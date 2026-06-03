# Tasks - MOTOMEC 17GB Frota

Status:

- `[done]` concluida nesta etapa.
- `[next]` proxima tarefa recomendada.
- `[todo]` pendente.
- `[blocked]` depende de decisao, credencial ou backend inexistente.

## Issue 001 - Criar baseline de produto e execucao

Status: `[done]`

Objetivo:

- Registrar a spec, paginas, componentes, comportamentos, riscos e fila inicial de trabalho.

Arquivos criados/modificados:

- `docs/spec.md`
- `docs/tasks.md`
- `docs/status.md`

Banco de dados:

- Nenhuma alteracao.

Dependencias externas:

- Nenhuma.

Cenarios:

- Sucesso: documentacao permite continuar por tarefas pequenas.
- Erro: informacao incompleta deve ser corrigida em nova issue de documentacao.
- Edge cases: codigo atual diverge da spec; a spec deve ser atualizada antes da implementacao.

## Issue 002 - Corrigir estrategia de repositorio e ignorar artefatos locais

Status: `[done]`

Objetivo:

- Evitar que artefatos locais como `node_modules`, `build` e arquivos `.env` entrem no controle de versao.
- Corrigir a situacao atual em que o `git` detecta como raiz `C:/Users/phpos`, nao a pasta do projeto.

Busca de reutilizacao:

- Verificar se existe `.gitignore` no projeto ou na raiz superior.
- Reutilizar padroes comuns de Node/Create React App.

Arquivos planejados:

- `.gitignore` criado na raiz operacional `motomec17gb-frota-main`.
- Entradas adicionadas para `.env`, `.env.*`, `node_modules`, `build`, `dist`, logs, editor/OS e coverage.

Banco de dados:

- Nenhuma alteracao.

Dependencias externas:

- Nenhuma.

Cenarios:

- Sucesso: `git status` deixa de listar dependencias e segredos do projeto.
- Erro: repositorio Git real esta em `C:/Users/phpos` e pode conter outros projetos.
- Edge cases: nao remover arquivos existentes do usuario sem autorizacao; apenas preparar ignore.

## Issue 003 - Centralizar configuracao publica do frontend

Status: `[done]`

Objetivo:

- Substituir IDs de planilha hardcoded por variaveis `REACT_APP_*` enquanto a migracao para backend nao estiver pronta.
- Documentar que essas variaveis nao sao segredo quando expostas ao navegador.

Busca de reutilizacao:

- `frontend/src/services/googleSheets.js`
- `frontend/src/services/logisticaSheets.js`
- `frontend/src/pages/Frota.jsx`
- `frontend/.env.example`
- `frontend/.env.production`

Arquivos planejados:

- `frontend/src/config/publicConfig.js`
- `frontend/src/services/googleSheets.js`
- `frontend/src/services/logisticaSheets.js`
- `frontend/src/pages/Frota.jsx`
- `frontend/src/services/api.js`
- `frontend/.env.example`
- `frontend/.env.production`

Banco de dados:

- Nenhuma alteracao.

Dependencias externas:

- Nenhuma.

Cenarios:

- Sucesso: IDs ficam centralizados e ambiente controla a origem.
- Erro: variavel ausente retorna erro claro.
- Edge cases: deploy em GitHub Pages/Railway com variaveis diferentes.

## Issue 004 - Criar contrato de backend para dados de frota

Status: `[done]`

Objetivo:

- Planejar endpoints para retirar do frontend a leitura direta de planilhas e calculos de negocio.

Busca de reutilizacao:

- `frontend/src/services/api.js` ja tem nomes de funcoes para frota, manutencao, alertas, tarefas, relatorios e usuarios.
- Reutilizar esses contratos para evitar reescrever telas.

Arquivos planejados:

- `docs/backend-contract.md`
- Ajuste futuro em `frontend/src/services/api.js` apenas depois do backend existir.

Banco de dados:

- A definir: tabelas de usuarios, viaturas, manutencoes, alertas, tarefas, abastecimentos, gastos, materiais.

Dependencias externas:

- Backend REST.
- Google Sheets API ou outra fonte oficial de dados.

Cenarios:

- Sucesso: telas passam a consumir API propria.
- Erro: backend indisponivel deve retornar erro padronizado ao frontend.
- Edge cases: cache desatualizado, permissao por perfil, planilha temporariamente fora do ar.

## Issue 005 - Migrar Dashboard para backend

Status: `[blocked]`

Objetivo:

- Fazer `Dashboard.jsx` consumir apenas dados agregados do backend.

Busca de reutilizacao:

- `frontend/src/services/api.js`
- `frontend/src/pages/Dashboard.jsx`
- Estrutura visual atual dos cards.

Arquivos planejados:

- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/services/api.js`
- Backend ainda inexistente neste repositorio.

Banco de dados:

- Sem alteracao no frontend.
- Backend deve fornecer agregados ou ler fonte externa de forma controlada.

Dependencias externas:

- Endpoint `/api/dashboard/macro` ou equivalente.

Cenarios:

- Sucesso: frontend recebe objeto ja calculado.
- Erro: mostrar retry e mensagem clara.
- Edge cases: dados parciais, permissao negada, atraso de sincronizacao.

## Issue 010 - Criar scaffold minimo de backend

Status: `[done]`

Objetivo:

- Criar a base de uma API backend pequena, antes de migrar qualquer tela.
- Expor health check e estrutura inicial de configuracao sem implementar regra grande.

Busca de reutilizacao:

- `frontend/src/services/api.js` ja aponta para `http://localhost:8000`.
- `.env` da raiz indica intencao de backend com MySQL, JWT, CORS, Google Sheets, Telegram e FIPE.
- `docs/backend-contract.md` define os contratos.

Arquivos planejados:

- `backend/package.json`
- `backend/src/server.js`
- `backend/src/app.js`
- `backend/src/config/env.js`
- `backend/src/routes/health.js`
- `backend/scripts/healthcheck.js`
- `backend/.env.example`

Banco de dados:

- Nenhuma migracao inicial.
- Apenas preparar leitura segura de `DATABASE_URL` se a stack exigir.

Dependencias externas:

- Node.js >= 20.
- Express.
- CORS.
- dotenv.

Cenarios:

- Sucesso: `GET /api/health` retorna 200.
- Erro: porta ocupada, env ausente, CORS mal configurado.
- Edge cases: Windows local, deploy Railway, variaveis com caracteres especiais.

## Issue 006 - Remover duplicacao de Abastecimentos

Status: `[done]`

Objetivo:

- Avaliar e remover ou integrar `frontend/src/Abastecimentos.jsx`, que duplica a pagina `frontend/src/pages/Abastecimentos.jsx`.

Busca de reutilizacao:

- Comparar os dois componentes.
- Manter apenas a versao usada em `frontend/src/App.jsx`, salvo necessidade real.

Arquivos planejados/executados:

- `frontend/src/Abastecimentos.jsx` removido por estar fora da árvore de páginas usada e com import inválido para `../services/googleSheets`.
- `frontend/src/pages/Abastecimentos.jsx` mantido como fonte única usada por `frontend/src/App.jsx`.
- Nenhum ajuste de imports necessário.

Banco de dados:

- Nenhuma alteracao.

Dependencias externas:

- Nenhuma.

Cenarios:

- Sucesso: uma unica fonte de verdade para abastecimentos.
- Erro: algum import legado quebra build.
- Edge cases: a versao duplicada contem comportamento melhor que precisa ser preservado.

## Issue 007 - Corrigir textos com encoding quebrado

Status: `[done]`

Objetivo:

- Corrigir textos exibidos com mojibake, por exemplo `GestÃ£o`, `InÃ­cio`, `ManutenÃ§Ã£o`.

Busca de reutilizacao:

- Usar busca por padroes `Ã`, `Â`, `â` nos arquivos de UI.
- Corrigir por pagina pequena, nao tudo de uma vez.

Arquivos planejados/executados:

- `frontend/src/components/Sidebar.jsx`: corrigidos labels sem acento em Manutenção, Relatórios e Configurações.
- `frontend/src/pages/Login.jsx`: verificado em leitura UTF-8 via Node; não havia mojibake real no arquivo, apenas exibição distorcida no `Get-Content` do PowerShell.
- Demais paginas devem continuar em issues separadas.

Banco de dados:

- Nenhuma alteracao.

Dependencias externas:

- Nenhuma.

Cenarios:

- Sucesso: textos principais renderizam corretamente.
- Erro: arquivo salvo em encoding incorreto.
- Edge cases: icones/emojis tambem podem estar corrompidos; preferir lucide-react quando houver icone equivalente.

## Issue 011 - Corrigir cadastro e aprovacao de usuarios

Status: `[done]`

Objetivo:

- Fazer o cadastro publico salvar usuarios como `pendente`.
- Bloquear login de usuarios pendentes ou inativos.
- Criar gerenciamento administrativo de usuarios na tela Configuracoes.

Busca de reutilizacao:

- `frontend/src/pages/Login.jsx` ja possui alternancia entre login e cadastro.
- `frontend/src/pages/Configuracoes.jsx` ja possuia uma area inicial de usuarios.
- `frontend/src/services/api.js` ja possuia funcoes para `/api/usuarios`.
- `backend/src/services/authService.js` ja emitia JWT e foi mantido como camada de autenticacao.

Arquivos planejados/executados:

- `docs/spec.md`
- `docs/tasks.md`
- `docs/backend-contract.md`
- `backend/src/services/userService.js`
- `backend/src/services/authService.js`
- `backend/src/middleware/auth.js`
- `backend/src/routes/users.js`
- `backend/src/app.js`
- `frontend/src/services/api.js`
- `frontend/src/config/publicConfig.js`
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Configuracoes.jsx`
- `frontend/src/styles/App.css`

Banco de dados:

- Nenhuma migracao nesta etapa.
- O repositorio atual usa mock em memoria no backend; a persistencia real deve substituir `userService` quando o banco for introduzido.
- Senhas sao armazenadas no mock como hash com `crypto.scryptSync`, nao em texto puro.

Dependencias externas:

- Nenhuma dependencia nova.

Cenarios:

- Sucesso: cadastro publico retorna usuario pendente; admin lista usuarios, filtra por status, libera acesso, altera perfil, inativa e exclui usuarios.
- Erro: email duplicado retorna 409; pendente/inativo recebe 403 no login; nao admin recebe 403 nas rotas administrativas.
- Edge cases: administrador nao pode excluir, inativar ou remover o admin da propria conta; token antigo passa por validacao contra o status atual do usuario no backend.

## Issue 012 - Recuperacao e visibilidade de senha

Status: `[done]`

Objetivo:

- Permitir que o usuario solicite recuperacao de senha sem expor se o email existe.
- Permitir que administradores redefinam senha de usuarios na tela Configuracoes.
- Mostrar ou ocultar a senha digitada no login/cadastro para reduzir erro de digitacao.

Busca de reutilizacao:

- `frontend/src/pages/Login.jsx` ja concentrava login e cadastro.
- `frontend/src/pages/Configuracoes.jsx` ja concentrava gerenciamento administrativo de usuarios.
- `frontend/src/services/api.js` ja possuia o cliente Axios com token JWT.
- O backend FastAPI ja possuia rotas protegidas por `require_admin` e hash de senha com `pwd_context`.

Arquivos planejados/executados:

- `docs/spec.md`
- `docs/tasks.md`
- `_deploy_repo_codex/backend/app/api/auth.py`
- `_deploy_repo_codex/backend/app/api/usuarios.py`
- `_deploy_repo_codex/backend/app/database.py`
- `_deploy_repo_codex/backend/app/schemas/usuario_schema.py`
- `frontend/src/services/api.js`
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Configuracoes.jsx`

Banco de dados:

- Nenhuma migracao.
- A senha redefinida atualiza somente `senha_hash`.

Dependencias externas:

- Nenhuma dependencia nova.
- Recuperacao por link de email fica fora do escopo porque o ambiente atual nao tem servico de email/transacao configurado.

Cenarios:

- Sucesso: usuario solicita recuperacao e recebe orientacao clara; admin redefine a senha; usuario ativo entra com a nova senha.
- Erro: email invalido, senha menor que 6 caracteres, permissao insuficiente ou API indisponivel.
- Edge cases: resposta de recuperacao nao revela existencia do email; usuario pendente continua bloqueado ate liberacao administrativa.

## Issue 013 - Integrar Frota com Manutencao por prefixo

Status: `[done]`

Objetivo:

- Tornar cada card da Frota clicavel.
- Redirecionar para `/manutencao?prefixo=...` levando o prefixo e o objeto completo da viatura.
- Carregar automaticamente os detalhes da viatura na Manutencao quando a URL tiver prefixo.
- Filtrar a tabela de manutencao pelo prefixo selecionado.
- Preparar pesquisa de servicos realizados, troca de oleo, pneus e bateria.

Busca de reutilizacao:

- `frontend/src/pages/Frota.jsx` ja montava os cards e filtros da frota.
- `frontend/src/pages/Manutencao.jsx` ja carregava manutencoes e abas de status.
- `frontend/src/services/googleSheets.js` ja possuia a leitura de manutencoes.
- A leitura detalhada da frota foi isolada em `frontend/src/services/frotaService.js` para evitar duplicacao entre Frota e Manutencao.

Arquivos planejados/executados:

- `docs/spec.md`
- `docs/tasks.md`
- `frontend/src/services/frotaService.js`
- `frontend/src/pages/Frota.jsx`
- `frontend/src/pages/Manutencao.jsx`
- `frontend/src/components/DetalhesViaturaManutencao.jsx`

Banco de dados:

- Nenhuma migracao.
- A integracao usa as abas existentes `FROTA`, `1SGB` e `2SGB`.

Dependencias externas:

- Nenhuma dependencia nova.

Cenarios:

- Sucesso: clique no card abre manutencao com o prefixo, exibe detalhes e filtra a tabela.
- Erro: falha ao carregar planilha mostra erro de carregamento.
- Edge cases: acesso direto por URL, prefixo inexistente, campos ainda nao existentes na planilha exibidos como `Nao informado`.

## Issue 008 - Padronizar estados de carregamento e erro

Status: `[done]`

Objetivo:

- Criar componentes reutilizaveis para loading, empty state e error state.

Busca de reutilizacao:

- Revisar paginas que usam loading inline.
- Reutilizar estilos existentes em `frontend/src/styles/App.css` e `frontend/src/styles/Dashboard.css`.

Arquivos planejados:

- `frontend/src/components/PageState.jsx`
- Pagina piloto: `frontend/src/pages/Frota.jsx`

Banco de dados:

- Nenhuma alteracao.

Dependencias externas:

- Nenhuma.

Cenarios:

- Sucesso: estados consistentes e menos duplicacao.
- Erro: componente generico nao cobre caso especifico.
- Edge cases: telas com paineis laterais e carregamento parcial.

Arquivos criados/modificados nesta etapa:

- `frontend/src/components/PageState.jsx`
- `frontend/src/pages/Frota.jsx`
- `frontend/src/styles/App.css`
- `docs/spec.md`
- `docs/tasks.md`
- `docs/CURRENT_STATE.md`
- `docs/ARCHITECTURE.md`

Resumo:

- Estados de loading, erro e vazio da pagina `Frota` passaram a usar o componente reutilizavel `PageState`.
- O botao de atualizar foi desabilitado enquanto o carregamento esta em andamento.
- Proxima tarefa recomendada: Issue 009 - Auditoria de dependencias.

## Issue 015 - Corrigir dominio e SSL na VPS

Status: `[next]`

Objetivo:

- Emitir certificado SSL para `motomec17gb-frota.com.br` e `www.motomec17gb-frota.com.br` via certbot.
- Reativar proxy Cloudflare apos emissao do certificado.
- Redeploy do frontend com build Vite atual.
- Substituir backend Python legado pelo backend Node.js/Express.

Contexto levantado:

- VPS: 204.168.180.25 (Ubuntu 24.04, Hetzner Helsinki), gerenciado pelo Coolify.
- nginx em `/etc/nginx/sites-enabled/motomec17gb-frota` cobre raiz e www, roteando para porta 8080 (frontend) e 8001 (api).
- Container `motomec17gb-frontend-1` rodando build CRA de 11 dias atras (antigo, pre-Vite).
- Container `motomec17gb-backend-1` rodando backend Python uvicorn legado na porta 8001.
- DNS Cloudflare: registros `@` e `www` adicionados apontando para 204.168.180.25, proxy desativado (DNS only) aguardando certbot.

Causa raiz do dominio servindo HEXAGON:

- nginx do MOTOMEC escutava apenas porta 80.
- Cloudflare com proxy laranja envia HTTPS (porta 443) ao servidor.
- Na porta 443 so o HEXAGON tinha certificado configurado; nginx servia HEXAGON como fallback.

Passos de execucao:

1. Na VPS (proxy Cloudflare desativado): `certbot --nginx -d motomec17gb-frota.com.br -d www.motomec17gb-frota.com.br`
2. Cloudflare: reativar proxy laranja em `@` e `www`.
3. Testar `https://motomec17gb-frota.com.br`.
4. Redeploy do frontend com imagem Vite (nova Dockerfile + vite build).
5. Deploy do backend Node.js substituindo o container Python.

Banco de dados:

- Nenhuma migracao nesta etapa.

Dependencias externas:

- Acesso SSH a VPS.
- Certbot instalado na VPS.
- Cloudflare DNS com proxy desativado durante emissao do certificado.

Cenarios:

- Sucesso: HTTPS funciona, MOTOMEC serve o app correto, logo no dominio customizado.
- Erro: certbot falha se DNS ainda nao propagou ou proxy Cloudflare estiver ativo.
- Edge cases: renovacao automatica do certificado (cron do certbot); redeploy sem downtime.

## Issue 014 - Migrar bundler de CRA para Vite

Status: `[done]`

Objetivo:

- Eliminar as 29 vulnerabilidades presas no `react-scripts@5`.
- Reduzir o tempo de build e de servidor de desenvolvimento.
- Modernizar o toolchain do frontend.

Busca de reutilizacao:

- `frontend/src/config/publicConfig.js` ja centralizava todas as variaveis de ambiente, tornando a troca de prefixo cirurgica.
- `frontend/public/` mantida como pasta de assets estaticos.

Arquivos criados/modificados:

- `frontend/package.json`: removido `react-scripts`; adicionado `vite@^8`, `@vitejs/plugin-react@^6`; scripts atualizados; deploy aponta para `dist/` em vez de `build/`.
- `frontend/vite.config.js`: criado com plugin React, base `/motomec17gb-frota/`, porta 3000.
- `frontend/index.html`: movido de `public/index.html` para a raiz; adicionado `<script type="module" src="/src/index.jsx">`.
- `frontend/public/index.html`: removido (substituido pelo novo `index.html` na raiz).
- `frontend/src/index.js`: renomeado para `index.jsx` (Vite exige extensao .jsx para arquivos com JSX).
- `frontend/src/config/publicConfig.js`: `process.env[name]` trocado por `import.meta.env[name]`; `process.env.NODE_ENV` por `import.meta.env.DEV`; prefixo `REACT_APP_` trocado por `VITE_`.
- `frontend/.env.example`: prefixos `REACT_APP_` trocados por `VITE_`.
- `frontend/.env.production`: prefixos `REACT_APP_` trocados por `VITE_`.
- `frontend/src/components/Header.jsx`: `process.env.PUBLIC_URL` trocado por `import.meta.env.BASE_URL`.
- `frontend/src/pages/Login.jsx`: mesma troca.
- `frontend/src/components/LogoCBMESP.jsx`: mesma troca.
- `frontend/Dockerfile`: variavel `REACT_APP_API_URL` trocada por `VITE_API_URL`; pasta `build/` trocada por `dist/`; imagens atualizadas para `node:22-alpine` e `nginx:1.27-alpine`.

Banco de dados:

- Nenhuma alteracao.

Dependencias externas:

- Nenhuma nova dependencia de runtime.

Resultado:

- 0 vulnerabilidades npm (era 43).
- Build de producao: 448ms (era ~60s).
- Servidor de desenvolvimento: porta 3000, HMR nativo do Vite.

## Issue 009 - Auditoria de dependencias

Status: `[done]`

Objetivo:

- Investigar vulnerabilidades reportadas pelo `npm audit`.
- Aplicar atualizacoes seguras e documentar as que nao podem ser corrigidas sem breaking change.

Busca de reutilizacao:

- Usar `npm audit` e classificar quais vulnerabilidades vem de `react-scripts`.

Resultado:

- Ponto de partida: 43 vulnerabilidades (9 baixas, 13 moderadas, 21 altas).
- Apos `axios` atualizado de `1.6.5` para `1.15.2+` (instalado `1.16.1`) e `npm audit fix`: 29 vulnerabilidades (9 baixas, 7 moderadas, 13 altas).
- Reducao: 14 vulnerabilidades eliminadas.

Vulnerabilidades remanescentes (29) — todas presas dentro da cadeia de `react-scripts@5.0.1`:

- `nth-check`, `postcss`, `serialize-javascript` (via svgo/workbox/rollup): build-time apenas; `--force` instalaria `react-scripts@0.0.0` que quebra o build inteiramente.
- `uuid`, `sockjs`, `webpack-dev-server`: servidor de desenvolvimento local; nao afeta o bundle de producao.
- `@tootallnate/once`, `underscore`, `yaml`: tooling de jest e bfj dentro do CRA; nao afeta producao.
- Risco real: baixo. Nenhuma dessas dependencias executa no navegador do usuario em producao.
- Mitigacao recomendada futura: migrar de Create React App para Vite (issue separada).

Arquivos modificados nesta etapa:

- `frontend/package.json`: versao do axios atualizada para `^1.15.2`.
- `frontend/package-lock.json`: atualizado pelo `npm audit fix`.
- `docs/tasks.md`
- `docs/CURRENT_STATE.md`

Banco de dados:

- Nenhuma alteracao.

Dependencias externas:

- NPM registry.

Cenarios:

- Sucesso: vulnerabilidades classificadas e atualizacoes seguras aplicadas.
- Erro: `npm audit fix --force` gera breaking changes — nao executado.
- Edge cases: Create React App antigo mantem vulnerabilidades transitivas sem correcao simples; aceitas como risco documentado.
