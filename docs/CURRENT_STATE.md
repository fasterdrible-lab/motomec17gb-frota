# Current State — MOTOMEC 17GB Frota

Atualizado em: 2026-06-12

## Status geral

Aplicacao em producao em https://motomec17gb-frota.com.br.
Proximo passo recomendado: redeploy do backend na VPS para ativar `GET /api/frota/detalhada` (Issue 020) e, em seguida, rebuild do frontend com o import atualizado.

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

**Colunas confirmadas (via Apps Script v10.0 — fonte autoritativa):**

1SGB e 2SGB tem estrutura IDENTICA (base 0). O Apps Script usa os mesmos indices para ambas.

| Aba       | Coluna | Campo                        | Indice (base 0) | R/W       |
|-----------|--------|------------------------------|-----------------|-----------|
| FROTA     | A      | PREFIXO                      | 0               | R         |
| FROTA     | B      | CODIGO FIPE                  | 1               | R         |
| FROTA     | C      | FIPE ESTIMADO                | 2               | W         |
| FROTA     | G      | PLACA                        | 6               | R         |
| FROTA     | H      | MARCA                        | 7               | R         |
| FROTA     | I      | MODELO                       | 8               | R         |
| FROTA     | K      | ANO FABRICACAO               | 10              | R         |
| FROTA     | L      | ANO MODELO                   | 11              | R         |
| 1SGB/2SGB | A      | PREFIXO                      | 0               | R         |
| 1SGB/2SGB | B      | PLACA                        | 1               | R         |
| 1SGB/2SGB | C      | KM ATUAL                     | 2               | W         |
| 1SGB/2SGB | D      | DATA KM (timestamp)          | 3               | W         |
| 1SGB/2SGB | E      | KM PROX TROCA OLEO           | 4               | R         |
| 1SGB/2SGB | F      | DATA PROX TROCA OLEO         | 5               | R         |
| 1SGB/2SGB | G      | KM REVISAO FREIO             | 6               | R         |
| 1SGB/2SGB | H      | DATA VENC BATERIA            | 7               | R         |
| 1SGB/2SGB | I      | STATUS OLEO KM (computado)   | 8               | W         |
| 1SGB/2SGB | J      | STATUS OLEO TEMPO (computado)| 9               | W         |
| 1SGB/2SGB | K      | STATUS FREIO (computado)     | 10              | W         |
| 1SGB/2SGB | L      | STATUS BATERIA (computado)   | 11              | W         |
| 1SGB/2SGB | M      | DATA LAVAGEM                 | 12              | R         |
| 1SGB/2SGB | N      | KM TROCA PNEU                | 13              | R         |
| 1SGB/2SGB | O      | KM TROCA EMBREAGEM           | 14              | R         |
| 1SGB/2SGB | P      | STATUS OPERACIONAL           | 15              | W         |
| RIV_2026  | A      | VTR (= PREFIXO)              | 0               | R         |
| RIV_2026  | C      | DATA                         | 2               | R         |
| RIV_2026  | G      | VALOR                        | 6               | R         |
| TAREFAS   | A      | PREFIXO                      | 0               | R         |
| TAREFAS   | C      | DESCRICAO                    | 2               | R         |
| TAREFAS   | E      | STATUS (PENDENTE/FINALIZADA) | 4               | R         |
| GASTOS    | A      | PREFIXO                      | 0               | R         |
| GASTOS    | B      | VALOR FIPE                   | 1               | W         |
| GASTOS    | C      | GASTO TOTAL (2026)           | 2               | W         |
| GASTOS    | D      | % FIPE                       | 3               | W         |
| GASTOS    | E      | STATUS                       | 4               | W         |

**Fluxo de dados — Apps Script escreve, backend le:**
- O Apps Script (`sincronizarStatus`) le status de planilhas externas (`ID_PLANILHA_OPERACIONAL` e `ID_CBM`) e **grava** na col P de 1SGB/2SGB.
- O Apps Script (`atualizarStatusColunas`) **calcula e grava** I/J/K/L (status de oleo/freio/bateria) a partir das colunas E/F/G/H.
- O backend (`sheetsService.js`) **le** via GViz API os valores ja gravados pelo Apps Script.
- Portanto: se o Apps Script nao rodou recentemente, os status podem estar desatualizados.

**Alertas — limiares do Apps Script:**
- `LAVAGEM_DIAS = 15` dias | aviso com `ALERTA_DIAS_AVISO = 3` dias de antecedencia (threshold efetivo: 12 dias)
- `ALERTA_KM_AVISO = 5000` km para pneu/embreagem
- `ALERTA_KM_OLEO_AVISO = 2000` km para oleo
- `ALERTA_KM_FREIO_AVISO = 2000` km para freio
- `ALERTA_DIAS_BATERIA = 30` dias | `ALERTA_DIAS_OLEO = 15` dias

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

## O que foi implementado nesta sessao (2026-06-08 sessao 2)

### Issue 018 — Corrigir contagem de baixadas [CONCLUIDA + DEPLOYADA]

**Investigacao:**
- Script diagnostico executado na VPS via GViz API para ler dados brutos de 1SGB e 2SGB.
- Resultado: 1SGB = 2 linhas, 2SGB = 6 linhas — todas com STATUS OPERACIONAL = BAIXADA.
- Causa raiz: filtros ativos na planilha ocultam viaturas OPERANDO da API publica GViz.
- Viaturas incorretas identificadas: UR-17208 e UR-17211 (col P aba 2SGB marca BAIXADA indevidamente).

**Fix:**
- `backend/src/services/sheetsService.js`: adicionada constante `STATUS_OVERRIDES` com UR-17208 e UR-17211 mapeados para string vazia (= OPERANDO no calculo).
- Arquivo uploado via SFTP para `/opt/motomec17gb-frota/backend/src/services/sheetsService.js`.
- Imagem backend rebuilada: `docker build -t motomec17gb-backend-node /opt/motomec17gb-frota/backend`.
- Container reiniciado com os mesmos parametros de ambiente.

**Resultado verificado via API (estado final):** `operando=58, baixadas=7, reserva=0, total=65`.

Apos o Apps Script sincronizar, MOB-17108 foi adicionada como nova BAIXADA na 1SGB, elevando para 7. Confirmado pelo usuario como correto. UR-17208 e UR-17211 permanecem com override OPERANDO.

**Pendencia manual na planilha:** corrigir UR-17208 e UR-17211 na aba 2SGB coluna P (STATUS OPERACIONAL) para vazio ou OPERANDO. Apos correcao, remover as entradas do `STATUS_OVERRIDES` no codigo.

### Fix senha phpos35@gmail.com [CORRIGIDO]

- Hash da conta `phpos35@gmail.com` recriado via `crypto.scryptSync` na VPS e atualizado no MySQL.
- Senha: `admin123`.
- **Comportamento observado:** o hash muda apos restarts — provavel uso da funcao "alterar senha" no painel por outro admin. Se a senha parar de funcionar novamente, executar o script `/tmp/update_pw.js` na VPS.

### Issues 017 e 005 — Deploy confirmado

- Backend com `sheetsService.js` e rotas `/api/dashboard/*` esta em execucao na VPS (confirmado pelo dashboard retornando dados corretos).
- Frontend (`Dashboard.jsx`) chamando o backend em vez da planilha diretamente (confirmado pelo funcionamento em producao).

---

## O que foi implementado nesta sessao (2026-06-12)

### Issue 020 — Migrar Frota para backend [CONCLUIDA — deploy pendente]

- Constante `STATUS_OVERRIDES` elevada para nivel de modulo em `sheetsService.js` (antes estava inline em `getDashboardMacro`).
- Helper `getCellFormatted(row, idx)` adicionado ao `sheetsService.js`: retorna `cell.f ?? cell.v` (valor formatado para exibicao).
- Funcao `mapSgbDetalhado(rows, sgb)` adicionada: monta o mapa de dados SGB para cruzamento com FROTA.
- Funcao `getFrotaDetalhada()` adicionada ao `sheetsService.js`: busca FROTA + 1SGB + 2SGB em paralelo, cruza por prefixo, aplica STATUS_OVERRIDES, retorna array identico ao que `frotaService.js` produzia no frontend.
- `backend/src/routes/frota.js` criado: `GET /api/frota/detalhada` protegido por JWT.
- `backend/src/app.js`: rota `/api/frota` registrada.
- `frontend/src/services/api.js`: `getFrotaDetalhada()` e `findViaturaByPrefixo()` adicionados apontando para `/api/frota/detalhada`; stubs legados `getFrota/getViatura/createViatura/updateViatura/deleteViatura` removidos.
- `frontend/src/pages/Frota.jsx`: import trocado de `frotaService` para `api`.
- `frontend/src/pages/Manutencao.jsx`: import trocado de `frotaService` para `api`.

**Resultado:** `frotaService.js` nao e mais usado por nenhuma pagina ativa. Pode ser removido em issue futura de limpeza.

---

## Pendencias

- **Planilha (acao manual):** corrigir STATUS OPERACIONAL de UR-17208 e UR-17211 na aba 2SGB col P.
  Apos correcao: remover `STATUS_OVERRIDES` em `backend/src/services/sheetsService.js` (linhas com a constante e a variavel `rawS`).
- **Filtros na planilha:** 1SGB e 2SGB parecem ter filtros ativos mostrando so baixadas. Verificar se e intencional; se nao, desativar para que o GViz retorne todos os veiculos com seus status reais.
- `Relatorios.gs` CONCLUIDO — todas as colunas confirmadas e mapeadas.
