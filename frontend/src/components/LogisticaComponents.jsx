// ═══════════════════════════════════════════════════════════════════
// LogisticaComponents.jsx — Sub-componentes compartilhados de Logística
// 17º Grupamento de Bombeiros
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react';

export const REFRESH_INTERVAL = 5 * 60 * 1000;

// ─── CORES ───────────────────────────────────────────────────────────────────
export const C = {
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

// ─── KPI CARD ────────────────────────────────────────────────────────────────
export function KPICard({ icon, label, value, sub, variant = 'default' }) {
  const borders = { default: C.border, danger: C.red2, warning: C.yellow, success: C.green, info: '#1565C0' };
  const bgs     = { default: C.card,   danger: '#fff5f5', warning: '#fffbeb', success: '#f0fdf4', info: '#eff6ff' };
  return (
    <div style={{
      background: bgs[variant] || C.card,
      borderRadius: 10,
      padding: '22px 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      borderLeft: `4px solid ${borders[variant] || C.border}`,
    }}>
      <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: C.dark, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.8rem', color: C.mid, marginTop: 4 }}>{sub}</div>}
      <div style={{ fontSize: '0.85rem', color: C.mid, marginTop: 8, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ─── STATUS BADGE ────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
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

// ─── PROGRESS BAR ────────────────────────────────────────────────────────────
export function ProgressBar({ pct }) {
  const cor = pct >= 90 ? C.green : pct >= 70 ? C.yellow : C.red2;
  return (
    <div style={{ background: '#e5e7eb', borderRadius: 4, height: 6 }}>
      <div style={{ width: `${pct}%`, background: cor, height: 6, borderRadius: 4, transition: '0.5s' }} />
    </div>
  );
}

// ─── ABA HEADER ──────────────────────────────────────────────────────────────
export function AbaHeader({ aba }) {
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
export function TabelaAba({ aba }) {
  const [busca,        setBusca]        = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [buscaAtiva,   setBuscaAtiva]   = useState(false);
  const [termoPesq,    setTermoPesq]    = useState('');
  const [statusPesq,   setStatusPesq]   = useState('');

  const fim2026 = new Date('2026-12-31');

  function executarPesquisa() {
    setTermoPesq(busca);
    setStatusPesq(filtroStatus);
    setBuscaAtiva(true);
  }

  function limparPesquisa() {
    setBusca(''); setFiltroStatus('');
    setTermoPesq(''); setStatusPesq('');
    setBuscaAtiva(false);
  }

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
    const okBusca  = !termoPesq || txt.includes(termoPesq.toLowerCase());
    const statusField = colunas.find(c => c.toUpperCase().includes('STATUS'));
    const okStatus = !statusPesq || !statusField || (r[statusField] || '').toUpperCase() === statusPesq;
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
          onKeyDown={e => e.key === 'Enter' && executarPesquisa()}
          style={{ padding: '6px 10px', border: '1px solid #CFD8DC', borderRadius: 6, fontSize: '0.8rem', color: C.dark, minWidth: 200 }}
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
              <option value="">Todos</option>
              <option value="OPERANDO">✅ Operando</option>
              <option value="BAIXADO">❌ Baixado</option>
            </select>
          </>
        )}
        <button onClick={executarPesquisa} style={{ padding: '6px 16px', background: C.red2, color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
          🔍 Pesquisar
        </button>
        {buscaAtiva && (
          <button onClick={limparPesquisa} style={{ padding: '6px 12px', background: '#f3f4f6', color: C.mid, border: '1px solid #ddd', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer' }}>
            ✕ Limpar
          </button>
        )}
        {buscaAtiva && <span style={{ fontSize: '0.74rem', color: C.mid }}>{filtrados.length} itens</span>}
      </div>

      {/* Tabela — só exibida após pesquisar */}
      {!buscaAtiva ? (
        <div style={{ background: '#fff', border: '1px solid #ddd', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '40px 24px', textAlign: 'center', color: C.mid }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
          <div style={{ fontWeight: 600 }}>Use o campo de busca e clique em Pesquisar</div>
          <div style={{ fontSize: '0.82rem', marginTop: 4 }}>Você também pode filtrar por Status ou pressionar Enter</div>
        </div>
      ) : (
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
                  if (col.toUpperCase().includes('STATUS') || up === 'OPERANDO' || up === 'BAIXADO') {
                    if (up.includes('OPERANDO') || up.includes('BAIXADO') || up.includes('ATIVO') || up.includes('INATIVO')) {
                      return <td key={col} style={{ padding: '8px 12px' }}><StatusBadge status={val} /></td>;
                    }
                  }
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
      )}
    </div>
  );
}
