import React, { useState, useEffect, useCallback } from 'react';
import { getMateriaisOperacionais } from '../services/logisticaSheets';

const REFRESH_INTERVAL = 5 * 60 * 1000;

// ─── CORES ───────────────────────────────────────────────────────────────────
const C = {
  red:    '#B71C1C',
  red2:   '#D32F2F',
  orange: '#E64A19',
  green:  '#16a34a',
  yellow: '#d97706',
  dark:   '#1a1a2e',
  mid:    '#6b7280',
  bg:     '#f0f2f5',
  card:   '#ffffff',
  border: '#e5e7eb',
};

// ─── SUB-COMPONENTES ─────────────────────────────────────────────────────────
function KPICard({ icon, label, value, sub, variant = 'default' }) {
  const borders = { default: C.border, danger: C.red2, warning: C.yellow, success: C.green, info: '#1565C0' };
  const bgs     = { default: C.card,   danger: '#fff5f5', warning: '#fffbeb', success: '#f0fdf4', info: '#eff6ff' };
  return (
    <div style={{
      background: bgs[variant] || C.card,
      borderRadius: 10,
      padding: '18px 20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      borderLeft: `4px solid ${borders[variant] || C.border}`,
    }}>
      <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: C.dark, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: C.mid, marginTop: 3 }}>{sub}</div>}
      <div style={{ fontSize: '0.8rem', color: C.mid, marginTop: 6, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const v = String(status).toUpperCase();
  const isOp = v.includes('OPERANDO') || v.includes('ATIVO') || v.includes('OK');
  return (
    <span style={{
      background: isOp ? '#dcfce7' : '#fee2e2',
      color:      isOp ? '#15803d' : '#dc2626',
      padding: '3px 10px', borderRadius: 12,
      fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      {isOp ? '✅' : '❌'} {status}
    </span>
  );
}

function ProgressBar({ pct }) {
  const cor = pct >= 90 ? C.green : pct >= 70 ? C.yellow : C.red2;
  return (
    <div style={{ background: '#e5e7eb', borderRadius: 4, height: 6 }}>
      <div style={{ width: `${pct}%`, background: cor, height: 6, borderRadius: 4, transition: '0.5s' }} />
    </div>
  );
}

function AbaHeader({ aba }) {
  const pct = aba.total ? Math.round(aba.op / aba.total * 100) : 100;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        background: `linear-gradient(90deg, ${C.red2}, ${C.orange})`,
        color: '#fff', padding: '12px 18px', borderRadius: '8px 8px 0 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{aba.icone || '📋'} {aba.aba}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { txt: `Total: ${aba.total}`, bg: 'rgba(255,255,255,0.2)', cl: '#fff' },
            { txt: `✅ ${aba.op}`,        bg: '#dcfce7', cl: '#15803d' },
            { txt: `❌ ${aba.bx}`,        bg: '#fee2e2', cl: '#dc2626' },
            { txt: `${pct}% disp.`,       bg: 'rgba(255,255,255,0.2)', cl: '#fff' },
          ].map((b, i) => (
            <span key={i} style={{
              background: b.bg, color: b.cl, padding: '3px 10px',
              borderRadius: 12, fontSize: '0.72rem', fontWeight: 700,
            }}>{b.txt}</span>
          ))}
        </div>
      </div>
      <div style={{ background: '#e5e7eb', borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd' }}>
        <ProgressBar pct={pct} />
      </div>
    </div>
  );
}

// ─── TABELA GENÉRICA (funciona para qualquer aba) ─────────────────────────────
function TabelaAba({ aba }) {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  const fim2026 = new Date('2026-12-31');

  // Decide quais colunas mostrar
  const COLUNAS_FIXAS = {
    'EPR':               ['PATRIMÔNIO', 'TIPO', 'MARCA', 'MODELO', 'STATUS', 'SGB', 'LOCALIZAÇÃO'],
    'COMPRESSOR':        ['PATRIMÔNIO', 'TIPO', 'MARCA', 'MODELO', 'STATUS', 'SGB', 'LOCALIZAÇÃO'],
    'EMBARCAÇÕES':       ['PATRIMÔNIO', 'TIPO', 'MARCA', 'MODELO', 'STATUS', 'SGB', 'LOCALIZAÇÃO'],
    'CILÍNDROS':         ['Nº SÉRIE', 'TIPO', 'STATUS', 'LOCALIZAÇÃO', 'VENCIMENTO TH'],
    'MS/MA/MP/SS':       ['PATRIMÔNIO', 'TIPO', 'MARCA', 'MODELO', 'STATUS', 'SGB', 'LOCALIZAÇÃO'],
    'DESENCARCERADORES': ['PATRIMÔNIO', 'TIPO', 'MARCA', 'MODELO', 'STATUS', 'SGB', 'LOCALIZAÇÃO'],
    'EQUIP. DIVERSOS':   ['PATRIMÔNIO', 'TIPO', 'MARCA', 'MODELO', 'STATUS', 'SGB', 'LOCALIZAÇÃO'],
  };

  const colunas = COLUNAS_FIXAS[aba.aba]
    || (aba.headers && aba.headers.length ? aba.headers.slice(0, 9) : ['PATRIMÔNIO', 'TIPO', 'STATUS', 'LOCALIZAÇÃO']);

  const isVencCol = col => col.toUpperCase().includes('VENCIMENTO') || col.toUpperCase().includes('TH');
  const uid = `sel-${aba.aba}`.replace(/[^a-z0-9]/gi, '');

  const temStatus = colunas.includes('STATUS') || colunas.some(c => c.toUpperCase().includes('STATUS'));

  const filtrados = aba.rows.filter(r => {
    const txt = Object.values(r).join(' ').toLowerCase();
    const okBusca  = !busca || txt.includes(busca.toLowerCase());
    const statusField = colunas.find(c => c.toUpperCase().includes('STATUS'));
    const okStatus = !filtroStatus || !statusField || (r[statusField] || '').toUpperCase() === filtroStatus;
    return okBusca && okStatus;
  });

  if (aba.erro) return (
    <div style={{ textAlign: 'center', padding: 40, color: C.mid }}>
      ⚠️ Erro ao carregar: {aba.erro}
    </div>
  );

  if (!aba.rows.length) return (
    <div style={{ textAlign: 'center', padding: 40, color: C.mid }}>
      Nenhum dado encontrado nesta aba.
    </div>
  );

  return (
    <div>
      {/* Filtros */}
      <div style={{
        background: '#fff', padding: '10px 16px', display: 'flex', gap: 10,
        flexWrap: 'wrap', border: '1px solid #ddd', borderTop: 'none', alignItems: 'center',
      }}>
        <span style={{ fontSize: '0.74rem', color: C.mid, fontWeight: 600 }}>Buscar:</span>
        <input
          type="text"
          placeholder="Patrimônio, marca, localização..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{
            padding: '6px 10px', border: '1px solid #CFD8DC',
            borderRadius: 6, fontSize: '0.8rem', color: C.dark, minWidth: 200,
          }}
        />
        {temStatus && (
          <>
            <span style={{ fontSize: '0.74rem', color: C.mid, fontWeight: 600 }}>Status:</span>
            <select
              id={uid}
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid #CFD8DC', borderRadius: 6, fontSize: '0.8rem' }}
            >
              <option value="">Todos ({aba.rows.length})</option>
              <option value="OPERANDO">✅ Operando</option>
              <option value="BAIXADO">❌ Baixado</option>
            </select>
          </>
        )}
        <span style={{ fontSize: '0.74rem', color: C.mid }}>{filtrados.length} itens</span>
      </div>

      {/* Tabela */}
      <div style={{ overflowX: 'auto', border: '1px solid #ddd', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead style={{ background: '#263238', color: '#fff' }}>
            <tr>
              {colunas.map(col => (
                <th key={col} style={{
                  padding: '9px 12px', textAlign: 'left', fontSize: '0.72rem',
                  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap',
                }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={colunas.length} style={{ textAlign: 'center', padding: 40, color: C.mid }}>
                Nenhum item encontrado.
              </td></tr>
            ) : filtrados.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #ECEFF1' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                {colunas.map(col => {
                  const val = r[col] || '—';
                  const up = val.toUpperCase();
                  // Coluna de status
                  if (col.toUpperCase().includes('STATUS') || up === 'OPERANDO' || up === 'BAIXADO') {
                    if (up.includes('OPERANDO') || up.includes('BAIXADO') || up.includes('ATIVO') || up.includes('INATIVO')) {
                      return <td key={col} style={{ padding: '8px 12px' }}><StatusBadge status={val} /></td>;
                    }
                  }
                  // Coluna de vencimento
                  if (isVencCol(col)) {
                    const d = new Date(val);
                    const vencendo = !isNaN(d) && d <= fim2026;
                    return (
                      <td key={col} style={{ padding: '8px 12px', color: vencendo ? C.orange : 'inherit', fontWeight: vencendo ? 700 : 'normal' }}>
                        {val !== '—' ? val.substring(0, 10) : '—'}
                        {vencendo && ' ⚠️'}
                      </td>
                    );
                  }
                  return <td key={col} style={{ padding: '8px 12px' }}>{val}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
function Logistica() {
  const [matOp, setMatOp]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [syncing, setSyncing]       = useState(false);
  const [error, setError]           = useState('');
  const [ultimaSync, setUltimaSync] = useState(null);
  const [abaAtiva, setAbaAtiva]     = useState(null);

  const loadData = useCallback(async (manual = false) => {
    if (manual) setSyncing(true);
    else setLoading(true);
    setError('');
    try {
      const matResult = await getMateriaisOperacionais();
      setMatOp(matResult);
      if (!abaAtiva && matResult.abas.length) setAbaAtiva(matResult.abas[0].aba);
      setUltimaSync(new Date());
    } catch (e) {
      setError('Erro ao carregar dados: ' + e.message);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    loadData();
    const t = setInterval(() => loadData(), REFRESH_INTERVAL);
    return () => clearInterval(t);
  }, [loadData]);

  // ── LOADING / ERRO ──────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 16 }}>
      <div style={{
        width: 40, height: 40, border: `4px solid #e5e7eb`,
        borderTopColor: C.red2, borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      }} />
      <div style={{ color: C.mid }}>Carregando dados das planilhas de logística...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error && !matOp) return (
    <div style={{ padding: 40, textAlign: 'center', color: C.red2 }}>
      <div style={{ fontSize: '2rem', marginBottom: 12 }}>❌</div>
      <div style={{ fontWeight: 700 }}>{error}</div>
      <button onClick={() => loadData(true)} style={{ marginTop: 16, padding: '8px 20px', background: C.red2, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
        Tentar novamente
      </button>
    </div>
  );

  const totais = matOp?.totais || { total: 0, op: 0, bx: 0 };
  const thVencendo = matOp?.thVencendo || 0;
  const pctGeral = totais.total ? Math.round(totais.op / totais.total * 100) : 0;
  const abaObj = matOp?.abas?.find(a => a.aba === abaAtiva);

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>

      {/* CABEÇALHO DA PÁGINA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: C.dark }}>
            🚒 Painel de Logística
          </h1>
          <p style={{ fontSize: '0.85rem', color: C.mid, marginTop: 2 }}>
            Seção de Materiais Operacionais · 17º Grupamento de Bombeiros
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {ultimaSync && (
            <span style={{ fontSize: '0.75rem', color: C.mid }}>
              Última sync: {ultimaSync.toLocaleTimeString('pt-BR')}
            </span>
          )}
          <button
            onClick={() => loadData(true)}
            disabled={syncing}
            style={{
              padding: '8px 16px', background: syncing ? '#e5e7eb' : C.red2,
              color: syncing ? C.mid : '#fff', border: 'none', borderRadius: 8,
              cursor: syncing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.82rem',
            }}
          >
            {syncing ? '⟳ Atualizando...' : '⟳ Atualizar'}
          </button>
        </div>
      </div>

      {/* KPIs GLOBAIS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        <KPICard icon="📦" label="Total de Equipamentos" value={totais.total} sub="Mat. Operacionais" />
        <KPICard icon="✅" label="Operando" value={totais.op} sub={`${pctGeral}% disponibilidade`} variant="success" />
        <KPICard icon="❌" label="Baixados" value={totais.bx} sub={`${100 - pctGeral}% indisponíveis`} variant={totais.bx > 20 ? 'danger' : 'warning'} />
        <KPICard icon="⚠️" label="TH Vencendo em 2026" value={thVencendo} sub="cilíndros" variant={thVencendo > 0 ? 'warning' : 'success'} />
        <KPICard icon="🚤" label="Embarcações" value={`${matOp?.abas?.find(a=>a.aba==='EMBARCAÇÕES')?.op || 0}/${matOp?.abas?.find(a=>a.aba==='EMBARCAÇÕES')?.total || 0}`} sub="operacionais" variant="success" />
        <KPICard icon="⚙️" label="Compressores" value={`${matOp?.abas?.find(a=>a.aba==='COMPRESSOR')?.op || 0}/${matOp?.abas?.find(a=>a.aba==='COMPRESSOR')?.total || 0}`} sub="operacionais" variant="info" />
      </div>

      {/* ALERTAS */}
      {(thVencendo > 0 || totais.bx > 0) && (
        <div style={{
          background: '#fffbeb', border: '1px solid #FFC107', borderRadius: 10,
          padding: '16px 20px', marginBottom: 24,
        }}>
          <div style={{ color: '#E65100', fontSize: '0.9rem', fontWeight: 700, marginBottom: 10 }}>⚠️ Alertas Prioritários</div>
          {[
            thVencendo > 0 && { txt: `🫁 ${thVencendo} cilíndros com Teste Hidrostático (TH) vencendo em 2026 — agendar revisão.`, crit: true },
            (matOp?.abas?.find(a=>a.aba==='COMPRESSOR')?.bx || 0) >= 3 && { txt: `⚙️ Compressores: apenas ${matOp?.abas?.find(a=>a.aba==='COMPRESSOR')?.op} de ${matOp?.abas?.find(a=>a.aba==='COMPRESSOR')?.total} operando — risco para reabastecimento.`, crit: true },
            (matOp?.abas?.find(a=>a.aba==='EPR')?.bx || 0) > 0 && { txt: `🛡️ EPR: ${matOp?.abas?.find(a=>a.aba==='EPR')?.bx} unidades baixadas — verificar manutenção.`, crit: false },
          ].filter(Boolean).map((a, i) => (
            <div key={i} style={{
              background: '#fff', borderLeft: `4px solid ${a.crit ? C.red2 : C.yellow}`,
              padding: '9px 14px', marginBottom: 7, borderRadius: '0 6px 6px 0', fontSize: '0.83rem',
            }}
              dangerouslySetInnerHTML={{ __html: a.txt }}
            />
          ))}
        </div>
      )}

      {/* ABAS DE CATEGORIA — todas dinâmicas */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {matOp?.abas?.map(a => (
          <button key={a.aba} onClick={() => setAbaAtiva(a.aba)} style={{
            padding: '7px 14px', borderRadius: 20,
            border: `2px solid ${abaAtiva === a.aba ? C.red2 : '#ddd'}`,
            background: abaAtiva === a.aba ? C.red2 : '#fff',
            color: abaAtiva === a.aba ? '#fff' : C.mid,
            fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', transition: '0.2s',
          }}>
            {a.icone} {a.aba}
            <span style={{
              marginLeft: 6, background: abaAtiva === a.aba ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
              color: abaAtiva === a.aba ? '#fff' : C.mid,
              borderRadius: 10, padding: '1px 7px', fontSize: '0.7rem',
            }}>{a.total}</span>
          </button>
        ))}
      </div>

      {/* CONTEÚDO DA ABA SELECIONADA */}
      {abaObj && (
        <div>
          <AbaHeader aba={abaObj} />
          <TabelaAba aba={abaObj} />
        </div>
      )}
    </div>
  );
}

export default Logistica;