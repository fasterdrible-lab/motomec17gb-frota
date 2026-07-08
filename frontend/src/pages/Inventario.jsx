import React, { useState, useEffect, useRef } from 'react';
import { Ocr } from '@jcesarmobile/capacitor-ocr';
import patrimonioRaw from '../data/patrimonio_estado.json';

// ─── Helpers de dados ────────────────────────────────────────────────────────
function parseDivisao(div) {
  // Remove prefixo "OPM  XXXXXXX  17GB " → ex: "1 SGB EB BRAS CUBAS  SALA DE RESGATE"
  const m = div.match(/17GB\s+(.*)/);
  return m ? m[1].trim() : div.trim();
}

// Normaliza o prefixo da divisão em um nome de setor legível.
// Os dados tem grafias inconsistentes ("1 SGB" vs "1SGB"), entao usamos
// regex em vez de comparar a string inteira.
function getSetor(divisaoLabel) {
  if (/^1\s*SGB/i.test(divisaoLabel)) return '1º SGB';
  if (/^2\s*SGB/i.test(divisaoLabel)) return '2º SGB';
  if (/^EM\b/i.test(divisaoLabel)) return 'Estado-Maior (EM)';
  return divisaoLabel.split(' ')[0];
}

// Nomes conhecidos de Estação de Bombeiros (EB) — a formatação da planilha
// e inconsistente (espacamento, "EBEB", falta de token "EB"), entao em vez
// de tentar parsear a posicao exata, procuramos essas cidades conhecidas em
// qualquer lugar do texto da divisão.
const EB_NOMES = ['FERRAZ DE VASCONCELOS', 'ITAQUAQUECETUBA', 'BRAS CUBAS', 'GUARAREMA', 'SHANGAI', 'SUZANO'];
const PALAVRAS_MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

function toTitleCase(s) {
  return s.toLowerCase().split(' ').map((w, i) => (
    i > 0 && PALAVRAS_MINUSCULAS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)
  )).join(' ');
}

function getEB(divisaoLabel) {
  const upper = divisaoLabel.toUpperCase();
  const nome = EB_NOMES.find(n => upper.includes(n));
  return nome ? `EB ${toTitleCase(nome)}` : 'Outros';
}

// Fracao da area VISIVEL do video (o retangulo da mira) que sera de fato
// analisada. Mantendo os dois usando a mesma constante garantimos que o
// usuario so consegue ler o que aparece dentro da mira — evita pegar por
// engano uma etiqueta vizinha que esteja no campo de visao da camera mas
// fora da area que o usuario mirou. Tamanho generoso de proposito: o
// usuario mira a etiqueta inteira (nao so o numero).
//
// Nao existe um recorte interno fixo pro numero (ja tentamos — testado com
// etiqueta real, a posicao do numero DENTRO da mira varia bastante conforme
// a distancia/angulo: as vezes fica na metade de baixo, as vezes na de
// cima. Um recorte fixo acertava uma foto e cortava o numero fora em
// outra). Quem descarta o codigo de barras e o SPARSE_TEXT (que segmenta a
// imagem em blocos de texto soltos) + extrairChapa (que filtra o ruido do
// codigo de barras pelo tamanho do candidato) — ver mais abaixo.
const MIRA_LARGURA_PCT = 0.8;
const MIRA_ALTURA_PCT = 0.32;

// Converte a mira (definida em % da area exibida do <video>, que usa
// object-fit:cover) para coordenadas de pixel do frame REAL da camera, que
// quase sempre tem uma resolucao/proporcao diferente da area exibida.
function getCropRegion(video, containerEl) {
  const videoW = video.videoWidth;
  const videoH = video.videoHeight;
  if (!videoW || !videoH) return null;

  const rect = containerEl.getBoundingClientRect();
  const containerW = rect.width;
  const containerH = rect.height;
  if (!containerW || !containerH) return null;

  // object-fit:cover — a imagem e escalada para cobrir o container inteiro,
  // cortando o excesso; precisamos do mesmo fator de escala para saber quais
  // pixels do frame original correspondem ao que esta sendo exibido.
  const scale = Math.max(containerW / videoW, containerH / videoH);
  const displayedW = videoW * scale;
  const displayedH = videoH * scale;
  const offsetX = (displayedW - containerW) / 2;
  const offsetY = (displayedH - containerH) / 2;

  const boxW = containerW * MIRA_LARGURA_PCT;
  const boxH = containerH * MIRA_ALTURA_PCT;
  const boxX = (containerW - boxW) / 2;
  const boxY = (containerH - boxH) / 2;

  const srcX = (boxX + offsetX) / scale;
  const srcY = (boxY + offsetY) / scale;
  const srcW = boxW / scale;
  const srcH = boxH / scale;

  return { srcX, srcY, srcW, srcH };
}

// O OCR (SPARSE_TEXT) as vezes quebra o numero da chapa em varios pedacos na
// mesma linha por causa do espacamento entre os digitos — em fontes com
// letras mais separadas, um numero de 6 digitos pode sair como 6 tokens de
// UM digito cada, nao so 2 pedacos. Tambem pega ruido do codigo de barras
// como "digitos" isolados por perto (ex: "211029 4"). Por isso testamos
// TODA sequencia contigua de tokens numericos na mesma linha (nao so pares
// adjacentes) e filtramos pelo tamanho real das chapas cadastradas (4 a 6
// digitos) — isso reconstroi o numero mesmo se ele saiu bem fragmentado, e
// ainda rejeita ruido isolado e uniões longas demais tipo
// "211029"+"4"="2110294" (7 digitos, fora do range valido).
function extrairChapa(texto) {
  const candidatos = [];
  for (const linha of texto.split(/\n+/)) {
    const tokens = linha.trim().split(/\s+/).filter(t => /^\d+$/.test(t));
    for (let i = 0; i < tokens.length; i++) {
      let acumulado = '';
      for (let j = i; j < tokens.length; j++) {
        acumulado += tokens[j];
        if (acumulado.length > 6) break;
        candidatos.push(acumulado);
      }
    }
  }
  const validos = candidatos
    .filter(c => c.length >= 4 && c.length <= 6)
    .sort((a, b) => b.length - a.length);
  return validos[0] || null;
}

// O numero impresso da chapa fica sempre logo ACIMA ou ABAIXO do codigo de
// barras (o layout da etiqueta e fixo), mas a posicao disso tudo DENTRO da
// mira varia bastante conforme a distancia/angulo de quem esta escaneando
// — testado com etiqueta real, um recorte fixo por posicao acertava uma
// foto e cortava o numero fora em outra. Em vez de adivinhar a posicao,
// detectamos onde o codigo de barras REALMENTE esta em cada frame (linhas
// de pixel com muitas transições claro/escuro — as barras finas do codigo
// de barras têm bem mais transições por linha do que o restante da
// etiqueta) e recortamos a faixa logo depois dele.
function detectarFaixaAposBarcode(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  if (w < 10 || h < 10) return null;
  const { data } = ctx.getImageData(0, 0, w, h);

  const gray = new Float32Array(w * h);
  let soma = 0;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const v = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    gray[p] = v;
    soma += v;
  }
  const media = soma / (w * h);
  const limiar = media * 0.75;

  const transicoesPorLinha = new Int32Array(h);
  for (let y = 0; y < h; y++) {
    const base = y * w;
    let escuroAnterior = gray[base] < limiar;
    let contagem = 0;
    for (let x = 1; x < w; x++) {
      const escuro = gray[base + x] < limiar;
      if (escuro !== escuroAnterior) contagem++;
      escuroAnterior = escuro;
    }
    transicoesPorLinha[y] = contagem;
  }

  // Limiar RELATIVO (nao um numero fixo de barras) — etiquetas diferentes
  // tem codigos de barra com espessuras de barra diferentes. Usamos metade
  // da maior contagem de transicoes encontrada na propria imagem: a linha
  // mais "listrada" quase sempre e uma linha do codigo de barras, entao
  // isso se adapta a densidade real de cada etiqueta em vez de assumir uma
  // largura de barra fixa.
  let maxTransicoes = 0;
  for (let y = 0; y < h; y++) if (transicoesPorLinha[y] > maxTransicoes) maxTransicoes = transicoesPorLinha[y];
  const limiarBarcode = Math.max(8, maxTransicoes * 0.5);
  let melhorInicio = -1;
  let melhorFim = -1;
  let inicioAtual = -1;
  for (let y = 0; y < h; y++) {
    if (transicoesPorLinha[y] > limiarBarcode) {
      if (inicioAtual === -1) inicioAtual = y;
    } else if (inicioAtual !== -1) {
      if (y - inicioAtual > melhorFim - melhorInicio) { melhorInicio = inicioAtual; melhorFim = y; }
      inicioAtual = -1;
    }
  }
  if (inicioAtual !== -1 && h - inicioAtual > melhorFim - melhorInicio) {
    melhorInicio = inicioAtual;
    melhorFim = h;
  }
  if (melhorInicio === -1) return null;

  // Margem generosa entre o codigo de barras detectado e o recorte do
  // numero — testado com etiqueta real: com pouca margem, uma sombra fina
  // das ultimas barras ainda aparece colada no numero e confunde o OCR
  // (leu "211088" e "2118" em vez de "167207", provavelmente misturando
  // resquicio de barra com digito).
  const margem = Math.max(6, Math.round(h * 0.06));
  const alturaAbaixo = h - melhorFim;
  const alturaAcima = melhorInicio;
  if (alturaAbaixo >= alturaAcima) {
    const y0 = Math.min(melhorFim + margem, h - 1);
    return { x: 0, y: y0, w, h: h - y0 };
  }
  const y1 = Math.max(melhorInicio - margem, 1);
  return { x: 0, y: 0, w, h: y1 };
}

const TODOS_ITENS = patrimonioRaw.map(i => ({ ...i, divisaoLabel: parseDivisao(i.divisao) }));

const DIVISOES = [...new Set(TODOS_ITENS.map(i => i.divisao))]
  .sort((a, b) => parseDivisao(a).localeCompare(parseDivisao(b)));

// Mapa responsável → divisões sob sua responsabilidade (usado para filtrar
// o dropdown de Divisão/Ambiente assim que o responsável e escolhido).
const RESP_TO_DIVISOES = {};
TODOS_ITENS.forEach(i => {
  const r = (i.responsavel || '').trim();
  if (!r) return;
  if (!RESP_TO_DIVISOES[r]) RESP_TO_DIVISOES[r] = new Set();
  RESP_TO_DIVISOES[r].add(i.divisao);
});
const RESPONSAVEIS = Object.keys(RESP_TO_DIVISOES).sort();

const STATUS_COR = {
  ok:           { label: 'Correto',      cor: '#16a34a', bg: '#dcfce7', borda: '#86efac', icon: '✓' },
  deslocado:    { label: 'Deslocado',    cor: '#d97706', bg: '#fef3c7', borda: '#fcd34d', icon: '⚠' },
  desconhecido: { label: 'Não cadastrado', cor: '#dc2626', bg: '#fee2e2', borda: '#fca5a5', icon: '✗' },
  ausente:      { label: 'Ausente',      cor: '#6b7280', bg: '#f3f4f6', borda: '#d1d5db', icon: '○' },
};

// ─── Componente principal ────────────────────────────────────────────────────
export default function Inventario() {
  const [step, setStep]               = useState('configuracao');
  const [divisaoSel, setDivisaoSel]   = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [ebSel, setEbSel]             = useState('');
  const [dataHora]                    = useState(() => new Date().toLocaleString('pt-BR'));
  const [escaneados, setEscaneados]   = useState({});
  const [flashStatus, setFlashStatus] = useState(null);
  const [flashNome, setFlashNome]     = useState('');
  const [manualInput, setManualInput] = useState('');
  const [manualAviso, setManualAviso] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [ocrBusy, setOcrBusy]         = useState(false);
  const [ocrReady, setOcrReady]       = useState(false);
  const [ultimaCaptura, setUltimaCaptura] = useState(null);
  const [busca, setBusca]             = useState('');

  const videoRef     = useRef(null);
  const processarRef = useRef(null);
  const capturarRef  = useRef(null);

  const itensEsperados = TODOS_ITENS.filter(i => i.divisao === divisaoSel);

  // ─── Validação ──────────────────────────────────────────────────────────
  // O OCR agora so roda quando o usuario aperta o botao "Capturar" (nao mais
  // continuamente), entao toda leitura — camera ou digitada — e uma acao
  // explicita do usuario e deve sempre processar, mesmo que o codigo seja
  // igual ao ultimo lido.
  function processarScan(codigo) {
    const cod = codigo.trim();
    if (!cod) return;

    const item = TODOS_ITENS.find(i => i.chapa === cod);
    let status;
    if (!item)                         status = 'desconhecido';
    else if (item.divisao === divisaoSel) status = 'ok';
    else                               status = 'deslocado';

    setEscaneados(prev => ({
      ...prev,
      [cod]: { item: item || null, status, ts: new Date().toLocaleTimeString('pt-BR'), codigo: cod },
    }));
    setFlashStatus(status);
    setFlashNome(item?.descricao ?? 'Item não cadastrado');
    setTimeout(() => setFlashStatus(null), 1400);
  }

  processarRef.current = processarScan;

  function validarManual() {
    const cod = manualInput.trim();
    if (!cod) {
      setManualAviso('Digite o número da chapa antes de validar.');
      return;
    }
    setManualAviso('');
    processarScan(cod);
    setManualInput('');
  }

  // ─── Scanner lifecycle ───────────────────────────────────────────────────
  // O valor gravado nas barras do codigo de barras nem sempre e o mesmo
  // numero impresso na etiqueta — foi o que causava leituras "erradas".
  // Por isso a camera faz OCR (reconhecimento de texto) apenas dos DIGITOS
  // IMPRESSOS dentro da mira, em vez de tentar decodificar as barras.
  //
  // OCR via ML Kit nativo (plugin @jcesarmobile/capacitor-ocr, usa
  // com.google.mlkit:text-recognition no Android) em vez do tesseract.js
  // rodando dentro do WebView — testado com varias etiquetas reais, o
  // tesseract.js errava ou nao achava nada mesmo com a imagem bem legivel;
  // ML Kit e nativo, muito mais rapido e muito mais preciso pra esse tipo
  // de leitura.
  //
  // Leitura AUTOMATICA e continua de novo (como no inicio do projeto) —
  // agora que o OCR e nativo (ML Kit) em vez de rodar dentro do WebView
  // (tesseract.js), cada tentativa e rapida o bastante pra nao travar a
  // tela como acontecia antes. O botao "Capturar" continua disponivel como
  // forma de forcar uma tentativa imediata, sem esperar o proximo ciclo.
  useEffect(() => {
    if (step !== 'escaneando') return;
    let stopped = false;
    let stream = null;
    let loopTimer = null;
    let emAndamento = false;
    setCameraError('');
    setCameraAtiva(false);
    setOcrBusy(false);
    setOcrReady(false);
    setUltimaCaptura(null);

    const scanCanvas = document.createElement('canvas');
    const scanCtx = scanCanvas.getContext('2d');
    const numeroCanvas = document.createElement('canvas');
    const numeroCtx = numeroCanvas.getContext('2d');

    async function startScanner() {
      try {
        // Sem largura/altura definidas o navegador pode escolher uma
        // resolucao baixa demais para ler os digitos pequenos da etiqueta.
        // facingMode 'environment' pede a camera traseira.
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return; }

        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        if (stopped) return;

        setCameraAtiva(true);

        // Foco continuo ajuda muito em etiquetas pequenas de perto — nem
        // todo aparelho suporta, entao e melhor esforco (nao trava nada se a
        // API ou o modo nao existir).
        try {
          const track = stream.getVideoTracks()[0];
          const caps = track?.getCapabilities?.();
          if (caps?.focusMode?.includes('continuous')) {
            await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
          }
        } catch {
          // sem suporte a controle de foco manual, segue com o padrao do aparelho
        }

        // Retorna true se achou e processou um numero valido — usado tanto
        // pelo botao manual quanto pelo loop automatico. `emAndamento`
        // evita que as duas vias rodem uma captura ao mesmo tempo.
        async function capturarUmaVez() {
          if (stopped || emAndamento) return false;
          const region = getCropRegion(video, video.parentElement);
          if (!region || region.srcW <= 0 || region.srcH <= 0) return false;

          emAndamento = true;
          try {
            scanCanvas.width = region.srcW;
            scanCanvas.height = region.srcH;
            scanCtx.filter = 'none';
            scanCtx.drawImage(
              video,
              region.srcX, region.srcY, region.srcW, region.srcH,
              0, 0, region.srcW, region.srcH
            );

            // Tenta achar a faixa logo apos o codigo de barras (onde o
            // numero sempre fica impresso) e roda o OCR so nela — reduz a
            // chance do ML Kit misturar o texto do orgao ou o codigo de
            // barras com o numero. Se nao conseguir detectar o codigo de
            // barras nesse frame, cai de volta pra mira inteira mesmo.
            let ocrCanvas = scanCanvas;
            const faixa = detectarFaixaAposBarcode(scanCanvas);
            if (faixa && faixa.h >= 12) {
              numeroCanvas.width = faixa.w;
              numeroCanvas.height = faixa.h;
              numeroCtx.drawImage(scanCanvas, faixa.x, faixa.y, faixa.w, faixa.h, 0, 0, faixa.w, faixa.h);
              ocrCanvas = numeroCanvas;
            }

            // Mostra pro usuario exatamente a imagem que foi analisada —
            // ajuda a perceber na hora se o problema e foco/distancia.
            const imagemAnalisada = ocrCanvas.toDataURL('image/jpeg', 0.9);
            setUltimaCaptura(imagemAnalisada);

            setOcrBusy(true);
            try {
              const { results } = await Ocr.process({ image: imagemAnalisada });
              const textoCompleto = (results || []).map(r => r.text).join('\n');
              const digitos = extrairChapa(textoCompleto);
              if (stopped) return false;
              if (digitos) {
                setManualAviso('');
                processarRef.current(digitos);
                return true;
              }
              return false;
            } catch {
              return false;
            } finally {
              if (!stopped) setOcrBusy(false);
            }
          } finally {
            emAndamento = false;
          }
        }

        capturarRef.current = () => { capturarUmaVez(); };

        // Loop automatico: tenta de novo logo em seguida se nao achou nada
        // (400ms — ML Kit e rapido o bastante pra isso nao pesar), e espera
        // um pouco mais depois de um acerto (1200ms, tempo do flash de
        // confirmacao na tela) pra nao reler a mesma etiqueta em sequencia
        // enquanto o usuario ainda nao trocou de mira.
        async function loop() {
          if (stopped) return;
          const achou = await capturarUmaVez();
          if (stopped) return;
          loopTimer = setTimeout(loop, achou ? 1200 : 400);
        }

        setOcrReady(true);
        loop();
      } catch {
        if (!stopped) setCameraError('Câmera não disponível. Use o campo manual abaixo.');
      }
    }

    startScanner();
    return () => {
      stopped = true;
      capturarRef.current = null;
      if (loopTimer) clearTimeout(loopTimer);
      stream?.getTracks().forEach(t => t.stop());
      setCameraAtiva(false);
      setOcrBusy(false);
      setOcrReady(false);
    };
  }, [step]);

  // ─── STEP 1 — Configuração ───────────────────────────────────────────────
  if (step === 'configuracao') {
    const divisaoLabel = divisaoSel ? parseDivisao(divisaoSel) : '';
    const divisoesDoResponsavel = responsavel ? [...(RESP_TO_DIVISOES[responsavel] || [])] : [];
    const setoresDoResponsavel = [...new Set(divisoesDoResponsavel.map(d => getSetor(parseDivisao(d))))];
    const ebsDoResponsavel = [...new Set(divisoesDoResponsavel.map(d => getEB(parseDivisao(d))))]
      .sort((a, b) => a === 'Outros' ? 1 : b === 'Outros' ? -1 : a.localeCompare(b));
    const divisoesDisponiveis = divisoesDoResponsavel
      .filter(d => !ebSel || getEB(parseDivisao(d)) === ebSel)
      .sort((a, b) => parseDivisao(a).localeCompare(parseDivisao(b)));

    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#1e3a5f' }}>
            📋 Novo Inventário
          </h2>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.82rem' }}>{dataHora}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Responsável pelo setor</label>
            <select
              value={responsavel}
              onChange={e => { setResponsavel(e.target.value); setDivisaoSel(''); }}
              style={inputStyle}
            >
              <option value="">Selecione o responsável…</option>
              {RESPONSAVEIS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {responsavel && (
            <div style={{ background: '#eff6ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#1e40af' }}>
                Setor{setoresDoResponsavel.length > 1 ? 'es' : ''}: <strong>{setoresDoResponsavel.join(', ')}</strong>
                {' '}· {divisoesDoResponsavel.length} divisões
              </p>
            </div>
          )}

          {responsavel && (
            <div>
              <label style={labelStyle}>Estação de Bombeiros (EB)</label>
              <select
                value={ebSel}
                onChange={e => { setEbSel(e.target.value); setDivisaoSel(''); }}
                style={inputStyle}
              >
                <option value="">Todas as EB deste setor</option>
                {ebsDoResponsavel.map(eb => (
                  <option key={eb} value={eb}>{eb}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={labelStyle}>Divisão / Ambiente</label>
            <select
              value={divisaoSel}
              onChange={e => setDivisaoSel(e.target.value)}
              style={inputStyle}
              disabled={!responsavel}
            >
              <option value="">{responsavel ? 'Selecione a divisão…' : 'Selecione o responsável primeiro'}</option>
              {divisoesDisponiveis.map(d => (
                <option key={d} value={d}>
                  {parseDivisao(d)}
                </option>
              ))}
            </select>
          </div>

          {divisaoSel && (
            <div style={{ background: '#eff6ff', border: '1px solid #bae6fd', borderRadius: 10, padding: 14 }}>
              <p style={{ margin: '0 0 4px', fontSize: '0.8rem', fontWeight: 700, color: '#1e40af' }}>
                {itensEsperados.length} itens cadastrados nesta divisão
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#3b82f6' }}>{divisaoLabel}</p>
            </div>
          )}

          <button
            disabled={!divisaoSel || !responsavel}
            onClick={() => { setEscaneados({}); setStep('escaneando'); }}
            style={{
              ...btnPrimary,
              opacity: (!divisaoSel || !responsavel) ? 0.45 : 1,
              cursor: (!divisaoSel || !responsavel) ? 'not-allowed' : 'pointer',
              padding: '14px 0', fontSize: '1rem', marginTop: 8,
            }}
          >
            Iniciar Scanner →
          </button>
        </div>
      </div>
    );
  }

  // ─── STEP 2 — Escaneamento ───────────────────────────────────────────────
  if (step === 'escaneando') {
    const totalEsperado = itensEsperados.length;
    const qtdOk        = Object.values(escaneados).filter(e => e.status === 'ok').length;
    const pct          = totalEsperado > 0 ? Math.round((qtdOk / totalEsperado) * 100) : 0;
    const listaEsc     = Object.values(escaneados).sort((a, b) => b.ts.localeCompare(a.ts));
    const pendentes    = itensEsperados.filter(i => !escaneados[i.chapa] || escaneados[i.chapa].status !== 'ok');

    return (
      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        {/* Cabeçalho de progresso */}
        <div style={{ background: '#1e3a5f', color: 'white', padding: '12px 20px', borderRadius: '0 0 12px 12px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: '0.85rem', opacity: 0.9 }}>
              {parseDivisao(divisaoSel).substring(0, 50)}{parseDivisao(divisaoSel).length > 50 ? '…' : ''}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{qtdOk}/{totalEsperado} · {pct}%</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 99, height: 6 }}>
            <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#4ade80' : '#60a5fa', borderRadius: 99, transition: 'width 0.4s' }} />
          </div>
        </div>

        <div style={{ padding: '0 14px 20px' }}>
          {/* Flash */}
          {flashStatus && (
            <div style={{
              background: STATUS_COR[flashStatus].bg,
              border: `2px solid ${STATUS_COR[flashStatus].borda}`,
              color: STATUS_COR[flashStatus].cor,
              borderRadius: 10, padding: '10px 16px',
              textAlign: 'center', fontWeight: 700, fontSize: '1rem',
              marginBottom: 12,
            }}>
              {STATUS_COR[flashStatus].icon} {STATUS_COR[flashStatus].label}
              {flashNome && <div style={{ fontSize: '0.8rem', fontWeight: 500, marginTop: 2, opacity: 0.85 }}>{flashNome}</div>}
            </div>
          )}

          {/* Viewfinder */}
          <div style={{ position: 'relative', background: '#111', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
            <video ref={videoRef} style={{ width: '100%', display: 'block', maxHeight: 240, objectFit: 'cover' }} muted playsInline />
            {cameraAtiva && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                {/* Precisa bater com MIRA_LARGURA_PCT/MIRA_ALTURA_PCT — só o
                    que aparece dentro dessa caixa é de fato decodificado. */}
                <div style={{ width: `${MIRA_LARGURA_PCT * 100}%`, height: `${MIRA_ALTURA_PCT * 100}%`, border: '2px solid rgba(255,255,255,0.75)', borderRadius: 8, boxShadow: '0 0 0 9999px rgba(0,0,0,0.38)' }} />
                {ocrBusy && (
                  <span style={{ position: 'absolute', bottom: 8, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.7rem', padding: '3px 10px', borderRadius: 20 }}>
                    Analisando…
                  </span>
                )}
              </div>
            )}
            {!cameraAtiva && !cameraError && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                Iniciando câmera…
              </div>
            )}
          </div>

          {cameraAtiva && (
            <>
              <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
                Centralize a etiqueta dentro da caixa — a leitura acontece sozinha. Se demorar, toque em Capturar pra forçar agora.
              </p>
              <button
                onClick={() => capturarRef.current?.()}
                disabled={!ocrReady || ocrBusy}
                style={{
                  ...btnPrimary,
                  width: '100%', padding: '12px 0', fontSize: '0.95rem', marginBottom: 14,
                  opacity: (!ocrReady || ocrBusy) ? 0.6 : 1,
                  cursor: (!ocrReady || ocrBusy) ? 'not-allowed' : 'pointer',
                }}
              >
                {ocrBusy ? 'Analisando…' : ocrReady ? '📸 Capturar agora' : 'Preparando leitor…'}
              </button>
            </>
          )}

          {cameraError && (
            <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: 10, marginBottom: 10, color: '#92400e', fontSize: '0.82rem' }}>
              ⚠ {cameraError}
            </div>
          )}

          {/* Input manual */}
          <div style={{ display: 'flex', gap: 8, marginBottom: manualAviso ? 4 : 14 }}>
            <input
              type="text"
              inputMode="numeric"
              autoCapitalize="off"
              autoCorrect="off"
              value={manualInput}
              onChange={e => { setManualInput(e.target.value); if (manualAviso) setManualAviso(''); }}
              onKeyDown={e => { if (e.key === 'Enter') validarManual(); }}
              placeholder="Nº da Chapa (ex: 90057) + Enter"
              style={{ ...inputStyle, flex: 1, margin: 0 }}
            />
            <button
              onClick={validarManual}
              style={{ ...btnPrimary, padding: '10px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
            >
              Validar
            </button>
          </div>

          {manualAviso && (
            <div style={{ color: '#dc2626', fontSize: '0.78rem', fontWeight: 600, marginBottom: 8 }}>
              ⚠ {manualAviso}
            </div>
          )}

          {ultimaCaptura && (
            <div style={{ marginBottom: 14 }}>
              <p style={sectionLabel}>ÚLTIMA CAPTURA (o que foi analisado)</p>
              <img
                src={ultimaCaptura}
                alt="Última captura analisada pelo leitor"
                style={{ width: '100%', maxHeight: 120, objectFit: 'contain', background: '#111', borderRadius: 8, border: '1px solid #d1d5db' }}
              />
            </div>
          )}

          {/* Escaneados */}
          {listaEsc.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p style={sectionLabel}>LIDOS ({listaEsc.length})</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 180, overflowY: 'auto' }}>
                {listaEsc.map(e => {
                  const cfg = STATUS_COR[e.status];
                  return (
                    <div key={e.codigo} style={{ display: 'flex', gap: 8, background: cfg.bg, border: `1px solid ${cfg.borda}`, borderRadius: 8, padding: '7px 10px', alignItems: 'flex-start' }}>
                      <span style={{ color: cfg.cor, fontWeight: 700, fontSize: '0.85rem', minWidth: 16 }}>{cfg.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1f2937' }}>
                          {e.codigo} — {e.item?.descricao ?? 'Não cadastrado'}
                        </div>
                        {e.status === 'deslocado' && e.item && (
                          <div style={{ fontSize: '0.7rem', color: cfg.cor }}>Divisão correta: {parseDivisao(e.item.divisao)}</div>
                        )}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#9ca3af', whiteSpace: 'nowrap', alignSelf: 'flex-end' }}>{e.ts}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pendentes */}
          {pendentes.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p style={sectionLabel}>PENDENTES ({pendentes.length})</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {pendentes.slice(0, 30).map(i => (
                  <span key={i.chapa} style={{ background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem', color: '#6b7280' }}>
                    {i.chapa}
                  </span>
                ))}
                {pendentes.length > 30 && (
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af', alignSelf: 'center' }}>+{pendentes.length - 30} mais</span>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep('configuracao')} style={{ ...btnSecondary, flex: 1 }}>← Voltar</button>
            <button onClick={() => setStep('relatorio')} style={{ ...btnPrimary, flex: 2 }}>Finalizar →</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP 3 — Relatório ─────────────────────────────────────────────────
  const todosEsc     = Object.values(escaneados);
  const encontrados  = todosEsc.filter(e => e.status === 'ok');
  const deslocados   = todosEsc.filter(e => e.status === 'deslocado');
  const desconhecidos = todosEsc.filter(e => e.status === 'desconhecido');
  const ausentes     = itensEsperados.filter(i => !escaneados[i.chapa] || escaneados[i.chapa].status !== 'ok');
  const pct          = itensEsperados.length > 0 ? Math.round((encontrados.length / itensEsperados.length) * 100) : 0;

  const itensFiltrados = (() => {
    const base = [...itensEsperados];
    if (!busca) return base;
    const q = busca.toLowerCase();
    return base.filter(i =>
      i.chapa.toLowerCase().includes(q) ||
      i.descricao.toLowerCase().includes(q) ||
      (i.responsavel || '').toLowerCase().includes(q)
    );
  })();

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 14px 32px' }}>
      {/* Cabeçalho */}
      <div style={{ background: '#1e3a5f', color: 'white', borderRadius: '0 0 16px 16px', padding: '18px 22px', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>📋 Relatório de Inventário</h2>
        <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '0.78rem' }}>
          {parseDivisao(divisaoSel)} · {responsavel} · {dataHora}
        </p>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.2)', borderRadius: 99, height: 8 }}>
            <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#4ade80' : '#facc15', borderRadius: 99 }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>{pct}%</span>
        </div>
      </div>

      {/* Cards */}
      <div className="grid-cols-3" style={{ gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Esperados',    valor: itensEsperados.length, cor: '#1e40af', bg: '#eff6ff' },
          { label: 'Encontrados',  valor: encontrados.length,    cor: '#16a34a', bg: '#dcfce7' },
          { label: 'Ausentes',     valor: ausentes.length,       cor: '#dc2626', bg: '#fee2e2' },
          { label: 'Deslocados',   valor: deslocados.length,     cor: '#d97706', bg: '#fef3c7' },
          { label: 'Não cadastr.', valor: desconhecidos.length,  cor: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Cobertura',    valor: `${pct}%`,             cor: pct === 100 ? '#16a34a' : '#d97706', bg: '#f9fafb' },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: c.cor }}>{c.valor}</div>
            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Tabela de itens esperados */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ ...sectionLabel, margin: 0 }}>ITENS DA DIVISÃO ({itensFiltrados.length})</p>
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Filtrar…"
            style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.8rem', width: 140 }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 340, overflowY: 'auto' }}>
          {itensFiltrados.map(item => {
            const scan = escaneados[item.chapa];
            const status = scan?.status ?? 'ausente';
            const cfg = STATUS_COR[status];
            return (
              <div key={item.chapa} style={{ display: 'flex', gap: 8, background: cfg.bg, border: `1px solid ${cfg.borda}`, borderRadius: 8, padding: '8px 12px', alignItems: 'flex-start' }}>
                <span style={{ color: cfg.cor, fontWeight: 700, minWidth: 18, textAlign: 'center', paddingTop: 1 }}>{cfg.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1f2937' }}>
                    {item.chapa} — {item.descricao}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280', display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginTop: 2 }}>
                    {item.responsavel && <span>👤 {item.responsavel}</span>}
                    {item.contaContabil && <span>📒 {item.contaContabil}</span>}
                    {item.valorAtual && <span>💰 R$ {item.valorAtual}</span>}
                    {item.estado && <span>🏷 {item.estado}</span>}
                  </div>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: cfg.cor, background: 'rgba(255,255,255,0.6)', border: `1px solid ${cfg.borda}`, borderRadius: 99, padding: '2px 8px', whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deslocados */}
      {deslocados.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ ...sectionLabel, color: '#d97706' }}>DESLOCADOS ({deslocados.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {deslocados.map(e => (
              <div key={e.codigo} style={{ display: 'flex', gap: 8, background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '8px 12px' }}>
                <span style={{ color: '#d97706', fontWeight: 700 }}>⚠</span>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{e.codigo} — {e.item?.descricao}</div>
                  <div style={{ fontSize: '0.7rem', color: '#92400e' }}>Divisão correta: {e.item ? parseDivisao(e.item.divisao) : '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Não cadastrados */}
      {desconhecidos.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ ...sectionLabel, color: '#dc2626' }}>NÃO CADASTRADOS ({desconhecidos.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {desconhecidos.map(e => (
              <div key={e.codigo} style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 12px', fontSize: '0.82rem', fontWeight: 700, color: '#991b1b' }}>
                ✗ Chapa {e.codigo} — não encontrada na base
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button onClick={() => setStep('escaneando')} style={{ ...btnSecondary, flex: 1 }}>← Retomar Scan</button>
        <button
          onClick={() => { setStep('configuracao'); setDivisaoSel(''); setResponsavel(''); setEbSel(''); setEscaneados({}); setBusca(''); }}
          style={{ ...btnPrimary, flex: 1 }}
        >
          Novo Inventário
        </button>
      </div>
    </div>
  );
}

// ─── Estilos base ────────────────────────────────────────────────────────────
const inputStyle  = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' };
const labelStyle  = { display: 'block', marginBottom: 6, fontSize: '0.82rem', fontWeight: 600, color: '#374151' };
const sectionLabel = { margin: '0 0 6px', fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' };
const btnPrimary  = { background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' };
const btnSecondary = { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 20px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' };
