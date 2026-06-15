'use strict';

const { Router } = require('express');
const { getFrotaDetalhada } = require('../services/sheetsService');
const authMiddleware = require('../middleware/auth');

const router = Router();

router.get('/detalhada', authMiddleware, async (req, res, next) => {
  try {
    const viaturas = await getFrotaDetalhada();
    res.json(viaturas);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
