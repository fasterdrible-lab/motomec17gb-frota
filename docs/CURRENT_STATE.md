# Current State - MOTOMEC 17GB Frota

## Baseline atual (2026-06-03)

### Concluido

- Issue 009: auditoria de dependencias; `axios` atualizado; 43 → 0 vulnerabilidades npm.
- Issue 014: migracao de CRA para Vite 8; build em 448ms; 0 vulnerabilidades.
- Issue 015: dominio, SSL e deploy completos na VPS.
  - DNS Cloudflare corrigido: registros `@` e `www` apontando para 204.168.180.25.
  - Certificado SSL Let's Encrypt emitido via certbot para raiz e www.
  - Frontend Vite deployado na VPS (container `motomec17gb-frontend-1`, porta 8080).
  - Backend Node.js/Express deployado na VPS (container `motomec17gb-backend-1`, porta 8001).
  - Backend Python/uvicorn legado substituido.
  - Projeto clonado em `/opt/motomec17gb-frota` na VPS.
  - Secrets do backend em `/opt/motomec17gb-frota/.env.backend` (chmod 600, fora do git).
- Bugs corrigidos:
  - `backend/src/routes/auth.js` criado (ausente causava crash do backend Node.js).
  - `api.js` login corrigido: de form-urlencoded (Python) para JSON (Node.js).
  - `Configuracoes.jsx`: label REACT_APP_API_URL corrigido para VITE_API_URL.
  - `loadUsuarios` agora passa filtro de status ao backend.
  - Duplicata `createUsuario` removida de `api.js`.

### Stack atual na VPS

| Camada | Container | Porta | Imagem |
|---|---|---|---|
| Frontend | motomec17gb-frontend-1 | 8080 | motomec17gb-frontend (Vite 8 + nginx:1.27) |
| Backend | motomec17gb-backend-1 | 8001 | motomec17gb-backend-node (Node.js 22) |
| Banco (futuro) | motomec17gb-db-backup-1 | 3306 | mysql:8.0 |

### Dominio

- `https://motomec17gb-frota.com.br` → Cloudflare → VPS 204.168.180.25 → nginx → porta 8080/8001
- Certificado SSL: Let's Encrypt via certbot (renovacao automatica configurada)

## Proxima tarefa recomendada

- Issue 016: substituir mock em memoria do `userService` por persistencia real no MySQL.

## Pendencias

- Usuarios perdem dados ao restartar o backend (mock em memoria).
- Dashboard ainda consome planilhas diretamente; aguarda endpoint `/api/dashboard/macro`.
- Redeploy na VPS: usar `--env-file /opt/motomec17gb-frota/.env.backend` para preservar JWT_SECRET.
