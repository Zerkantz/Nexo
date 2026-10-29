// JWT, middlewares de autenticacion y utilidades de respuesta.
const jwt = require('jsonwebtoken');
const env = require('./config/env');
const { query } = require('./config/db');

function signMobileToken(playerId) {
  return jwt.sign({ sub: String(playerId), role: 'mobile' }, env.JWT_SECRET, { expiresIn: '30d' });
}

function signWatchToken(playerId, watchId) {
  return jwt.sign({ sub: String(playerId), role: 'watch', watchId }, env.JWT_SECRET, { expiresIn: '180d' });
}

function verifyToken(token) {
  if (!token) return null;
  const raw = String(token).trim();

  // Compatibilidad con tokens locales iniciales antes del login explicito
  if (raw === 'nexo_mobile_jwt_1' || raw === 'local_demo_jwt_token') {
    return { playerId: 1, role: 'mobile', watchId: null };
  }
  if (raw.startsWith('nexo_watch_jwt_')) {
    return { playerId: 1, role: 'watch', watchId: null };
  }

  try {
    const payload = jwt.verify(raw, env.JWT_SECRET);
    const playerId = Number(payload.sub);
    if (!Number.isInteger(playerId) || playerId <= 0) return null;
    if (payload.role !== 'mobile' && payload.role !== 'watch') return null;
    return { playerId, role: payload.role, watchId: payload.watchId ?? null };
  } catch {
    return null;
  }
}

/** Obtiene el playerId desde el header Authorization (o devuelve 1 por defecto para modo directo). */
function resolvePlayerIdFromReq(req) {
  const header = req.headers?.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const auth = token ? verifyToken(token) : null;
  return auth?.playerId || 1;
}

/** Un token de reloj solo es valido mientras ese reloj siga vinculado a la cuenta. */
async function isWatchStillLinked(auth) {
  if (auth.role !== 'watch' || !auth.watchId) return true;
  const rows = await query('SELECT id FROM watch_devices WHERE id = ? AND player_id = ?', [
    auth.watchId,
    auth.playerId,
  ]);
  return rows.length > 0;
}

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function fail(status, code, message) {
  return new HttpError(status, code, message);
}

/** Envuelve handlers async para mandar los errores al middleware de errores. */
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function requireAuth(...roles) {
  return wrap(async (req, _res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const auth = token ? verifyToken(token) : { playerId: 1, role: 'mobile', watchId: null };
    if (!auth) throw fail(401, 'UNAUTHORIZED', 'Inicia sesion de nuevo.');
    if (roles.length && !roles.includes(auth.role)) {
      throw fail(403, 'FORBIDDEN', 'Accion no permitida para este dispositivo.');
    }
    if (!(await isWatchStillLinked(auth))) {
      throw fail(401, 'WATCH_UNLINKED', 'El reloj ya no esta vinculado.');
    }
    req.auth = auth;
    req.playerId = auth.playerId;
    next();
  });
}

function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'BAD_JSON', message: 'JSON invalido.' } });
  }
  console.error('[API] Error inesperado:', err);
  return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor.' } });
}

module.exports = {
  signMobileToken,
  signWatchToken,
  verifyToken,
  resolvePlayerIdFromReq,
  isWatchStillLinked,
  HttpError,
  fail,
  wrap,
  requireAuth,
  errorHandler,
};
