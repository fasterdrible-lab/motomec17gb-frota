# Current State - MOTOMEC 17GB Frota

## Baseline atual (2026-06-03)

### Concluido

- Issue 009: auditoria de dependencias; `axios` atualizado de 1.6.5 para 1.16.1.
- Issue 014: migracao de CRA para Vite 8; 0 vulnerabilidades npm; build em 448ms.
- DNS corrigido: registros `@` e `www` adicionados no Cloudflare apontando para VPS 204.168.180.25.
- Causa raiz do dominio servindo HEXAGON identificada e documentada (ver ARCHITECTURE.md).

### Pendente — proximos passos obrigatorios

1. **SSL (urgente):** Rodar na VPS com proxy Cloudflare desativado:
   ```
   certbot --nginx -d motomec17gb-frota.com.br -d www.motomec17gb-frota.com.br
   ```
   Depois reativar proxy laranja nos dois registros DNS do Cloudflare.

2. **Redeploy do frontend:** O container `motomec17gb-frontend-1` esta rodando um build de 11 dias atras (CRA). Apos o certbot, buildar e redeploy com a versao Vite atual.

3. **Deploy do backend Node.js:** O container `motomec17gb-backend-1` ainda roda o backend Python legado (`uvicorn`). O backend Node.js/Express (`backend/src/`) precisa ser buildado e deployado substituindo o container atual.

## Proxima tarefa de codigo recomendada

- Issue 005 - Migrar Dashboard para backend (atualmente `[blocked]` aguardando backend Node.js deployado na VPS).

## Infraestrutura resumida

- VPS: 204.168.180.25 (Ubuntu 24.04, Hetzner)
- Orquestrador: Coolify
- Frontend: porta 8080 (Docker)
- Backend: porta 8001 (Docker, Python legado)
- Nginx: `/etc/nginx/sites-enabled/motomec17gb-frota`
- DNS: Cloudflare (registro.br nameservers)
- Dominio: motomec17gb-frota.com.br
