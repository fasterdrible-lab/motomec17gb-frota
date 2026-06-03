# Current State — MOTOMEC 17GB Frota

Atualizado em: 2026-06-03

## Status geral

Aplicacao em producao em https://motomec17gb-frota.com.br.
Proxima tarefa: **Issue 016 — persistencia MySQL de usuarios**.

## Stack em producao

| Camada      | Container                  | Porta  | Imagem                           |
|-------------|----------------------------|--------|----------------------------------|
| Frontend    | motomec17gb-frontend-1     | 8080   | Vite 8 + nginx 1.27-alpine       |
| Backend     | motomec17gb-backend-1      | 8001   | Node.js 22 / Express             |
| Banco       | motomec17gb-db-backup-1    | 3306   | mysql:8.0 (existente, sem schema)|

Nginx no host roteia:
- `GET /motomec17gb-frota/*` → porta 8080
- `GET /api/*` → porta 8001

SSL: Let's Encrypt via certbot, renovacao automatica ativa. Cloudflare proxy ativado (laranja).

## Projeto no servidor

- Repositorio clonado em `/opt/motomec17gb-frota` na VPS 204.168.180.25.
- Secrets em `/opt/motomec17gb-frota/.env.backend` (chmod 600, fora do git).
- Redeploy: `docker build` + `docker run --env-file /opt/motomec17gb-frota/.env.backend`.

## O que funciona hoje

- Login, cadastro (pendente), recuperar senha, toggle show/hide senha.
- Gerenciamento de usuarios no Configuracoes (admin pode listar, ativar, alterar perfil, redefinir senha, excluir).
- JWT valido com validacao de status no backend a cada requisicao autenticada.
- Todas as paginas de conteudo carregam dados via Google Sheets diretamente do frontend.
- Frota → clique no card → Manutencao com prefixo e detalhes da viatura.
- States de loading/erro/vazio padronizados via `PageState.jsx`.

## Issues pendentes

| Issue | Status      | Descricao                                             |
|-------|-------------|-------------------------------------------------------|
| 016   | `[done]`    | Persistencia real de usuarios no MySQL — implementado, aguarda deploy na VPS |
| 005   | `[blocked]` | Dashboard migrar para backend (depende de endpoint)   |
| 017+  | `[todo]`    | Migrar demais paginas de Google Sheets para backend   |

## Issue 016 — estado pos-implementacao

Codigo concluido. Aguarda deploy na VPS. Passos necessarios na VPS:

1. `git pull` em `/opt/motomec17gb-frota`
2. Descobrir credenciais do MySQL: `docker exec motomec17gb-db-backup-1 env | grep MYSQL`
3. Rodar schema: `docker exec -i motomec17gb-db-backup-1 mysql -u<USER> -p<PASS> < backend/database/schema.sql`
4. Adicionar ao `.env.backend`: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
5. Rebuild e restart do backend com `--env-file /opt/motomec17gb-frota/.env.backend`
