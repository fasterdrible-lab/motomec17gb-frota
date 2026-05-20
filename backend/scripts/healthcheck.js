const { createApp } = require('../src/app');

const app = createApp();
const server = app.listen(0, async () => {
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    const body = await response.json();

    if (!response.ok || body.status !== 'ok') {
      throw new Error(`Healthcheck invalido: HTTP ${response.status}`);
    }

    console.log(`STATUS=${response.status} SERVICE=${body.service}`);
  } finally {
    server.close();
  }
});

