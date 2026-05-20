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

## Issue 008 - Padronizar estados de carregamento e erro

Status: `[todo]`

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

## Issue 009 - Auditoria de dependencias

Status: `[todo]`

Objetivo:

- Investigar 38 vulnerabilidades reportadas pelo `npm install`.

Busca de reutilizacao:

- Usar `npm audit` e classificar quais vulnerabilidades vem de `react-scripts`.

Arquivos planejados:

- Possivelmente `frontend/package.json`
- Possivelmente `frontend/package-lock.json`
- `docs/status.md`

Banco de dados:

- Nenhuma alteracao.

Dependencias externas:

- NPM registry.

Cenarios:

- Sucesso: vulnerabilidades classificadas e atualizacoes seguras aplicadas.
- Erro: `npm audit fix --force` gera breaking changes.
- Edge cases: Create React App antigo pode manter vulnerabilidades transitivas sem correcao simples.
