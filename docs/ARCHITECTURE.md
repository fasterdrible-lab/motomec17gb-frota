# Architecture - MOTOMEC 17GB Frota

## Infraestrutura de producao

### VPS (204.168.180.25 — Ubuntu 24.04, Hetzner Helsinki)

Servidor principal gerenciado pelo Coolify. Todos os servicos rodam em Docker.

| Container | Imagem | Porta interna | Funcao |
|---|---|---|---|
| motomec17gb-frontend-1 | motomec17gb-frontend | 8080→80 | Frontend (build atual, pendente redeploy Vite) |
| motomec17gb-backend-1 | motomec17gb-backend | 8001→8000 | Backend Python/uvicorn (legado, pendente troca Node.js) |
| motomec17gb-db-backup-1 | mysql:8.0 | 3306 | Banco de dados MySQL |
| hexagon-dashboard-web | hexagon-dashboard-web | 3100 | HEXAGON Dashboard frontend |
| hexagon-dashboard-api | hexagon-dashboard-api | 4100 | HEXAGON Dashboard API |
| hexagon-dashboard-postgres | postgres:16-alpine | — | Banco do HEXAGON |
| hexagon-dashboard-redis | redis:7-alpine | — | Cache do HEXAGON |
| meu-postgres | postgres:16 | 5432 | Postgres compartilhado |

### Nginx (host, /etc/nginx/sites-enabled/)

| Config | Dominio | Destino |
|---|---|---|
| motomec17gb-frota | motomec17gb-frota.com.br, www.motomec17gb-frota.com.br | porta 8080 (frontend), 8001 (api) |
| hexagondashboard.com.br | hexagondashboard.com.br | porta 3100 (web), 4100 (api) |
| saleia | — | — |
| av3d-api | — | — |
| second-brain | — | — |

Rotas do nginx para o MOTOMEC:
- `GET /` → 302 para `/motomec17gb-frota/dashboard`
- `GET /motomec17gb-frota/*` → proxy para `http://127.0.0.1:8080`
- `GET /api/*` → proxy para `http://127.0.0.1:8001`

### DNS e SSL

- Dominio registrado em **registro.br**, nameservers delegados ao **Cloudflare**.
- Registros DNS atuais (DNS only, sem proxy):
  - `@` A → 204.168.180.25
  - `www` A → 204.168.180.25
- SSL: pendente emissao de certificado Let's Encrypt via certbot para `motomec17gb-frota.com.br` e `www.motomec17gb-frota.com.br`.
- Apos o certbot, reativar proxy Cloudflare (icone laranja) nos dois registros.

### Causa raiz do dominio servindo HEXAGON

O nginx do MOTOMEC escutava apenas porta 80. O Cloudflare com proxy laranja envia HTTPS (443) ao servidor. Na porta 443 so existia o bloco do HEXAGON (unico com certificado SSL). Nginx usava HEXAGON como fallback para dominios sem bloco 443 configurado.

## Camadas do codigo

- `frontend/src/pages/`: paginas principais da aplicacao.
- `frontend/src/components/`: componentes reutilizaveis de UI.
- `frontend/src/services/`: acesso a dados e integracoes.
- `backend/src/`: API Node.js/Express (pendente deploy na VPS).
- `docs/`: spec, tarefas e estado atual do projeto.

## Padroes estabelecidos

- Estados de loading, erro e vazio centralizados em `frontend/src/components/PageState.jsx`.
- Variaveis de ambiente publicas centralizadas em `frontend/src/config/publicConfig.js` com prefixo `VITE_`.
- Bundler: Vite 8 (`frontend/vite.config.js`), base `/motomec17gb-frota/`, porta dev 3000.

## Diretriz

- Regra de negocio sensivel continua fora do frontend.
- O frontend fica responsavel por exibir dados, estados e acoes do usuario.
- Backend Node.js/Express (`backend/src/`) deve substituir o backend Python legado na proxima janela de deploy.
