const express = require('express');
const cors = require('cors');
const { env } = require('./config/env');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');

function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/usuarios', userRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  app.use((req, res) => {
    res.status(404).json({
      detail: 'Recurso nao encontrado.',
      code: 'NOT_FOUND',
      requestId: req.headers['x-request-id'] || null,
    });
  });

  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }

    const status = err.status || 500;
    return res.status(status).json({
      detail: status === 500 ? 'Erro interno do servidor.' : err.message,
      code: err.code || 'INTERNAL_ERROR',
      requestId: req.headers['x-request-id'] || null,
    });
  });

  return app;
}

module.exports = { createApp };

