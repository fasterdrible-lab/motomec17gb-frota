# Current State — MOTOMEC 17GB Frota

Atualizado em: 2026-06-08

## Status geral

Aplicacao em producao em https://motomec17gb-frota.com.br.
Proximo passo recomendado: redeploy do backend e frontend na VPS com as variaveis `GOOGLE_SHEETS_ID` e `TAREFAS_GID` adicionadas ao `.env.backend`.

---

## Stack em producao

| Camada   | Container                  | Porta | Imagem                             |
|----------|----------------------------|-------|------------------------------------|
| Frontend | motomec17gb-frontend-1     | 8080  | Vite 8 + nginx 1.27-alpine         |
| Backend  | motomec17gb-backend-1      | 8001  | Node.js 22 / Express               |
| MySQL    | motomec-mysql              | 3306  | mysql:8.0 (volume persistente)     |
| Backup   | motomec17gb-db-backup-1    | —     | mysql:8.0 (apenas cliente mysqldump)|

Nginx no host:
- `GET /motomec17gb-frota/*` → porta 8080
- `GET /api/*` → porta 8001

SSL: Let's Encrypt via certbot, renovacao automatica ativa. Cloudflare proxy ativo.

## Projeto no servidor

- Repositorio: `/opt/motomec17gb-frota` (VPS 204.168.180.25)
- Secrets: `/opt/motomec17gb-frota/.env.backend` (chmod 600, fora do git)
- Redeploy backend: `docker build -t motomec17gb-backend-node ./backend && docker run --env-file /opt/motomec17gb-frota/.env.backend ...`

---

## O que foi implementado nesta sessao (2026-06-03)

### Issue 016 — Persistencia MySQL de usuarios [CONCLUIDA + DEPLOYADA]

- Container `motomec-mysql` criado na VPS com volume persistente (`motomec-mysql-data`)
- Banco `motomec17gb_frota`, usuario `motomec`, senha `motomec2026`
- Schema SQL criado: `backend/database/schema.sql`
- Pool de conexao: `backend/src/db/connection.js` (mysql2/promise)
- `initializeDb()` cria tabela e seed do admin na primeira execucao
- `userService.js` reescrito com queries SQL async (substituiu mock em memoria)
- `authService.js`, `middleware/auth.js`, rotas `auth.js` e `users.js` tornadas async/await
- `server.js` chama `initializeDb()` no startup; falha com exit(1) se banco nao conectar
- `mysql2` adicionado ao `backend/package.json`
- Variaveis `DB_HOST/PORT/NAME/USER/PASSWORD` adicionadas ao `env.js` e `.env.example`

**Admin padrao criado automaticamente:** `phpos35@gmail.com` (email atualizado via SQL) / `admin123`

### Fix JWT [CONCLUIDO + DEPLOYADO]

- `expiresIn: env.jwtExpiresIn` → `expiresIn: Number(env.jwtExpiresIn)`
- Token agora expira em 1 hora (era 3 segundos por interpretacao de string como ms)

### UI — Sidebar e Header [CONCLUIDO + DEPLOYADO]

- Titulo do sidebar alterado de "SITE" para "Painel de Gestao"
- Subtitulo "17º Grupamento" removido do sidebar
- Botao X removido do header (agora sempre mostra icone hamburger ≡)
- Botao `ChevronLeft` (‹) adicionado dentro do sidebar para ocultar o menu

### Google Apps Script — Relatorios.gs [ATUALIZADO COM COLUNAS REAIS — 2026-06-03 sessao 2]

Arquivo: `docs/Relatorios.gs` (colar no Apps Script da planilha)

Funcionalidades implementadas:
- `adicionarMenuRelatorios_(ui, menu)` — integrar no `onOpen()` existente
- **Relatorio da Frota**: resumo geral + tabela com status colorido por operacional/baixado/reserva
- **Relatorio de Manutencoes por Viatura**: filtra por prefixo + periodo
- **Relatorio de Abastecimento por Viatura**: filtra por prefixo/placa + periodo
- **Relatorio Executivo**: rankings top 10, alertas consolidados, tarefas, viaturas sem abastecimento
- Exportacao Excel e PDF para o Google Drive

**Colunas confirmadas (via screenshot 2026-06-03):**

| Aba       | Coluna | Campo                   | Indice |
|-----------|--------|-------------------------|--------|
| FROTA     | A      | PREFIXO                 | 1      |
| FROTA     | C      | FIPE ESTIMADO           | 3      |
| FROTA     | G      | PLACA                   | 7      |
| FROTA     | H      | MARCA                   | 8      |
| FROTA     | I      | MODELO                  | 9      |
| RIV_2026  | A      | VTR (= PREFIXO)         | 1      |
| RIV_2026  | B      | NEO                     | 2      |
| RIV_2026  | C      | DATA                    | 3      |
| RIV_2026  | D      | KM                      | 4      |
| RIV_2026  | E      | SERVICOS                | 5      |
| RIV_2026  | F      | EMPRESA                 | 6      |
| RIV_2026  | G      | VALOR                   | 7      |
| TAREFAS   | A      | PREFIXO                 | 1      |
| TAREFAS   | B      | PLACA                   | 2      |
| TAREFAS   | C      | DESCRICAO               | 3      |
| TAREFAS   | D      | RESPONSAVEL             | 4      |
| TAREFAS   | E      | STATUS (PENDENTE/FINALIZADA) | 5 |
| 2SGB      | A      | PREFIXO                 | 1      |
| 2SGB      | B      | PLACA                   | 2      |
| 2SGB      | C      | KM ATUAL                | 3      |
| 2SGB      | H      | STATUS: OLEO KM         | 8      |
| 2SGB      | I      | STATUS: OLEO TEMPO      | 9      |
| 2SGB      | J      | STATUS: REVISAO FREIO   | 10     |
| 2SGB      | K      | STATUS: BATERIA         | 11     |
| 2SGB      | P      | STATUS OPERACIONAL      | 16     |
| 1SGB      | A      | VTR (= PREFIXO)         | 1      |
| 1SGB      | B      | PLACA                   | 2      |
| 1SGB      | C      | KM ATUAL                | 3      |
| 1SGB      | D      | VTR EM GARANTIA (extra) | 4      |
| 1SGB      | I      | STATUS: OLEO KM         | 9      |
| 1SGB      | J      | STATUS: OLEO TEMPO      | 10     |
| 1SGB      | K      | STATUS: REVISAO FREIO   | 11     |
| 1SGB      | L      | STATUS: BATERIA         | 12     |
| 1SGB      | P      | STATUS OPERACIONAL      | 16     |

**IMPORTANTE — 1SGB tem coluna extra "VTR EM GARANTIA" em D, deslocando todos os indices de status.**
O script usa `REL_COL_1SGB` e `REL_COL_2SGB` separados para tratar isso corretamente.

| ABAST. VTR | A      | Carimbo (form)           | 1      |
| ABAST. VTR | F      | PREFIXO DA VIATURA       | 6      |
| ABAST. VTR | G      | CONFIRME A PLACA         | 7      |
| ABAST. VTR | H      | DATA                     | 8      |
| ABAST. VTR | I      | HODOMETRO (KM)           | 9      |
| ABAST. VTR | J      | VOLUME (litros)          | 10     |
| ABAST. VTR | K      | VALOR TOTAL              | 11     |
| GASTOS     | A      | PREFIXO                  | 1      |
| GASTOS     | B      | VALORFIPE                | 2      |
| GASTOS     | C      | GASTOTOTAL(2026)         | 3      |
| GASTOS     | D      | %FIPE                    | 4      |
| GASTOS     | E      | STATUS                   | 5      |

**Observacao:** ABAST. VTR e um Google Form — colunas A-E sao metadados do form (carimbo, email, posto, nome, unidade). Dados da viatura comecam em F.

**Todas as colunas confirmadas. Relatorios.gs esta pronto para uso.**

---

## O que foi implementado nesta sessao (2026-06-08)

### Issue 017 — Endpoint backend /api/dashboard [CONCLUIDO — deploy pendente]

- `backend/src/services/sheetsService.js` criado: porta toda a logica de agregacao do `googleSheets.js` para Node.js (CommonJS, fetch nativo Node 22).
- `backend/src/routes/dashboard.js` criado: GET `/api/dashboard/macro`, `/api/dashboard/abastecimentos`, `/api/dashboard/tarefas` (protegidos por JWT).
- `backend/src/app.js` atualizado: rota `/api/dashboard` registrada.
- `backend/src/config/env.js` atualizado: campos `sheetsId` e `tarefasGid`.
- `backend/.env.example` atualizado: `GOOGLE_SHEETS_ID` e `TAREFAS_GID`.

### Issue 005 — Dashboard migrado para backend [CONCLUIDO — deploy pendente]

- `frontend/src/pages/Dashboard.jsx`: import trocado de `googleSheets.js` para `api.js`; todas as 3 chamadas de planilha agora usam o backend.
- `frontend/src/services/api.js`: funcoes `getDashboardMacro`, `getDashboardAbastecimentos`, `getDashboardTarefas` adicionadas.

---

## Pendencias

- **Deploy na VPS (prioritario):**
  1. Adicionar ao `/opt/motomec17gb-frota/.env.backend`:
     ```
     GOOGLE_SHEETS_ID=1q6wy9iO4aRDKMBPzxR9cISE7pCmUuIaYSRBdhUNlM4Q
     TAREFAS_GID=1988288811
     ```
  2. Rebuild e redeploy do backend (`docker build` + `docker run --env-file`).
  3. Rebuild e redeploy do frontend (`docker build` + substituir container).
- `Relatorios.gs` CONCLUIDO — todas as colunas confirmadas e mapeadas.
