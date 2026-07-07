const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const userService = require('../services/userService');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      detail: 'Token não fornecido.',
      code: 'UNAUTHORIZED',
      requestId: req.headers['x-request-id'] || null,
    });
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      detail: 'Formato de autorização inválido.',
      code: 'UNAUTHORIZED',
      requestId: req.headers['x-request-id'] || null,
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    const detail = err.name === 'TokenExpiredError' ? 'Token expirado.' : 'Token inválido.';
    return res.status(401).json({
      detail,
      code: 'UNAUTHORIZED',
      requestId: req.headers['x-request-id'] || null,
    });
  }

  try {
    req.user = await userService.getActiveUserForRequest(decoded.id);
    return next();
  } catch (err) {
    if (err.code === 'USER_PENDING' || err.code === 'USER_INACTIVE' || err.code === 'INVALID_CREDENTIALS') {
      return res.status(err.status || 403).json({
        detail: err.message,
        code: err.code,
        requestId: req.headers['x-request-id'] || null,
      });
    }
    return next(err);
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.perfil !== 'admin') {
    return res.status(403).json({
      detail: 'Acesso permitido apenas para administradores.',
      code: 'ADMIN_REQUIRED',
      requestId: req.headers['x-request-id'] || null,
    });
  }
  return next();
}

module.exports = { authMiddleware, requireAdmin };
