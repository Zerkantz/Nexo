// Variables de entorno del servidor (archivo backend/.env).
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const env = {
  PORT: Number(process.env.PORT || 3000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'nexo_db',
  JWT_SECRET: process.env.JWT_SECRET || 'nexo_secret_dev_key_2026_tactical_grid',
};
if (!/^[A-Za-z0-9_]+$/.test(env.DB_NAME)) {
  throw new Error('DB_NAME solo puede contener letras, números y guion bajo');
}

env.IS_DEV = env.NODE_ENV !== 'production';

module.exports = env;
