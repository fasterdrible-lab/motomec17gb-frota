const mysql = require('mysql2/promise');
const crypto = require('crypto');
const { env } = require('../config/env');

const pool = mysql.createPool({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

async function initializeDb() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      nome       VARCHAR(120)                             NOT NULL,
      email      VARCHAR(200)                             NOT NULL UNIQUE,
      senha_hash VARCHAR(300)                             NOT NULL,
      cargo      VARCHAR(80),
      unidade    VARCHAR(80),
      perfil     ENUM('admin','operador','visualizador')  NOT NULL DEFAULT 'operador',
      status     ENUM('pendente','ativo','inativo')       NOT NULL DEFAULT 'pendente',
      created_at DATETIME                                 NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email  (email),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [rows] = await pool.execute(
    "SELECT id FROM usuarios WHERE perfil = 'admin' LIMIT 1"
  );

  if (rows.length === 0) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync('admin123', salt, 64).toString('hex');
    await pool.execute(
      `INSERT INTO usuarios (nome, email, senha_hash, cargo, unidade, perfil, status)
       VALUES (?, ?, ?, ?, ?, 'admin', 'ativo')`,
      ['Admin Teste', 'admin@cbmesp.sp.gov.br', `${salt}:${hash}`, 'Comandante', '17GB']
    );
    console.log('[db] Admin padrão criado: admin@cbmesp.sp.gov.br / admin123');
  }

  console.log('[db] Banco inicializado.');
}

module.exports = { pool, initializeDb };
