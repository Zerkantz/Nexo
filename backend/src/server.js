// Servidor autoritativo REST + Socket.io para NEXO (Móvil Expo + Smartwatch Wear OS).
// Implementa el contrato completo de docs/NEXO_Contexto_IA.md y watch/watch/docs/INTEGRATION.md.
const http = require('http');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const PORT = Number(process.env.PORT || 3000);

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
// Estado en memoria sincronizado entre Móvil y Smartwatch
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
  credits: 350,
  energy: 90,
  intel: 35,
  upgrades: {
    battery: 1,
    cipher: 1,
    efficiency: 1,
  },
  unlockedSkills: ['SCANNER', 'SABOTAGE', 'CAMOUFLAGE', 'OVERLOAD'],
  equippedSkills: ['SCANNER', 'SABOTAGE', 'CAMOUFLAGE', 'OVERLOAD'],
  watch: null,
};

// Códigos temporales de vinculación: Map<pairingToken, PairingEntry>
const pairingRequests = new Map();

// Partida activa sincronizada entre móvil y reloj
let activeSession = null;
let radarActiveForSession = false;

// Desafíos de hackeo activos enviados al reloj: Map<challengeId, ChallengeRecord>
const activeChallenges = new Map();

// ============================================================================
// Funciones auxiliares de cálculo de `watch:context` y minijuegos
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
 * Busca si el jugador en el tablero móvil está sobre o adyacente (distancia Manhattan <= 1)
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
 * Calcula rumbo (0° norte/arriba, 90° derecha/este, 180° abajo/sur, 270° izquierda/oeste)
 * y distancia Manhattan hacia la casilla de extracción (5) o puerta morada de sector.
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
  // 0° arriba (dy = -1), 90° derecha (dx = 1)
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

  // Incluir HACK cuando hay objetivo cercano (según docs/INTEGRATION.md sección "Habilidades y feedback")
  const hackCost = getSkillCost('HACK');
  skills.push({
    code: 'HACK',
    cost: hackCost,
    available: nearTarget !== null && battery >= hackCost,
    reason: nearTarget === null ? 'Acércate a una puerta o terminal' : battery < hackCost ? 'Batería insuficiente' : null,
  });

  for (const code of equipped) {
    if (code === 'HACK') continue;
    const cost = getSkillCost(code);
    const hasBat = battery >= cost;
    skills.push({
      code,
      cost,
      available: hasBat,
      reason: hasBat ? null : 'Batería insuficiente',
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
 * Elige y genera los parámetros del minijuego según el tema/nivel o la entidad objetivo.
 * Compatible al 100% con `Protocol.challenge(json)` en `watch/watch/.../Protocol.kt`.
 */
function createChallengePayload(targetId, state) {
  const challengeId = `chk-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const cipherLevel = playerProfile.upgrades?.cipher || 1;
  const expiresAt = new Date(Date.now() + 45000).toISOString();

  // Seleccionar minijuego según el tema del nivel o la entidad
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
  io.to('player:1').emit('session:state', activeSession);
  if (activeSession.status === 'PLAYING') {
    io.to('player:1').emit('watch:context', buildWatchContext(activeSession));
  }
}

// ============================================================================
// Endpoints REST (/api/*)
// ============================================================================

app.get('/api/health', (_req, res) => {
  let latestPendingCode = null;
  for (const entry of pairingRequests.values()) {
    if (entry.status === 'PENDING' && new Date(entry.expiresAt).getTime() > Date.now()) {
      latestPendingCode = entry.code;
    }
  }
  res.json({
    ok: true,
    watchLinked: !!playerProfile.watch,
    watch: playerProfile.watch,
    pendingWatchCode: latestPendingCode,
    activeSessionId: activeSession?.sessionId || null,
  });
});

app.post('/api/auth/register', (req, res) => {
  const { username, email } = req.body || {};
  if (username) playerProfile.username = String(username).toUpperCase();
  if (email) playerProfile.email = String(email);
  res.json({
    token: 'nexo_mobile_jwt_1',
    player: {
      id: playerProfile.id,
      username: playerProfile.username,
      email: playerProfile.email,
      credits: playerProfile.credits,
      energy: playerProfile.energy,
      intel: playerProfile.intel,
    },
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body || {};
  if (email) playerProfile.email = String(email);
  res.json({
    token: 'nexo_mobile_jwt_1',
    player: {
      id: playerProfile.id,
      username: playerProfile.username,
      email: playerProfile.email,
      credits: playerProfile.credits,
      energy: playerProfile.energy,
      intel: playerProfile.intel,
    },
  });
});

app.get('/api/me', (_req, res) => {
  res.json({
    id: playerProfile.id,
    username: playerProfile.username,
    email: playerProfile.email,
    credits: playerProfile.credits,
    energy: playerProfile.energy,
    intel: playerProfile.intel,
    player: {
      id: playerProfile.id,
      username: playerProfile.username,
      email: playerProfile.email,
      credits: playerProfile.credits,
      energy: playerProfile.energy,
      intel: playerProfile.intel,
    },
    upgrades: playerProfile.upgrades,
    equippedSkills: playerProfile.equippedSkills,
    watch: playerProfile.watch,
  });
});

// 1. El Smartwatch solicita un código de 4 dígitos (POST /api/pairing/code)
app.post('/api/pairing/code', (_req, res) => {
  const code = String(Math.floor(1000 + Math.random() * 9000));
  const pairingToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  pairingRequests.set(pairingToken, {
    code,
    pairingToken,
    expiresAt,
    status: 'PENDING',
    watchToken: null,
  });

  console.log(`[PAIRING] Smartwatch solicito codigo: ${code} (token: ${pairingToken})`);
  // Notificar al móvil por si está en la pantalla /pair
  io.to('player:1').emit('pairing:code_requested', { code, expiresAt });

  res.json({ code, pairingToken, expiresAt });
});

// 2. El Smartwatch pregunta cada 2 s si el móvil ya confirmó el código (GET /api/pairing/status/:token)
app.get('/api/pairing/status/:token', (req, res) => {
  const entry = pairingRequests.get(req.params.token);
  if (!entry) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Código no encontrado' } });
  }

  if (entry.status === 'LINKED') {
    return res.json({
      status: 'LINKED',
      watchToken: entry.watchToken,
      player: {
        id: playerProfile.id,
        username: playerProfile.username,
        credits: playerProfile.credits,
        energy: playerProfile.energy,
        intel: playerProfile.intel,
      },
    });
  }

  return res.json({ status: 'PENDING' });
});

// Endpoint de ayuda para que el móvil consulte si hay un reloj esperando vinculación
app.get('/api/pairing/active', (_req, res) => {
  let latest = null;
  for (const entry of pairingRequests.values()) {
    if (entry.status === 'PENDING' && new Date(entry.expiresAt).getTime() > Date.now()) {
      latest = { code: entry.code, expiresAt: entry.expiresAt };
    }
  }
  res.json({ activeCode: latest, watch: playerProfile.watch });
});

// 3. El Móvil envía los 4 dígitos para vincular el reloj (POST /api/pairing/claim)
app.post('/api/pairing/claim', (req, res) => {
  const rawCode = String(req.body?.code || '').trim();
  if (!/^\d{4}$/.test(rawCode)) {
    return res.status(400).json({
      error: { code: 'INVALID_CODE', message: 'El código debe tener 4 dígitos.' },
    });
  }

  // Buscar coincidencia exacta con el código del reloj, o vincular la solicitud pendiente más reciente
  let matchedEntry = null;
  for (const entry of pairingRequests.values()) {
    if (entry.status === 'PENDING' && entry.code === rawCode) {
      matchedEntry = entry;
      break;
    }
  }
  if (!matchedEntry) {
    for (const entry of pairingRequests.values()) {
      if (entry.status === 'PENDING') {
        matchedEntry = entry;
      }
    }
  }

  const watchToken = `nexo_watch_jwt_${Date.now()}`;
  if (matchedEntry) {
    matchedEntry.status = 'LINKED';
    matchedEntry.watchToken = watchToken;
  }

  const watchDevice = {
    id: Date.now(),
    deviceName: `Wear OS Hacker Deck #${matchedEntry ? matchedEntry.code : rawCode}`,
    linkedAt: 'Vinculado en tiempo real',
    lastSeenAt: 'En línea · Socket activo',
  };
  playerProfile.watch = watchDevice;

  console.log(`[PAIRING] Reloj vinculado con exito (codigo: ${rawCode})`);
  io.to('player:1').emit('pairing:linked', { watch: watchDevice });

  return res.json({
    ok: true,
    watch: watchDevice,
    player: playerProfile,
  });
});

app.put('/api/skills/equip', (req, res) => {
  if (Array.isArray(req.body?.skills)) {
    playerProfile.equippedSkills = req.body.skills.slice(0, 4);
  }
  if (activeSession?.status === 'PLAYING') {
    io.to('player:1').emit('watch:context', buildWatchContext(activeSession));
  }
  res.json({ ok: true, equippedSkills: playerProfile.equippedSkills });
});

app.post('/api/upgrades/:type/buy', (req, res) => {
  const type = req.params.type;
  if (type === 'battery' || type === 'cipher' || type === 'efficiency') {
    const curr = playerProfile.upgrades[type] || 1;
    playerProfile.upgrades[type] = Math.min(3, curr + 1);
  }
  res.json({ ok: true, upgrades: playerProfile.upgrades });
});

// ============================================================================
// Eventos en Tiempo Real (Socket.io) entre Móvil y Smartwatch
// ============================================================================

io.on('connection', (socket) => {
  const token = socket.handshake.auth?.token || 'guest';
  const isWatch = String(token).startsWith('nexo_watch_jwt');
  socket.join('player:1');

  console.log(`[SOCKET] Conectado (${isWatch ? 'SMARTWATCH' : 'MOVIL'}) id=${socket.id}`);

  if (isWatch && playerProfile.watch) {
    playerProfile.watch.lastSeenAt = 'Conectado en vivo';
    io.to('player:1').emit('pairing:linked', { watch: playerProfile.watch });
  }

  // Si ya hay una misión activa, enviar de inmediato el estado al dispositivo que acaba de conectar
  if (activeSession && activeSession.status === 'PLAYING') {
    socket.emit('session:state', activeSession);
    socket.emit('watch:context', buildWatchContext(activeSession));
  }

  // Unirse a la sala de una sesión
  socket.on('session:join', (payload) => {
    const sid = payload?.sessionId || activeSession?.sessionId || 'demo';
    socket.join(`session:${sid}`);
    if (activeSession) {
      socket.emit('session:state', activeSession);
      socket.emit('watch:context', buildWatchContext(activeSession));
    }
  });

  // Sincronización de estado enviada por el Móvil en cada movimiento o inicio de misión
  socket.on('session:sync', (payload) => {
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

    // Si cruzó el umbral de sospecha (50%), hacer vibrar el reloj con ALERT_UP
    if (prevAlert < 50 && (activeSession.alert || 0) >= 50) {
      io.to('player:1').emit('watch:feedback', { type: 'ALERT_UP', data: {} });
    }

    // Si la partida terminó en el móvil, avisar también al reloj con `game:ended`
    if (activeSession.status === 'WON' || activeSession.status === 'LOST') {
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

  // El Móvil también puede pedir lanzar un desafío en el reloj cuando el jugador toca una puerta/terminal cerrada
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

  // El Smartwatch pide iniciar el minijuego de hackeo (`watch:hack_request { targetId }`)
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

  // El Smartwatch envía la respuesta del minijuego (`watch:hack_result { challengeId, input }`)
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

    // Enviar feedback háptico al reloj
    io.to('player:1').emit('watch:feedback', {
      type: isSuccess ? 'SUCCESS' : 'FAIL',
      data: { targetId: record.targetId },
    });

    // Ordenar al móvil que aplique el resultado en el tablero en tiempo real
    io.to('player:1').emit('watch:command', {
      type: 'HACK_RESOLVED',
      success: isSuccess,
      targetId: record.targetId,
      cost: getSkillCost('HACK'),
    });
  });

  // El Smartwatch usa una habilidad (`watch:skill { skill }`)
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

  // Eventos cooperativos desde el reloj (`coop:ping`, `coop:transfer_battery`)
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

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================================`);
  console.log(`NEXO Backend (REST + Socket.io) escuchando en 0.0.0.0:${PORT}`);
  console.log(`- En PC / Web:            http://localhost:${PORT}`);
  console.log(`- En Emulador Android:    http://10.0.2.2:${PORT}`);
  console.log(`- En Red Local Wi-Fi:     http://192.168.33.4:${PORT}`);
  console.log(`========================================================`);
});
