# Status - MOTOMEC 17GB Frota

Atualizado em: 2026-05-20

## Baseline tecnico

- Raiz operacional analisada: `C:\Users\phpos\OneDrive\motomec17gb-frota\motomec17gb-frota-main`
- Aplicacao principal: `frontend`
- Stack: React 18, Create React App, React Router, Axios, Recharts, lucide-react
- Backend no repositorio: scaffold minimo Express em `backend`
- Build frontend: validado com sucesso apos `npm install`
- Deploy configurado: homepage `/motomec17gb-frota`, Dockerfile/nginx e Railway no frontend

## Validacoes executadas

- `npm install` em `frontend`: concluiu com dependencias instaladas.
- `npm run build` em `frontend`: compilou com sucesso.
- `npm install` em `backend`: concluiu com 0 vulnerabilidades reportadas.
- `npm run healthcheck` em `backend`: retornou `STATUS=200 SERVICE=motomec17gb-frota-api`.
- `npm.cmd run build` em `frontend`: compilou com sucesso apos remover duplicacao de Abastecimentos.
- `npm.cmd run healthcheck` em `backend`: retornou `STATUS=200 SERVICE=motomec17gb-frota-api`.
- `Sidebar.jsx` e `Login.jsx` verificados em UTF-8; corrigidos labels sem acento no Sidebar e confirmado que o Login nao tinha mojibake real.
- Validação estática do build em `/motomec17gb-frota/assets`: `logo17gb.png` e `logocb.png` retornaram HTTP 200.
- `.gitignore` criado na raiz operacional para proteger `.env`, dependencias, builds e artefatos locais.
- Configuracao publica criada em `frontend/src/config/publicConfig.js`; IDs/GIDs de planilhas foram movidos para `REACT_APP_*`.
- Contrato de backend criado em `docs/backend-contract.md`.
- Scaffold minimo de backend criado em `backend` com Express e `GET /api/health`.
- Logos publicados em `frontend/public/assets` e componentes ajustados para carregar via `PUBLIC_URL`.
- `frontend/src/Abastecimentos.jsx` removido; `frontend/src/pages/Abastecimentos.jsx` segue como fonte unica usada pela rota `/abastecimentos`.

Observacoes da validacao:

- NPM reportou 38 vulnerabilidades: 9 baixas, 7 moderadas e 22 altas.
- O build emitiu aviso de depreciacao `fs.F_OK`, vindo do toolchain.
- Antes do `npm install`, o build falhava porque `react-scripts` nao estava instalado localmente.

## Riscos atuais

- Backend ainda e minimo: existem healthcheck e auth, mas a maior parte dos endpoints esperados pelo frontend ainda nao foi implementada.
- Regras de negocio e leitura de Google Sheets estao no frontend em varios pontos.
- IDs de planilhas agora estao em variaveis `REACT_APP_*`, mas ainda entram no bundle por serem configuracao publica de frontend.
- Ainda pode haver textos com encoding corrompido em outros arquivos de UI e docs; `Sidebar.jsx` e `Login.jsx` ja foram tratados no escopo piloto.
- O comando `git rev-parse --show-toplevel` aponta para `C:/Users/phpos`, nao para a pasta do projeto, entao qualquer operacao Git precisa de cuidado extra.
- Existe `.env` na raiz do projeto com chaves e tokens; nao foi exibido o conteudo sensivel, apenas as chaves foram inventariadas.

## Proximo passo recomendado

Executar uma proxima issue pequena:

1. Criar uma nova issue para migrar apenas o endpoint de status operacional da frota para o backend, ou
2. Continuar a correcao de encoding em uma proxima pagina pequena.

Recomendacao pratica: seguir com a migracao piloto de backend para `/api/frota/status-operacional`.
