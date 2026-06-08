'use strict';

const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth');
const { getDashboardMacro, getAbastecimentos, getTarefasCompletas } = require('../services/sheetsService');

const router = Router();

router.get('/macro', authMiddleware, async (req, res, next) => {
  try {
    const data = await getDashboardMacro();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/abastecimentos', authMiddleware, async (req, res, next) => {
  try {
    const data = await getAbastecimentos();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/tarefas', authMiddleware, async (req, res, next) => {
  try {
    const data = await getTarefasCompletas();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
