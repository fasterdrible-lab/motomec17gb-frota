-- =============================================================================
-- Schema: motomec17gb — Sistema de Gestão de Frota — 17º GB
-- =============================================================================

-- Enable trigram extension for text search (optional)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- 1. viaturas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS viaturas (
    id          SERIAL PRIMARY KEY,
    placa       VARCHAR(10)  NOT NULL UNIQUE,
    prefixo     VARCHAR(20)  NOT NULL,
    modelo      VARCHAR(100) NOT NULL,
    marca       VARCHAR(100) NOT NULL,
    ano         INTEGER      NOT NULL,
    valor_fipe  NUMERIC(12,2),
    unidade     VARCHAR(50)  NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'operacional'
                    CHECK (status IN ('operacional','manutencao','inativo')),
    km_atual    INTEGER      NOT NULL DEFAULT 0 CHECK (km_atual >= 0),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_viaturas_status   ON viaturas(status);
CREATE INDEX IF NOT EXISTS idx_viaturas_unidade  ON viaturas(unidade);
CREATE INDEX IF NOT EXISTS idx_viaturas_prefixo  ON viaturas(prefixo);

-- ---------------------------------------------------------------------------
-- 2. manutencoes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS manutencoes (
    id           SERIAL PRIMARY KEY,
    viatura_id   INTEGER     NOT NULL REFERENCES viaturas(id) ON DELETE CASCADE,
    tipo         VARCHAR(50) NOT NULL
                     CHECK (tipo IN ('oleo','pneu','bateria','inspecao','geral')),
    km_proximo   INTEGER,
    data_proximo DATE,
    status       VARCHAR(20) NOT NULL DEFAULT 'pendente'
                     CHECK (status IN ('pendente','realizada','vencida')),
    data_ultima  DATE,
    observacoes  TEXT,
    created_at   TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manutencoes_viatura ON manutencoes(viatura_id);
CREATE INDEX IF NOT EXISTS idx_manutencoes_status  ON manutencoes(status);
CREATE INDEX IF NOT EXISTS idx_manutencoes_data    ON manutencoes(data_proximo);

-- ---------------------------------------------------------------------------
-- 3. abastecimentos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS abastecimentos (
    id               SERIAL PRIMARY KEY,
    viatura_id       INTEGER     NOT NULL REFERENCES viaturas(id) ON DELETE CASCADE,
    data             DATE        NOT NULL,
    km               INTEGER     NOT NULL CHECK (km >= 0),
    quantidade_litros NUMERIC(8,3) NOT NULL CHECK (quantidade_litros > 0),
    valor_total      NUMERIC(10,2) NOT NULL CHECK (valor_total >= 0),
    posto            VARCHAR(100),
    responsavel      VARCHAR(100),
    created_at       TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abastecimentos_viatura ON abastecimentos(viatura_id);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_data    ON abastecimentos(data);

-- ---------------------------------------------------------------------------
-- 4. gastos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gastos (
    id          SERIAL PRIMARY KEY,
    viatura_id  INTEGER      NOT NULL REFERENCES viaturas(id) ON DELETE CASCADE,
    categoria   VARCHAR(50)  NOT NULL
                    CHECK (categoria IN ('manutencao','combustivel','peca','servico','outro')),
    descricao   VARCHAR(255) NOT NULL,
    data        DATE         NOT NULL,
    valor       NUMERIC(12,2) NOT NULL CHECK (valor >= 0),
    nota_fiscal VARCHAR(100),
    responsavel VARCHAR(100),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gastos_viatura   ON gastos(viatura_id);
CREATE INDEX IF NOT EXISTS idx_gastos_data      ON gastos(data);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria);

-- ---------------------------------------------------------------------------
-- 5. defeitos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS defeitos (
    id             SERIAL PRIMARY KEY,
    viatura_id     INTEGER     NOT NULL REFERENCES viaturas(id) ON DELETE CASCADE,
    data_relato    DATE        NOT NULL,
    tipo_defeito   VARCHAR(100) NOT NULL,
    descricao      TEXT        NOT NULL,
    severidade     VARCHAR(20) NOT NULL DEFAULT 'media'
                       CHECK (severidade IN ('critica','alta','media','baixa')),
    status         VARCHAR(20) NOT NULL DEFAULT 'aberto'
                       CHECK (status IN ('aberto','em_andamento','resolvido')),
    data_resolucao DATE,
    created_at     TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_defeitos_viatura    ON defeitos(viatura_id);
CREATE INDEX IF NOT EXISTS idx_defeitos_status     ON defeitos(status);
CREATE INDEX IF NOT EXISTS idx_defeitos_severidade ON defeitos(severidade);

-- ---------------------------------------------------------------------------
-- 6. ordens_servico
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ordens_servico (
    id             SERIAL PRIMARY KEY,
    viatura_id     INTEGER      NOT NULL REFERENCES viaturas(id) ON DELETE CASCADE,
    data_abertura  DATE         NOT NULL,
    tipo_servico   VARCHAR(100) NOT NULL,
    descricao      TEXT,
    status         VARCHAR(20)  NOT NULL DEFAULT 'aberta'
                       CHECK (status IN ('aberta','em_andamento','concluida','cancelada')),
    data_conclusao DATE,
    custo          NUMERIC(12,2),
    oficina        VARCHAR(150),
    responsavel    VARCHAR(100),
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_os_viatura ON ordens_servico(viatura_id);
CREATE INDEX IF NOT EXISTS idx_os_status  ON ordens_servico(status);

-- ---------------------------------------------------------------------------
-- 7. alertas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alertas (
    id           SERIAL PRIMARY KEY,
    viatura_id   INTEGER      REFERENCES viaturas(id) ON DELETE SET NULL,
    tipo_alerta  VARCHAR(20)  NOT NULL
                     CHECK (tipo_alerta IN ('critico','urgente','aviso','info')),
    mensagem     VARCHAR(500) NOT NULL,
    data_criacao TIMESTAMP    NOT NULL DEFAULT NOW(),
    status       VARCHAR(20)  NOT NULL DEFAULT 'ativo'
                     CHECK (status IN ('ativo','resolvido')),
    lido         BOOLEAN      NOT NULL DEFAULT FALSE,
    data_leitura TIMESTAMP,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alertas_viatura    ON alertas(viatura_id);
CREATE INDEX IF NOT EXISTS idx_alertas_status     ON alertas(status);
CREATE INDEX IF NOT EXISTS idx_alertas_tipo       ON alertas(tipo_alerta);
CREATE INDEX IF NOT EXISTS idx_alertas_lido       ON alertas(lido);

-- ---------------------------------------------------------------------------
-- 8. usuarios
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id            SERIAL PRIMARY KEY,
    nome          VARCHAR(150) NOT NULL,
    email         VARCHAR(200) NOT NULL UNIQUE,
    cargo         VARCHAR(20)  NOT NULL DEFAULT 'Leitor'
                      CHECK (cargo IN ('Admin','Editor','Leitor')),
    unidade       VARCHAR(50)  NOT NULL,
    senha_hash    VARCHAR(255) NOT NULL,
    ativo         BOOLEAN      NOT NULL DEFAULT TRUE,
    data_cadastro TIMESTAMP    NOT NULL DEFAULT NOW(),
    ultimo_acesso TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- ---------------------------------------------------------------------------
-- 9. configuracoes (key-value store)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS configuracoes (
    id         SERIAL PRIMARY KEY,
    chave      VARCHAR(100) NOT NULL UNIQUE,
    valor      TEXT         NOT NULL,
    descricao  TEXT,
    updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 10. logs_sistema
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logs_sistema (
    id         SERIAL PRIMARY KEY,
    nivel      VARCHAR(10)  NOT NULL CHECK (nivel IN ('DEBUG','INFO','WARNING','ERROR','CRITICAL')),
    modulo     VARCHAR(100),
    mensagem   TEXT         NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_nivel      ON logs_sistema(nivel);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs_sistema(created_at);

-- ---------------------------------------------------------------------------
-- Triggers for updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY['viaturas','manutencoes','defeitos','ordens_servico']
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I;
             CREATE TRIGGER trg_%I_updated_at
             BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
            tbl, tbl, tbl, tbl
        );
    END LOOP;
END;
$$;
