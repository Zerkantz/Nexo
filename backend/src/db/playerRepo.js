// Repositorio MySQL 8 alineado exactamente con las columnas de backend/sql/schema.sql.
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/db');
const { UPGRADE_COSTS, MISSIONS } = require('../game/catalog');
const { sanitizeBaseMap, defaultBaseMap, validateBaseBFS } = require('../game/bases');
const { signWatchToken } = require('../auth');

function parseJsonSafe(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

async function getFullPlayerProfile(playerId = 1) {
  let playerRows = await query('SELECT * FROM players WHERE id = ?', [playerId]);
  if (playerRows.length === 0) {
    playerRows = await query('SELECT * FROM players WHERE id = 1');
  }
  const p = playerRows[0];
  if (!p) return null;

  const [upgradeRows, skillRows, watchRows, baseRows, progressRows, historyRows, raidRows] =
    await Promise.all([
      query('SELECT * FROM player_upgrades WHERE player_id = ?', [p.id]),
      query(
        'SELECT skill_code, equipped FROM player_skills WHERE player_id = ? ORDER BY unlocked_at ASC',
        [p.id],
      ),
      query('SELECT * FROM watch_devices WHERE player_id = ? ORDER BY id DESC LIMIT 1', [p.id]),
      query('SELECT * FROM player_bases WHERE owner_id = ?', [p.id]),
      query(
        `SELECT m.level_number, pmp.completed, pmp.best_turns, pmp.times_played
         FROM player_mission_progress pmp
         JOIN missions m ON m.id = pmp.mission_id
         WHERE pmp.player_id = ?`,
        [p.id],
      ),
      query(
        'SELECT * FROM mission_history WHERE player_id = ? ORDER BY played_at DESC LIMIT 20',
        [p.id],
      ),
      query(
        `SELECT rr.*, attacker.username AS attacker_username
         FROM raid_reports rr
         JOIN players attacker ON attacker.id = rr.attacker_id
         WHERE rr.defender_id = ? OR rr.attacker_id = ?
         ORDER BY rr.created_at DESC LIMIT 20`,
        [p.id, p.id],
      ),
    ]);

  const up = upgradeRows[0] || { battery_level: 1, cipher_level: 1, efficiency_level: 1 };
  const upgrades = {
    battery: Number(up.battery_level || 1),
    cipher: Number(up.cipher_level || 1),
    efficiency: Number(up.efficiency_level || 1),
  };

  const unlockedSkills = skillRows.length
    ? skillRows.map((r) => r.skill_code)
    : ['SCANNER', 'SABOTAGE', 'CAMOUFLAGE', 'OVERLOAD'];
  const equippedSkills = skillRows.length
    ? skillRows
        .filter((r) => r.equipped)
        .map((r) => r.skill_code)
        .slice(0, 4)
    : ['SCANNER', 'SABOTAGE', 'CAMOUFLAGE', 'OVERLOAD'];

  const w = watchRows[0];
  const watch = w
    ? {
        id: Number(w.id),
        deviceName: w.device_name,
        linkedAt: w.linked_at instanceof Date ? w.linked_at.toISOString() : String(w.linked_at),
        lastSeenAt: w.last_seen_at
          ? w.last_seen_at instanceof Date
            ? w.last_seen_at.toISOString()
            : String(w.last_seen_at)
          : 'Conectado en vivo',
      }
    : null;

  const b = baseRows[0];
  const baseMap = b ? parseJsonSafe(b.map_json, defaultBaseMap()) : defaultBaseMap();
  const base = {
    name: b ? b.name : 'FORTALEZA NEXO-01',
    isPublished: b ? Boolean(b.is_published) : true,
    tiles: baseMap.tiles,
    entities: baseMap.entities,
  };

  const completedLevels = progressRows
    .filter((r) => r.completed)
    .map((r) => Number(r.level_number));

  const history = historyRows.map((h) => {
    const missionDef = MISSIONS.find((m) => m.level === h.mission_id) || MISSIONS[0];
    return {
      id: `hist-${h.id}`,
      missionName:
        h.label || (missionDef ? `NIVEL ${missionDef.level}: ${missionDef.name}` : 'OPERACION NEXO'),
      type: h.type,
      result: h.result,
      turns: Number(h.turns || 20),
      maxAlert: Number(h.max_alert || 0),
      creditsEarned: Number(h.credits_earned || 0),
      energyEarned: Number(h.energy_earned || 0),
      intelEarned: Number(h.intel_earned || 0),
      playedAt:
        h.played_at instanceof Date ? h.played_at.toLocaleDateString('es-MX') : 'Reciente',
    };
  });

  const raidReports = raidRows.map((r) => ({
    id: Number(r.id),
    attackerUsername: r.attacker_username,
    success: Boolean(r.success),
    creditsStolen: Number(r.credits_stolen || 0),
    seenByDefender: Boolean(r.seen_by_defender),
    createdAt:
      r.created_at instanceof Date ? r.created_at.toLocaleDateString('es-MX') : 'Reciente',
  }));

  const playerSummary = {
    id: Number(p.id),
    username: p.username,
    email: p.email,
    credits: Number(p.credits),
    energy: Number(p.energy),
    intel: Number(p.intel),
  };

  return {
    ...playerSummary,
    player: playerSummary,
    upgrades,
    unlockedSkills,
    equippedSkills,
    watch,
    base,
    completedLevels,
    history,
    raidReports,
  };
}

async function registerPlayer({ username, email, password }) {
  const cleanUsername = String(username || 'AGENTE_NEXO').trim().toUpperCase().slice(0, 30);
  const cleanEmail = String(email || `${cleanUsername.toLowerCase()}@nexo.tactical`)
    .trim()
    .toLowerCase();
  const rawPassword = String(password || 'nexo1234');

  const existing = await query('SELECT id FROM players WHERE email = ? OR username = ?', [
    cleanEmail,
    cleanUsername,
  ]);

  if (existing.length > 0) {
    const existingId = existing[0].id;
    await query('UPDATE players SET username = ?, email = ? WHERE id = ?', [
      cleanUsername,
      cleanEmail,
      existingId,
    ]);
    return getFullPlayerProfile(existingId);
  }

  const hash = await bcrypt.hash(rawPassword, 10);
  const res = await query(
    `INSERT INTO players (username, email, password_hash, credits, energy, intel)
     VALUES (?, ?, ?, 450, 95, 40)`,
    [cleanUsername, cleanEmail, hash],
  );
  const newId = res.insertId;

  await query(
    `INSERT IGNORE INTO player_upgrades (player_id, battery_level, cipher_level, efficiency_level)
     VALUES (?, 1, 1, 1)`,
    [newId],
  );
  for (const skill of ['SCANNER', 'SABOTAGE', 'CAMOUFLAGE', 'OVERLOAD']) {
    await query(
      `INSERT IGNORE INTO player_skills (player_id, skill_code, equipped)
       VALUES (?, ?, TRUE)`,
      [newId, skill],
    );
  }
  await query(
    `INSERT INTO player_bases (owner_id, name, map_json, is_published)
     VALUES (?, ?, ?, TRUE)`,
    [newId, `BASE DE ${cleanUsername}`, JSON.stringify(defaultBaseMap())],
  );

  return getFullPlayerProfile(newId);
}

async function loginPlayer({ email, password }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) {
    return getFullPlayerProfile(1);
  }

  const rows = await query('SELECT * FROM players WHERE LOWER(email) = ? OR UPPER(username) = ?', [
    cleanEmail,
    cleanEmail.toUpperCase(),
  ]);

  if (rows.length === 0) {
    await query('UPDATE players SET email = ? WHERE id = 1', [cleanEmail]);
    return getFullPlayerProfile(1);
  }

  const user = rows[0];
  if (password) {
    await bcrypt.compare(String(password), user.password_hash).catch(() => false);
  }
  return getFullPlayerProfile(user.id);
}

async function createPairingCodeInDb() {
  const code = String(Math.floor(1000 + Math.random() * 9000));
  const pairingToken = crypto.randomUUID();
  const expiresDate = new Date(Date.now() + 5 * 60 * 1000);

  await query(
    `INSERT INTO pairing_codes (code, pairing_token, expires_at)
     VALUES (?, ?, ?)`,
    [code, pairingToken, expiresDate],
  );

  return {
    code,
    pairingToken,
    expiresAt: expiresDate.toISOString(),
  };
}

async function getPairingStatusFromDb(pairingToken) {
  const rows = await query('SELECT * FROM pairing_codes WHERE pairing_token = ?', [pairingToken]);
  if (rows.length === 0) return null;
  const entry = rows[0];

  if (entry.claimed_at && entry.player_id) {
    const profile = await getFullPlayerProfile(entry.player_id);
    const watchId = profile?.watch?.id || 1;
    const watchToken = signWatchToken(entry.player_id, watchId);
    return {
      status: 'LINKED',
      watchToken,
      player: profile?.player || {
        id: 1,
        username: 'AGENTE_NEXO',
        credits: 450,
        energy: 95,
        intel: 40,
      },
    };
  }

  if (new Date(entry.expires_at).getTime() <= Date.now()) {
    return { status: 'EXPIRED' };
  }

  return { status: 'PENDING', code: entry.code };
}

async function getActivePairingFromDb(playerId = 1) {
  const rows = await query(
    `SELECT code, expires_at FROM pairing_codes
     WHERE claimed_at IS NULL AND expires_at > UTC_TIMESTAMP()
     ORDER BY created_at DESC LIMIT 1`,
  );
  const profile = await getFullPlayerProfile(playerId);
  const latest = rows[0]
    ? {
        code: rows[0].code,
        expiresAt:
          rows[0].expires_at instanceof Date
            ? rows[0].expires_at.toISOString()
            : String(rows[0].expires_at),
      }
    : null;

  return {
    activeCode: latest,
    watch: profile?.watch || null,
  };
}

async function claimPairingCodeInDb(playerId, rawCode) {
  return transaction(async (conn) => {
    const [exactRows] = await conn.query(
      `SELECT * FROM pairing_codes
       WHERE claimed_at IS NULL AND code = ?
       ORDER BY created_at DESC LIMIT 1`,
      [rawCode],
    );

    let matched = exactRows[0] || null;
    if (!matched) {
      const [recentRows] = await conn.query(
        `SELECT * FROM pairing_codes
         WHERE claimed_at IS NULL
         ORDER BY created_at DESC LIMIT 1`,
      );
      matched = recentRows[0] || null;
    }

    const codeLabel = matched ? matched.code : rawCode;
    const deviceName = `Wear OS Hacker Deck #${codeLabel}`;

    await conn.query('DELETE FROM watch_devices WHERE player_id = ?', [playerId]);
    const [ins] = await conn.query(
      `INSERT INTO watch_devices (player_id, device_name, linked_at, last_seen_at)
       VALUES (?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
      [playerId, deviceName],
    );
    const watchId = ins.insertId;
    const watchToken = signWatchToken(playerId, watchId);

    if (matched) {
      await conn.query(
        `UPDATE pairing_codes
         SET player_id = ?, claimed_at = UTC_TIMESTAMP()
         WHERE id = ?`,
        [playerId, matched.id],
      );
    }

    return {
      watch: {
        id: Number(watchId),
        deviceName,
        linkedAt: 'Vinculado en MySQL',
        lastSeenAt: 'En linea · Socket activo',
      },
      watchToken,
    };
  });
}

async function touchWatchLastSeen(playerId = 1) {
  await query('UPDATE watch_devices SET last_seen_at = UTC_TIMESTAMP() WHERE player_id = ?', [
    playerId,
  ]);
}

async function unlinkWatchInDb(playerId = 1) {
  await query('DELETE FROM watch_devices WHERE player_id = ?', [playerId]);
}

async function buyUpgradeInDb(playerId, type) {
  const columnMap = {
    battery: 'battery_level',
    cipher: 'cipher_level',
    efficiency: 'efficiency_level',
  };
  const col = columnMap[type];
  if (!col) return getFullPlayerProfile(playerId);

  const upRows = await query('SELECT * FROM player_upgrades WHERE player_id = ?', [playerId]);
  const currentLevel = Number(upRows[0]?.[col] || 1);
  const nextLevel = Math.min(3, currentLevel + 1);

  if (nextLevel > currentLevel) {
    const cost = UPGRADE_COSTS[type]?.[nextLevel] || { credits: 0, energy: 0, intel: 0 };

    await query(
      `UPDATE players
       SET credits = GREATEST(0, credits - ?),
           energy = GREATEST(0, energy - ?),
           intel = GREATEST(0, intel - ?)
       WHERE id = ?`,
      [cost.credits || 0, cost.energy || 0, cost.intel || 0, playerId],
    );

    await query(`UPDATE player_upgrades SET ${col} = ? WHERE player_id = ?`, [
      nextLevel,
      playerId,
    ]);
  }

  return getFullPlayerProfile(playerId);
}

async function equipSkillsInDb(playerId, skills) {
  const clean = Array.isArray(skills) ? skills.slice(0, 4).map((s) => String(s)) : [];
  await query('UPDATE player_skills SET equipped = FALSE WHERE player_id = ?', [playerId]);
  for (const code of clean) {
    await query(
      `INSERT INTO player_skills (player_id, skill_code, equipped)
       VALUES (?, ?, TRUE)
       ON DUPLICATE KEY UPDATE equipped = TRUE`,
      [playerId, code],
    );
  }
  return getFullPlayerProfile(playerId);
}

async function grantDemoSuppliesInDb(playerId = 1) {
  await query(
    `UPDATE players
     SET credits = credits + 500,
         energy = energy + 150,
         intel = intel + 60
     WHERE id = ?`,
    [playerId],
  );
  const allSkills = [
    'SCANNER',
    'SABOTAGE',
    'CAMOUFLAGE',
    'OVERLOAD',
    'RADAR',
    'EMP',
    'THERMAL',
    'TIMEDILATE',
  ];
  for (const code of allSkills) {
    await query(
      `INSERT IGNORE INTO player_skills (player_id, skill_code, equipped)
       VALUES (?, ?, FALSE)`,
      [playerId, code],
    );
  }
  return getFullPlayerProfile(playerId);
}

async function savePlayerBaseInDb(playerId, { name, tiles, entities, isPublished = true }) {
  const cleanMap = sanitizeBaseMap({ tiles, entities }) || defaultBaseMap();
  const bfs = validateBaseBFS(cleanMap.tiles);
  const validPath = Boolean(bfs?.valid);
  const cleanName = String(name || 'FORTALEZA NEXO-01').trim().slice(0, 40);

  await query(
    `INSERT INTO player_bases (owner_id, name, map_json, is_published)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       map_json = VALUES(map_json),
       is_published = VALUES(is_published)`,
    [playerId, cleanName, JSON.stringify(cleanMap), Boolean(isPublished && validPath)],
  );

  return getFullPlayerProfile(playerId);
}

async function recordMissionResultInDb(playerId, payload) {
  const levelNumber = Number(payload?.level || 1);
  const rawMode = String(payload?.mode || 'SOLO').toUpperCase();
  const type = rawMode === 'PVP' || rawMode === 'RAID' ? 'RAID' : rawMode === 'COOP' ? 'COOP' : 'SOLO';
  const result = payload?.result === 'LOST' ? 'LOST' : 'WON';
  const turns = Math.max(1, Number(payload?.turns || Math.round((payload?.durationSeconds || 40) / 2)));
  const hacksOk = Number(payload?.hacksCompleted || 2);
  const maxAlert = Math.min(100, Math.max(0, Number(payload?.alertPeak || 0)));

  const missionRows = await query('SELECT * FROM missions WHERE level_number = ?', [levelNumber]);
  const mission = missionRows[0];
  const missionId = mission ? mission.id : null;

  let creditsEarned = 0;
  let energyEarned = 0;
  let intelEarned = 0;
  let unlockedSkill = null;

  if (result === 'WON') {
    creditsEarned = Number(payload?.creditsEarned ?? mission?.reward_credits ?? 250);
    energyEarned = Number(payload?.energyEarned ?? mission?.reward_energy ?? 60);
    intelEarned = Number(payload?.intelEarned ?? mission?.reward_intel ?? 25);
    unlockedSkill = payload?.unlockedSkill || mission?.unlocks_skill || null;

    await query(
      `UPDATE players
       SET credits = credits + ?, energy = energy + ?, intel = intel + ?
       WHERE id = ?`,
      [creditsEarned, energyEarned, intelEarned, playerId],
    );

    if (unlockedSkill) {
      await query(
        `INSERT IGNORE INTO player_skills (player_id, skill_code, equipped)
         VALUES (?, ?, FALSE)`,
        [playerId, unlockedSkill],
      );
    }

    if (missionId) {
      await query(
        `INSERT INTO player_mission_progress (player_id, mission_id, completed, best_turns, times_played)
         VALUES (?, ?, TRUE, ?, 1)
         ON DUPLICATE KEY UPDATE
           completed = TRUE,
           best_turns = CASE
             WHEN best_turns IS NULL OR VALUES(best_turns) < best_turns THEN VALUES(best_turns)
             ELSE best_turns
           END,
           times_played = times_played + 1`,
        [playerId, missionId, turns],
      );
    }
  }

  const label = mission
    ? `NIVEL ${mission.level_number}: ${mission.name}`
    : `OPERACION ${type}`;

  await query(
    `INSERT INTO mission_history
       (session_id, player_id, mission_id, type, label, result, turns, max_alert,
        hacks_ok, hacks_failed, credits_earned, energy_earned, intel_earned)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      playerId,
      missionId,
      type,
      label,
      result,
      turns,
      maxAlert,
      hacksOk,
      creditsEarned,
      energyEarned,
      intelEarned,
    ],
  );

  return getFullPlayerProfile(playerId);
}

async function getRaidTargetsFromDb(playerId = 1) {
  const rows = await query(
    `SELECT pb.id AS base_id, pb.name AS base_name, pb.map_json, pb.times_raided, pb.times_defended,
            p.id AS owner_id, p.username, p.credits
     FROM player_bases pb
     JOIN players p ON p.id = pb.owner_id
     WHERE pb.is_published = TRUE AND pb.owner_id != ?
     ORDER BY p.credits DESC LIMIT 10`,
    [playerId],
  );

  return rows.map((r) => {
    const map = parseJsonSafe(r.map_json, defaultBaseMap());
    const entities = Array.isArray(map.entities) ? map.entities : [];
    const guardsCount = entities.filter((e) => e.type === 'guard').length;
    const camerasCount = entities.filter((e) => e.type === 'camera').length;
    const trapsCount = entities.filter((e) => e.type === 'trap').length;

    return {
      id: Number(r.base_id),
      baseId: Number(r.base_id),
      ownerId: Number(r.owner_id),
      ownerUsername: r.username,
      ownerName: r.username,
      baseName: r.base_name,
      vaultCredits: Math.max(150, Math.round(Number(r.credits) * 0.25)),
      lootCredits: Math.max(150, Math.round(Number(r.credits) * 0.15)),
      securityRating: `${camerasCount} Camaras · ${guardsCount} Guardias${trapsCount ? ` · ${trapsCount} Trampas` : ''}`,
      timesRaided: Number(r.times_raided || 0),
      timesDefended: Number(r.times_defended || 0),
      guardsCount,
      camerasCount,
      trapsCount,
      map,
    };
  });
}

module.exports = {
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
};
