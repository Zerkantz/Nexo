// Conexión a MySQL 8 (mysql2/promise). Al arrancar crea la base de datos y las tablas
// si no existen (backend/sql/schema.sql) y carga el catálogo de los 5 niveles.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const env = require('./env');

let pool = null;

async function initDatabase() {
  const schemaPath = path.join(__dirname, '..', '..', 'sql', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8').replace(/nexo_db/g, env.DB_NAME);

  const bootstrap = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    multipleStatements: true,
  });
  await bootstrap.query(schema);
  await bootstrap.end();

  pool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    connectionLimit: 10,
    timezone: 'Z',
  });

  return pool;
}

function getPool() {
  if (!pool) throw new Error('La base de datos no está inicializada');
  return pool;
}

/** Ejecuta una consulta y devuelve las filas. */
async function query(sql, params = []) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}

/** Ejecuta `fn(conn)` dentro de una transacción. */
async function transaction(fn) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { initDatabase, getPool, query, transaction };
