# 🗄️ Documentação do Banco de Dados — Sistema de Gestão de Frota 17º GB

> **SGBD:** PostgreSQL 14+
> **ORM:** SQLAlchemy 2.x
> **Migrações:** Alembic

---

## 📊 Diagrama de Relacionamentos

```
┌──────────────────────────────────────────────────────────────┐
│                        USUÁRIOS                              │
│  (tabela independente — gerencia autenticação)               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                        VIATURAS                              │
│  id (PK), placa, prefixo, modelo, marca, ano,               │
│  valor_fipe, unidade, status, km_atual                       │
└──────┬───────────┬──────────┬──────────┬──────────┬─────────┘
       │           │          │          │          │
       │1:N        │1:N       │1:N       │1:N       │1:N
       ▼           ▼          ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐
│MANUTENCOES│ │ABASTECIM.│ │ GASTOS  │ │DEFEITOS │ │ ORDENS   │
│          │ │          │ │         │ │         │ │ SERVICO  │
└──────────┘ └──────────┘ └─────────┘ └─────────┘ └──────────┘

                                    ┌─────────────────────────┐
                                    │       ALERTAS           │
                                    │  viatura_id (nullable)  │
                                    └─────────────────────────┘
```

---

## 📋 Tabelas

### 1. `viaturas` — Frota de Veículos

Tabela central do sistema. Representa cada viatura da frota do 17º GB.

| Coluna       | Tipo          | Nulo | Padrão      | Descrição                                     |
|--------------|---------------|------|-------------|-----------------------------------------------|
| `id`         | INTEGER       | NÃO  | auto        | Chave primária                                |
| `placa`      | VARCHAR(10)   | NÃO  | —           | Placa do veículo (única)                     |
| `prefixo`    | VARCHAR(20)   | NÃO  | —           | Prefixo da viatura (ex: AB-01)               |
| `modelo`     | VARCHAR(100)  | NÃO  | —           | Modelo do veículo (ex: Sprinter CDI)          |
| `marca`      | VARCHAR(100)  | NÃO  | —           | Marca do veículo (ex: Mercedes-Benz)          |
| `ano`        | INTEGER       | NÃO  | —           | Ano de fabricação                             |
| `valor_fipe` | FLOAT         | SIM  | NULL        | Valor de mercado FIPE (atualizado via API)    |
| `unidade`    | VARCHAR(50)   | NÃO  | —           | Unidade do 17º GB                             |
| `status`     | VARCHAR(20)   | NÃO  | operacional | `operacional`, `manutencao`, `inativo`        |
| `km_atual`   | INTEGER       | NÃO  | 0           | Quilometragem atual do veículo                |
| `created_at` | TIMESTAMP     | NÃO  | now()       | Data de cadastro                              |
| `updated_at` | TIMESTAMP     | NÃO  | now()       | Última atualização                            |

**Índices:** `placa` (único), `prefixo`, `id` (PK)

---

### 2. `manutencoes` — Controle de Manutenções

Registra manutenções preventivas e corretivas por viatura.

| Coluna        | Tipo         | Nulo | Padrão   | Descrição                                       |
|---------------|--------------|------|----------|-------------------------------------------------|
| `id`          | INTEGER      | NÃO  | auto     | Chave primária                                  |
| `viatura_id`  | INTEGER (FK) | NÃO  | —        | Referência à viatura                            |
| `tipo`        | VARCHAR(50)  | NÃO  | —        | `oleo`, `pneu`, `bateria`, `inspecao`, `geral`  |
| `km_proximo`  | INTEGER      | SIM  | NULL     | Quilometragem para próxima manutenção           |
| `data_proximo`| DATE         | SIM  | NULL     | Data prevista para próxima manutenção           |
| `status`      | VARCHAR(20)  | NÃO  | pendente | `pendente`, `realizada`, `vencida`              |
| `data_ultima` | DATE         | SIM  | NULL     | Data da última manutenção realizada             |
| `observacoes` | TEXT         | SIM  | NULL     | Observações técnicas                            |
| `created_at`  | TIMESTAMP    | NÃO  | now()    | Data de criação                                 |
| `updated_at`  | TIMESTAMP    | NÃO  | now()    | Última atualização                              |

**FK:** `viatura_id` → `viaturas.id` ON DELETE CASCADE

---

### 3. `abastecimentos` — Registro de Abastecimentos

Histórico de abastecimentos de combustível.

| Coluna            | Tipo         | Nulo | Padrão | Descrição                        |
|-------------------|--------------|------|--------|----------------------------------|
| `id`              | INTEGER      | NÃO  | auto   | Chave primária                   |
| `viatura_id`      | INTEGER (FK) | NÃO  | —      | Referência à viatura             |
| `data`            | DATE         | NÃO  | —      | Data do abastecimento            |
| `km`              | INTEGER      | NÃO  | —      | Quilometragem no abastecimento   |
| `quantidade_litros`| FLOAT       | NÃO  | —      | Litros abastecidos               |
| `valor_total`     | FLOAT        | NÃO  | —      | Valor total pago (R$)            |
| `posto`           | VARCHAR(100) | SIM  | NULL   | Nome/localização do posto        |
| `responsavel`     | VARCHAR(100) | SIM  | NULL   | Militar responsável              |
| `created_at`      | TIMESTAMP    | NÃO  | now()  | Data de registro                 |

**FK:** `viatura_id` → `viaturas.id` ON DELETE CASCADE

---

### 4. `gastos` — Controle Financeiro

Registro de todos os gastos relacionados à frota.

| Coluna       | Tipo         | Nulo | Padrão | Descrição                                         |
|--------------|--------------|------|--------|---------------------------------------------------|
| `id`         | INTEGER      | NÃO  | auto   | Chave primária                                    |
| `viatura_id` | INTEGER (FK) | NÃO  | —      | Referência à viatura                              |
| `categoria`  | VARCHAR(50)  | NÃO  | —      | `manutencao`, `combustivel`, `peca`, `servico`, `outro` |
| `descricao`  | VARCHAR(255) | NÃO  | —      | Descrição do gasto                                |
| `data`       | DATE         | NÃO  | —      | Data do gasto                                     |
| `valor`      | FLOAT        | NÃO  | —      | Valor (R$)                                        |
| `nota_fiscal`| VARCHAR(100) | SIM  | NULL   | Número da nota fiscal                             |
| `responsavel`| VARCHAR(100) | SIM  | NULL   | Responsável pela despesa                          |
| `created_at` | TIMESTAMP    | NÃO  | now()  | Data de registro                                  |

**FK:** `viatura_id` → `viaturas.id` ON DELETE CASCADE

---

### 5. `defeitos` — Registro de Defeitos

Ocorrências de defeitos reportados nas viaturas.

| Coluna           | Tipo         | Nulo | Padrão | Descrição                                   |
|------------------|--------------|------|--------|---------------------------------------------|
| `id`             | INTEGER      | NÃO  | auto   | Chave primária                              |
| `viatura_id`     | INTEGER (FK) | NÃO  | —      | Referência à viatura                        |
| `data_relato`    | DATE         | NÃO  | —      | Data em que o defeito foi relatado          |
| `tipo_defeito`   | VARCHAR(100) | NÃO  | —      | Categoria/tipo do defeito                   |
| `descricao`      | TEXT         | NÃO  | —      | Descrição detalhada do defeito              |
| `severidade`     | VARCHAR(20)  | NÃO  | media  | `critica`, `alta`, `media`, `baixa`         |
| `status`         | VARCHAR(20)  | NÃO  | aberto | `aberto`, `em_andamento`, `resolvido`       |
| `data_resolucao` | DATE         | SIM  | NULL   | Data em que o defeito foi resolvido         |
| `created_at`     | TIMESTAMP    | NÃO  | now()  | Data de criação                             |
| `updated_at`     | TIMESTAMP    | NÃO  | now()  | Última atualização                          |

**FK:** `viatura_id` → `viaturas.id` ON DELETE CASCADE

---

### 6. `ordens_servico` — Ordens de Serviço

Controle de serviços realizados em oficinas.

| Coluna          | Tipo         | Nulo | Padrão | Descrição                                          |
|-----------------|--------------|------|--------|----------------------------------------------------|
| `id`            | INTEGER      | NÃO  | auto   | Chave primária                                     |
| `viatura_id`    | INTEGER (FK) | NÃO  | —      | Referência à viatura                               |
| `data_abertura` | DATE         | NÃO  | —      | Data de abertura da OS                             |
| `tipo_servico`  | VARCHAR(100) | NÃO  | —      | Tipo de serviço realizado                          |
| `descricao`     | TEXT         | SIM  | NULL   | Descrição detalhada dos serviços                   |
| `status`        | VARCHAR(20)  | NÃO  | aberta | `aberta`, `em_andamento`, `concluida`, `cancelada` |
| `data_conclusao`| DATE         | SIM  | NULL   | Data de conclusão da OS                            |
| `custo`         | FLOAT        | SIM  | NULL   | Custo total dos serviços (R$)                      |
| `oficina`       | VARCHAR(150) | SIM  | NULL   | Nome da oficina                                    |
| `responsavel`   | VARCHAR(100) | SIM  | NULL   | Responsável pela OS                                |
| `created_at`    | TIMESTAMP    | NÃO  | now()  | Data de criação                                    |
| `updated_at`    | TIMESTAMP    | NÃO  | now()  | Última atualização                                 |

**FK:** `viatura_id` → `viaturas.id` ON DELETE CASCADE

---

### 7. `alertas` — Alertas do Sistema

Alertas gerados automaticamente ou manualmente.

| Coluna         | Tipo         | Nulo | Padrão | Descrição                                   |
|----------------|--------------|------|--------|---------------------------------------------|
| `id`           | INTEGER      | NÃO  | auto   | Chave primária                              |
| `viatura_id`   | INTEGER (FK) | SIM  | NULL   | Referência à viatura (pode ser geral)       |
| `tipo_alerta`  | VARCHAR(20)  | NÃO  | —      | `critico`, `urgente`, `aviso`, `info`       |
| `mensagem`     | VARCHAR(500) | NÃO  | —      | Texto da mensagem do alerta                 |
| `data_criacao` | TIMESTAMP    | NÃO  | now()  | Data e hora de criação                      |
| `status`       | VARCHAR(20)  | NÃO  | ativo  | `ativo`, `resolvido`                        |
| `lido`         | BOOLEAN      | NÃO  | false  | Se o alerta foi lido                        |
| `data_leitura` | TIMESTAMP    | SIM  | NULL   | Data e hora em que foi lido                 |
| `created_at`   | TIMESTAMP    | NÃO  | now()  | Data de registro                            |

**FK:** `viatura_id` → `viaturas.id` ON DELETE SET NULL

---

### 8. `usuarios` — Usuários do Sistema

Usuários com acesso à plataforma.

| Coluna         | Tipo         | Nulo | Padrão | Descrição                                   |
|----------------|--------------|------|--------|---------------------------------------------|
| `id`           | INTEGER      | NÃO  | auto   | Chave primária                              |
| `nome`         | VARCHAR(150) | NÃO  | —      | Nome completo                               |
| `email`        | VARCHAR(200) | NÃO  | —      | E-mail (único, usado no login)              |
| `cargo`        | VARCHAR(20)  | NÃO  | Leitor | `Admin`, `Editor`, `Leitor`                 |
| `unidade`      | VARCHAR(50)  | NÃO  | —      | Unidade do 17º GB                           |
| `senha_hash`   | VARCHAR(255) | NÃO  | —      | Hash bcrypt da senha                        |
| `ativo`        | BOOLEAN      | NÃO  | true   | Usuário ativo ou inativo                    |
| `data_cadastro`| TIMESTAMP    | NÃO  | now()  | Data de criação da conta                    |
| `ultimo_acesso`| TIMESTAMP    | SIM  | NULL   | Último login registrado                     |

**Índices:** `email` (único)

---

## 🔍 Índices

| Tabela           | Coluna(s)    | Tipo    | Motivo                                |
|------------------|--------------|---------|---------------------------------------|
| `viaturas`       | `placa`      | UNIQUE  | Busca rápida por placa                |
| `viaturas`       | `prefixo`    | INDEX   | Filtro frequente por prefixo          |
| `manutencoes`    | `viatura_id` | INDEX   | Join com viaturas                     |
| `abastecimentos` | `viatura_id` | INDEX   | Histórico por viatura                 |
| `gastos`         | `viatura_id` | INDEX   | Relatórios financeiros por viatura    |
| `defeitos`       | `viatura_id` | INDEX   | Defeitos por viatura                  |
| `ordens_servico` | `viatura_id` | INDEX   | OS por viatura                        |
| `alertas`        | `viatura_id` | INDEX   | Alertas por viatura                   |
| `usuarios`       | `email`      | UNIQUE  | Login por e-mail                      |

---

## 💡 Queries Comuns

### Viaturas em manutenção
```sql
SELECT v.prefixo, v.placa, v.modelo, v.unidade
FROM viaturas v
WHERE v.status = 'manutencao'
ORDER BY v.prefixo;
```

### Custo total por viatura (último mês)
```sql
SELECT v.prefixo, v.placa, SUM(g.valor) AS custo_total
FROM gastos g
JOIN viaturas v ON v.id = g.viatura_id
WHERE g.data >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY v.id, v.prefixo, v.placa
ORDER BY custo_total DESC;
```

### Manutenções vencidas
```sql
SELECT v.prefixo, v.placa, m.tipo, m.km_proximo, m.data_proximo
FROM manutencoes m
JOIN viaturas v ON v.id = m.viatura_id
WHERE m.status = 'pendente'
  AND (
    (m.km_proximo IS NOT NULL AND v.km_atual >= m.km_proximo)
    OR (m.data_proximo IS NOT NULL AND m.data_proximo < CURRENT_DATE)
  )
ORDER BY v.prefixo;
```

### Alertas críticos não lidos
```sql
SELECT a.id, a.tipo_alerta, a.mensagem, v.prefixo, a.data_criacao
FROM alertas a
LEFT JOIN viaturas v ON v.id = a.viatura_id
WHERE a.lido = false
  AND a.status = 'ativo'
  AND a.tipo_alerta IN ('critico', 'urgente')
ORDER BY a.data_criacao DESC;
```

### Consumo médio de combustível por viatura
```sql
SELECT
  v.prefixo,
  v.placa,
  COUNT(ab.id) AS total_abastecimentos,
  SUM(ab.quantidade_litros) AS total_litros,
  SUM(ab.valor_total) AS custo_total,
  ROUND(SUM(ab.valor_total)::numeric / NULLIF(SUM(ab.quantidade_litros), 0), 2) AS preco_medio_litro
FROM abastecimentos ab
JOIN viaturas v ON v.id = ab.viatura_id
GROUP BY v.id, v.prefixo, v.placa
ORDER BY custo_total DESC;
```

---

## 💾 Backup e Restauração

### Backup completo

```bash
# Via Docker
docker compose exec postgres pg_dump \
  -U motomec \
  -d motomec17gb \
  -F c \
  -f /tmp/backup_$(date +%Y%m%d_%H%M%S).dump

# Copiar backup para o host
docker compose cp postgres:/tmp/backup_*.dump ./backups/
```

### Backup em texto plano (SQL)

```bash
docker compose exec postgres pg_dump \
  -U motomec \
  -d motomec17gb \
  --no-password \
  > backups/motomec17gb_$(date +%Y%m%d).sql
```

### Restauração

```bash
# Restaurar backup binário
docker compose exec -T postgres pg_restore \
  -U motomec \
  -d motomec17gb \
  --clean \
  < backups/backup.dump

# Restaurar SQL
docker compose exec -T postgres psql \
  -U motomec \
  -d motomec17gb \
  < backups/motomec17gb.sql
```

### Backup automatizado (cron)

```bash
# Adicionar ao crontab para backup diário às 2h
0 2 * * * docker compose -f /caminho/docker-compose.yml exec -T postgres pg_dump -U motomec -d motomec17gb > /backups/motomec17gb_$(date +\%Y\%m\%d).sql
```
