const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

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
    req.user = decoded;
    next();
  } catch (err) {
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

module.exports = { authMiddleware };
