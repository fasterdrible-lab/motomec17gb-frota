-- Schema MOTOMEC 17GB Frota
-- Executar na VPS: docker exec -i motomec17gb-db-backup-1 mysql -u<USER> -p<PASS> < schema.sql

CREATE DATABASE IF NOT EXISTS motomec17gb_frota
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE motomec17gb_frota;

CREATE TABLE IF NOT EXISTS usuarios (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nome       VARCHAR(120)                              NOT NULL,
  email      VARCHAR(200)                              NOT NULL UNIQUE,
  senha_hash VARCHAR(300)                              NOT NULL,
  cargo      VARCHAR(80),
  unidade    VARCHAR(80),
  perfil     ENUM('admin','operador','visualizador')   NOT NULL DEFAULT 'operador',
  status     ENUM('pendente','ativo','inativo')        NOT NULL DEFAULT 'pendente',
  created_at DATETIME                                  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email  (email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- O usuario admin padrao e criado automaticamente pelo backend
-- na primeira inicializacao quando nenhum admin existir (ver connection.js initializeDb).
