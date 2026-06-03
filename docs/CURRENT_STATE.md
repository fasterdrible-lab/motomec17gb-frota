# Current State — MOTOMEC 17GB Frota

Atualizado em: 2026-06-03

## Status geral

Aplicacao em producao em https://motomec17gb-frota.com.br.
Proximo passo recomendado: ajustar colunas restantes do `Relatorios.gs` (FROTA, RIV_2026, ABAST. VTR, GASTOS).

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

### Google Apps Script — Relatorios.gs [CRIADO, aguarda ajuste de colunas]

Arquivo: `docs/Relatorios.gs` (colar no Apps Script da planilha)

Funcionalidades implementadas:
- `adicionarMenuRelatorios_(ui, menu)` — integrar no `onOpen()` existente
- **Relatorio da Frota**: resumo geral + tabela com status colorido por operacional/baixado/reserva
- **Relatorio de Manutencoes por Viatura**: filtra por prefixo + periodo
- **Relatorio de Abastecimento por Viatura**: filtra por prefixo/placa + periodo
- **Relatorio Executivo**: rankings top 10, alertas consolidados, tarefas, viaturas sem abastecimento
- Exportacao Excel e PDF para o Google Drive

**Colunas confirmadas ate agora:**

| Aba       | Coluna | Campo                  | Indice |
|-----------|--------|------------------------|--------|
| TAREFAS   | A      | PREFIXO                | 1      |
| TAREFAS   | B      | PLACA                  | 2      |
| TAREFAS   | C      | DESCRICAO              | 3      |
| TAREFAS   | D      | RESPONSAVEL            | 4      |
| TAREFAS   | E      | STATUS                 | 5      |
| 1SGB/2SGB | A      | PREFIXO                | 1      |
| 1SGB/2SGB | B      | PLACA                  | 2      |
| 1SGB/2SGB | C      | KM ATUAL               | 3      |
| 1SGB/2SGB | D      | PROX TROCA OLEO (KM)   | 4      |
| 1SGB/2SGB | E      | PROX TROCA OLEO (TEMPO)| 5      |
| 1SGB/2SGB | F      | REVISAO FREIO (KM)     | 6      |
| 1SGB/2SGB | G      | DATA VENC BATERIA      | 7      |
| 1SGB/2SGB | H      | STATUS: OLEO KM        | 8      |
| 1SGB/2SGB | I      | STATUS: OLEO TEMPO     | 9      |
| 1SGB/2SGB | J      | STATUS: REVISAO FREIO  | 10     |
| 1SGB/2SGB | K      | STATUS: BATERIA        | 11     |
| 1SGB/2SGB | L      | DATA LAVAGEM           | 12     |
| 1SGB/2SGB | M      | PNEUS DATA TROCA       | 13     |
| 1SGB/2SGB | N      | DATA TROCA EMBREAGEM   | 14     |
| 1SGB/2SGB | P      | STATUS OPERACIONAL     | 16     |

**Colunas ainda nao confirmadas:** FROTA, RIV_2026, ABAST. VTR, GASTOS.

---

## Pendencias

- Confirmar colunas de FROTA, RIV_2026, ABAST. VTR e GASTOS para ajustar `Relatorios.gs`
- Dashboard ainda consome planilhas diretamente (Issue 005, blocked)
- Redeploy do frontend pendente para refletir mudancas de UI do Sidebar/Header
