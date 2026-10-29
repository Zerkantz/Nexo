// Validación y costo de las bases PvP 10x10 (sección 8.2).
const { BASE_PIECE_COSTS, BASE_SIZE } = require('./catalog');

const ALLOWED_TILES = new Set([0, 1, 2, 4, 5, 6, 7]);
const ALLOWED_ENTITIES = new Set(['camera', 'guard', 'trap', 'door']);
const ALLOWED_DIRS = new Set(['up', 'down', 'left', 'right']);

/** Plantilla inicial que ve un jugador que todavía no guardó su base. */
function defaultBaseMap() {
  return {
    width: BASE_SIZE,
    height: BASE_SIZE,
    tiles: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 6, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 2, 0, 1, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 0, 1, 0, 1],
      [1, 0, 0, 0, 1, 1, 0, 1, 0, 1],
      [1, 1, 2, 1, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 2, 0, 5, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    entities: [
      { id: 'CAM_B1', type: 'camera', x: 5, y: 1, dir: 'down' },
      { id: 'CAM_B2', type: 'camera', x: 8, y: 5, dir: 'left' },
      { id: 'GRD_B1', type: 'guard', x: 3, y: 6, dir: 'right' },
      { id: 'TRP_B1', type: 'trap', x: 5, y: 5 },
      { id: 'DOOR_B1', type: 'door', x: 4, y: 2 },
      { id: 'DOOR_B2', type: 'door', x: 2, y: 5 },
      { id: 'DOOR_B3', type: 'door', x: 6, y: 8 },
    ],
  };
}

/**
 * Normaliza el mapa recibido del móvil. Lanza un Error con mensaje en español si es inválido.
 */
function sanitizeBaseMap(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('El mapa de la base no es válido.');
  const tiles = raw.tiles;
  if (!Array.isArray(tiles) || tiles.length !== BASE_SIZE) {
    throw new Error(`La base debe medir ${BASE_SIZE}x${BASE_SIZE}.`);
  }
  const cleanTiles = tiles.map((row) => {
    if (!Array.isArray(row) || row.length !== BASE_SIZE) {
      throw new Error(`La base debe medir ${BASE_SIZE}x${BASE_SIZE}.`);
    }
    return row.map((t) => {
      const n = Number(t);
      if (!ALLOWED_TILES.has(n)) throw new Error('La base contiene casillas no permitidas.');
      return n;
    });
  });

  const rawEntities = Array.isArray(raw.entities) ? raw.entities : [];
  if (rawEntities.length > 40) throw new Error('Demasiadas defensas en la base.');
  const seen = new Set();
  const entities = [];
  for (const e of rawEntities) {
    const x = Number(e?.x);
    const y = Number(e?.y);
    const type = String(e?.type || '');
    if (!ALLOWED_ENTITIES.has(type)) continue;
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= BASE_SIZE || y >= BASE_SIZE) {
      continue;
    }
    const key = `${x},${y}`;
    if (seen.has(key)) continue;
    if (cleanTiles[y][x] === 1) continue; // no se colocan defensas dentro de muros
    seen.add(key);
    const entity = { id: `${type.toUpperCase()}_${x}_${y}`, type, x, y };
    if ((type === 'camera' || type === 'guard') && ALLOWED_DIRS.has(e?.dir)) entity.dir = e.dir;
    else if (type === 'camera') entity.dir = 'down';
    else if (type === 'guard') entity.dir = 'right';
    entities.push(entity);
  }

  return { width: BASE_SIZE, height: BASE_SIZE, tiles: cleanTiles, entities };
}

/** Costo total en créditos de las piezas de la base (los muros perimetrales no cuentan). */
function baseCost(map) {
  let cost = 0;
  for (let y = 1; y < BASE_SIZE - 1; y++) {
    for (let x = 1; x < BASE_SIZE - 1; x++) {
      if (map.tiles[y][x] === 1) cost += BASE_PIECE_COSTS.wall;
    }
  }
  for (const e of map.entities) cost += BASE_PIECE_COSTS[e.type] ?? 0;
  return cost;
}

/**
 * BFS: debe existir un camino desde la entrada (6) hasta la bóveda (5), contando puertas como cruzables.
 */
function validateBaseBFS(tiles) {
  let start = null;
  let vault = null;
  let starts = 0;
  let vaults = 0;
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      if (tiles[y][x] === 6) { start = [x, y]; starts++; }
      if (tiles[y][x] === 5) { vault = [x, y]; vaults++; }
    }
  }
  if (starts !== 1) return { valid: false, reason: 'La base necesita exactamente una Entrada.' };
  if (vaults !== 1) return { valid: false, reason: 'La base necesita exactamente una Bóveda.' };

  const visited = tiles.map((row) => row.map(() => false));
  const queue = [[start[0], start[1], 0]];
  visited[start[1]][start[0]] = true;
  while (queue.length) {
    const [cx, cy, dist] = queue.shift();
    if (cx === vault[0] && cy === vault[1]) {
      return { valid: true, reason: `Ruta verificada: ${dist} pasos de la Entrada a la Bóveda.`, pathLength: dist };
    }
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (ny < 0 || ny >= tiles.length || nx < 0 || nx >= tiles[ny].length) continue;
      if (visited[ny][nx]) continue;
      const t = tiles[ny][nx];
      if (t === 1 || t === 9) continue;
      visited[ny][nx] = true;
      queue.push([nx, ny, dist + 1]);
    }
  }
  return { valid: false, reason: 'No existe ningún camino entre la Entrada y la Bóveda.' };
}

function securityRating(map) {
  const count = (t) => map.entities.filter((e) => e.type === t).length;
  const cams = count('camera');
  const guards = count('guard');
  const traps = count('trap');
  const doors = count('door');
  const score = cams * 2 + guards * 3 + traps * 2 + doors;
  const level = score >= 18 ? 'ALTA' : score >= 9 ? 'MEDIA' : 'ESTÁNDAR';
  return `${level} // ${cams} Cámaras · ${guards} Guardias · ${traps} Trampas · ${doors} Puertas`;
}

module.exports = { defaultBaseMap, sanitizeBaseMap, baseCost, validateBaseBFS, securityRating };
