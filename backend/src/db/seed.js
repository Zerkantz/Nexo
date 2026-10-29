// Datos iniciales: agente principal por defecto (id=1), catálogo de los 5 niveles
// y 3 bases PvP de agentes rivales para que la lista de asaltos esté poblada en MySQL.
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { MISSIONS, INITIAL_SKILLS } = require('../game/catalog');
const { defaultBaseMap } = require('../game/bases');

async function seedDefaultPlayer() {
  const existing = await query('SELECT id FROM players WHERE id = 1');
  if (existing.length === 0) {
    const hash = await bcrypt.hash('nexo1234', 10);
    await query(
      `INSERT INTO players (id, username, email, password_hash, credits, energy, intel)
       VALUES (1, 'AGENTE_NEXO', 'agente@nexo.tactical', ?, 450, 95, 40)`,
      [hash],
    );
  }

  await query(
    `INSERT IGNORE INTO player_upgrades (player_id, battery_level, cipher_level, efficiency_level)
     VALUES (1, 1, 1, 1)`,
  );

  const defaultSkills = ['SCANNER', 'SABOTAGE', 'CAMOUFLAGE', 'OVERLOAD'];
  for (const skill of defaultSkills) {
    await query(
      `INSERT IGNORE INTO player_skills (player_id, skill_code, equipped)
       VALUES (1, ?, TRUE)`,
      [skill],
    );
  }

  const baseRows = await query('SELECT id FROM player_bases WHERE owner_id = 1');
  if (baseRows.length === 0) {
    const map = defaultBaseMap();
    await query(
      `INSERT INTO player_bases (owner_id, name, map_json, is_published)
       VALUES (1, 'FORTALEZA NEXO-01', ?, TRUE)`,
      [JSON.stringify(map)],
    );
  }
}

async function seedMissions() {
  for (const m of MISSIONS) {
    await query(
      `INSERT INTO missions
         (level_number, name, theme, minigame_label, description, map_json,
          reward_credits, reward_energy, reward_intel, unlocks_skill, supports_coop)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), theme = VALUES(theme), minigame_label = VALUES(minigame_label),
         description = VALUES(description), reward_credits = VALUES(reward_credits),
         reward_energy = VALUES(reward_energy), reward_intel = VALUES(reward_intel),
         unlocks_skill = VALUES(unlocks_skill)`,
      [
        m.level,
        m.name,
        m.theme,
        m.minigameLabel,
        m.description,
        JSON.stringify({ theme: m.theme, source: 'mobile' }),
        m.rewards.credits,
        m.rewards.energy,
        m.rewards.intel,
        m.unlocksSkill,
      ],
    );
  }
}

const RIVALS = [
  {
    username: 'KRONOS_99',
    baseName: 'BUNKER CRIPTO-7',
    credits: 2000,
    extra: [{ type: 'camera', x: 8, y: 1, dir: 'down' }],
  },
  {
    username: 'VALKYRIE_OS',
    baseName: 'NODO NEURAL X',
    credits: 3100,
    extra: [
      { type: 'guard', x: 5, y: 7, dir: 'up' },
      { type: 'trap', x: 1, y: 7 },
      { type: 'camera', x: 1, y: 6, dir: 'right' },
    ],
  },
  {
    username: 'ZERO_COOL',
    baseName: 'SECTOR FANTASMA',
    credits: 1400,
    extra: [],
  },
];

async function seedRivalBases() {
  for (const rival of RIVALS) {
    const existing = await query('SELECT id FROM players WHERE username = ?', [rival.username]);
    if (existing.length) continue;

    const hash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);
    const res = await query(
      'INSERT INTO players (username, email, password_hash, credits, energy, intel) VALUES (?, ?, ?, ?, 50, 10)',
      [rival.username, `${rival.username.toLowerCase()}@bots.nexo`, hash, rival.credits],
    );
    const playerId = res.insertId;
    await query('INSERT INTO player_upgrades (player_id) VALUES (?)', [playerId]);
    for (const skill of INITIAL_SKILLS) {
      await query(
        'INSERT INTO player_skills (player_id, skill_code, equipped) VALUES (?, ?, TRUE)',
        [playerId, skill],
      );
    }

    const map = defaultBaseMap();
    for (const e of rival.extra) {
      map.entities.push({ id: `${e.type.toUpperCase()}_${e.x}_${e.y}`, ...e });
    }
    await query(
      'INSERT INTO player_bases (owner_id, name, map_json, is_published) VALUES (?, ?, ?, TRUE)',
      [playerId, rival.baseName, JSON.stringify(map)],
    );
  }
}

async function seed() {
  await seedDefaultPlayer();
  await seedMissions();
  await seedRivalBases();
}

module.exports = { seed };
