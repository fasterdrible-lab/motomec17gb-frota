# AGENT.md - MOTOMEC 17GB Frota

## O que o projeto faz e domínio de produção

MOTOMEC 17GB Frota é uma aplicação web para controle operacional da frota do 17º Grupamento de Bombeiros (CBMESP). Cobre dashboard com KPIs, gerenciamento de viaturas, manutenção, alertas operacionais, gastos, tarefas, abastecimentos, logística (materiais, PAS/DEA, reparos) e relatórios.

| Ambiente | URL |
|---|---|
| Frontend (GitHub Pages) | `https://fasterdrible-lab.github.io/motomec17gb-frota` |
| Backend/API (Railway) | `https://motomec17gb-frota-production.up.railway.app` |
| Frontend local | `http://localhost:3000` |
| Backend local | `http://localhost:8000` |
| Base path frontend | `/motomec17gb-frota` |

---

## Stack completa com versões

| Camada | Tecnologia | Versão |
|---|---|---|
| Runtime local | Node.js | `v24.15.0` |
| Runtime mínimo backend | Node.js | `>=20` |
| Gerenciador de pacotes | npm | `11.12.1` |
| Frontend app | React | `18.3.1` |
| Frontend DOM | React DOM | `18.3.1` |
| Rotas frontend | React Router DOM | `6.30.3` |
| Build tool | React Scripts (CRA) | `5.0.1` |
| HTTP client | Axios | `1.13.6` |
| Gráficos | Recharts | `2.15.4` |
| Ícones | lucide-react | `0.311.0` |
| Deploy frontend | gh-pages | `6.3.0` |
| Backend HTTP | Express | `4.22.2` |
| CORS | cors | `2.8.6` |
| Variáveis de ambiente | dotenv | `16.6.1` |
| Autenticação | jsonwebtoken | `9.0.3` |
| Build Docker frontend | node | `18-alpine` |
| Servidor Docker frontend | nginx | `alpine` |
| Banco de dados | In-memory mock (futuro: MySQL) | — |

---

## Estrutura do monorepo e módulos do backend

```txt
motomec17gb-frota-main/
├── AGENT.md
├── AGENTS.md
├── docs/
│   ├── spec.md               # Especificação de produto
│   ├── tasks.md              # Fila de tarefas com status
│   ├── backend-contract.md   # Contrato de API
│   ├── CURRENT_STATE.md      # Baseline do estado atual
│   ├── ARCHITECTURE.md       # Decisões arquiteturais
│   ├── status.md             # Validações de status
│   └── api-tests.md          # Testes manuais de API
├── frontend/
│   ├── Dockerfile            # Multi-stage: build → nginx
│   ├── nginx.conf            # SPA fallback + subpath /motomec17gb-frota
│   ├── package.json
│   └── src/
│       ├── App.jsx           # Roteamento e guarda de auth visual
│       ├── index.js
│       ├── components/
│       │   ├── Sidebar.jsx
│       │   ├── Header.jsx
│       │   ├── AlertCard.jsx
│       │   ├── ViaturaCard.jsx
│       │   ├── PageState.jsx             # Loading/erro/vazio reutilizável
│       │   ├── DetalhesViaturaManutencao.jsx
│       │   ├── LogisticaComponents.jsx
│       │   └── LogoCBMESP.jsx
│       ├── config/
│       │   └── publicConfig.js           # URLs e IDs públicos centralizados
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Frota.jsx
│       │   ├── Manutencao.jsx
│       │   ├── Alertas.jsx
│       │   ├── Gastos.jsx
│       │   ├── Tarefas.jsx
│       │   ├── Abastecimentos.jsx
│       │   ├── Relatorios.jsx
│       │   ├── RelatorioLogistica.jsx
│       │   ├── Configuracoes.jsx
│       │   ├── Logistica.jsx
│       │   ├── MatOperacionais.jsx
│       │   └── PasDeaReparos.jsx
│       ├── services/
│       │   ├── api.js             # Axios + interceptors JWT
│       │   ├── googleSheets.js    # Leitura de frota via Google Sheets
│       │   ├── logisticaSheets.js # Leitura de logística via Google Sheets
│       │   └── frotaService.js    # Serviço de frota
│       └── styles/
│           ├── App.css
│           └── Dashboard.css
└── backend/
    ├── package.json
    ├── scripts/
    │   └── healthcheck.js
    └── src/
        ├── server.js          # Entry point — cria app e sobe na porta
        ├── app.js             # Express: CORS, parsers, rotas, 404, erros
        ├── config/
        │   └── env.js         # PORT, NODE_ENV, CORS_ORIGINS, JWT_SECRET
        ├── middleware/
        │   └── auth.js        # authMiddleware + requireAdmin
        ├── routes/
        │   ├── health.js      # GET /api/health
        │   ├── auth.js        # POST /api/auth/login · GET /api/auth/me
        │   └── users.js       # CRUD de usuários (público + admin)
        └── services/
            ├── authService.js # Login, geração de JWT, getUser
            └── userService.js # Mock in-memory, hash, perfis, status
```

### Módulos do backend em detalhe

| Módulo | Arquivo | Responsabilidade |
|---|---|---|
| Entrada HTTP | `backend/src/server.js` | Instancia app e abre porta. |
| App Express | `backend/src/app.js` | CORS, parsers, montagem das rotas, 404 e handler global de erro. |
| Env | `backend/src/config/env.js` | Lê `PORT`, `NODE_ENV`, `CORS_ORIGINS`, `JWT_SECRET`, `JWT_EXPIRES_IN`. |
| Health | `backend/src/routes/health.js` | `GET /api/health` — probe de disponibilidade. |
| Auth routes | `backend/src/routes/auth.js` | `POST /api/auth/login` e `GET /api/auth/me`. |
| Users routes | `backend/src/routes/users.js` | Cadastro público + CRUD admin de usuários. |
| Auth middleware | `backend/src/middleware/auth.js` | Valida Bearer JWT; `requireAdmin` verifica `perfil === 'admin'`. |
| Auth service | `backend/src/services/authService.js` | Executa login, assina JWT (3600 s), expõe `getUser`. |
| User service | `backend/src/services/userService.js` | Store in-memory, `scryptSync` para hash, perfis, status, regras de self-edit. |

---

## Rotas do frontend mapeadas

| Rota | Componente | Query param | Observação |
|---|---|---|---|
| `/` | `Navigate` | — | Redireciona para `/dashboard`. |
| `/dashboard` | `Dashboard` | — | KPIs, status de frota, alertas. |
| `/frota` | `Frota` | — | Cards de viatura; clique navega para `/manutencao?prefixo=X`. |
| `/manutencao` | `Manutencao` | `?prefixo=` | Abre painel de detalhes filtrado por viatura. |
| `/alertas` | `Alertas` | — | Alertas operacionais por severidade. |
| `/gastos` | `Gastos` | — | Custos por viatura. |
| `/tarefas` | `Tarefas` | — | Lista e status de tarefas. |
| `/abastecimentos` | `Abastecimentos` | — | Histórico de abastecimentos. |
| `/relatorios` | `Navigate` | — | Redireciona para `/relatorios/motomec`. |
| `/relatorios/motomec` | `Relatorios` | — | Relatório MOTOMEC completo. |
| `/configuracoes` | `Configuracoes` | — | Gerenciamento de usuários (admin). |
| `/logistica` | `Logistica` | — | Visão geral de logística. |
| `/logistica/mat-operacionais` | `MatOperacionais` | — | Materiais operacionais. |
| `/logistica/pas-dea-reparos` | `PasDeaReparos` | — | PAS, DEA e reparos. |
| `/logistica/relatorio` | `RelatorioLogistica` | — | Relatório de logística. |

Todas as rotas protegidas verificam token em `localStorage['token']`; sem token, `App.jsx` renderiza `<Login />`.

---

## Roles de usuário e regras de autenticação

### Perfis válidos

| Perfil | Acesso |
|---|---|
| `admin` | CRUD de usuários, aprovação, alteração de status e perfil de terceiros. Não pode remover/inativar/rebaixar a própria conta. |
| `operador` | Acesso operacional padrão. Cadastro público cria como `operador`. |
| `visualizador` | Perfil reservado para acesso somente-leitura futuro. |

### Status válidos

| Status | Comportamento |
|---|---|
| `pendente` | Login bloqueado (HTTP 403 `USER_PENDING`) até aprovação pelo admin. |
| `ativo` | Pode autenticar normalmente. |
| `inativo` | Login bloqueado (HTTP 403 `USER_INACTIVE`). |

### Fluxo de autenticação

1. Frontend `POST /api/auth/login` com `application/x-www-form-urlencoded` (`username` + `password`).
2. Backend valida em `authService.login()` → `userService.validateCredentials()`.
3. Status verificado: `pendente` ou `inativo` retornam 403.
4. JWT assinado com `JWT_SECRET`, `exp` = `JWT_EXPIRES_IN` (padrão 3600 s), retornado com `token_type: bearer`.
5. Frontend salva token em `localStorage['token']`.
6. Axios injeta `Authorization: Bearer <token>` em todas as requisições.
7. Resposta 401 apaga o token local.
8. `authMiddleware` valida JWT e chama `userService.getActiveUserForRequest()` para revalidar status a cada requisição.
9. `requireAdmin` verifica `req.user.perfil === 'admin'`.

### Endpoints e proteção

| Endpoint | Método | Auth exigida |
|---|---|---|
| `/api/health` | GET | Pública |
| `/api/auth/login` | POST | Pública |
| `/api/auth/me` | GET | `authMiddleware` |
| `/api/usuarios/` | POST | Pública (registro `pendente`) |
| `/api/usuarios/` | GET | `authMiddleware` + `requireAdmin` |
| `/api/usuarios/:id` | PUT | `authMiddleware` + `requireAdmin` |
| `/api/usuarios/:id` | DELETE | `authMiddleware` + `requireAdmin` |

---

## Estado atual do desenvolvimento e próxima tarefa

### Issues concluídas

| Issue | Título |
|---|---|
| 001 | Criar baseline de produto e execução |
| 002 | Corrigir estratégia de repositório |
| 003 | Centralizar configuração pública do frontend |
| 004 | Criar contrato de backend para dados de frota |
| 006 | Remover duplicação de Abastecimentos |
| 007 | Corrigir textos com encoding quebrado |
| 008 | Padronizar estados de carregamento e erro (`PageState`) |
| 010 | Criar scaffold mínimo de backend |
| 011 | Corrigir cadastro e aprovação de usuários |
| 012 | Recuperação e visibilidade de senha |
| 013 | Integrar Frota com Manutenção por prefixo |

### Próxima tarefa

**Issue 009 — Auditoria de dependências** (`[todo]`)

- Investigar as 38 vulnerabilidades reportadas no frontend (9 low, 7 moderate, 22 high).
- Rodar `npm audit` nos dois pacotes e avaliar impacto antes de atualizar.

### Bloqueada

**Issue 005 — Migrar Dashboard para backend** (`[blocked]`)

- Aguarda endpoints de frota, manutenção e alertas no backend.
- Atualmente o Dashboard consome Google Sheets diretamente via frontend.

### Limitações atuais

- Backend tem apenas auth e usuários; todo o restante (frota, manutenção, logística) ainda lê Google Sheets direto do frontend.
- `userService.js` usa store in-memory; reiniciar o processo apaga usuários não semeados.
- Não há banco de dados real ainda.

---

## Regras obrigatórias

### Banco de dados

- O backend usa mock in-memory em `backend/src/services/userService.js`; não há persistência real ainda.
- Antes de introduzir banco real: registrar contrato de tabelas, migrações e impacto em `docs/` e atualizar `CURRENT_STATE.md`.
- Nunca armazenar senha em texto puro — usar `crypto.scryptSync` com salt.
- Não mover regras de negócio críticas (permissão, validação, integração externa) para o frontend.

### Docker

- Dockerfile existe **apenas** para o frontend em `frontend/Dockerfile`.
- Não assumir `docker-compose`; criar apenas se a tarefa exigir explicitamente.
- O build Docker precisa receber `--build-arg REACT_APP_API_URL=<url>` para apontar à API correta.
- Manter o app servido sob `/motomec17gb-frota`.

### Frontend

- Manter `<BrowserRouter basename="/motomec17gb-frota">` em `App.jsx`.
- Toda configuração pública vai em `frontend/src/config/publicConfig.js` via variáveis `REACT_APP_*`.
- `REACT_APP_*` é público — segredos reais ficam **somente** no backend.
- Reutilizar componentes de `frontend/src/components/` antes de criar novos.
- Loading, erro e vazio devem usar `<PageState>` onde couber.

### Auth

- Permissões críticas são verificadas **no backend**, nunca apenas no frontend.
- Cadastro público cria usuário `pendente`; login bloqueado até aprovação admin.
- Rotas admin exigem `authMiddleware` + `requireAdmin`.
- Nunca logar senha, JWT, chaves ou credenciais em console ou arquivo.

### Código

- Ler apenas o contexto necessário para a tarefa.
- Não alterar arquivos fora do escopo da issue.
- Preferir diffs pequenos e focados.
- Não refatorar áreas não relacionadas à tarefa.
- Atualizar `docs/CURRENT_STATE.md` e `docs/tasks.md` ao concluir qualquer tarefa de desenvolvimento.

---

## Arquivos de risco

| Arquivo | Nível | Motivo |
|---|---|---|
| `.env` (raiz) | Crítico | Pode conter segredos de produção; nunca commitar. |
| `backend/.env.example` | Médio | Modelo de variáveis; manter sem credenciais reais. |
| `frontend/.env.production` | Médio | Contém URL da API e IDs de planilha; não inserir tokens. |
| `frontend/src/config/publicConfig.js` | Alto | Centraliza todas as URLs e IDs usados no browser; mudança quebra múltiplas páginas. |
| `frontend/src/services/api.js` | Alto | Cliente HTTP, armazenamento de JWT, interceptors e contrato de todas as chamadas à API. |
| `frontend/src/services/googleSheets.js` | Alto | Concentra regras de leitura de frota diretamente no frontend — gap de segurança a migrar. |
| `frontend/src/services/logisticaSheets.js` | Alto | Idem para logística — deve migrar para backend futuramente. |
| `frontend/src/App.jsx` | Alto | Define basename, guarda de auth visual e todas as rotas; erro aqui derruba toda a aplicação. |
| `frontend/src/pages/Login.jsx` | Alto | Login, cadastro público, recuperação de senha e armazenamento de token. |
| `frontend/src/pages/Configuracoes.jsx` | Alto | Superfície administrativa de aprovação e gestão de usuários. |
| `backend/src/config/env.js` | Alto | Fallbacks de segurança, CORS e leitura de segredos; valores padrão inseguros em produção. |
| `backend/src/middleware/auth.js` | Crítico | Valida JWT e aplica controle de acesso — falha aqui expõe todas as rotas protegidas. |
| `backend/src/services/authService.js` | Crítico | Login e emissão de token; vulnerabilidade aqui compromete todo o sistema de auth. |
| `backend/src/services/userService.js` | Crítico | Hash de senha, perfis, status e regras de self-edit; store in-memory reinicia sem persistência. |
| `backend/src/routes/users.js` | Alto | Cadastro público e CRUD admin; endpoint de registro é acessível sem auth. |
| `frontend/Dockerfile` | Médio | Emite variáveis `REACT_APP_*` no bundle estático — visíveis a qualquer usuário. |
| `frontend/nginx.conf` | Médio | SPA fallback e subpath de produção; configuração errada quebra roteamento. |

---

## Comandos úteis

### Instalação

```powershell
npm.cmd --prefix frontend install
npm.cmd --prefix backend install
```

### Desenvolvimento local

```powershell
# Backend (porta 8000, hot-reload com --watch)
npm.cmd --prefix backend run dev

# Frontend (porta 3000)
npm.cmd --prefix frontend start
```

### Build e deploy

```powershell
# Build de produção do frontend
npm.cmd --prefix frontend run build

# Deploy GitHub Pages
npm.cmd --prefix frontend run deploy
```

### Auditoria (Issue 009 — próxima tarefa)

```powershell
npm.cmd --prefix frontend audit
npm.cmd --prefix backend audit
```

### Docker frontend

```powershell
# Build apontando para Railway
docker build `
  --build-arg REACT_APP_API_URL=https://motomec17gb-frota-production.up.railway.app `
  -t motomec17gb-frota-frontend `
  ./frontend

# Testar imagem localmente
docker run --rm -p 8080:80 motomec17gb-frota-frontend
```

### Verificação de saúde do backend

```powershell
# Via script healthcheck
npm.cmd --prefix backend run healthcheck

# Via PowerShell direto
Invoke-RestMethod -Uri http://localhost:8000/api/health
```

### Listar dependências diretas

```powershell
npm.cmd --prefix frontend list --depth=0
npm.cmd --prefix backend list --depth=0
```

---

## Links para os docs de referência

| Documento | Caminho | Conteúdo |
|---|---|---|
| Especificação de produto | [docs/spec.md](docs/spec.md) | Páginas, componentes, comportamentos esperados e riscos do produto. |
| Fila de tarefas | [docs/tasks.md](docs/tasks.md) | Todas as issues com status `[done]`, `[next]`, `[todo]`, `[blocked]`. |
| Estado atual | [docs/CURRENT_STATE.md](docs/CURRENT_STATE.md) | Baseline do que foi concluído e próxima tarefa recomendada. Atualizar a cada issue concluída. |
| Contrato de API | [docs/backend-contract.md](docs/backend-contract.md) | Endpoints, payloads, códigos de erro e regras de validação do backend. |
| Decisões arquiteturais | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Escolhas de stack, trade-offs e restrições do projeto. |
| Validações de status | [docs/status.md](docs/status.md) | Checklist de validação do estado por módulo. |
| Testes de API | [docs/api-tests.md](docs/api-tests.md) | Exemplos de chamadas manuais para validar os endpoints. |
