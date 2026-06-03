# Architecture — MOTOMEC 17GB Frota

Atualizado em: 2026-06-03

## Infraestrutura de producao

### VPS (204.168.180.25 — Ubuntu 24.04, Hetzner Helsinki)

Servidor principal gerenciado pelo Coolify. Todos os servicos rodam em Docker.

| Container                  | Imagem                       | Porta interna | Funcao                                        |
|----------------------------|------------------------------|---------------|-----------------------------------------------|
| motomec17gb-frontend-1     | motomec17gb-frontend         | 8080          | Frontend Vite 8 + nginx 1.27                  |
| motomec17gb-backend-1      | motomec17gb-backend-node     | 8001          | Backend Node.js 22 / Express (mock em memoria)|
| motomec17gb-db-backup-1    | mysql:8.0                    | 3306          | MySQL — schema ainda nao criado               |
| hexagon-dashboard-web      | hexagon-dashboard-web        | 3100          | HEXAGON Dashboard frontend                    |
| hexagon-dashboard-api      | hexagon-dashboard-api        | 4100          | HEXAGON Dashboard API                         |
| hexagon-dashboard-postgres | postgres:16-alpine           | —             | Banco do HEXAGON                              |
| hexagon-dashboard-redis    | redis:7-alpine               | —             | Cache do HEXAGON                              |
| meu-postgres               | postgres:16                  | 5432          | Postgres compartilhado                        |

### Nginx (host, /etc/nginx/sites-enabled/)

| Config              | Dominio                                              | Destino                             |
|---------------------|------------------------------------------------------|-------------------------------------|
| motomec17gb-frota   | motomec17gb-frota.com.br, www.motomec17gb-frota.com.br | porta 8080 (frontend), 8001 (api) |
| hexagondashboard.com.br | hexagondashboard.com.br                         | porta 3100 (web), 4100 (api)        |

Rotas do nginx para o MOTOMEC:
- `GET /` → 302 para `/motomec17gb-frota/dashboard`
- `GET /motomec17gb-frota/*` → proxy para `http://127.0.0.1:8080`
- `GET /api/*` → proxy para `http://127.0.0.1:8001`

### DNS e SSL

- Dominio registrado em **registro.br**, nameservers delegados ao **Cloudflare**.
- Registros DNS: `@` e `www` A → 204.168.180.25, proxy Cloudflare ativo (laranja).
- SSL: Let's Encrypt via certbot, renovacao automatica ativa (configurada em Issue 015).
- Secrets do backend: `/opt/motomec17gb-frota/.env.backend` na VPS (chmod 600, fora do git).

### Redeploy do backend

```bash
docker build -t motomec17gb-backend-node ./backend
docker stop motomec17gb-backend-1 && docker rm motomec17gb-backend-1
docker run -d --name motomec17gb-backend-1 \
  --env-file /opt/motomec17gb-frota/.env.backend \
  -p 8001:8000 motomec17gb-backend-node
```

**Importante:** sempre usar `--env-file` para preservar JWT_SECRET.

## Camadas do codigo

```
motomec17gb-frota-main/
  frontend/
    index.html                       # entry point Vite
    vite.config.js                   # base = /motomec17gb-frota/, porta 3000
    src/
      index.jsx                      # bootstrap React
      App.jsx                        # rotas BrowserRouter
      config/publicConfig.js         # variaveis VITE_* centralizadas
      pages/                         # Dashboard, Frota, Manutencao, Alertas,
                                     # Gastos, Tarefas, Abastecimentos,
                                     # Relatorios, Configuracoes, Logistica,
                                     # MatOperacionais, PasDeaReparos, Login
      components/                    # Sidebar, Header, PageState, ViaturaCard,
                                     # AlertCard, DetalhesViaturaManutencao,
                                     # LogoCBMESP, LogisticaComponents
      services/
        api.js                       # cliente Axios para backend REST
        googleSheets.js              # leitura direta de planilhas (frota/manutencao)
        logisticaSheets.js           # leitura direta de planilhas (logistica)
        frotaService.js              # leitura de frota isolada (reutilizada por Manutencao)
    Dockerfile                       # node:22-alpine build + nginx:1.27-alpine serve
  backend/
    src/
      server.js                      # listen na porta 8000
      app.js                         # Express + CORS + rotas
      config/env.js                  # leitura segura de .env
      middleware/auth.js             # verificacao JWT
      routes/
        health.js                    # GET /api/health
        auth.js                      # POST /api/auth/login, GET /api/auth/me
        users.js                     # CRUD /api/usuarios (admin)
      services/
        authService.js               # gera JWT, delega ao userService
        userService.js               # MOCK em memoria — Issue 016 substitui por MySQL
    Dockerfile                       # node:22-alpine, porta 8000
  docs/                              # spec, tasks, CURRENT_STATE, ARCHITECTURE
```

## Padroes estabelecidos

- Loading / erro / vazio: `PageState.jsx` com prop `type` (loading | error | empty).
- Variaveis de ambiente: prefixo `VITE_`, centralizadas em `config/publicConfig.js`.
- Erros da API: `{ detail, code, requestId }` com HTTP semântico.
- Hash de senha: `crypto.scryptSync` com salt aleatorio (formato `salt:hash`).

## Diretriz arquitetural

- Regra de negocio e credenciais ficam no backend; frontend so exibe dados autorizados.
- Leitura direta de Google Sheets no frontend e temporaria — deve migrar para backend por modulo.
- Proxima camada de dados: MySQL via `mysql2/promise` (Issue 016).
