import React, { useState, useEffect, useRef } from 'react';
import { createWorker, PSM } from 'tesseract.js';
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

// O OCR (SPARSE_TEXT) as vezes quebra o numero da chapa em pedacos na mesma
// linha por causa do espacamento entre os digitos (ex: "211 029" em vez de
// "211029"), e quase sempre pega ruido do codigo de barras como "digitos"
// isolados em outras linhas (ex: "8", "15"). Por isso: junta tokens
// numericos ADJACENTES na mesma linha (provavelmente o mesmo numero
// quebrado em dois pelo OCR), descarta fragmentos curtos demais pra ser
// uma chapa valida (as reais tem 5-6 digitos), e fica com o candidato mais
// longo.
function extrairChapa(texto) {
  const candidatos = [];
  for (const linha of texto.split(/\n+/)) {
    const tokens = linha.trim().split(/\s+/).filter(Boolean);
    let atual = '';
    for (const tok of tokens) {
      if (/^\d+$/.test(tok)) {
        atual += tok;
      } else if (atual) {
        candidatos.push(atual);
        atual = '';
      }
    }
    if (atual) candidatos.push(atual);
  }
  const validos = candidatos
    .filter(c => c.length >= 4 && c.length <= 8)
    .sort((a, b) => b.length - a.length);
  return validos[0] || null;
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
  const [busca, setBusca]             = useState('');

  const videoRef     = useRef(null);
  const lastCodeRef  = useRef('');
  const processarRef = useRef(null);

  const itensEsperados = TODOS_ITENS.filter(i => i.divisao === divisaoSel);

  // ─── Validação ──────────────────────────────────────────────────────────
  // A trava de "nao repetir o mesmo codigo em 2s" existe para a camera (que
  // tenta decodificar a cada ~500ms e leria o mesmo codigo varias vezes por
  // frame). Ela so deve valer para leituras vindas da camera — validacao
  // manual e uma acao explicita do usuario (clique/Enter) e deve sempre
  // processar, mesmo que o codigo seja igual ao ultimo lido.
  function processarScan(codigo, origem = 'manual') {
    const cod = codigo.trim();
    if (!cod) return;
    if (origem === 'camera') {
      if (cod === lastCodeRef.current) return;
      lastCodeRef.current = cod;
      setTimeout(() => { lastCodeRef.current = ''; }, 2000);
    }

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

  processarRef.current = (codigo) => processarScan(codigo, 'camera');

  function validarManual() {
    const cod = manualInput.trim();
    if (!cod) {
      setManualAviso('Digite o número da chapa antes de validar.');
      return;
    }
    setManualAviso('');
    processarScan(cod, 'manual');
    setManualInput('');
  }

  // ─── Scanner lifecycle ───────────────────────────────────────────────────
  // O valor gravado nas barras do codigo de barras nem sempre e o mesmo
  // numero impresso na etiqueta — foi o que causava leituras "erradas".
  // Por isso a camera agora faz OCR (reconhecimento de texto) apenas dos
  // DIGITOS IMPRESSOS dentro da mira, em vez de tentar decodificar as
  // barras. Mais lento por captura, mas o numero reconhecido e sempre o
  // mesmo que esta escrito na etiqueta. Continua analisando so o recorte da
  // mira (getCropRegion), pelo mesmo motivo de antes: nao pegar por engano
  // o numero de uma etiqueta vizinha que esteja no campo de visao da camera.
  useEffect(() => {
    if (step !== 'escaneando') return;
    let stopped = false;
    let stream = null;
    let loopTimer = null;
    let worker = null;
    setCameraError('');
    setCameraAtiva(false);
    setOcrBusy(false);

    const scanCanvas = document.createElement('canvas');
    const scanCtx = scanCanvas.getContext('2d');

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

        // Worker do tesseract.js apontando para arquivos locais (copiados em
        // frontend/public/) em vez do CDN padrao — o app roda como APK e nao
        // podemos depender de internet no momento do inventario.
        worker = await createWorker('eng', 1, {
          workerPath: '/tesseract-worker.min.js',
          // Arquivo especifico (nao um diretorio) — evita a autodeteccao de
          // SIMD/relaxedSIMD do tesseract.js, que tenta variantes diferentes
          // do wasm dependendo do aparelho e falha se alguma nao estiver
          // presente. simd-lstm cobre qualquer Android moderno.
          corePath: '/tesseract-core/tesseract-core-simd-lstm.wasm.js',
          langPath: '/tessdata',
          // O WebView do Capacitor devolve 404 pra arquivos .gz (nao
          // reconhece a extensao como servivel) — descoberto testando no
          // aparelho real via CDP, o OCR nunca rodava porque o download do
          // eng.traineddata.gz falhava em silencio. Usamos o arquivo
          // descompactado (eng.traineddata) e avisamos o tesseract.js que
          // nao precisa tentar descomprimir.
          gzip: false,
          cacheMethod: 'readOnly',
        });
        if (stopped) { await worker.terminate(); return; }
        await worker.setParameters({
          tessedit_char_whitelist: '0123456789',
          // SPARSE_TEXT (busca blocos de texto soltos na imagem) funciona
          // muito melhor aqui do que SINGLE_LINE — testado com etiqueta
          // real: SINGLE_LINE errava ou vinha vazio, SPARSE_TEXT acertou o
          // numero certo com 95%+ de confianca.
          tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        });

        async function loop() {
          if (stopped) return;
          const region = getCropRegion(video, video.parentElement);
          if (!region || region.srcW <= 0 || region.srcH <= 0) {
            loopTimer = setTimeout(loop, 300);
            return;
          }

          scanCanvas.width = region.srcW;
          scanCanvas.height = region.srcH;
          // Preto e branco + mais contraste ajuda bastante o OCR a separar
          // os digitos impressos do fundo da etiqueta.
          scanCtx.filter = 'grayscale(1) contrast(1.6)';
          scanCtx.drawImage(
            video,
            region.srcX, region.srcY, region.srcW, region.srcH,
            0, 0, region.srcW, region.srcH
          );

          setOcrBusy(true);
          try {
            const { data } = await worker.recognize(scanCanvas);
            const digitos = extrairChapa(data.text);
            if (digitos && !stopped) processarRef.current(digitos);
          } catch {
            // frame ilegivel — tenta de novo no proximo ciclo
          }
          if (!stopped) {
            setOcrBusy(false);
            // Sem espera artificial extra — o proprio tempo do
            // reconhecimento ja da uma pausa natural entre tentativas, e
            // cada tentativa a mais aumenta a chance de pegar um enquadramento
            // em que o SPARSE_TEXT consiga separar bem o numero do resto.
            loopTimer = setTimeout(loop, 60);
          }
        }

        loop();
      } catch {
        if (!stopped) setCameraError('Câmera não disponível. Use o campo manual abaixo.');
      }
    }

    startScanner();
    return () => {
      stopped = true;
      if (loopTimer) clearTimeout(loopTimer);
      stream?.getTracks().forEach(t => t.stop());
      worker?.terminate();
      setCameraAtiva(false);
      setOcrBusy(false);
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
            <p style={{ margin: '0 0 12px', fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
              Centralize a etiqueta dentro da caixa. O código de barras é ignorado — só o número é lido.
            </p>
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
            <div style={{ color: '#dc2626', fontSize: '0.78rem', fontWeight: 600, marginBottom: 14 }}>
              ⚠ {manualAviso}
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
