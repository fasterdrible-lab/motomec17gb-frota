# Tasks - MOTOMEC 17GB Frota

Status:

- `[done]` concluida nesta etapa.
- `[next]` proxima tarefa recomendada.
- `[todo]` pendente.
- `[blocked]` depende de decisao, credencial ou backend inexistente.

## Issue 029 - Scanner confirmava leitura errada (mira verde em fragmento de numero)

Status: `[done]` — corrigido, validado ao vivo no aparelho real (CDP + adb) e deployado na VPS + APK em 2026-07-16

Objetivo:

- Usuario reportou "ferramenta de captura em loop"; refinando o relato, o problema real era: a mira ficava verde tanto quando lia o numero completo quanto quando lia so uma parte dele, e pediu pra investigar por que as vezes nao le o numero completo.

Investigacao (via CDP remoto no Samsung A07, aparelho conectado):

- Instrumentado `window.Capacitor.Plugins.Ocr.process` para logar cada chamada, e testado ao vivo apontando pra etiqueta real da chapa 167207 (LANTERNA TATICA, mesma usada na Issue 026). Confirmado no relatorio de "LIDOS" do proprio app: leituras confirmadas em sequencia foram `2013`, `7207`, `20229`, `6720`, `197186` — todas marcadas "Nao cadastrado". `7207` e `6720` sao literalmente pedacos contiguos de `167207`.

Causas raiz (duas, em `frontend/src/pages/Inventario.jsx`):

1. **Cor da mira nao refletia o status real.** `corMira = flashStatus ? '#4ade80' : ...` so checava se HAVIA um resultado confirmado, nao QUAL — entao uma leitura "Nao cadastrado" (fragmento/ruido) piscava o mesmo verde de uma leitura "Correto", passando confianca falsa pro usuario.
2. **`extrairChapa()` aceitava qualquer fragmento numerico valido (4-6 digitos) como resultado final.** O ML Kit fragmenta o numero por causa do espacamento da fonte; sem preferencia por uma reconstrucao que bata com uma chapa cadastrada de verdade, o algoritmo travava no primeiro candidato "do tamanho certo" (mesmo sendo so um pedaco) em vez de continuar tentando ate reconstruir o numero completo.

Fix:

- `corMira` agora usa `STATUS_COR[flashStatus].cor` — verde so para "Correto", laranja para "Deslocado", vermelho para "Nao cadastrado".
- `extrairChapa(texto, chapasConhecidas)` agora recebe o conjunto de todas as chapas cadastradas (`CHAPAS_CONHECIDAS`, construido uma vez a partir de `TODOS_ITENS`) e, entre os candidatos de tamanho valido de um mesmo frame, prioriza o mais longo que bata exatamente com uma chapa real — so cai para "candidato mais longo" (comportamento antigo) se nenhum bater.

Validacao:

- Build web local (`vite build --mode capacitor`) + `cap copy android` + `gradlew assembleDebug` (com o contorno de OneDrive documentado abaixo) + `adb install -r` no Samsung A07 conectado.
- Reproduzido ao vivo: apontando pra chapa 167207 de novo, a leitura confirmada mais recente mostrou `167207 — LANTERNA TATICA · Divisao correta: EM EB SHANGAI SALA DE MATERIAIS PARA DESCARGA` em **laranja** (Deslocado, correto — o item pertence a outra divisao) em vez do verde enganoso de antes. Fragmentos de tentativas anteriores na mesma sessao ainda apareceram (`67207`, `2029`, `16720`), mas agora corretamente em vermelho.

Limitacao conhecida (nao e bug, ja existia antes):

- O ML Kit ainda fragmenta o numero em alguns frames — o fix faz o app reconhecer e priorizar o numero completo assim que ele aparece em algum frame, mas nao elimina 100% das tentativas com fragmento antes disso. Cada fragmento confirmado ainda para o loop automatico (exige toque em "Capturar agora" pra tentar de novo) — comportamento existente desde a Issue 026, nao alterado nesta rodada.

Deploy:

- Commit `9c3c21c`, push para `main`.
- VPS: `git pull origin main` (`ed9e3d3` → `9c3c21c`) + `docker build --no-cache` do frontend + container `motomec17gb-frontend-1` recriado. Site (200 em `/motomec17gb-frota/`) e `/api/health` (200) confirmados.
- APK debug recompilado e reinstalado no aparelho de teste; copiado para `apk/MOTOMEC-17GB-Frota-debug.apk`.

## Issue 028 - Scanner: orientacao de posicionamento e foco "cacando" sozinho

Status: `[done]` — corrigido, testado no aparelho real, instalado e deployado na VPS em 2026-07-15

Objetivo:

- Usuario testou o scanner apos a Issue 027 e reportou duas dificuldades reais de uso: "esta bem dificil de ler, o usuario fica sem orientacao de como posicionar a camera" e, em seguida, "por mais que mantenha a camera parada o foco muda sozinho".

Fix 1 — orientacao de posicionamento (`frontend/src/pages/Inventario.jsx`):

- Texto fixo acima do botao "Capturar" trocado de generico ("Centralize a etiqueta...") para uma instrucao concreta de distancia e enquadramento: "Aproxime a camera a ~15 cm da etiqueta e encaixe o numero da chapa dentro da mira."
- Dica adaptativa nova (`getDicaPosicionamento`): conta tentativas de OCR sem sucesso (`falhasSeguidas`, resetado a zero em qualquer leitura confirmada, manual ou automatica) e exibe uma dica cada vez mais especifica conforme a dificuldade persiste — 3+ falhas: aproximar mais a camera; 6+ falhas: inclinar para evitar reflexo de luz; 12+ falhas: sugere usar o campo manual (etiqueta provavelmente ilegivel/danificada).

Fix 2 — foco automatico reajustando sozinho:

- Causa: o codigo forcava `focusMode: 'continuous'` via `track.applyConstraints`, que fica continuamente re-buscando foco mesmo com o aparelho parado — comportamento classico de "hunting" em distancias curtas (~15cm), confirmado pelo usuario em teste real no Samsung A07.
- Corrigido: agora prefere `'single-shot'` quando o aparelho suporta essa capability (foca uma vez e trava, sem ficar reajustando sozinho); so cai para `'continuous'` se `'single-shot'` nao estiver disponivel nas `track.getCapabilities()`.
- Nova funcao `refocar()`: chamada apos qualquer tentativa de OCR sem sucesso, forca um novo ciclo de foco `single-shot` antes da proxima captura — evita que o foco fique travado permanentemente na primeira convergencia (que pode ter sido ruim) sem nenhuma tentativa de corrigir.

Decisao registrada (nao e bug, e limitacao conhecida) — etiquetas manuscritas:

- Usuario relatou que as vezes usa etiqueta manuscrita quando a etiqueta convencional (impressa) se desgasta.
- O motor de OCR (ML Kit Text Recognition, via `@jcesarmobile/capacitor-ocr`) e otimizado para texto IMPRESSO; letra manuscrita em bloco pode sair razoavel, mas manuscrito corrido tem taxa de acerto bem mais baixa, sem alternativa de "modo manuscrito" no mesmo motor.
- Opcao de pre-processamento de imagem (contraste/binarizacao) para ajudar traços finos de caneta/lapis foi avaliada e descartada por pedido do usuario ("deixa como esta") — o campo manual + botao "Validar" ja existente na tela e o caminho usado hoje para esses casos. Revisitar se o usuario reportar dificuldade real de campo com etiquetas manuscritas.

Validacao:

- Build web + `cap copy android` + `gradlew assembleDebug` (com o mesmo contorno de OneDrive documentado no `CURRENT_STATE.md`) + `adb install -r` no Samsung A07 conectado, repetido apos cada um dos dois fixes.
- Teste fisico de leitura com etiqueta real apos os dois fixes fica com o usuario (sessao terminou aguardando esse feedback).

Deploy:

- VPS: `git pull origin main` (`096e73f` → `ed9e3d3`) + `docker build --no-cache` do frontend + container `motomec17gb-frontend-1` recriado. Site publico (200) e `/api/health` (200) confirmados em 2026-07-15.

Pendencias:

- Confirmar com o usuario se as dicas de posicionamento e o novo comportamento de foco realmente melhoraram a taxa de leitura em uso real.

## Issue 027 - Scanner nao recuperava a camera apos o app voltar de segundo plano

Status: `[done]` — corrigido, validado no aparelho real e deployado (VPS + APK final) em 2026-07-15

Objetivo:

- Usuario pediu debug com o celular conectado: "a captura precisa ser refinada".

Investigacao (via CDP remoto no Samsung A07, aparelho ja conectado):

- O app estava parado na tela de Inventario havia cerca de 2 horas (ultimas leituras registradas as 12:45, sessao investigada as 14:39). A previa da camera estava preta.
- `document.querySelector('video').srcObject.getVideoTracks()[0].readyState` retornava `"ended"` e o `<video>` estava `paused`. O sistema Android encerra a faixa de video da camera quando o app vai para segundo plano (tela apaga, troca de app), mas o codigo nunca detectava isso — o loop de OCR continuava rodando a cada 400ms sobre o ultimo frame congelado, sem avisar o usuario e sem tentar reconectar.
- Reproduzido sob demanda: `adb shell input keyevent KEYCODE_HOME` (backgrounding) seguido de reabrir o app confirma `readyState` mudando para `"ended"` e permanecendo assim indefinidamente sem o fix.

Fix aplicado em `frontend/src/pages/Inventario.jsx` (dentro do `useEffect` do scanner):

- Contador `geracao`: cada chamada de `startScanner()` guarda sua propria `minhaGeracao`; o loop de captura (`iniciarLoop`/`capturarUmaVez`) e o `catch` de erro passam a checar `minhaGeracao === geracao` alem de `stopped`, entao uma chamada antiga se auto-encerra no proximo checkpoint em vez de continuar rodando em paralelo com a nova.
- `track.addEventListener('ended', ...)`: quando o sistema encerra a faixa de video, chama `startScanner()` de novo automaticamente (pede um novo `getUserMedia`).
- `document.addEventListener('visibilitychange', ...)`: cobre o caso do evento `'ended'` nao disparar em algum fabricante — ao voltar para o app, verifica se a faixa ainda esta `'live'`; se nao estiver, reinicia a captura; se estiver mas o `<video>` estiver pausado, so chama `video.play()`.

Validacao no aparelho real (Samsung A07, via CDP + `adb`):

- Build web (`vite build --mode capacitor`) + `npx cap copy android` + `./gradlew assembleDebug` + `adb install -r` no aparelho conectado.
- Login efetuado, navegado ate Logistica → Patrimonio → Inventario, configuracao selecionada, scanner iniciado — `track.readyState` confirmado `"live"`.
- `adb shell input keyevent KEYCODE_HOME` (background) → confirmado `readyState: "ended"`, `paused: true`, `document.visibilityState: "hidden"` (bug reproduzido).
- App trazido de volta ao primeiro plano (`adb shell am start ...`, equivalente a tocar no icone) → sem nenhuma acao do usuario na tela do scanner, `readyState` voltou sozinho para `"live"`, `paused: false` — recuperacao automatica confirmada.

Pendencias:

- Nao testado ainda com uma etiqueta real apontada pela camera apos a recuperacao (a validacao desta rodada usou o celular sobre a mesa, sem etiqueta em vista) — recomendado o usuario confirmar em uso real.
- Deploy concluido em 2026-07-15: rebuild do frontend web na VPS (`docker build --no-cache`) e novo APK final gerado (`apk/MOTOMEC-17GB-Frota-debug.apk`) para o usuario reinstalar.
- Achado a parte (nao e bug): quando a etiqueta mirada tem blocos de texto densos alem do numero (ex.: instrucoes do fabricante), o ML Kit as vezes le esse texto em vez do numero — `detectarFaixaAposBarcode` e `extrairChapa` ja mitigam isso, mas nao eliminam 100% dos casos; nao investigado a fundo nesta rodada porque o achado principal (camera travando) explicava a maior parte das leituras erradas observadas.

## Issue 023 - Gerar APK Android (Capacitor) para o modulo Inventario

Status: `[done]` — APK debug gerado localmente; codigo commitado (`dcb1dbf`) e pushado

Objetivo:

- Viabilizar o uso do modulo Inventario (scanner de camera) no celular como app instalavel, sem depender do navegador.

Busca de reutilizacao:

- `@zxing/browser` (ja usado em `Inventario.jsx`) funciona via `getUserMedia` padrao — compativel com WebView do Capacitor sem plugin de camera adicional.
- Build web existente (Vite) reaproveitado; apenas variou o `base` e o `basename` do router para o contexto do app nativo.

Arquivos criados/modificados:

- `frontend/vite.config.js`: `base` e `build.outDir` agora condicionais a `VITE_BUILD_TARGET=capacitor` (usa `/` e `dist-capacitor` em vez de `/motomec17gb-frota/` e `dist`).
- `frontend/src/App.jsx`: `basename` do `BrowserRouter` extraido para constante `routerBasename`, vazio quando `VITE_BUILD_TARGET=capacitor`.
- `frontend/.env.capacitor`: variaveis publicas para o build do app (API aponta para `https://motomec17gb-frota.com.br`, producao).
- `frontend/capacitor.config.json`: criado (`appId: br.mil.sp.cbm.motomec17gb`, `appName: MOTOMEC 17GB Frota`, `webDir: dist-capacitor`).
- `frontend/android/`: projeto nativo Android gerado pelo Capacitor (commitado; artefatos de build e `local.properties` ignorados via `.gitignore`).
- `frontend/android/app/src/main/AndroidManifest.xml`: permissao `android.permission.CAMERA` e features de camera (`required="false"`) adicionadas.
- `frontend/package.json`: `@capacitor/core`, `@capacitor/android` e devDependency `@capacitor/cli` adicionados.
- `.gitignore`: entradas para `frontend/dist-capacitor/`, `frontend/android/build/`, `frontend/android/app/build/`, `frontend/android/.gradle/`, `frontend/android/local.properties`, keystores.

Banco de dados:

- Nenhuma alteracao.

Dependencias externas:

- Android SDK (platforms 33-36, build-tools) e JDK 21 (JBR do Android Studio) usados localmente para o build via `./gradlew assembleDebug`. `JAVA_HOME` e `ANDROID_HOME` precisam apontar para esses caminhos ao rodar o build fora deste ambiente.
- Nenhuma dependencia de runtime nova alem do Capacitor.

Build gerado:

- APK debug: `android/app/build/outputs/apk/debug/app-debug.apk`, copiado para `../apk/MOTOMEC-17GB-Frota-debug.apk` (fora do repositorio git, no OneDrive do projeto).
- Assinado com a chave de debug padrao do Android — valido para instalar e testar em aparelhos com "Fontes desconhecidas" habilitado, **nao apto para publicacao na Play Store**.

**Bugs encontrados e corrigidos em teste real em dispositivo (Samsung A07, Android 16, commit `b341e33`):**

1. **Tela branca ao abrir o app.** `ReactDOM.createRoot` (renderer concorrente do React 18) executa a arvore inteira (roda hooks, `useEffect`, nao lanca excecao) mas nunca comita nada no DOM real nessa WebView especifica — confirmado isolando o problema via Chrome DevTools Protocol remoto (`chrome://inspect` equivalente por adb), testando ate um `<div>` estatico via `createRoot`. A API legada `ReactDOM.render` funciona perfeitamente no mesmo dispositivo. Trocado em `frontend/src/index.jsx`; app nao usa recursos concorrentes (Suspense/useTransition), sem perda de funcionalidade. Adicionado `ErrorBoundary` para expor erros futuros na tela em vez de branco silencioso.
2. **Roteamento quebrado no build do Capacitor.** O segundo `<BrowserRouter>` (branch autenticado) em `App.jsx` ainda usava o `basename` fixo `/motomec17gb-frota` em vez da constante `routerBasename` — só o primeiro (`Login`) tinha sido corrigido. Corrigido para os dois usarem `routerBasename`.
3. **Login "funcionava" mas gravava token invalido.** A tentativa inicial de resolver CORS configurando `capacitor.config.json` com `server.hostname` = dominio real de producao teve um efeito colateral grave: o interceptador local do Capacitor (WebViewAssetLoader) passou a capturar tambem as chamadas `/api/*` (mesma origem = mesmo dominio interceptado), devolvendo o proprio `index.html` do app em vez de proxiar para a internet — o login "succedia" com um corpo sem `access_token`, gravando a **string** `"undefined"` no `localStorage` (que e truthy em `!!token`). Corrigido revertendo `capacitor.config.json` para o hostname padrao do Capacitor (`localhost`) e adicionando `https://localhost` ao `CORS_ORIGINS` do backend na VPS (editado `.env.backend` + `docker run` novo do container `motomec17gb-backend-1`, sem rebuild de imagem). `Login.jsx` ganhou guarda contra `access_token` ausente; `App.jsx` ganhou `hasValidToken()` para tratar tokens corrompidos (`"undefined"`/`"null"`) como nao autenticado.

Validado ponta a ponta no dispositivo apos os 3 fixes: login real contra a API de producao, Dashboard renderizando dados reais (frota, alertas, tarefas, gastos), navegacao para `/inventario` com as 169 divisoes carregadas.

Cenarios:

- Sucesso: app abre, faz login contra a API de producao, dashboard e inventario renderizam corretamente; scanner de codigo de barras aciona o dialogo nativo de permissao de camera na primeira leitura (mecanismo do Capacitor, sem plugin adicional).
- Erro: sem `JAVA_HOME`/`ANDROID_HOME` configurados o Gradle nao builda; sem permissao de camera concedida, o `getUserMedia` falha e o input manual de chapa deve ser usado como fallback (ja existente na tela).
- Edge cases: no navegador (versao web), `VITE_BUILD_TARGET` fica indefinido e o comportamento de rota/base permanece identico ao de antes desta issue — nao ha regressao no deploy web (rebuild `dist/` testado, compila normalmente).

Pendencias:

- Icone e splash screen usam o padrao gerado pelo Capacitor — customizar com a identidade visual do projeto e uma melhoria futura.
- Build atual e "debug" (chave de assinatura automatica do Android SDK). Para publicacao oficial (Play Store) ou distribuicao mais formal, gerar build "release" com keystore proprio.
- `CORS_ORIGINS` do backend na VPS foi editado diretamente (`.env.backend`) e o container reiniciado — a mudanca nao esta versionada em nenhum arquivo do repositorio (o `.env.backend` fica fora do git por design). Documentado aqui como referencia: valor atual e `https://motomec17gb-frota.com.br,https://www.motomec17gb-frota.com.br,https://localhost`.
- Observado durante o teste: apos o restart do container backend, a senha da conta `phpos35@gmail.com` voltou a ser `admin123` (documentado como comportamento conhecido em Issue 018/CURRENT_STATE.md — possivel logica de seed no `initializeDb()`). Nao investigado a fundo nesta sessao.

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

Status: `[done]` — desbloqueado e concluido via Issue 017.

Objetivo:

- Fazer `Dashboard.jsx` consumir apenas dados agregados do backend.

Arquivos modificados:

- `frontend/src/pages/Dashboard.jsx`: import trocado de `googleSheets.js` para `api.js`; chamadas `getDashboardMacro`, `getDashboardAbastecimentos`, `getDashboardTarefas`.
- `frontend/src/services/api.js`: funcoes `getDashboardMacro`, `getDashboardAbastecimentos`, `getDashboardTarefas` adicionadas apontando para `/api/dashboard/*`.

Banco de dados:

- Nenhuma alteracao. O backend busca dados do Google Sheets e os agrega.

Dependencias externas:

- Issue 017 (endpoint backend) concluida primeiro.

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

## Issue 015 - Corrigir dominio, SSL e deploy na VPS

Status: `[done]`

Objetivo:

- Emitir certificado SSL para `motomec17gb-frota.com.br` e `www.motomec17gb-frota.com.br` via certbot.
- Reativar proxy Cloudflare apos emissao do certificado.
- Redeploy do frontend com build Vite atual.
- Substituir backend Python legado pelo backend Node.js/Express.

Contexto levantado:

- VPS: 204.168.180.25 (Ubuntu 24.04, Hetzner Helsinki), gerenciado pelo Coolify.
- nginx em `/etc/nginx/sites-enabled/motomec17gb-frota` cobre raiz e www, roteando para porta 8080 (frontend) e 8001 (api).
- DNS gerenciado pelo Cloudflare (nameservers delegados no registro.br).
- Projeto clonado na VPS em `/opt/motomec17gb-frota`.
- Secrets do backend salvos em `/opt/motomec17gb-frota/.env.backend` (fora do git, chmod 600).

Causa raiz do dominio servindo HEXAGON:

- nginx do MOTOMEC escutava apenas porta 80.
- Cloudflare com proxy laranja envia HTTPS (porta 443) ao servidor.
- Na porta 443 so o HEXAGON tinha certificado; nginx servia HEXAGON como fallback.

Execucao realizada:

1. Cloudflare: adicionado registro `@` A → 204.168.180.25 (proxy desativado).
2. Cloudflare: registro `www` alterado para proxy desativado.
3. VPS: `certbot --nginx -d motomec17gb-frota.com.br -d www.motomec17gb-frota.com.br` — certificado emitido com sucesso.
4. Cloudflare: proxy reativado (laranja) em `@` e `www`.
5. VPS: `git clone` do repositorio em `/opt/motomec17gb-frota`.
6. VPS: build do frontend Vite com `docker build -t motomec17gb-frontend --build-arg VITE_API_URL=https://motomec17gb-frota.com.br ./frontend`.
7. VPS: container `motomec17gb-frontend-1` substituido pelo novo build Vite na porta 8080.
8. VPS: build do backend Node.js com `docker build -t motomec17gb-backend-node ./backend`.
9. VPS: container `motomec17gb-backend-1` (Python/uvicorn) substituido pelo Node.js/Express na porta 8001.
10. JWT_SECRET gerado com `openssl rand -hex 32` e salvo em `/opt/motomec17gb-frota/.env.backend`.

Arquivos criados/modificados:

- `backend/Dockerfile`: criado para build do backend Node.js (node:22-alpine, porta 8000, healthcheck).
- `backend/src/routes/auth.js`: criado (ausente causava crash — POST /login, POST /recuperar-senha, GET /me).
- `frontend/src/services/api.js`: login corrigido de form-urlencoded para JSON; duplicata createUsuario removida.
- `frontend/src/pages/Configuracoes.jsx`: REACT_APP_API_URL corrigido para VITE_API_URL; loadUsuarios passa filtro ao backend.

Banco de dados:

- Nenhuma migracao. Backend Node.js usa mock em memoria; persistencia real e Issue futura.

Dependencias externas:

- Acesso SSH a VPS.
- Certbot instalado na VPS.
- Docker na VPS.

Cenarios:

- Sucesso: HTTPS funciona, MOTOMEC serve o app correto no dominio customizado com backend Node.js.
- Erro: certbot falha se DNS ainda nao propagou ou proxy Cloudflare estiver ativo.
- Edge cases: renovacao automatica do certificado (cron do certbot ja configurado); JWT_SECRET deve ser preservado em `.env.backend`.

## Issue 016 - Persistencia real de usuarios no backend

Status: `[done]` — codigo implementado; deploy na VPS pendente (ver CURRENT_STATE.md)

Objetivo:

- Substituir o mock em memoria do `backend/src/services/userService.js` por persistencia real em banco de dados.
- Usuarios cadastrados devem sobreviver ao restart do container.

Busca de reutilizacao:

- `backend/src/services/userService.js` ja encapsula toda a logica de usuarios; apenas a camada de dados precisa mudar.
- MySQL ja disponivel na VPS (`motomec17gb-db-backup-1`, porta 3306).

Arquivos planejados:

- `backend/src/db/connection.js`: cliente MySQL.
- `backend/src/services/userService.js`: substituir array em memoria por queries SQL.
- `backend/database/schema.sql`: schema da tabela de usuarios.
- `.env.backend` na VPS: adicionar `DATABASE_URL`.

Banco de dados:

- Tabela `usuarios` com campos: id, nome, email, senha_hash, cargo, unidade, perfil, status, created_at.

Dependencias externas:

- MySQL rodando na VPS (container `motomec17gb-db-backup-1`).

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

## Issue 019 - Alinhar sheetsService.js com Apps Script v10.0

Status: `[done]` — deployado na VPS em 2026-06-08

Objetivo:

- Alinhar logica de alertas do backend com o Apps Script `Controle.gs v10.0`.
- Corrigir mapeamento de colunas documentado (1SGB = 2SGB — estrutura identica).
- Documentar fluxo de dados entre Apps Script e backend.

Mudancas em `backend/src/services/sheetsService.js`:

- Adicionados alertas de OLEO KM (col I=8), OLEO TEMPO (col J=9) e FREIO (col K=10) — leem status pre-computado gravado pelo Apps Script.
- Constante `WASHING_WARNING_DAYS=12` substituida por `LAVAGEM_DIAS=15` + `ALERTA_DIAS_AVISO=3` (comportamento igual, nomes agora batem com o Apps Script).
- Logica de lavagem explicita: alerta quando `diasFaltando <= ALERTA_DIAS_AVISO` (threshold efetivo = 12 dias, vencido a partir de 15).

Mudancas em `docs/CURRENT_STATE.md`:

- Mapeamento completo de colunas de 1SGB/2SGB (base 0) com indicacao R/W.
- Corrigida documentacao incorreta que dizia 1SGB ter coluna extra D — Apps Script usa indices identicos para ambas as abas.
- Secao "Fluxo de dados" adicionada: Apps Script escreve colunas I/J/K/L/P; backend le via GViz API.
- Limiares de alerta documentados com nomes do Apps Script.

Banco de dados:

- Nenhuma alteracao.

Dependencias externas:

- Apps Script `Controle.gs v10.0` deve rodar periodicamente para que os status das colunas I/J/K/L/P estejam atualizados.

Resultado:

- totalAlertas agora conta 7 categorias (era 4): oleo KM, oleo tempo, freio, bateria, lavagem, pneu, embreagem.

## Issue 018 - Corrigir contagem de baixadas no dashboard

Status: `[done]` — deployado na VPS em 2026-06-08

Objetivo:

- Corrigir contagem de viaturas baixadas (estava 8; apos investigacao e sincronizacao do Apps Script, correto e 7).
- Identificar quais veiculos estavam com STATUS OPERACIONAL incorreto na planilha.

Investigacao realizada:

- Executado script diagnostico na VPS via GViz API para ler dados brutos das abas 1SGB e 2SGB.
- 1SGB retornava apenas 2 linhas; 2SGB retornava apenas 6 linhas — todas com STATUS = BAIXADA.
- Motivo: a planilha possui filtros ativos que ocultam linhas OPERANDO da API publica GViz.
- Identificadas como incorretas: UR-17208 e UR-17211 (ambas marcadas como BAIXADA na col P da 2SGB quando deveriam ser OPERANDO).

Fix aplicado:

- `backend/src/services/sheetsService.js`: adicionado `STATUS_OVERRIDES` mapeando UR-17208 e UR-17211 para status vazio (equivale a OPERANDO no calculo de contagem).
- Override e temporario ate que a planilha seja corrigida manualmente na aba 2SGB coluna P (STATUS OPERACIONAL).

Arquivos modificados:

- `backend/src/services/sheetsService.js`: constante `STATUS_OVERRIDES` adicionada antes do loop de contagem em `getDashboardMacro`.

Banco de dados:

- Nenhuma alteracao.

Resultado verificado na VPS:

- operando=59, baixadas=6, reserva=0, total=65.

Cenarios:

- Sucesso: dashboard exibe 6 baixadas e 59 operando.
- Remocao futura: quando o usuario corrigir UR-17208 e UR-17211 na planilha (col P, aba 2SGB), remover as entradas do `STATUS_OVERRIDES`.

## Issue 017 - Implementar endpoint /api/dashboard no backend

Status: `[done]`

Objetivo:

- Criar endpoint backend que agrega dados do Google Sheets e os serve ao frontend.
- Mover a logica de leitura de planilhas do frontend para o backend.
- Desbloquear Issue 005 (migracao do Dashboard).

Busca de reutilizacao:

- Logica de `frontend/src/services/googleSheets.js` portada para Node.js CommonJS.
- `backend/src/middleware/auth.js` reutilizado para proteger as rotas.

Arquivos criados/modificados:

- `backend/src/services/sheetsService.js`: funcoes `getDashboardMacro`, `getAbastecimentos`, `getTarefasCompletas` com toda a logica de agregacao de dados do Google Sheets.
- `backend/src/routes/dashboard.js`: GET `/api/dashboard/macro`, GET `/api/dashboard/abastecimentos`, GET `/api/dashboard/tarefas` (todas com authMiddleware).
- `backend/src/app.js`: rota `/api/dashboard` registrada.
- `backend/src/config/env.js`: campos `sheetsId` e `tarefasGid` adicionados.
- `backend/.env.example`: variaveis `GOOGLE_SHEETS_ID` e `TAREFAS_GID` documentadas.

Banco de dados:

- Nenhuma alteracao. Dados ainda vem do Google Sheets via API publica gviz.

Dependencias externas:

- `fetch` nativo do Node 22 (sem dependencia nova).
- `GOOGLE_SHEETS_ID` e `TAREFAS_GID` devem ser adicionados ao `.env.backend` na VPS.

Cenarios:

- Sucesso: `GET /api/dashboard/macro` retorna objeto com frota, alertas, tarefas, gastos, OS, abastecimentos e FCD.
- Erro: planilha inacessivel retorna 500 com mensagem descritiva.
- Edge cases: usuario nao autenticado recebe 401; tarefas sem GID configurado retornam dados vazios graciosamente.

Deploy:

- Variaveis `GOOGLE_SHEETS_ID` e `TAREFAS_GID` adicionadas ao container em execucao (via `-e` no `docker run`).
- Backend rebuilado e reiniciado na VPS em 2026-06-08 (junto com Issue 018).

## Issue 020 - Migrar Frota para backend

Status: `[done]` — deployado na VPS em 2026-07-07

Objetivo:

- Mover a leitura de FROTA + 1SGB + 2SGB do frontend para o backend.
- Eliminar a dependencia do `frotaService.js` nas paginas `Frota.jsx` e `Manutencao.jsx`.
- Expor `GET /api/frota/detalhada` protegido por JWT.

Busca de reutilizacao:

- `backend/src/services/sheetsService.js` ja tem toda a infraestrutura GViz (fetchSheetData, getCell, formatDateFromRaw, isSyncRow, STATUS_OVERRIDES).
- `frontend/src/services/api.js` ja tem cliente Axios com interceptor JWT.
- Logica de `frotaService.js` portada diretamente para o backend.

Arquivos criados/modificados:

- `backend/src/services/sheetsService.js`: constante `STATUS_OVERRIDES` elevada para nivel de modulo; helpers `getCellFormatted` e `mapSgbDetalhado` adicionados; funcao `getFrotaDetalhada` implementada; exportada no `module.exports`.
- `backend/src/routes/frota.js`: criado; `GET /api/frota/detalhada` com authMiddleware.
- `backend/src/app.js`: rota `/api/frota` registrada.
- `frontend/src/services/api.js`: `getFrotaDetalhada` e `findViaturaByPrefixo` adicionados; stubs legados `getFrota/getViatura/createViatura/updateViatura/deleteViatura` removidos.
- `frontend/src/pages/Frota.jsx`: import de `frotaService` trocado por `api`.
- `frontend/src/pages/Manutencao.jsx`: import de `frotaService` trocado por `api`.

Banco de dados:

- Nenhuma alteracao. Dados vem do Google Sheets via GViz API no backend.

Dependencias externas:

- `GOOGLE_SHEETS_ID` ja disponivel no `.env.backend` da VPS.

Cenarios:

- Sucesso: `GET /api/frota/detalhada` retorna array de viaturas com todos os campos de FROTA + 1SGB + 2SGB cruzados; Frota.jsx e Manutencao.jsx funcionam identicamente ao anterior mas lendo via backend.
- Erro: planilha inacessivel retorna 500; usuario nao autenticado recebe 401.
- Edge cases: STATUS_OVERRIDES aplicado; prefixo ausente no SGB retorna campos vazios graciosamente.

Deploy:

- Deployado na VPS em 2026-07-07. Bug encontrado durante o deploy: `backend/src/routes/frota.js` importava `authMiddleware` sem desestruturar (`const authMiddleware = require(...)` em vez de `const { authMiddleware } = require(...)`), o que derrubava o backend no boot (`Route.get() requires a callback function but got a [object Object]`). Corrigido e pushado (commit `290b062`).

## Issue 021 - Modulo Patrimonio (Logistica)

Status: `[done]` — deployado na VPS em 2026-07-07

Objetivo:

- Criar pagina de gestao de patrimonio dentro da secao Logistica.
- Separar patrimonios por origem (Prefeitura vs Estado).
- Registrar processos de inclusao e exclusao de viaturas e materiais.

Busca de reutilizacao:

- Estrutura de abas similar a paginas existentes (Logistica, MatOperacionais).
- Navegacao colapsavel do Sidebar ja existia para Logistica; reutilizada para Patrimonio.

Arquivos criados/modificados:

- `frontend/src/pages/Patrimonio.jsx`: criado com 4 abas (Prefeitura, Estado, Inclusao, Exclusao); dados de amostra embutidos.
- `frontend/src/App.jsx`: rota `/logistica/patrimonio/:modo` registrada; footer copyright NEX-ALS adicionado.
- `frontend/src/components/Sidebar.jsx`: item Patrimonio colapsavel com sub-itens Prefeitura, Estado, Inclusao, Exclusao.
- `frontend/src/components/Header.jsx`, `LogisticaComponents.jsx`: ajustes de UI.
- `frontend/src/pages/Logistica.jsx`, `MatOperacionais.jsx`, `Configuracoes.jsx`: melhorias de interface.

Banco de dados:

- Nenhuma alteracao. Dados de amostra embutidos no componente (placeholder para backend futuro).

Dependencias externas:

- Nenhuma.

Cenarios:

- Sucesso: sidebar exibe "Patrimonio" dentro de Logistica; sub-itens Prefeitura/Estado/Inclusao/Exclusao navegam para a pagina com aba correspondente.
- Erro: rota inexistente redireciona para /logistica/patrimonio/prefeitura.
- Edge cases: dados reais viriam de backend quando Issue 022 (backend patrimonio) for implementada.

Deploy:

- Deployado na VPS em 2026-07-07 (rebuild do frontend junto com Issue 020).

## Issue 022 - Modulo Inventario com Scanner de Camera

Status: `[done]` — deployado na VPS em 2026-07-07

Objetivo:

- Permitir realizar inventario fisico dos bens patrimoniais do Estado por leitura de codigo de barras (campo Chapa).
- Validar o ambiente (Divisao) em que o material foi encontrado vs. o ambiente onde deveria estar.
- Gerar relatorio de cobertura com itens encontrados, ausentes, deslocados e nao cadastrados.

Busca de reutilizacao:

- `@zxing/browser`: lib de leitura de codigos de barras/QR via camera do navegador (sem app nativo).
- `frontend/src/data/patrimonio_estado.json`: dados reais extraidos de `Inventario_Estado.xlsx` (planilha oficial, OneDrive).
- Estrutura de wizard (3 etapas) similar a outros formularios do sistema.

Arquivos criados/modificados:

- `frontend/src/pages/Inventario.jsx`: wizard com Etapa 1 (Configuracao: divisao + responsavel), Etapa 2 (Escaneamento: camera + input manual), Etapa 3 (Relatorio completo com filtro de busca).
- `frontend/src/data/patrimonio_estado.json`: 1.334 itens reais; campos: chapa, descricao, divisao, divisaoLabel, responsavel, contaContabil, valorAquisicao, valorAtual, vidaUtil, dataAquisicao, dataIncorporacao, estado.
- `frontend/src/App.jsx`: rota `/inventario` adicionada.
- `frontend/src/components/Sidebar.jsx`: item INVENTARIO adicionado no menu principal (entre MOTOMEC e LOGISTICA).
- `frontend/package.json`: dependencia `@zxing/browser ^0.2.0` adicionada.

Banco de dados:

- Nenhuma alteracao. Dados embutidos como JSON estatico no bundle do frontend.
- Para atualizar os dados: substituir `frontend/src/data/patrimonio_estado.json` com nova extracao da planilha.

Dependencias externas:

- `@zxing/browser ^0.2.0` (npm).
- Camera do dispositivo (permissao solicitada automaticamente pelo browser).
- Arquivo fonte: `Inventario_Estado.xlsx` no OneDrive (`motomec17gb-frota/`).

Mapeamento de colunas da planilha (Inventario_Estado.xlsx):

| Campo JSON      | Coluna Excel | Nome original         |
|-----------------|-------------|----------------------|
| chapa           | 2           | Chapa                |
| descricao       | 6           | Descricao do Item    |
| divisao         | 11          | Descricao da Divisao |
| responsavel     | 12          | Responsavel          |
| contaContabil   | 13          | Conta Contabil       |
| valorAquisicao  | 15          | Valor de Aquisicao   |
| valorAtual      | 17          | Valor Atual          |
| vidaUtil        | 19          | Vida Util (Meses)    |
| dataAquisicao   | 20          | Data de Aquisicao    |
| dataIncorporacao| 21          | Data de Incorporacao |
| estado          | 27          | Estado de Conservacao|

Logica de validacao:

- Chapa escaneada na divisao selecionada → OK (verde)
- Chapa de outra divisao → DESLOCADO (laranja) — mostra divisao correta
- Chapa sem cadastro na base → NAO CADASTRADO (vermelho)
- Item esperado nao escaneado ao finalizar → AUSENTE no relatorio

Cenarios:

- Sucesso: usuario seleciona divisao, escaneia itens com a camera, relatorio mostra cobertura%.
- Sem camera: input manual de chapa como fallback.
- Chapa de outro ambiente: sinaliza deslocamento e indica onde o item deveria estar.
- Edge cases: debounce de 2s evita dupla leitura do mesmo codigo; divisaoLabel remove prefixo OPM verboso do dropdown.

Deploy:

- Deployado na VPS em 2026-07-07. Nenhuma variavel de ambiente nova.

---

## Issue 024 - Scanner lia etiqueta errada (fora da mira)

Status: `[done]` — deployado na VPS e no APK em 2026-07-08

Objetivo:

- Corrigir leitura incorreta de codigo de barras: usuario mirava uma etiqueta e o app trazia o numero de outra (relatado com etiqueta 211029 → leu 70730).

Causa raiz:

- `reader.decodeFromConstraints` (zxing) decodifica o FRAME INTEIRO da camera a cada tentativa, nao apenas a area dentro da mira desenhada na tela. Uma etiqueta vizinha dentro do campo de visao da camera, mas fora do que o usuario mirou, podia ser lida em vez da pretendida.

Arquivos modificados:

- `frontend/src/pages/Inventario.jsx`: captura passou a ser controlada manualmente (`getUserMedia` + loop de 350ms via `setInterval`), recortando via `<canvas>` apenas a regiao correspondente a mira visivel (conversao coordenadas de tela → pixels do frame real, considerando `object-fit:cover`) e decodificando so esse recorte com `reader.decodeFromCanvas`. Constantes `MIRA_LARGURA_PCT`/`MIRA_ALTURA_PCT` compartilhadas entre o calculo do recorte e o tamanho visual da mira, garantindo que o que o usuario ve e exatamente o que e analisado.
- `frontend/vite.config.js`: commitado fix pendente desde a Issue 023 (remocao do atributo `crossorigin` no build do Capacitor — evita tela branca de login por falha silenciosa de CORS na WebView).

Validacao:

- CDP no Samsung A07: camera ativa (1080x1920, foco continuo), recorte calculado ~865x256px (~10% da area do frame), loop de decodificacao roda sem excecoes.
- Teste fisico de leitura de etiqueta real (confirmacao de que o numero correto aparece) fica pendente do usuario.

Deploy:

- Commits `5b56db2` (vite.config.js) e `3cfb17b` (Inventario.jsx), push para `main`.
- VPS: `git pull` + `docker build --no-cache` do frontend (o build com cache normal nao pegou as mudancas — necessario `--no-cache` para builds futuros apos alteracoes em `frontend/src`). Container `motomec17gb-frontend-1` recriado, site publico verificado (200).
- APK debug recompilado (`gradlew assembleDebug`) e reinstalado no aparelho de teste; copiado para `apk/MOTOMEC-17GB-Frota-debug.apk`.

**Atualizacao 2026-07-08 — teste real revelou dois problemas novos, ambos corrigidos:**

1. `frontend/.env.production` apontava para o antigo deploy no Railway (nunca atualizado apos migrar pra VPS). O build do APK nao tinha o `--build-arg` que o Dockerfile usa pra sobrescrever isso, entao o app instalado chamava uma API fora do ar — toda tela mostrava "Erro ao buscar dados do servidor". Corrigido a URL (commit `0f2f55e`), APK recompilado.
2. Testando com etiqueta real (chapa 211029, Prefeitura Municipal de Mogi das Cruzes — fora do escopo atual, so Estado), usuario pediu pra trocar a abordagem: em vez de decodificar as barras do codigo (que podem gravar um valor diferente do numero impresso), ler diretamente os DIGITOS IMPRESSOS via OCR. Ver Issue 025.

---

## Issue 025 - Trocar leitura de codigo de barras por OCR dos digitos

Status: `[done]` — deployado na VPS e no APK em 2026-07-08

Objetivo:

- O valor decodificado das barras de uma etiqueta de patrimonio pode nao ser o mesmo numero impresso nela. Pedido do usuario: parar de tentar decodificar o codigo de barras e ler os digitos impressos diretamente (OCR), do jeito que uma pessoa leria a etiqueta.

Arquivos modificados:

- `frontend/src/pages/Inventario.jsx`: `@zxing/browser` substituido por `tesseract.js`. Mesmo recorte da mira (`getCropRegion`, ja existente) alimenta o OCR em vez do decodificador de barras. `tessedit_char_whitelist` restrito a `0-9`, `PSM.SINGLE_LINE`, filtro `grayscale + contraste` no canvas antes de reconhecer. Loop sequencial (`setTimeout` apos cada reconhecimento, nao `setInterval`) pra nao empilhar OCRs simultaneos — bem mais pesado que decodificar barras. Indicador "Analisando…" sobre a mira enquanto processa.
- `frontend/package.json`: `@zxing/browser` removido, `tesseract.js ^7.0.0` adicionado.
- `frontend/public/tesseract-worker.min.js`, `frontend/public/tesseract-core/tesseract-core-simd-lstm.wasm(.js)`, `frontend/public/tessdata/eng.traineddata.gz`: arquivos do tesseract.js copiados localmente (nao usa o CDN padrao) — o app roda como APK e nao da pra depender de internet no momento do inventario.

Bug encontrado e corrigido durante o teste no aparelho real (Samsung A07, via CDP):

- `corePath` apontando para um DIRETORIO deixa o tesseract.js autodetectar SIMD/relaxedSIMD do aparelho e escolher a variante do `.wasm` sozinho. O aparelho de teste suporta `relaxedSimd`, mas eu só tinha copiado a variante `simd-lstm` — o worker quebrava em silencio (`importScripts` falhava) e o app so mostrava "Câmera não disponível", mascarando a causa real. Corrigido fixando `corePath` num arquivo especifico (`tesseract-core-simd-lstm.wasm.js`), pulando a autodeteccao.

Validacao:

- CDP no Samsung A07: worker carrega, camera ativa, loop de OCR roda sem excecoes.
- Teste fisico de leitura (confirmar que os digitos reconhecidos batem com a etiqueta) pendente do usuario — sessao terminou com o app na tela de login (usuario deslogado durante o teste), sem credenciais disponiveis pra continuar via CDP.

Deploy:

- Commits `0f2f55e` (fix VITE_API_URL) e `a1d52ab` (OCR), push para `main`.
- VPS: `git pull` + `docker build --no-cache` do frontend, container recriado, assets do tesseract confirmados presentes no container, site publico verificado (200).
- APK debug recompilado e reinstalado no aparelho de teste.

---

## Issue 026 - Scanner: iteracoes com etiqueta real ate ML Kit nativo

Status: `[done]` — deployado na VPS e no APK em 2026-07-08

Objetivo:

- Continuacao da Issue 025. Depois do fix de deploy, o usuario testou o OCR (tesseract.js) com etiquetas reais (Prefeitura de Mogi das Cruzes e Corpo de Bombeiros) por varias rodadas. Essa issue documenta as iteracoes ate chegar na versao que funciona bem, incluindo dois pivots de arquitetura pedidos pelo usuario no meio do caminho.

Iteracoes com tesseract.js (todas testadas com fotos reais capturadas via CDP no aparelho):

1. **PSM errado + mira grande demais**: `PSM.SINGLE_LINE` nao lida bem com uma imagem com titulo+codigo de barras+numero juntos. Trocado pra `PSM.SPARSE_TEXT` e mira reduzida — usuario pediu de volta o tamanho grande (nao queria mirar so o numero).
2. **Extracao de digitos**: o OCR fragmenta o numero em varios tokens por causa do espacamento da fonte. Versao final de `extrairChapa()` testa toda sequencia contigua de tokens numericos na mesma linha (nao so pares adjacentes) e filtra pelo tamanho real das chapas (4-6 digitos).
3. **Recorte por posicao fixa nao funciona**: tentativa de recortar so a "metade de baixo" da mira (onde o numero geralmente fica) falhava porque a posicao varia com distancia/angulo. Substituido por `detectarFaixaAposBarcode()` — detecta a faixa de linhas com muitas transicoes claro/escuro (o codigo de barras) dinamicamente em cada frame, com limiar RELATIVO (metade da maior contagem de transicoes da propria imagem) pra funcionar em etiquetas com barras de espessuras diferentes.
4. **OCR nunca rodava**: o WebView do Capacitor devolve 404 pra arquivos `.gz` — o download do modelo de idioma do tesseract falhava em silencio. Resolvido usando o arquivo descompactado + `gzip: false`.
5. **Margem entre codigo de barras e numero**: mesmo detectando o codigo de barras corretamente, uma margem pequena deixava resquicio de barra colado no numero, confundindo o OCR (leu "211088" em vez de "167207"). Margem aumentada de ~1.5% pra 6% da altura.

Pivot 1 — camera nativa (revertido): pedido do usuario ("abra janela de captura pra focar melhor") — implementado `@capacitor/camera` (`Camera.getPhoto`) pra abrir o app de camera nativo do Android em vez do preview embutido. Testado: funcionou tecnicamentre (sem erros), mas o usuario achou a experiencia pior ("essa solucao nao me atende") por interromper o fluxo do app. Revertido pra camera embutida (`git checkout` nos arquivos, `@capacitor/camera` nunca chegou a ser commitado).

Pivot 2 — ML Kit nativo (permanente): apos mais uma etiqueta falhar com tesseract.js mesmo com imagem legivel na previa "ULTIMA CAPTURA" (nova funcionalidade adicionada nessa rodada — mostra a imagem exata analisada, pra debug sem precisar de CDP), usuario pediu pra trocar pra ML Kit Text Recognition do Google. Trocado `tesseract.js` por `@jcesarmobile/capacitor-ocr` (usa `com.google.mlkit:text-recognition` nativamente no Android). API bem mais simples (`Ocr.process({ image: dataUrl })`), sem precisar de worker/wasm/modelo de idioma bundled — tudo roda nativo.

Ajustes finais depois do ML Kit:

- Leitura automatica continua de volta (era manual desde a Issue 025 por causa da lentidao do tesseract.js) — ML Kit e rapido o bastante pra nao ter esse problema. Loop tenta a cada 400ms, mas **para completamente** ao confirmar um numero (evita reler a mesma etiqueta em sequencia). Botao "Capturar agora" forca tentativa imediata e reativa o loop pra proxima etiqueta.
- Mira trocada de moldura fechada pra cantos em L estilo leitor de QR code, com cor por estado (branco parado, azul analisando, verde ao confirmar).

Achados de dados (nao sao bugs de codigo):

- A etiqueta de teste inicial (chapa 211029) e da Prefeitura Municipal de Mogi das Cruzes, fora do escopo atual do Inventario (so reconhece `patrimonio_estado.json`).
- `Inventario_Municipio.xlsx` (pasta do projeto) e identico ao `Inventario_Estado.xlsx` — nao e uma planilha real da Prefeitura. Usuario vai providenciar o arquivo correto depois.
- Uma segunda etiqueta de teste (chapa 167207, "LANTERNA TATICA") e um item real do Estado — usada pra validar o pipeline completo.

Arquivos modificados: `frontend/src/pages/Inventario.jsx` (praticamente reescrito nessa rodada), `frontend/package.json` (`tesseract.js` removido, `@jcesarmobile/capacitor-ocr` adicionado), `frontend/android/app/capacitor.build.gradle` e `capacitor.settings.gradle` (registro do plugin nativo, gerados por `npx cap sync`), arquivos publicos do tesseract removidos (`public/tesseract-worker.min.js`, `public/tesseract-core/`, `public/tessdata/`).

Deploy: cada iteracao foi commitada, pushada, deployada na VPS (`docker build --no-cache`) e testada no APK real (Samsung A07) antes da proxima. Commits principais: `929a79b`, `489c9f3`, `77eac7a`, `67cec10`, `1dbb0f2`, `f2eefa1`, `0a9da12`, `4197bea`, `66b64d7`, `113f5ee`, `d0a68b6`, `68faa93`, `43048d6`, `fc5bb4d`.
