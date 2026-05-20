const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'motomec17gb-frota-api',
    version: '0.1.0',
  });
});

module.exports = router;

