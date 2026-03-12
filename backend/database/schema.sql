-- ============================================================
-- Mototec 17º GB - Sistema de Gestão de Frota
-- Schema PostgreSQL completo
-- ============================================================

-- Tipos ENUM
CREATE TYPE status_viatura AS ENUM ('operando', 'manutencao', 'baixada', 'reserva');
CREATE TYPE tipo_manutencao AS ENUM ('troca_oleo', 'revisao_freio', 'troca_bateria', 'troca_pneus', 'revisao_geral', 'embreagem', 'outro');
CREATE TYPE status_manutencao AS ENUM ('pendente', 'em_andamento', 'concluida', 'vencida');
CREATE TYPE categoria_gasto AS ENUM ('combustivel', 'manutencao', 'peca', 'seguro', 'multa', 'outro');
CREATE TYPE severidade_defeito AS ENUM ('baixa', 'media', 'alta', 'critica');
CREATE TYPE status_defeito AS ENUM ('pendente', 'em_reparo', 'resolvido', 'aguardando_peca');
CREATE TYPE status_os AS ENUM ('aberta', 'em_andamento', 'aguardando_peca', 'finalizada', 'cancelada');
CREATE TYPE prioridade_os AS ENUM ('baixa', 'normal', 'alta', 'urgente');
CREATE TYPE tipo_alerta AS ENUM ('manutencao', 'defeito', 'operacional', 'combustivel', 'financeiro');
CREATE TYPE nivel_alerta AS ENUM ('critico', 'aviso', 'info');
CREATE TYPE role_usuario AS ENUM ('admin', 'editor', 'leitor');

-- ============================================================
-- Tabela: viaturas
-- ============================================================
CREATE TABLE IF NOT EXISTS viaturas (
    id               SERIAL PRIMARY KEY,
    placa            VARCHAR(10)  NOT NULL UNIQUE,
    prefixo          VARCHAR(20)  NOT NULL,
    modelo           VARCHAR(100) NOT NULL,
    marca            VARCHAR(50)  NOT NULL,
    ano              INTEGER,
    unidade          VARCHAR(10),
    status           status_viatura NOT NULL DEFAULT 'operando',
    km_atual         FLOAT NOT NULL DEFAULT 0,
    valor_fipe       FLOAT NOT NULL DEFAULT 0,
    data_cadastro    TIMESTAMP NOT NULL DEFAULT NOW(),
    data_atualizacao TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_viaturas_placa   ON viaturas (placa);
CREATE INDEX IF NOT EXISTS idx_viaturas_status  ON viaturas (status);
CREATE INDEX IF NOT EXISTS idx_viaturas_unidade ON viaturas (unidade);

-- ============================================================
-- Tabela: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id               SERIAL PRIMARY KEY,
    nome             VARCHAR(100) NOT NULL,
    email            VARCHAR(150) NOT NULL UNIQUE,
    hashed_password  VARCHAR(300) NOT NULL,
    cargo            VARCHAR(100),
    telefone         VARCHAR(20),
    unidade          VARCHAR(20),
    role             role_usuario NOT NULL DEFAULT 'leitor',
    ativo            BOOLEAN NOT NULL DEFAULT TRUE,
    data_cadastro    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios (email);

-- ============================================================
-- Tabela: manutencao_preventiva
-- ============================================================
CREATE TABLE IF NOT EXISTS manutencao_preventiva (
    id               SERIAL PRIMARY KEY,
    viatura_id       INTEGER NOT NULL REFERENCES viaturas(id) ON DELETE CASCADE,
    tipo             tipo_manutencao NOT NULL,
    km_proximo       FLOAT,
    data_proxima     TIMESTAMP,
    status           status_manutencao NOT NULL DEFAULT 'pendente',
    data_ultima      TIMESTAMP,
    km_ultima        FLOAT,
    responsavel      VARCHAR(100),
    observacoes      VARCHAR(500),
    data_criacao     TIMESTAMP NOT NULL DEFAULT NOW(),
    data_atualizacao TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manut_viatura ON manutencao_preventiva (viatura_id);
CREATE INDEX IF NOT EXISTS idx_manut_status  ON manutencao_preventiva (status);

-- ============================================================
-- Tabela: abastecimento
-- ============================================================
CREATE TABLE IF NOT EXISTS abastecimento (
    id               SERIAL PRIMARY KEY,
    viatura_id       INTEGER NOT NULL REFERENCES viaturas(id) ON DELETE CASCADE,
    data             TIMESTAMP NOT NULL DEFAULT NOW(),
    km               FLOAT NOT NULL,
    quantidade_litros FLOAT NOT NULL,
    valor_total      FLOAT NOT NULL,
    preco_litro      FLOAT,
    responsavel      VARCHAR(100),
    observacoes      VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_abast_viatura ON abastecimento (viatura_id);
CREATE INDEX IF NOT EXISTS idx_abast_data    ON abastecimento (data DESC);

-- ============================================================
-- Tabela: gastos_financeiros
-- ============================================================
CREATE TABLE IF NOT EXISTS gastos_financeiros (
    id          SERIAL PRIMARY KEY,
    viatura_id  INTEGER NOT NULL REFERENCES viaturas(id) ON DELETE CASCADE,
    categoria   categoria_gasto NOT NULL,
    descricao   VARCHAR(300) NOT NULL,
    data        TIMESTAMP NOT NULL DEFAULT NOW(),
    valor       FLOAT NOT NULL,
    mes         INTEGER,
    ano         INTEGER,
    responsavel VARCHAR(100),
    observacoes VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_gastos_viatura ON gastos_financeiros (viatura_id);
CREATE INDEX IF NOT EXISTS idx_gastos_ano_mes ON gastos_financeiros (ano, mes);

-- ============================================================
-- Tabela: defeitos
-- ============================================================
CREATE TABLE IF NOT EXISTS defeitos (
    id             SERIAL PRIMARY KEY,
    viatura_id     INTEGER NOT NULL REFERENCES viaturas(id) ON DELETE CASCADE,
    tipo           VARCHAR(100) NOT NULL,
    descricao      VARCHAR(500) NOT NULL,
    severidade     severidade_defeito NOT NULL DEFAULT 'media',
    status         status_defeito NOT NULL DEFAULT 'pendente',
    data_relato    TIMESTAMP NOT NULL DEFAULT NOW(),
    data_resolucao TIMESTAMP,
    mecanico       VARCHAR(100),
    observacoes    VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_defeitos_viatura ON defeitos (viatura_id);
CREATE INDEX IF NOT EXISTS idx_defeitos_status  ON defeitos (status);

-- ============================================================
-- Tabela: ordens_servico
-- ============================================================
CREATE TABLE IF NOT EXISTS ordens_servico (
    id             SERIAL PRIMARY KEY,
    numero_os      VARCHAR(20) NOT NULL UNIQUE,
    viatura_id     INTEGER NOT NULL REFERENCES viaturas(id) ON DELETE CASCADE,
    tipo_servico   VARCHAR(200) NOT NULL,
    status         status_os NOT NULL DEFAULT 'aberta',
    prioridade     prioridade_os NOT NULL DEFAULT 'normal',
    data_abertura  TIMESTAMP NOT NULL DEFAULT NOW(),
    data_conclusao TIMESTAMP,
    custo          FLOAT NOT NULL DEFAULT 0,
    mecanico       VARCHAR(100),
    observacoes    VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_os_viatura   ON ordens_servico (viatura_id);
CREATE INDEX IF NOT EXISTS idx_os_status    ON ordens_servico (status);
CREATE INDEX IF NOT EXISTS idx_os_numero_os ON ordens_servico (numero_os);

-- ============================================================
-- Tabela: alertas_automaticos
-- ============================================================
CREATE TABLE IF NOT EXISTS alertas_automaticos (
    id           SERIAL PRIMARY KEY,
    viatura_id   INTEGER REFERENCES viaturas(id) ON DELETE SET NULL,
    tipo         tipo_alerta NOT NULL,
    nivel        nivel_alerta NOT NULL,
    mensagem     VARCHAR(500) NOT NULL,
    lido         BOOLEAN NOT NULL DEFAULT FALSE,
    data_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    data_leitura TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alertas_viatura ON alertas_automaticos (viatura_id);
CREATE INDEX IF NOT EXISTS idx_alertas_nivel   ON alertas_automaticos (nivel);
CREATE INDEX IF NOT EXISTS idx_alertas_lido    ON alertas_automaticos (lido);

-- ============================================================
-- Tabela: historico_km
-- ============================================================
CREATE TABLE IF NOT EXISTS historico_km (
    id          SERIAL PRIMARY KEY,
    viatura_id  INTEGER NOT NULL REFERENCES viaturas(id) ON DELETE CASCADE,
    data        TIMESTAMP NOT NULL DEFAULT NOW(),
    km          FLOAT NOT NULL,
    responsavel VARCHAR(100),
    observacoes VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_hkm_viatura ON historico_km (viatura_id);
CREATE INDEX IF NOT EXISTS idx_hkm_data    ON historico_km (data DESC);
