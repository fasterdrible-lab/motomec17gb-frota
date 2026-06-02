const express = require('express');
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const userService = require('../services/userService');

const router = express.Router();

router.post('/', (req, res, next) => {
  try {
    const user = userService.createPendingUser(req.body || {});
    return res.status(201).json({
      detail: 'Cadastro recebido. Aguarde a liberacao de um administrador.',
      user,
    });
  } catch (err) {
    return next(err);
  }
});

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/', (req, res, next) => {
  try {
    const users = userService.listUsers({ status: req.query.status });
    return res.json(users);
  } catch (err) {
    return next(err);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const user = userService.updateUser(req.params.id, req.body || {}, req.user.id);
    return res.json({
      detail: 'Usuario atualizado com sucesso.',
      user,
    });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const user = userService.deleteUser(req.params.id, req.user.id);
    return res.json({
      detail: 'Usuario excluido com sucesso.',
      user,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
