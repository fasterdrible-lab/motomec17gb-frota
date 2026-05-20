const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const authService = require('../services/authService');

const router = express.Router();

/**
 * POST /api/auth/login
 * 
 * Autentica usuário e retorna JWT
 * 
 * Body (application/x-www-form-urlencoded):
 *   - username: email (ex: admin@cbmesp.sp.gov.br)
 *   - password: senha (ex: admin123)
 * 
 * Response 200:
 *   {
 *     "access_token": "eyJhbGc...",
 *     "token_type": "bearer",
 *     "expires_in": 3600
 *   }
 * 
 * Response 400/401:
 *   {
 *     "detail": "Email ou senha incorretos.",
 *     "code": "INVALID_CREDENTIALS"
 *   }
 */
router.post('/login', (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        detail: 'Email e senha sao obrigatorios.',
        code: 'MISSING_CREDENTIALS',
        requestId: req.headers['x-request-id'] || null,
      });
    }

    const result = authService.login(username, password);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * 
 * Retorna dados do usuário autenticado
 * Requer: Authorization: Bearer <token>
 * 
 * Response 200:
 *   {
 *     "id": 1,
 *     "nome": "Admin Teste",
 *     "email": "admin@cbmesp.sp.gov.br",
 *     "cargo": "Comandante",
 *     "unidade": "17GB",
 *     "perfil": "admin"
 *   }
 * 
 * Response 401:
 *   {
 *     "detail": "Token nao fornecido.",
 *     "code": "UNAUTHORIZED"
 *   }
 */
router.get('/me', authMiddleware, (req, res, next) => {
  try {
    const user = authService.getUser(req.user.id);
    return res.json(user);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
