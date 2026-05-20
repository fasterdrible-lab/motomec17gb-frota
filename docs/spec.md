# Spec - MOTOMEC 17GB Frota

## 1. Descricao geral

O MOTOMEC 17GB Frota e uma aplicacao web para acompanhamento operacional da frota, manutencoes, abastecimentos, gastos, tarefas, alertas e materiais de logistica do 17o Grupamento de Bombeiros.

Estado atual analisado em 2026-05-19:

- Aplicacao frontend em React 18 com Create React App.
- Rotas declaradas em `frontend/src/App.jsx`.
- Autenticacao visual no frontend com token salvo em `localStorage`.
- Servico HTTP preparado em `frontend/src/services/api.js` para um backend em `REACT_APP_API_URL` ou `http://localhost:8000`.
- Varias paginas ainda consultam Google Sheets diretamente pelo navegador via `frontend/src/services/googleSheets.js`, `frontend/src/services/logisticaSheets.js` ou funcoes locais.
- Nao ha backend dentro deste repositorio.

Diretriz arquitetural: regra de negocio, credenciais, IDs sensiveis, autorizacao, leitura de planilhas, persistencia e validacoes devem ficar no backend. O frontend deve apenas enviar comandos, solicitar dados autorizados e exibir respostas.

## 2. Paginas

### Login

Arquivo atual: `frontend/src/pages/Login.jsx`

Componentes:

- Cabecalho com logos do 17GB e CBMESP.
- Alternancia entre login e cadastro.
- Formulario de email/senha.
- Campos extras de cadastro: nome, confirmacao de senha, cargo e unidade.
- Mensagens de erro, sucesso e loading.

Comportamentos:

- Login chama `login(email, password)` em `frontend/src/services/api.js`.
- Cadastro chama `cadastrar(...)` em `frontend/src/services/api.js`.
- Em sucesso de login, grava `access_token` no `localStorage` e libera o layout autenticado.
- Em erro, exibe mensagem amigavel.

Cenarios:

- Sucesso: usuario autenticado recebe token valido.
- Erro: credenciais invalidas, API indisponivel, cadastro rejeitado.
- Edge cases: senha curta, senha e confirmacao diferentes, token expirado, usuario sem permissao.

### Layout autenticado

Arquivos atuais:

- `frontend/src/App.jsx`
- `frontend/src/components/Sidebar.jsx`
- `frontend/src/components/Header.jsx`

Componentes:

- Sidebar com grupo MOTOMEC e rotas de logistica.
- Header com acao de logout.
- Container principal para paginas.

Comportamentos:

- Redireciona `/` para `/dashboard`.
- Remove token no logout.
- Usa `BrowserRouter` com basename `/motomec17gb-frota`.

Cenarios:

- Sucesso: rotas renderizam conforme token local.
- Erro: token local invalido deve ser removido apos erro 401.
- Edge cases: refresh em rota interna, deploy em subpath, token removido em outra aba.

### Dashboard

Arquivo atual: `frontend/src/pages/Dashboard.jsx`

Componentes:

- Barra de sincronizacao e data/hora.
- Cards de status da frota.
- Cards de alertas, tarefas, manutencoes e gastos.
- Cards de abastecimentos e FCD.
- Destaques por viatura e ordens de servico.
- Painel lateral de tarefas.
- Painel lateral de abastecimentos.

Comportamentos:

- Consulta dados via `getDashboardMacro`, `getTarefasCompletas` e `getAbastecimentos`.
- Atualiza automaticamente a cada 5 minutos.
- Permite sincronizacao manual.
- Abre paineis laterais sob demanda.

Cenarios:

- Sucesso: indicadores carregados e atualizados.
- Erro: falha de rede ou planilha indisponivel mostra mensagem e permite retry.
- Edge cases: planilhas sem abas esperadas, dados incompletos, datas mal formatadas, valores monetarios vazios.

### Frota

Arquivo atual: `frontend/src/pages/Frota.jsx`

Componentes:

- Cabecalho com contadores.
- Botao atualizar.
- Busca textual.
- Filtros por tipo e status.
- Cards de viatura.

Comportamentos:

- Busca dados das abas `FROTA`, `1SGB` e `2SGB` diretamente no Google Sheets.
- Cruza prefixo da frota com KM/status das abas SGB.
- Filtra por prefixo, placa, modelo, marca e posto.

Cenarios:

- Sucesso: lista de viaturas carregada e filtravel.
- Erro: falha ao buscar planilhas.
- Edge cases: prefixo duplicado, prefixo ausente, status desconhecido, KM vazio.

### Manutencao

Arquivo atual: `frontend/src/pages/Manutencao.jsx`

Componentes:

- Abas/filtros por status.
- Tabela de manutencoes.
- Estados de loading e erro.

Comportamentos:

- Consulta manutencoes via `frontend/src/services/googleSheets.js`.
- Classifica itens como vencidos ou pendentes.

Cenarios:

- Sucesso: manutencoes agrupadas por status.
- Erro: falha no carregamento.
- Edge cases: limites de KM ausentes, status textual divergente, item sem prefixo.

### Alertas

Arquivo atual: `frontend/src/pages/Alertas.jsx`

Componentes:

- Abas de todos, criticos e avisos.
- Cards/lista de alertas.

Comportamentos:

- Consulta alertas detalhados via Google Sheets.
- Classifica severidade por status e limites.

Cenarios:

- Sucesso: alertas aparecem em ordem de criticidade.
- Erro: falha de rede.
- Edge cases: alerta sem tipo, alerta duplicado, leitura/marcacao nao persistida.

### Gastos

Arquivo atual: `frontend/src/pages/Gastos.jsx`

Componentes:

- Resumo financeiro.
- Lista/tabela por viatura.
- Detalhes expansivos por servico.

Comportamentos:

- Consulta gastos por viatura via Google Sheets.
- Calcula totais no frontend.

Cenarios:

- Sucesso: total geral e ranking por viatura.
- Erro: aba de gastos ausente.
- Edge cases: valor monetario com formatos diferentes, viatura sem placa, custo zerado.

### Tarefas

Arquivo atual: `frontend/src/pages/Tarefas.jsx`

Componentes:

- Cards de resumo.
- Filtros por status.
- Tabela de tarefas.

Comportamentos:

- Consulta tarefas completas via Google Sheets.
- Mostra tarefas pendentes ou em andamento.

Cenarios:

- Sucesso: tarefas exibidas e filtradas.
- Erro: falha no carregamento.
- Edge cases: status livre, responsavel vazio, tarefa sem prefixo.

### Abastecimentos

Arquivos atuais:

- `frontend/src/pages/Abastecimentos.jsx`
- `frontend/src/Abastecimentos.jsx`

Componentes:

- Resumos por periodo/combustivel.
- Filtros.
- Tabela por data.

Comportamentos:

- Consulta dados da aba `ABAST. VTR`.
- Calcula litros, custo e agrupamentos no frontend.

Cenarios:

- Sucesso: abastecimentos listados com totais.
- Erro: falha no Google Sheets.
- Edge cases: data invalida, combustivel vazio, valor total mal formatado, componente duplicado fora de `pages`.

### Relatorios

Arquivo atual: `frontend/src/pages/Relatorios.jsx`

Componentes:

- Resumo de frota, manutencoes, alertas e tarefas.
- Secoes de consolidacao.

Comportamentos:

- Consulta `getDadosRelatorio` via Google Sheets.
- Consolida dados no frontend.

Cenarios:

- Sucesso: relatorio renderizado.
- Erro: dados indisponiveis.
- Edge cases: relatorio parcial, data de geracao invalida.

### Configuracoes

Arquivo atual: `frontend/src/pages/Configuracoes.jsx`

Componentes:

- Gestao de usuarios.
- Status de integracoes.
- Variaveis esperadas.

Comportamentos:

- Consulta e cria usuarios via `frontend/src/services/api.js`.
- Exibe integracoes e variaveis esperadas.

Cenarios:

- Sucesso: usuarios listados/criados pelo backend.
- Erro: API indisponivel ou permissao negada.
- Edge cases: usuario duplicado, dados obrigatorios ausentes, permissao insuficiente.

### Logistica

Arquivos atuais:

- `frontend/src/pages/Logistica.jsx`
- `frontend/src/pages/MatOperacionais.jsx`
- `frontend/src/pages/PasDeaReparos.jsx`
- `frontend/src/components/LogisticaComponents.jsx`
- `frontend/src/services/logisticaSheets.js`

Componentes:

- Resumo de materiais operacionais.
- Tabelas por aba.
- Indicadores de operando/baixado.
- Detalhamento de PAS/DEA e reparos.

Comportamentos:

- Consulta planilha de logistica diretamente pelo frontend.
- Consolida status por categoria.

Cenarios:

- Sucesso: materiais exibidos por categoria.
- Erro: aba indisponivel.
- Edge cases: cabecalho variavel, status divergente, data de TH invalida.

## 3. Componentes reutilizaveis atuais

- `frontend/src/components/Sidebar.jsx`: navegacao lateral.
- `frontend/src/components/Header.jsx`: topo autenticado.
- `frontend/src/components/AlertCard.jsx`: card de alerta com acao de marcar como lido.
- `frontend/src/components/ViaturaCard.jsx`: card reutilizavel de viatura.
- `frontend/src/components/LogoCBMESP.jsx`: logo/marca.
- `frontend/src/components/LogisticaComponents.jsx`: badges, tabelas e cards de logistica.

## 4. Servicos atuais

- `frontend/src/services/api.js`: cliente Axios para backend REST.
- `frontend/src/services/googleSheets.js`: leitura e regras de negocio de frota/manutencao/gastos/alertas/tarefas em Google Sheets.
- `frontend/src/services/logisticaSheets.js`: leitura e regras de negocio de logistica em Google Sheets.

## 5. Requisitos nao funcionais

- Segurança: remover do frontend toda regra de negocio sensivel e leitura direta de fontes externas.
- Modularidade: componentes de UI devem ser reaproveitados, sem duplicar parsers e funcoes de planilha.
- Observabilidade: backend deve expor health check e logs de erro.
- Confiabilidade: chamadas externas devem ter timeout, tratamento de erro e cache quando apropriado.
- Deploy: frontend deve continuar compativel com subpath `/motomec17gb-frota`; backend deve ser configuravel por ambiente.

