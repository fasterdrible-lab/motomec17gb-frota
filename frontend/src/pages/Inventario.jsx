import React, { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

// ─── Dados de amostra (substitua por chamada ao backend quando Issue 022 estiver pronta) ───
const TODOS_ITENS = [
  { numChapa: 'CH-0042', nome: 'Extintor CO2 5kg',         qtd: 4,  ambiente: 'Garagem',      categoria: 'ESTADO' },
  { numChapa: 'CH-0043', nome: 'Mangueira 40mm',            qtd: 12, ambiente: '2SGB',          categoria: 'ESTADO' },
  { numChapa: 'CH-0044', nome: 'Lanterna LED Tática',       qtd: 8,  ambiente: '1SGB',          categoria: 'ESTADO' },
  { numChapa: 'CH-0045', nome: 'Capacete de Combate',       qtd: 10, ambiente: '1SGB',          categoria: 'ESTADO' },
  { numChapa: 'CH-0046', nome: 'Luva Proteção Térmica',     qtd: 20, ambiente: '2SGB',          categoria: 'ESTADO' },
  { numChapa: 'CH-0047', nome: 'Macaco Hidráulico 10t',     qtd: 2,  ambiente: 'Garagem',      categoria: 'ESTADO' },
  { numChapa: 'CH-0048', nome: 'Extintor Pó Químico 6kg',  qtd: 8,  ambiente: 'Garagem',      categoria: 'ESTADO' },
  { numChapa: 'CH-0049', nome: 'Corda Semiestática 50m',   qtd: 4,  ambiente: '1SGB',          categoria: 'ESTADO' },
  { numChapa: 'CH-0050', nome: 'Kit Primeiros Socorros',   qtd: 6,  ambiente: '2SGB',          categoria: 'ESTADO' },
  { numChapa: 'CH-0051', nome: 'EPR Scott',                 qtd: 6,  ambiente: '1SGB',          categoria: 'ESTADO' },
  { numChapa: 'CH-0052', nome: 'Compressor de Ar Portátil', qtd: 1,  ambiente: 'Garagem',      categoria: 'ESTADO' },
  { numChapa: 'CH-0053', nome: 'Cabo de Reboque',           qtd: 3,  ambiente: 'Garagem',      categoria: 'ESTADO' },
  { numChapa: 'CH-0054', nome: 'Escada Extensível 6m',     qtd: 2,  ambiente: '1SGB',          categoria: 'ESTADO' },
  { numChapa: 'CH-0055', nome: 'Gerador Portátil 5kW',     qtd: 1,  ambiente: '2SGB',          categoria: 'ESTADO' },
  { numChapa: 'CH-0060', nome: 'Viatura UR-17208',          qtd: 1,  ambiente: 'Garagem 1SGB', categoria: 'ESTADO' },
];

const AMBIENTES = [...new Set(TODOS_ITENS.map(i => i.ambiente))].sort();

const STATUS_COR = {
  ok:           { label: 'Correto',      cor: '#16a34a', bg: '#dcfce7', borda: '#86efac', icon: '✓' },
  deslocado:    { label: 'Deslocado',    cor: '#d97706', bg: '#fef3c7', borda: '#fcd34d', icon: '⚠' },
  desconhecido: { label: 'Desconhecido', cor: '#dc2626', bg: '#fee2e2', borda: '#fca5a5', icon: '✗' },
};

// ─── Componente principal ────────────────────────────────────────────────────
export default function Inventario() {
  const [step, setStep]             = useState('configuracao');
  const [ambiente, setAmbiente]     = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [dataHora]                  = useState(() => new Date().toLocaleString('pt-BR'));
  const [escaneados, setEscaneados] = useState({});
  const [flashStatus, setFlashStatus] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [cameraAtiva, setCameraAtiva] = useState(false);

  const videoRef        = useRef(null);
  const controlsRef     = useRef(null);
  const lastCodeRef     = useRef('');
  const processarRef    = useRef(null);

  // Itens esperados no ambiente selecionado
  const itensEsperados = TODOS_ITENS.filter(i => i.ambiente === ambiente);

  // ─── Lógica de validação ─────────────────────────────────────────────────
  function processarScan(codigo) {
    const cod = codigo.trim().toUpperCase();
    if (!cod) return;
    if (cod === lastCodeRef.current) return; // debounce: mesmo código em 2s
    lastCodeRef.current = cod;
    setTimeout(() => { lastCodeRef.current = ''; }, 2000);

    const item = TODOS_ITENS.find(i => i.numChapa === cod);
    let status;
    if (!item)                    status = 'desconhecido';
    else if (item.ambiente === ambiente) status = 'ok';
    else                          status = 'deslocado';

    setEscaneados(prev => ({
      ...prev,
      [cod]: { item: item || null, status, ts: new Date().toLocaleTimeString('pt-BR'), codigo: cod },
    }));
    setFlashStatus(status);
    setTimeout(() => setFlashStatus(null), 1200);
  }

  // sempre aponta para a versão mais recente sem reiniciar o scanner
  processarRef.current = processarScan;

  // ─── Ciclo de vida do scanner ────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'escaneando') return;
    let stopped = false;
    setCameraError('');
    setCameraAtiva(false);

    async function startScanner() {
      try {
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result) => { if (result && !stopped) processarRef.current(result.getText()); }
        );
        if (!stopped) {
          controlsRef.current = controls;
          setCameraAtiva(true);
        } else {
          controls.stop();
        }
      } catch {
        if (!stopped) setCameraError('Câmera não disponível neste dispositivo. Use o campo manual abaixo.');
      }
    }

    startScanner();

    return () => {
      stopped = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
      setCameraAtiva(false);
    };
  }, [step]);

  // ─── STEP 1 — Configuração ───────────────────────────────────────────────
  if (step === 'configuracao') {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e3a5f' }}>
            📋 Novo Inventário
          </h2>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.85rem' }}>{dataHora}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Ambiente a inventariar</label>
            <select value={ambiente} onChange={e => setAmbiente(e.target.value)} style={inputStyle}>
              <option value="">Selecione o ambiente…</option>
              {AMBIENTES.map(a => (
                <option key={a} value={a}>{a} ({TODOS_ITENS.filter(i => i.ambiente === a).length} itens)</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Responsável</label>
            <input
              type="text"
              value={responsavel}
              onChange={e => setResponsavel(e.target.value)}
              placeholder="Nome completo"
              style={inputStyle}
            />
          </div>

          {ambiente && (
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: 14 }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#0369a1', fontWeight: 600 }}>
                {itensEsperados.length} item(s) cadastrados em &ldquo;{ambiente}&rdquo;
              </p>
              <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {itensEsperados.slice(0, 6).map(i => (
                  <span key={i.numChapa} style={{ background: '#e0f2fe', color: '#0369a1', borderRadius: 4, padding: '2px 8px', fontSize: '0.75rem' }}>
                    {i.numChapa}
                  </span>
                ))}
                {itensEsperados.length > 6 && (
                  <span style={{ color: '#6b7280', fontSize: '0.75rem', alignSelf: 'center' }}>
                    +{itensEsperados.length - 6} mais
                  </span>
                )}
              </div>
            </div>
          )}

          <button
            disabled={!ambiente || !responsavel.trim()}
            onClick={() => { setEscaneados({}); setStep('escaneando'); }}
            style={{
              ...btnPrimary,
              opacity: (!ambiente || !responsavel.trim()) ? 0.45 : 1,
              cursor: (!ambiente || !responsavel.trim()) ? 'not-allowed' : 'pointer',
              marginTop: 8,
              padding: '14px 0',
              fontSize: '1rem',
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
    const totalEsperado  = itensEsperados.length;
    const qtdOk          = Object.values(escaneados).filter(e => e.status === 'ok').length;
    const progressPct    = totalEsperado > 0 ? Math.round((qtdOk / totalEsperado) * 100) : 0;
    const listaEscaneada = Object.values(escaneados).sort((a, b) => b.ts.localeCompare(a.ts));

    return (
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        {/* Header barra */}
        <div style={{ background: '#1e3a5f', color: 'white', padding: '12px 20px', borderRadius: '0 0 12px 12px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>📍 {ambiente}</span>
            <span style={{ fontSize: '0.85rem', opacity: 0.85 }}>{qtdOk}/{totalEsperado} verificados</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
            <div style={{ width: `${progressPct}%`, height: '100%', background: '#4ade80', transition: 'width 0.3s' }} />
          </div>
        </div>

        <div style={{ padding: '0 16px 16px' }}>
          {/* Flash de feedback */}
          {flashStatus && (
            <div style={{
              background: STATUS_COR[flashStatus].bg,
              border: `2px solid ${STATUS_COR[flashStatus].borda}`,
              color: STATUS_COR[flashStatus].cor,
              borderRadius: 10,
              padding: '10px 16px',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '1.05rem',
              marginBottom: 12,
              animation: 'fadeIn 0.15s ease',
            }}>
              {STATUS_COR[flashStatus].icon} {STATUS_COR[flashStatus].label}
            </div>
          )}

          {/* Viewfinder da câmera */}
          <div style={{ position: 'relative', background: '#000', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
            <video
              ref={videoRef}
              style={{ width: '100%', display: 'block', maxHeight: 260, objectFit: 'cover' }}
              muted
              playsInline
            />
            {/* Mira central */}
            {cameraAtiva && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
              }}>
                <div style={{ width: 180, height: 100, border: '2px solid rgba(255,255,255,0.7)', borderRadius: 8, boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)' }} />
              </div>
            )}
            {!cameraAtiva && !cameraError && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                <span>Iniciando câmera…</span>
              </div>
            )}
          </div>

          {/* Erro de câmera */}
          {cameraError && (
            <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: 10, marginBottom: 10, color: '#92400e', fontSize: '0.83rem' }}>
              ⚠ {cameraError}
            </div>
          )}

          {/* Input manual */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              type="text"
              value={manualInput}
              onChange={e => setManualInput(e.target.value.toUpperCase())}
              onKeyDown={e => {
                if (e.key === 'Enter' && manualInput.trim()) {
                  processarScan(manualInput);
                  setManualInput('');
                }
              }}
              placeholder="Digitar código manual (ex: CH-0042)"
              style={{ ...inputStyle, flex: 1, margin: 0 }}
            />
            <button
              onClick={() => { if (manualInput.trim()) { processarScan(manualInput); setManualInput(''); } }}
              style={{ ...btnPrimary, padding: '10px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
            >
              Validar
            </button>
          </div>

          {/* Lista de itens escaneados */}
          {listaEscaneada.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: '0 0 8px', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
                ESCANEADOS ({listaEscaneada.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                {listaEscaneada.map(e => {
                  const cfg = STATUS_COR[e.status];
                  return (
                    <div key={e.codigo} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: cfg.bg, border: `1px solid ${cfg.borda}`,
                      borderRadius: 8, padding: '8px 12px',
                    }}>
                      <span style={{ fontSize: '1rem', color: cfg.cor, fontWeight: 700, minWidth: 18 }}>{cfg.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1f2937' }}>
                          {e.codigo} — {e.item?.nome ?? 'Item não cadastrado'}
                        </div>
                        {e.status === 'deslocado' && e.item && (
                          <div style={{ fontSize: '0.72rem', color: cfg.cor }}>
                            Ambiente correto: {e.item.ambiente}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>{e.ts}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Itens ainda não escaneados */}
          {itensEsperados.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: '0 0 8px', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
                AGUARDANDO ({itensEsperados.filter(i => !escaneados[i.numChapa]).length})
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {itensEsperados.filter(i => !escaneados[i.numChapa]).map(i => (
                  <span key={i.numChapa} style={{
                    background: '#f3f4f6', border: '1px solid #d1d5db',
                    borderRadius: 6, padding: '3px 10px', fontSize: '0.75rem', color: '#6b7280',
                  }}>
                    {i.numChapa}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep('configuracao')} style={{ ...btnSecondary, flex: 1 }}>
              ← Voltar
            </button>
            <button
              onClick={() => setStep('relatorio')}
              style={{ ...btnPrimary, flex: 2 }}
            >
              Finalizar Inventário →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP 3 — Relatório ─────────────────────────────────────────────────
  const todosEscaneados  = Object.values(escaneados);
  const encontrados      = todosEscaneados.filter(e => e.status === 'ok');
  const deslocados       = todosEscaneados.filter(e => e.status === 'deslocado');
  const desconhecidos    = todosEscaneados.filter(e => e.status === 'desconhecido');
  const ausentes         = itensEsperados.filter(i => !escaneados[i.numChapa] || escaneados[i.numChapa].status !== 'ok');
  const pct              = itensEsperados.length > 0 ? Math.round((encontrados.length / itensEsperados.length) * 100) : 0;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px 32px' }}>
      {/* Cabeçalho do relatório */}
      <div style={{ background: '#1e3a5f', color: 'white', borderRadius: '0 0 16px 16px', padding: '20px 24px', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>📋 Relatório de Inventário</h2>
        <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '0.82rem' }}>
          {ambiente} · {responsavel} · {dataHora}
        </p>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.2)', borderRadius: 99, height: 8 }}>
            <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#4ade80' : '#facc15', borderRadius: 99 }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{pct}%</span>
        </div>
      </div>

      {/* Cards de resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Esperados',     valor: itensEsperados.length, cor: '#1e3a5f', bg: '#eff6ff' },
          { label: 'Encontrados',   valor: encontrados.length,    cor: '#16a34a', bg: '#dcfce7' },
          { label: 'Ausentes',      valor: ausentes.length,       cor: '#dc2626', bg: '#fee2e2' },
          { label: 'Deslocados',    valor: deslocados.length,     cor: '#d97706', bg: '#fef3c7' },
          { label: 'Desconhecidos', valor: desconhecidos.length,  cor: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Cobertura',     valor: `${pct}%`,             cor: pct === 100 ? '#16a34a' : '#d97706', bg: '#f9fafb' },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: c.cor }}>{c.valor}</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Tabela de itens esperados */}
      <Section title="Itens do Ambiente" cor="#1e3a5f">
        {itensEsperados.map(item => {
          const scan = escaneados[item.numChapa];
          const status = scan?.status ?? 'ausente';
          const cfg = STATUS_COR[status] ?? { label: 'Ausente', cor: '#dc2626', bg: '#fee2e2', borda: '#fca5a5', icon: '○' };
          return (
            <ItemRow key={item.numChapa} icon={cfg.icon} cor={cfg.cor} bg={cfg.bg} borda={cfg.borda}>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{item.numChapa}</span>
                <span style={{ color: '#374151', fontSize: '0.82rem' }}> — {item.nome}</span>
              </div>
              <StatusBadge cfg={cfg} label={scan ? cfg.label : 'Ausente'} />
            </ItemRow>
          );
        })}
      </Section>

      {/* Itens deslocados */}
      {deslocados.length > 0 && (
        <Section title={`Deslocados (${deslocados.length})`} cor="#d97706">
          {deslocados.map(e => (
            <ItemRow key={e.codigo} icon="⚠" cor="#d97706" bg="#fef3c7" borda="#fcd34d">
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{e.codigo}</span>
                <span style={{ color: '#374151', fontSize: '0.82rem' }}> — {e.item?.nome}</span>
                <div style={{ fontSize: '0.72rem', color: '#92400e' }}>Pertence a: {e.item?.ambiente}</div>
              </div>
            </ItemRow>
          ))}
        </Section>
      )}

      {/* Itens desconhecidos */}
      {desconhecidos.length > 0 && (
        <Section title={`Desconhecidos (${desconhecidos.length})`} cor="#dc2626">
          {desconhecidos.map(e => (
            <ItemRow key={e.codigo} icon="✗" cor="#dc2626" bg="#fee2e2" borda="#fca5a5">
              <div style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600 }}>{e.codigo} — não cadastrado</div>
            </ItemRow>
          ))}
        </Section>
      )}

      {/* Ações */}
      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button
          onClick={() => setStep('escaneando')}
          style={{ ...btnSecondary, flex: 1 }}
        >
          ← Retomar Scan
        </button>
        <button
          onClick={() => { setStep('configuracao'); setAmbiente(''); setResponsavel(''); setEscaneados({}); }}
          style={{ ...btnPrimary, flex: 1 }}
        >
          Novo Inventário
        </button>
      </div>
    </div>
  );
}

// ─── Componentes auxiliares ──────────────────────────────────────────────────
function Section({ title, cor, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ margin: '0 0 8px', fontSize: '0.78rem', fontWeight: 700, color: cor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  );
}

function ItemRow({ icon, cor, bg, borda, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: bg, border: `1px solid ${borda}`, borderRadius: 8, padding: '8px 12px' }}>
      <span style={{ color: cor, fontWeight: 700, fontSize: '0.9rem', minWidth: 18, textAlign: 'center' }}>{icon}</span>
      {children}
    </div>
  );
}

function StatusBadge({ cfg, label }) {
  return (
    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: cfg.cor, background: 'rgba(255,255,255,0.6)', border: `1px solid ${cfg.borda}`, borderRadius: 99, padding: '2px 8px', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

// ─── Estilos base ────────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid #d1d5db', fontSize: '0.9rem',
  boxSizing: 'border-box', outline: 'none',
};

const labelStyle = {
  display: 'block', marginBottom: 6,
  fontSize: '0.82rem', fontWeight: 600, color: '#374151',
};

const btnPrimary = {
  background: '#1d4ed8', color: 'white', border: 'none',
  borderRadius: 8, padding: '10px 20px', fontSize: '0.9rem',
  fontWeight: 600, cursor: 'pointer',
};

const btnSecondary = {
  background: '#f3f4f6', color: '#374151',
  border: '1px solid #d1d5db', borderRadius: 8,
  padding: '10px 20px', fontSize: '0.9rem',
  fontWeight: 600, cursor: 'pointer',
};
