const { createApp } = require('./app');
const { env } = require('./config/env');
const { initializeDb } = require('./db/connection');

async function start() {
  await initializeDb();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`MOTOMEC API listening on port ${env.port}`);
  });
}

start().catch(err => {
  console.error('[startup] Falha ao inicializar:', err.message);
  process.exit(1);
});
