-- Esquema MySQL 8 para NEXO (docs/NEXO_Contexto_IA.md, sección 10).
-- El servidor lo ejecuta automáticamente al arrancar (CREATE ... IF NOT EXISTS),
-- así que se puede volver a correr sin perder datos.
-- Extensiones respecto al documento (para que el móvil pueda mostrar la información):
--   missions.minigame_label, missions.description  -> texto del Hub de distritos
--   mission_history.label                          -> nombre visible en el historial (asaltos PvP)
CREATE DATABASE IF NOT EXISTS nexo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nexo_db;

-- Jugadores y recursos
CREATE TABLE IF NOT EXISTS players (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  credits INT NOT NULL DEFAULT 100,
  energy INT NOT NULL DEFAULT 50,
  intel INT NOT NULL DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relojes vinculados a un jugador
CREATE TABLE IF NOT EXISTS watch_devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player_id INT NOT NULL,
  device_name VARCHAR(80),
  linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NULL,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Códigos temporales de vinculación (los pide el reloj, los confirma el móvil)
CREATE TABLE IF NOT EXISTS pairing_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code CHAR(4) NOT NULL,
  pairing_token CHAR(36) NOT NULL UNIQUE,
  player_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  claimed_at TIMESTAMP NULL,
  INDEX (code),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Mejoras del Hacker Deck
CREATE TABLE IF NOT EXISTS player_upgrades (
  player_id INT PRIMARY KEY,
  battery_level TINYINT NOT NULL DEFAULT 1,
  cipher_level TINYINT NOT NULL DEFAULT 1,
  efficiency_level TINYINT NOT NULL DEFAULT 1,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Habilidades desbloqueadas y equipadas
CREATE TABLE IF NOT EXISTS player_skills (
  player_id INT NOT NULL,
  skill_code VARCHAR(20) NOT NULL,
  equipped BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (player_id, skill_code),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Catálogo de niveles
CREATE TABLE IF NOT EXISTS missions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  level_number TINYINT NOT NULL UNIQUE,
  name VARCHAR(80) NOT NULL,
  theme VARCHAR(40) NOT NULL,
  minigame_label VARCHAR(80) NOT NULL DEFAULT '',
  description VARCHAR(400) NOT NULL DEFAULT '',
  map_json JSON NOT NULL,
  reward_credits INT NOT NULL,
  reward_energy INT NOT NULL,
  reward_intel INT NOT NULL,
  unlocks_skill VARCHAR(20) NULL,
  supports_coop BOOLEAN NOT NULL DEFAULT TRUE
);

-- Progreso por nivel
CREATE TABLE IF NOT EXISTS player_mission_progress (
  player_id INT NOT NULL,
  mission_id INT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  best_turns INT NULL,
  times_played INT NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, mission_id),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
);

-- Bases PvP creadas por los jugadores
CREATE TABLE IF NOT EXISTS player_bases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL UNIQUE,
  name VARCHAR(60) NOT NULL,
  map_json JSON NOT NULL,
  vault_credits INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  times_raided INT NOT NULL DEFAULT 0,
  times_defended INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Partidas (solo, co-op y asaltos)
CREATE TABLE IF NOT EXISTS game_sessions (
  id CHAR(36) PRIMARY KEY,
  room_code VARCHAR(10) NULL UNIQUE,
  type ENUM('SOLO','COOP','RAID') NOT NULL,
  mission_id INT NULL,
  base_id INT NULL,
  status ENUM('WAITING','PLAYING','WON','LOST','ABANDONED') NOT NULL DEFAULT 'WAITING',
  turn INT NOT NULL DEFAULT 0,
  alert_level TINYINT NOT NULL DEFAULT 0,
  state_json JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  FOREIGN KEY (mission_id) REFERENCES missions(id),
  FOREIGN KEY (base_id) REFERENCES player_bases(id) ON DELETE SET NULL
);

-- Jugadores dentro de cada partida
CREATE TABLE IF NOT EXISTS session_players (
  session_id CHAR(36) NOT NULL,
  player_id INT NOT NULL,
  slot TINYINT NOT NULL,
  pos_x TINYINT NOT NULL DEFAULT 0,
  pos_y TINYINT NOT NULL DEFAULT 0,
  battery SMALLINT NOT NULL DEFAULT 100,
  max_battery SMALLINT NOT NULL DEFAULT 100,
  loot_credits INT NOT NULL DEFAULT 0,
  loot_energy INT NOT NULL DEFAULT 0,
  loot_intel INT NOT NULL DEFAULT 0,
  extracted BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (session_id, player_id),
  FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Historial de misiones terminadas
CREATE TABLE IF NOT EXISTS mission_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id CHAR(36) NOT NULL,
  player_id INT NOT NULL,
  mission_id INT NULL,
  type ENUM('SOLO','COOP','RAID') NOT NULL,
  label VARCHAR(100) NOT NULL DEFAULT '',
  result ENUM('WON','LOST') NOT NULL,
  turns INT NOT NULL,
  max_alert TINYINT NOT NULL,
  hacks_ok INT NOT NULL DEFAULT 0,
  hacks_failed INT NOT NULL DEFAULT 0,
  credits_earned INT NOT NULL DEFAULT 0,
  energy_earned INT NOT NULL DEFAULT 0,
  intel_earned INT NOT NULL DEFAULT 0,
  played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Reportes de asaltos PvP
CREATE TABLE IF NOT EXISTS raid_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id CHAR(36) NOT NULL,
  attacker_id INT NOT NULL,
  defender_id INT NOT NULL,
  base_id INT NOT NULL,
  success BOOLEAN NOT NULL,
  credits_stolen INT NOT NULL DEFAULT 0,
  seen_by_defender BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attacker_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (defender_id) REFERENCES players(id) ON DELETE CASCADE
);
