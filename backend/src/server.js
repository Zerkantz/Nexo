// Servidor autoritativo REST + Socket.io + MySQL 8 para NEXO (Movil Expo + Smartwatch Wear OS).
// Implementa el contrato completo de docs/NEXO_Contexto_IA.md y watch/watch/docs/INTEGRATION.md.
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const env = require('./config/env');
const { initDatabase, query } = require('./config/db');
const { seed } = require('./db/seed');
const {
  signMobileToken,
  verifyToken,
  resolvePlayerIdFromReq,
  wrap,
  errorHandler,
} = require('./auth');
const {
  getFullPlayerProfile,
  registerPlayer,
  loginPlayer,
  createPairingCodeInDb,
  getPairingStatusFromDb,
  getActivePairingFromDb,
  claimPairingCodeInDb,
  touchWatchLastSeen,
  unlinkWatchInDb,
  buyUpgradeInDb,
  equipSkillsInDb,
  grantDemoSuppliesInDb,
  savePlayerBaseInDb,
  recordMissionResultInDb,
  getRaidTargetsFromDb,
} = require('./db/playerRepo');

const PORT = env.PORT;

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// ============================================================================
// Cache de sesion en tiempo real respaldado por MySQL 8
// ============================================================================

const SKILL_COSTS = {
  HACK: 20,
  SCANNER: 15,
  SABOTAGE: 25,
  CAMOUFLAGE: 35,
  OVERLOAD: 20,
  RADAR: 15,
  EMP: 30,
  THERMAL: 25,
  TIMEDILATE: 40,
};

let playerProfile = {
  id: 1,
  username: 'AGENTE_NEXO',
  email: 'agente@nexo.tactical',
  credits: 450,
  energy: 95,
  intel: 40,
  upgrades: {
    battery: 1,
    cipher: 1,
    efficiency: 1,
  },
  unlockedSkills: ['SCANNER', 'SABOTAGE', 'CAMOUFLAGE', 'OVERLOAD'],
  equippedSkills: ['SCANNER', 'SABOTAGE', 'CAMOUFLAGE', 'OVERLOAD'],
  watch: null,
};

// Partida activa sincronizada entre movil y reloj
let activeSession = null;
let radarActiveForSession = false;
let lastRecordedWinSessionId = null;

// Salas cooperativas activas en memoria + MySQL
const coopRooms = new Map();

// Desafios de hackeo activos enviados al reloj: Map<challengeId, ChallengeRecord>
const activeChallenges = new Map();

// ============================================================================
// Funciones auxiliares de calculo de `watch:context` y minijuegos
// ============================================================================

function getEfficiencyDiscount() {
  const lv = playerProfile.upgrades?.efficiency || 1;
  return lv === 3 ? 10 : lv === 2 ? 5 : 0;
}

function getSkillCost(code) {
  const base = SKILL_COSTS[code] || 20;
  return Math.max(5, base - getEfficiencyDiscount());
}

/**
 * Busca si el jugador en el tablero movil esta sobre o adyacente (distancia Manhattan <= 1)
 * a una puerta cerrada o a una terminal hackeable.
 */
function findNearHackTarget(state) {
  if (!state || !Array.isArray(state.players) || state.players.length === 0) return null;
  const p = state.players[0];
  const entities = Array.isArray(state.entities) ? state.entities : [];

  for (const ent of entities) {
    const dist = Math.abs(ent.x - p.x) + Math.abs(ent.y - p.y);
    if (dist <= 1) {
      if ((ent.type === 'door' || ent.type === 'dual_door') && !ent.open) {
        return ent.id;
      }
      if (ent.type === 'terminal' && !ent.open) {
        return ent.id;
      }
    }
  }
  return null;
}

/**
 * Calcula rumbo (0 grados norte/arriba, 90 derecha/este, 180 abajo/sur, 270 izquierda/oeste)
 * y distancia Manhattan hacia la casilla de extraccion (5) o puerta morada de sector.
 */
function computeRadarData(state) {
  if (!state || !radarActiveForSession || !Array.isArray(state.players) || !state.players[0]) {
    return null;
  }
  const p = state.players[0];
  let targetX = null;
  let targetY = null;

  if (Array.isArray(state.tiles)) {
    for (let y = 0; y < state.tiles.length; y++) {
      for (let x = 0; x < state.tiles[y].length; x++) {
        if (state.tiles[y][x] === 5) {
          targetX = x;
          targetY = y;
        }
      }
    }
  }

  if (targetX === null && Array.isArray(state.entities)) {
    const portal = state.entities.find((e) => e.targetRoom);
    if (portal) {
      targetX = portal.x;
      targetY = portal.y;
    }
  }

  if (targetX === null || targetY === null) return null;

  const dx = targetX - p.x;
  const dy = targetY - p.y;
  const distance = Math.abs(dx) + Math.abs(dy);
  let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
  if (deg < 0) deg += 360;

  return {
    bearingDegrees: Math.round(deg),
    distance,
  };
}

/**
 * Construye el objeto `watch:context` exacto que espera `Protocol.deck(json)` en Kotlin.
 */
function buildWatchContext(state) {
  if (!state || !Array.isArray(state.players) || state.players.length === 0) {
    return {
      battery: 100,
      maxBattery: 100,
      alert: 0,
      nearTarget: null,
      skills: [],
      radar: null,
    };
  }

  const p = state.players[0];
  const battery = p.battery ?? 100;
  const maxBattery = p.maxBattery ?? 100;
  const alert = state.alert ?? 0;
  const nearTarget = findNearHackTarget(state);

  const equipped = Array.isArray(playerProfile.equippedSkills)
    ? playerProfile.equippedSkills
    : ['SCANNER', 'SABOTAGE', 'CAMOUFLAGE', 'OVERLOAD'];

  const skills = [];

  const hackCost = getSkillCost('HACK');
  skills.push({
    code: 'HACK',
    cost: hackCost,
    available: nearTarget !== null && battery >= hackCost,
    reason:
      nearTarget === null
        ? 'Acercate a una puerta o terminal'
        : battery < hackCost
          ? 'Bateria insuficiente'
          : null,
  });

  for (const code of equipped) {
    if (code === 'HACK') continue;
    const cost = getSkillCost(code);
    const hasBat = battery >= cost;
    skills.push({
      code,
      cost,
      available: hasBat,
      reason: hasBat ? null : 'Bateria insuficiente',
    });
  }

  return {
    battery,
    maxBattery,
    alert,
    nearTarget,
    skills,
    radar: computeRadarData(state),
  };
}

/**
 * Elige y genera los parametros del minijuego segun el tema/nivel o la entidad objetivo.
 * Compatible al 100% con `Protocol.challenge(json)` en `watch/watch/.../Protocol.kt`.
 */
function createChallengePayload(targetId, state) {
  const challengeId = `chk-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const cipherLevel = playerProfile.upgrades?.cipher || 1;
  const expiresAt = new Date(Date.now() + 45000).toISOString();

  const theme = state?.theme || 'BANK';
  let minigame = 'SEQUENCE';
  if (theme === 'CRYPT') minigame = 'GLYPHS';
  else if (theme === 'LAB') minigame = 'WAVES';
  else if (theme === 'SERVERS') minigame = 'FAST_SEQUENCE';
  else if (theme === 'ORBITAL') minigame = 'CORE_OVERLOAD';

  let params = {};
  let expected = null;

  if (minigame === 'SEQUENCE' || minigame === 'FAST_SEQUENCE') {
    const baseLen = minigame === 'FAST_SEQUENCE' ? 5 : 4;
    const length = cipherLevel >= 2 ? Math.max(3, baseLen - 1) : baseLen;
    const showMs = cipherLevel === 3 ? 750 : minigame === 'FAST_SEQUENCE' ? 380 : 600;
    const sequence = Array.from({ length }, () => Math.floor(Math.random() * 4));
    params = { sequence, showMs };
    expected = sequence;
  } else if (minigame === 'GLYPHS') {
    const symbols = 6;
    const initial = [0, 1, 2];
    const target = [
      Math.floor(Math.random() * symbols),
      Math.floor(Math.random() * symbols),
      Math.floor(Math.random() * symbols),
    ];
    params = { symbols, initial, target };
    expected = target;
  } else if (minigame === 'WAVES') {
    params = { periodMs: 2400, phase: 1.5 };
    expected = 'ANY_TIMING';
  } else if (minigame === 'CORE_OVERLOAD') {
    params = { durationMs: 3000, targetStart: 0.6, targetEnd: 0.85 };
    expected = { minMs: 1650, maxMs: 2650 };
  }

  const record = {
    challengeId,
    targetId,
    minigame,
    params,
    expected,
    expiresAt,
  };
  activeChallenges.set(challengeId, record);
  return record;
}

/**
 * Valida la respuesta enviada por el reloj en `watch:hack_result { challengeId, input }`.
 */
function validateChallengeInput(record, input) {
  if (!record) return false;
  const { minigame, expected } = record;

  if (minigame === 'SEQUENCE' || minigame === 'FAST_SEQUENCE') {
    const arr = Array.isArray(input) ? input : input?.values || [];
    if (!Array.isArray(arr) || arr.length !== expected.length) return false;
    return expected.every((val, idx) => Number(arr[idx]) === Number(val));
  }

  if (minigame === 'GLYPHS') {
    const pos = Array.isArray(input?.positions)
      ? input.positions
      : Array.isArray(input?.positions?.values)
        ? input.positions.values
        : Array.isArray(input)
          ? input
          : [];
    if (pos.length !== 3) return false;
    return expected.every((val, idx) => Number(pos[idx]) === Number(val));
  }

  if (minigame === 'WAVES') {
    const elapsedMs = Number(input?.elapsedMs ?? 0);
    return Number.isFinite(elapsedMs) && elapsedMs > 0;
  }

  if (minigame === 'CORE_OVERLOAD') {
    const heldMs = Number(input?.heldMs ?? 0);
    return heldMs >= expected.minMs && heldMs <= expected.maxMs;
  }

  return true;
}

function broadcastSessionAndContext() {
  if (!activeSession) return;
  const sid = activeSession.sessionId;
  if (sid) {
    io.to(`session:${sid}`).emit('session:state', activeSession);
  }
  io.to('player:1').emit('session:state', activeSession);
  io.emit('session:state', activeSession);
  if (activeSession.status === 'PLAYING') {
    io.emit('watch:context', buildWatchContext(activeSession));
  }
}

// ============================================================================
// Endpoints REST (/api/*) conectados a MySQL 8
// ============================================================================

app.get(
  '/api/health',
  wrap(async (req, res) => {
    const playerId = resolvePlayerIdFromReq(req);
    const [activePairing] = await Promise.all([
      getActivePairingFromDb(playerId),
      query('SELECT 1 AS ok'),
    ]);
    playerProfile = (await getFullPlayerProfile(playerId)) || playerProfile;

    res.json({
      ok: true,
      dbConnected: true,
      database: env.DB_NAME,
      watchLinked: !!playerProfile.watch,
      watch: playerProfile.watch,
      pendingWatchCode: activePairing.activeCode?.code || null,
      activeSessionId: activeSession?.sessionId || null,
    });
  }),
);

app.post(
  '/api/auth/register',
  wrap(async (req, res) => {
    const profile = await registerPlayer(req.body || {});
    playerProfile = profile;
    const token = signMobileToken(profile.id);
    res.json({
      token,
      player: profile.player,
      profile,
    });
  }),
);

app.post(
  '/api/auth/login',
  wrap(async (req, res) => {
    const profile = await loginPlayer(req.body || {});
    playerProfile = profile;
    const token = signMobileToken(profile.id);
    res.json({
      token,
      player: profile.player,
      profile,
    });
  }),
);

app.get(
  '/api/me',
  wrap(async (req, res) => {
    const playerId = resolvePlayerIdFromReq(req);
    const profile = await getFullPlayerProfile(playerId);
    if (profile) {
      playerProfile = profile;
    }
    res.json(playerProfile);
  }),
);

// 1. El Smartwatch solicita un codigo de 4 digitos (POST /api/pairing/code) -> Guarda en MySQL
app.post(
  '/api/pairing/code',
  wrap(async (_req, res) => {
    const created = await createPairingCodeInDb();
    console.log(
      `[PAIRING][MySQL] Smartwatch solicito codigo: ${created.code} (token: ${created.pairingToken})`,
    );
    io.to('player:1').emit('pairing:code_requested', {
      code: created.code,
      expiresAt: created.expiresAt,
    });
    res.json(created);
  }),
);

// 2. El Smartwatch pregunta cada 2 s si el movil ya confirmo el codigo (GET /api/pairing/status/:token)
app.get(
  '/api/pairing/status/:token',
  wrap(async (req, res) => {
    const statusObj = await getPairingStatusFromDb(req.params.token);
    if (!statusObj) {
      return res
        .status(404)
        .json({ error: { code: 'NOT_FOUND', message: 'Codigo no encontrado' } });
    }
    res.json(statusObj);
  }),
);

// Endpoint para que el movil consulte si hay un reloj esperando vinculacion en MySQL
app.get(
  '/api/pairing/active',
  wrap(async (req, res) => {
    const playerId = resolvePlayerIdFromReq(req);
    const data = await getActivePairingFromDb(playerId);
    res.json(data);
  }),
);

// 3. El Movil envia los 4 digitos para vincular el reloj (POST /api/pairing/claim) -> Guarda en MySQL
app.post(
  '/api/pairing/claim',
  wrap(async (req, res) => {
    const playerId = resolvePlayerIdFromReq(req);
    const rawCode = String(req.body?.code || '').trim();
    if (!/^\d{4}$/.test(rawCode)) {
      return res.status(400).json({
        error: { code: 'INVALID_CODE', message: 'El codigo debe tener 4 digitos.' },
      });
    }

    const { watch } = await claimPairingCodeInDb(playerId, rawCode);
    playerProfile = (await getFullPlayerProfile(playerId)) || playerProfile;

    console.log(`[PAIRING][MySQL] Reloj vinculado con exito para jugador #${playerId} (codigo: ${rawCode})`);
    io.to('player:1').emit('pairing:linked', { watch });

    return res.json({
      ok: true,
      watch,
      player: playerProfile,
    });
  }),
);

app.delete(
  '/api/pairing/watch',
  wrap(async (req, res) => {
    const playerId = resolvePlayerIdFromReq(req);
    await unlinkWatchInDb(playerId);
    playerProfile = (await getFullPlayerProfile(playerId)) || playerProfile;
    res.json({ ok: true, player: playerProfile });
  }),
);

app.put(
  '/api/skills/equip',
  wrap(async (req, res) => {
    const playerId = resolvePlayerIdFromReq(req);
    if (Array.isArray(req.body?.skills)) {
      playerProfile = await equipSkillsInDb(playerId, req.body.skills);
    }
    if (activeSession?.status === 'PLAYING') {
      io.to('player:1').emit('watch:context', buildWatchContext(activeSession));
    }
    res.json({
      ok: true,
      equippedSkills: playerProfile.equippedSkills,
      player: playerProfile,
    });
  }),
);

app.get(
  '/api/upgrades',
  wrap(async (req, res) => {
    const playerId = resolvePlayerIdFromReq(req);
    const profile = await getFullPlayerProfile(playerId);
    res.json({
      upgrades: profile.upgrades,
      unlockedSkills: profile.unlockedSkills,
      equippedSkills: profile.equippedSkills,
    });
  }),
);

app.post(
  '/api/upgrades/:type/buy',
  wrap(async (req, res) => {
    const playerId = resolvePlayerIdFromReq(req);
    const type = req.params.type;
    playerProfile = await buyUpgradeInDb(playerId, type);
    res.json({
      ok: true,
      upgrades: playerProfile.upgrades,
      player: playerProfile,
    });
  }),
);

app.post(
  '/api/supplies/grant',
  wrap(async (req, res) => {
    const playerId = resolvePlayerIdFromReq(req);
    playerProfile = await grantDemoSuppliesInDb(playerId);
    res.json({
      ok: true,
      player: playerProfile,
    });
  }),
);

app.get(
  '/api/base',
  wrap(async (req, res) => {
    const playerId = resolvePlayerIdFromReq(req);
    const profile = await getFullPlayerProfile(playerId);
    res.json({ ok: true, base: profile.base });
  }),
);

app.put(
  '/api/base',
  wrap(async (req, res) => {
    const playerId = resolvePlayerIdFromReq(req);
    const body = req.body || {};
    const mapPayload = body.mapJson || body;
    playerProfile = await savePlayerBaseInDb(playerId, {
      name: body.name || mapPayload.name,
      tiles: mapPayload.tiles,
      entities: mapPayload.entities,
      isPublished: body.isPublished ?? mapPayload.isPublished ?? true,
    });
    res.json({
      ok: true,
      base: playerProfile.base,
      player: playerProfile,
    });
  }),
);

app.post(
  '/api/base/publish',
  wrap(async (req, res) => {
    const playerId = resolvePlayerIdFromReq(req);
    const profile = await getFullPlayerProfile(playerId);
    playerProfile = await savePlayerBaseInDb(playerId, {
      name: profile.base.name,
      tiles: profile.base.tiles,
      entities: profile.base.entities,
      isPublished: true,
    });
    res.json({
      ok: true,
      base: playerProfile.base,
      player: playerProfile,
    });
  }),
);

app.post(
  '/api/sessions/solo',
  wrap(async (req, res) => {
    const missionId = Number(req.body?.missionId || 1);
    res.json({ sessionId: `level-${missionId}` });
  }),
);

app.post(
  '/api/raids/start',
  wrap(async (req, res) => {
    const baseId = Number(req.body?.baseId || 201);
    res.json({ sessionId: `raid-${baseId}` });
  }),
);

app.get(
  '/api/raids/reports',
  wrap(async (req, res) => {
    const playerId = resolvePlayerIdFromReq(req);
    const profile = await getFullPlayerProfile(playerId);
    res.json(profile.raidReports || []);
  }),
);

app.get(
  '/api/history',
  wrap(async (req, res) => {
    const playerId = resolvePlayerIdFromReq(req);
    const profile = await getFullPlayerProfile(playerId);
    res.json(profile.history || []);
  }),
);

app.get(
  '/api/missions',
  wrap(async (req, res) => {
    const playerId = resolvePlayerIdFromReq(req);
    const rows = await query('SELECT * FROM missions ORDER BY level_number ASC');
    const profile = await getFullPlayerProfile(playerId);
    res.json({
      missions: rows,
      completedLevels: profile.completedLevels,
    });
  }),
);

app.post(
  '/api/missions/:level/complete',
  wrap(async (req, res) => {
    const playerId = resolvePlayerIdFromReq(req);
    const level = Number(req.params.level || 1);
    playerProfile = await recordMissionResultInDb(playerId, {
      ...req.body,
      level,
    });
    res.json({
      ok: true,
      player: playerProfile,
    });
  }),
);

app.get(
  '/api/raids/targets',
  wrap(async (req, res) => {
    const playerId = resolvePlayerIdFromReq(req);
    const targets = await getRaidTargetsFromDb(playerId);
    res.json({ targets });
  }),
);

app.post(
  '/api/coop/rooms',
  wrap(async (req, res) => {
    const playerId = resolvePlayerIdFromReq(req);
    const levelNumber = Number(req.body?.levelNumber || 1);
    const roomCode = String(Math.floor(100000 + Math.random() * 900000));
    const sessionId = `coop-${roomCode}`;
    const room = {
      roomCode,
      sessionId,
      hostId: playerId,
      levelNumber,
      createdAt: new Date().toISOString(),
    };
    coopRooms.set(roomCode, room);
    res.json(room);
  }),
);

app.post(
  '/api/coop/rooms/:roomCode/join',
  wrap(async (req, res) => {
    const code = String(req.params.roomCode || '').trim();
    const existing = coopRooms.get(code) || {
      roomCode: code,
      sessionId: `coop-${code}`,
      levelNumber: 1,
    };
    res.json(existing);
  }),
);

app.use(errorHandler);

// ============================================================================
// Eventos en Tiempo Real (Socket.io) entre Movil y Smartwatch
// ============================================================================

io.on('connection', async (socket) => {
  const token = socket.handshake.auth?.token || 'guest';
  const auth = verifyToken(token);
  const isWatch = auth?.role === 'watch' || String(token).startsWith('nexo_watch_jwt');
  const playerId = auth?.playerId || 1;

  socket.join('player:1');
  socket.join(`player:${playerId}`);

  console.log(
    `[SOCKET] Conectado (${isWatch ? 'SMARTWATCH' : 'MOVIL'}) id=${socket.id} player=#${playerId}`,
  );

  if (isWatch) {
    try {
      await touchWatchLastSeen(playerId);
      playerProfile = (await getFullPlayerProfile(playerId)) || playerProfile;
      if (playerProfile.watch) {
        io.to('player:1').emit('pairing:linked', { watch: playerProfile.watch });
      }
    } catch (err) {
      console.error('[SOCKET] Error actualizando estado del reloj en MySQL:', err.message);
    }
  }

  if (activeSession && activeSession.status === 'PLAYING') {
    socket.emit('session:state', activeSession);
    socket.emit('watch:context', buildWatchContext(activeSession));
  }

  socket.on('session:join', (payload) => {
    const sid = payload?.sessionId || activeSession?.sessionId || 'demo';
    socket.join(`session:${sid}`);
    if (activeSession) {
      socket.emit('session:state', activeSession);
      socket.emit('watch:context', buildWatchContext(activeSession));
    }
  });

  // Sincronizacion de estado enviada por el Movil en cada movimiento o inicio de mision
  socket.on('session:sync', async (payload) => {
    if (!payload || !payload.state) return;
    const prevAlert = activeSession?.alert || 0;
    const prevSessionId = activeSession?.sessionId;

    activeSession = payload.state;
    if (prevSessionId !== activeSession.sessionId) {
      radarActiveForSession = false;
      activeChallenges.clear();
    }

    if (payload.profile) {
      if (payload.profile.upgrades) playerProfile.upgrades = payload.profile.upgrades;
      if (payload.profile.equippedSkills) playerProfile.equippedSkills = payload.profile.equippedSkills;
      if (payload.profile.player) {
        playerProfile.credits = payload.profile.player.credits ?? playerProfile.credits;
        playerProfile.energy = payload.profile.player.energy ?? playerProfile.energy;
        playerProfile.intel = payload.profile.player.intel ?? playerProfile.intel;
      }
    }

    if (prevAlert < 50 && (activeSession.alert || 0) >= 50) {
      io.to('player:1').emit('watch:feedback', { type: 'ALERT_UP', data: {} });
    }

    if (activeSession.status === 'WON' || activeSession.status === 'LOST') {
      if (lastRecordedWinSessionId !== `${activeSession.sessionId}:${activeSession.status}`) {
        lastRecordedWinSessionId = `${activeSession.sessionId}:${activeSession.status}`;
        try {
          playerProfile = await recordMissionResultInDb(playerId, {
            level: activeSession.level || 1,
            mode: activeSession.mode || 'SOLO',
            result: activeSession.status,
            durationSeconds: activeSession.elapsedSeconds || 60,
            hacksCompleted: 2,
            alertPeak: activeSession.alert || 0,
          });
        } catch (err) {
          console.error('[SOCKET][MySQL] Error guardando resultado de mision:', err.message);
        }
      }

      io.to('player:1').emit('game:ended', {
        result: activeSession.status,
        rewards:
          activeSession.status === 'WON'
            ? { credits: 250, energy: 60, intel: 30 }
            : { credits: 0, energy: 0, intel: 0 },
        unlockedSkill: activeSession.status === 'WON' ? 'OVERLOAD' : '',
      });
      return;
    }

    broadcastSessionAndContext();
  });

  socket.on('mobile:request_watch_hack', (payload) => {
    if (!activeSession || activeSession.status !== 'PLAYING') return;
    const targetId = payload?.targetId || findNearHackTarget(activeSession);
    if (!targetId) return;
    const challenge = createChallengePayload(targetId, activeSession);
    io.to('player:1').emit('watch:hack_challenge', {
      challengeId: challenge.challengeId,
      minigame: challenge.minigame,
      params: challenge.params,
      expiresAt: challenge.expiresAt,
    });
  });

  socket.on('watch:hack_request', (payload) => {
    if (!activeSession || activeSession.status !== 'PLAYING') return;
    const targetId = payload?.targetId || findNearHackTarget(activeSession) || 'DOOR_1';
    const challenge = createChallengePayload(targetId, activeSession);
    console.log(`[WATCH] Hack solicitado sobre ${targetId} -> Minijuego ${challenge.minigame}`);

    io.to('player:1').emit('watch:hack_challenge', {
      challengeId: challenge.challengeId,
      minigame: challenge.minigame,
      params: challenge.params,
      expiresAt: challenge.expiresAt,
    });
    io.to('player:1').emit('watch:command', {
      type: 'HACK_STARTED',
      targetId,
      minigame: challenge.minigame,
    });
  });

  socket.on('watch:hack_result', (payload) => {
    const challengeId = payload?.challengeId;
    const input = payload?.input;
    const record = activeChallenges.get(challengeId);
    if (!record) return;
    activeChallenges.delete(challengeId);

    const isSuccess = validateChallengeInput(record, input);
    console.log(
      `[WATCH] Resultado de minijuego ${record.minigame} en ${record.targetId}: ${
        isSuccess ? 'EXITO' : 'FALLO'
      }`,
    );

    io.to('player:1').emit('watch:feedback', {
      type: isSuccess ? 'SUCCESS' : 'FAIL',
      data: { targetId: record.targetId },
    });

    io.to('player:1').emit('watch:command', {
      type: 'HACK_RESOLVED',
      success: isSuccess,
      targetId: record.targetId,
      cost: getSkillCost('HACK'),
    });
  });

  socket.on('watch:skill', (payload) => {
    const skillCode = String(payload?.skill || '');
    if (!skillCode || !activeSession) return;
    const cost = getSkillCost(skillCode);
    console.log(`[WATCH] Habilidad activada desde la muneca: ${skillCode} (${cost}% bat)`);

    if (skillCode === 'RADAR') {
      radarActiveForSession = true;
    }

    io.to('player:1').emit('watch:feedback', {
      type: 'SUCCESS',
      data: { skill: skillCode },
    });

    io.to('player:1').emit('watch:command', {
      type: 'SKILL_ACTIVATED',
      skill: skillCode,
      cost,
    });
  });

  socket.on('coop:ping', (payload) => {
    const pingType = payload?.type || 'DANGER';
    io.to('player:1').emit('watch:feedback', {
      type: 'PING',
      data: { type: pingType },
    });
    io.to('player:1').emit('watch:command', {
      type: 'COOP_PING',
      pingType,
    });
  });

  socket.on('coop:transfer_battery', () => {
    io.to('player:1').emit('watch:feedback', {
      type: 'SUCCESS',
      data: {},
    });
    io.to('player:1').emit('watch:command', {
      type: 'COOP_TRANSFER_BATTERY',
      amount: 25,
    });
  });

  socket.on('session:leave', () => {
    if (activeSession) {
      activeSession = { ...activeSession, status: 'ABANDONED' };
      io.to('player:1').emit('session:state', activeSession);
    }
  });
});

// ============================================================================
// Inicializacion de Base de Datos MySQL 8 y Arranque del Servidor
// ============================================================================

async function startServer() {
  try {
    await initDatabase();
    await seed();
    const initialProfile = await getFullPlayerProfile(1);
    if (initialProfile) {
      playerProfile = initialProfile;
    }
    console.log(`[MySQL 8] Base de datos "${env.DB_NAME}" conectada y sincronizada.`);
  } catch (err) {
    console.error('[MySQL 8] Error al inicializar la base de datos:', err.message);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`========================================================`);
    console.log(`NEXO Backend (REST + Socket.io + MySQL 8) en 0.0.0.0:${PORT}`);
    console.log(`- En PC / Web:            http://localhost:${PORT}`);
    console.log(`- En Emulador Android:    http://10.0.2.2:${PORT}`);
    console.log(`- En Red Local Wi-Fi:     http://192.168.33.4:${PORT}`);
    console.log(`========================================================`);
  });
}

startServer();
