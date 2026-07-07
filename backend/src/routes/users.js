const express = require('express');
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const userService = require('../services/userService');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const user = await userService.createPendingUser(req.body || {});
    return res.status(201).json({
      detail: 'Cadastro recebido. Aguarde a liberação de um administrador.',
      user,
    });
  } catch (err) {
    return next(err);
  }
});

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const users = await userService.listUsers({ status: req.query.status });
    return res.json(users);
  } catch (err) {
    return next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body || {}, req.user.id);
    return res.json({
      detail: 'Usuário atualizado com sucesso.',
      user,
    });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const user = await userService.deleteUser(req.params.id, req.user.id);
    return res.json({
      detail: 'Usuário excluído com sucesso.',
      user,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
