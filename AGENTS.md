# AGENTS.md - MOTOMEC 17GB Frota

## Projeto e dominio

O MOTOMEC 17GB Frota e uma aplicacao web para controle operacional da frota do 17o Grupamento de Bombeiros, cobrindo dashboard, frota, manutencao, alertas, gastos, tarefas, abastecimentos, relatorios, configuracoes e logistica.

Dominio de producao:

- Frontend GitHub Pages: `https://fasterdrible-lab.github.io/motomec17gb-frota`
- Backend/API Railway: `https://motomec17gb-frota-production.up.railway.app`
- Base path do frontend: `/motomec17gb-frota`

## Stack com versoes

| Camada | Tecnologia | Versao atual |
|---|---:|---:|
| Runtime local | Node.js | `v24.15.0` |
| Runtime minimo backend | Node.js | `>=20` |
| Gerenciador | npm | `11.12.1` |
| Frontend app | React | `18.3.1` |
| Frontend DOM | React DOM | `18.3.1` |
| Rotas frontend | React Router DOM | `6.30.3` |
| Build frontend | React Scripts / CRA | `5.0.1` |
| HTTP frontend | Axios | `1.13.6` |
| Graficos | Recharts | `2.15.4` |
| Icones | lucide-react | `0.311.0` |
| Deploy GitHub Pages | gh-pages | `6.3.0` |
| Backend HTTP | Express | `4.22.2` |
| CORS | cors | `2.8.6` |
| Env backend | dotenv | `16.6.1` |
| JWT | jsonwebtoken | `9.0.3` |
| Docker build frontend | node | `18-alpine` |
| Docker runtime frontend | nginx | `alpine` |

## Estrutura do monorepo

```txt
motomec17gb-frota-main/
  AGENTS.md
  docs/
    spec.md
    tasks.md
    CURRENT_STATE.md
    ARCHITECTURE.md
    backend-contract.md
    api-tests.md
  frontend/
    Dockerfile
    nginx.conf
    package.json
    src/
      App.jsx
      components/
      config/
      pages/
      services/
      styles/
  backend/
    package.json
    scripts/
      healthcheck.js
    src/
      app.js
      server.js
      config/
      middleware/
      routes/
      services/
```

## Modulos do backend

| Modulo | Arquivo | Responsabilidade |
|---|---|---|
| Entrada HTTP | `backend/src/server.js` | Cria app e sobe servidor na porta configurada. |
| App Express | `backend/src/app.js` | CORS, parsers, rotas `/api/*`, 404 e handler de erro. |
| Env | `backend/src/config/env.js` | `PORT`, `NODE_ENV`, `CORS_ORIGINS`, `JWT_SECRET`, `JWT_EXPIRES_IN`. |
| Health | `backend/src/routes/health.js` | `GET /api/health`. |
| Auth routes | `backend/src/routes/auth.js` | `POST /api/auth/login`, `GET /api/auth/me`. |
| Users routes | `backend/src/routes/users.js` | Cadastro publico e CRUD admin de usuarios. |
| Auth middleware | `backend/src/middleware/auth.js` | Valida Bearer JWT e exige admin quando necessario. |
| Auth service | `backend/src/services/authService.js` | Login, assinatura JWT e consulta de usuario autenticado. |
| User service | `backend/src/services/userService.js` | Mock em memoria, hash de senha, perfis, status e regras de usuario. |

## Rotas do frontend

| Rota | Componente | Observacao |
|---|---|---|
| `/` | `Navigate` | Redireciona para `/dashboard`. |
| `/dashboard` | `Dashboard` | Indicadores e paineis principais. |
| `/frota` | `Frota` | Cards, filtros e clique para manutencao. |
| `/manutencao` | `Manutencao` | Aceita `?prefixo=...`. |
| `/alertas` | `Alertas` | Alertas operacionais. |
| `/gastos` | `Gastos` | Custos por viatura. |
| `/tarefas` | `Tarefas` | Tarefas operacionais. |
| `/abastecimentos` | `Abastecimentos` | Abastecimentos da frota. |
| `/relatorios` | `Navigate` | Redireciona para `/relatorios/motomec`. |
| `/relatorios/motomec` | `Relatorios` | Relatorio MOTOMEC. |
| `/configuracoes` | `Configuracoes` | Integracoes e administracao de usuarios. |
| `/logistica` | `Logistica` | Visao geral de logistica. |
| `/logistica/mat-operacionais` | `MatOperacionais` | Materiais operacionais. |
| `/logistica/pas-dea-reparos` | `PasDeaReparos` | PAS, DEA e reparos. |
| `/logistica/relatorio` | `RelatorioLogistica` | Relatorio de logistica. |

## Roles, status e auth

Roles validas no backend:

- `admin`: pode listar, filtrar, atualizar e excluir usuarios; nao pode remover o proprio admin, inativar a propria conta ou excluir a propria conta.
- `operador`: usuario operacional padrao; cadastro publico entra como `operador`.
- `visualizador`: perfil permitido pelo backend para acesso restrito futuro.

Status validos:

- `pendente`: cadastro recebido, mas login bloqueado ate liberacao.
- `ativo`: usuario pode autenticar.
- `inativo`: usuario bloqueado.

Regras de autenticacao:

- Login usa `POST /api/auth/login` com `username` e `password` em `application/x-www-form-urlencoded`.
- Backend retorna JWT Bearer e o frontend salva em `localStorage` na chave `token`.
- Axios injeta `Authorization: Bearer <token>` em cada requisicao quando existir token.
- Resposta `401` remove o token local.
- Rotas administrativas de usuario exigem `authMiddleware` e `requireAdmin`.
- Senhas no mock sao armazenadas com `crypto.scryptSync`, nunca em texto puro.

## Estado atual

- Issue 008 concluida: `frontend/src/components/PageState.jsx` foi criado e aplicado na pagina `Frota`.
- `Frota` usa estado reutilizavel para loading, erro e vazio.
- `docs/CURRENT_STATE.md`, `docs/TASKS.md` e `docs/ARCHITECTURE.md` existem e devem ser lidos antes de novas tarefas.

Proxima tarefa:

- Issue 009 - Auditoria de dependencias.

## Regras obrigatorias

Banco:

- O backend atual usa mock em memoria em `backend/src/services/userService.js`.
- Nao adicionar regra de negocio nova no frontend quando ela pertencer a persistencia, permissao, validacao critica ou integracao externa.
- Antes de criar banco real, registrar contrato, tabelas, migracoes e impacto em `docs/`.
- Nunca salvar senha em texto puro.

Docker:

- Existe Dockerfile apenas para o frontend em `frontend/Dockerfile`.
- Nao assumir `docker-compose`; criar somente se a tarefa pedir.
- O build Docker do frontend precisa receber `REACT_APP_API_URL` quando apontar para API externa.
- Manter o app servido em `/motomec17gb-frota`.

Frontend:

- Manter `BrowserRouter basename="/motomec17gb-frota"`.
- Configuracoes publicas devem ficar em `frontend/src/config/publicConfig.js` e variaveis `REACT_APP_*`.
- `REACT_APP_*` nao e segredo; segredos reais devem ficar no backend.
- Reutilizar componentes em `frontend/src/components/` antes de criar novos.
- Estados repetidos de loading, erro e vazio devem usar `PageState` quando couber.

Auth:

- Permissoes criticas devem ser verificadas no backend.
- Cadastro publico deve criar usuario `pendente`.
- Login deve bloquear usuarios `pendente` e `inativo`.
- Rotas admin devem usar `requireAdmin`.
- Nao logar senha, JWT, chaves ou credenciais.

Codigo:

- Ler apenas o contexto necessario.
- Nao alterar arquivos fora do escopo.
- Preferir diffs pequenos.
- Nao refatorar areas nao relacionadas.
- Atualizar `docs/CURRENT_STATE.md` e `docs/TASKS.md` ao concluir tarefa de desenvolvimento.

## Arquivos de risco

| Arquivo | Risco | Motivo |
|---|---|---|
| `.env` | Critico | Pode conter segredos locais; nao commitar e nao expor. |
| `backend/.env.example` | Medio | Modelo de segredos; manter sem credenciais reais. |
| `frontend/.env.production` | Medio | Contem API publica e IDs publicos; nao colocar tokens ou segredos. |
| `frontend/src/config/publicConfig.js` | Alto | Controla URLs e IDs publicos usados no browser. |
| `frontend/src/services/api.js` | Alto | Cliente HTTP, token JWT, interceptors e contratos de API. |
| `frontend/src/services/googleSheets.js` | Alto | Ainda concentra leitura e regras sobre planilhas no frontend. |
| `frontend/src/services/logisticaSheets.js` | Alto | Ainda concentra leitura e regras de logistica no frontend. |
| `frontend/src/App.jsx` | Alto | Define auth visual, basename e todas as rotas. |
| `frontend/src/pages/Configuracoes.jsx` | Alto | Superficie administrativa de usuarios. |
| `frontend/src/pages/Login.jsx` | Alto | Login, cadastro, recuperacao e armazenamento de token. |
| `backend/src/config/env.js` | Alto | Fallbacks de seguranca e CORS. |
| `backend/src/middleware/auth.js` | Critico | Valida JWT e permissoes admin. |
| `backend/src/services/authService.js` | Critico | Login e emissao de token. |
| `backend/src/services/userService.js` | Critico | Perfis, status, hash de senha e mock de usuarios. |
| `backend/src/routes/users.js` | Alto | Cadastro publico e CRUD admin. |
| `frontend/Dockerfile` | Medio | Build publica variaveis `REACT_APP_*` no bundle. |
| `frontend/nginx.conf` | Medio | SPA fallback e subpath de producao. |

## Comandos uteis

Instalar dependencias:

```powershell
npm.cmd --prefix frontend install
npm.cmd --prefix backend install
```

Rodar frontend local:

```powershell
npm.cmd --prefix frontend start
```

Rodar backend local:

```powershell
npm.cmd --prefix backend run dev
```

Build frontend:

```powershell
npm.cmd --prefix frontend run build
```

Healthcheck backend:

```powershell
npm.cmd --prefix backend run healthcheck
```

Listar dependencias diretas:

```powershell
npm.cmd --prefix frontend list --depth=0
npm.cmd --prefix backend list --depth=0
```

Auditar dependencias da proxima tarefa:

```powershell
npm.cmd --prefix frontend audit
npm.cmd --prefix backend audit
```

Deploy GitHub Pages do frontend:

```powershell
npm.cmd --prefix frontend run deploy
```

Build Docker do frontend apontando para Railway:

```powershell
docker build --build-arg REACT_APP_API_URL=https://motomec17gb-frota-production.up.railway.app -t motomec17gb-frota-frontend ./frontend
```

Rodar imagem Docker do frontend:

```powershell
docker run --rm -p 8080:80 motomec17gb-frota-frontend
```

Testar API local manualmente:

```powershell
Invoke-RestMethod -Uri http://localhost:8000/api/health
```
