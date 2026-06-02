const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const userService = require('../services/userService');

/**
 * Middleware para validar JWT e extrair dados do usuário
 * Esperado header: Authorization: Bearer <token>
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      detail: 'Token nao fornecido.',
      code: 'UNAUTHORIZED',
      requestId: req.headers['x-request-id'] || null,
    });
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      detail: 'Formato de autorizacao invalido.',
      code: 'UNAUTHORIZED',
      requestId: req.headers['x-request-id'] || null,
    });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = userService.getActiveUserForRequest(decoded.id);
    next();
  } catch (err) {
    if (err.code === 'USER_PENDING' || err.code === 'USER_INACTIVE' || err.code === 'INVALID_CREDENTIALS') {
      return res.status(err.status || 403).json({
        detail: err.message,
        code: err.code,
        requestId: req.headers['x-request-id'] || null,
      });
    }

    const detail = err.name === 'TokenExpiredError' 
      ? 'Token expirado.' 
      : 'Token invalido.';
    
    return res.status(401).json({
      detail,
      code: 'UNAUTHORIZED',
      requestId: req.headers['x-request-id'] || null,
    });
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
