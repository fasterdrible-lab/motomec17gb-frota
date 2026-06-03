const express = require('express');
const authService = require('../services/authService');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        detail: 'Email e senha sao obrigatorios.',
        code: 'MISSING_FIELDS',
        requestId: req.headers['x-request-id'] || null,
      });
    }

    const result = await authService.login(String(email).trim().toLowerCase(), password);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

router.post('/recuperar-senha', (req, res) => {
  return res.json({
    detail: 'Solicitacao recebida. Procure um administrador para redefinir sua senha.',
  });
});

router.get('/me', authMiddleware, (req, res) => {
  return res.json(req.user);
});

module.exports = router;
