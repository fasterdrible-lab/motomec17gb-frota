import React, { useState, useEffect, useCallback } from 'react';
import { getMateriaisOperacionais } from '../services/logisticaSheets';
import { C, REFRESH_INTERVAL, KPICard, AbaHeader, TabelaAba } from '../components/LogisticaComponents';

const ABAS_MAT_OP = ['EPR', 'COMPRESSOR', 'EMBARCAÇÕES', 'CILÍNDROS', 'MS/MA/MP/SS', 'DESENCARCERADORES', 'EQUIP. DIVERSOS'];

// ─── Helpers de agrupamento ───────────────────────────────────────────────────
function agrupar(rows, campo) {
  const map = {};
  rows.forEach(r => { const v = r[campo] || '—'; map[v] = (map[v] || 0) + 1; });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

// ─── Linha com mini-barra de progresso ───────────────────────────────────────
function MiniLinha({ label, count, total, color }) {
  const pct = total ? Math.round(count / total * 100) : 0;
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
        <span style={{ color: '#444', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '68%' }}>{label}</span>
        <span style={{ fontWeight: 700, color: '#222', flexShrink: 0 }}>
          {count} <span style={{ color: '#aaa', fontWeight: 400, fontSize: 11 }}>({pct}%)</span>
        </span>
      </div>
      <div style={{ background: '#f0f0f0', borderRadius: 3, height: 5 }}>
        <div style={{ width: `${pct}%`, background: color, height: 5, borderRadius: 3, transition: '0.4s' }} />
      </div>
    </div>
  );
}

// ─── Cards de resumo por dimensão ────────────────────────────────────────────
function ResumoCards({ aba }) {
  const rows  = aba.rows || [];
  const total = rows.length;

  const operando = rows.filter(r => (r['STATUS'] || '').toUpperCase().includes('OPERANDO')).length;
  const baixado  = rows.filter(r => (r['STATUS'] || '').toUpperCase().includes('BAIXADO')).length;
  const outros   = total - operando - baixado;

  const porSgb  = agrupar(rows, 'SGB');
  const porTipo = agrupar(rows, 'TIPO').slice(0, 6);
  const porMarca = agrupar(rows, 'MARCA').slice(0, 6);
  const porLoc  = agrupar(rows, 'LOCALIZAÇÃO').slice(0, 6);

  const card = {
    background: '#fff', borderRadius: 10, padding: '18px 20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb',
  };
  const titulo = (icone, txt) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
      <span>{icone}</span><span>{txt}</span>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 20 }}>

      {/* STATUS */}
      <div style={card}>
        {titulo('⚡', 'Status')}
        <MiniLinha label="✅ Operando" count={operando} total={total} color="#16a34a" />
        <MiniLinha label="❌ Baixado"  count={baixado}  total={total} color="#dc2626" />
        {outros > 0 && <MiniLinha label="❓ Outros" count={outros} total={total} color="#d97706" />}
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0f0f0', fontSize: 12, color: '#888' }}>
          Total: <strong style={{ color: '#222' }}>{total}</strong>
        </div>
      </div>

      {/* POR SGB */}
      <div style={card}>
        {titulo('🏠', 'Por SGB')}
        {porSgb.length ? porSgb.map(([k, v]) => <MiniLinha key={k} label={k} count={v} total={total} color="#1565C0" />) : <span style={{ color: '#bbb', fontSize: 12 }}>—</span>}
      </div>

      {/* POR TIPO */}
      <div style={card}>
        {titulo('🔧', 'Por Tipo')}
        {porTipo.length ? porTipo.map(([k, v]) => <MiniLinha key={k} label={k} count={v} total={total} color="#E64A19" />) : <span style={{ color: '#bbb', fontSize: 12 }}>—</span>}
      </div>

      {/* POR MARCA */}
      <div style={card}>
        {titulo('🏷️', 'Por Marca')}
        {porMarca.length ? porMarca.map(([k, v]) => <MiniLinha key={k} label={k} count={v} total={total} color="#7b1fa2" />) : <span style={{ color: '#bbb', fontSize: 12 }}>—</span>}
      </div>

      {/* POR LOCALIZAÇÃO */}
      <div style={card}>
        {titulo('📍', 'Por Localização')}
        {porLoc.length ? porLoc.map(([k, v]) => <MiniLinha key={k} label={k} count={v} total={total} color="#2e7d32" />) : <span style={{ color: '#bbb', fontSize: 12 }}>—</span>}
      </div>

    </div>
  );
}

function MatOperacionais() {
  const [matOp, setMatOp]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [syncing, setSyncing]       = useState(false);
  const [error, setError]           = useState('');
  const [ultimaSync, setUltimaSync] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState(null);

  const loadData = useCallback(async (manual = false) => {
    if (manual) setSyncing(true);
    else setLoading(true);
    setError('');
    try {
      const result = await getMateriaisOperacionais();
      setMatOp(result);
      setUltimaSync(new Date());
    } catch (e) {
      setError('Erro ao carregar dados: ' + e.message);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const t = setInterval(() => loadData(), REFRESH_INTERVAL);
    return () => clearInterval(t);
  }, [loadData]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 16 }}>
      <div style={{
        width: 40, height: 40, border: `4px solid #e5e7eb`,
        borderTopColor: C.red2, borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      }} />
      <div style={{ color: C.mid }}>Carregando materiais operacionais...</div>
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

  const totais     = matOp?.totais    || { total: 0, op: 0, bx: 0 };
  const thVencendo = matOp?.thVencendo || 0;
  const pctGeral   = totais.total ? Math.round(totais.op / totais.total * 100) : 0;

  const abasMatOp = (matOp?.abas || []).filter(a => ABAS_MAT_OP.includes(a.aba));
  const abaObj    = abasMatOp.find(a => a.aba === abaAtiva);

  return (
    <div style={{ padding: '24px 28px' }}>

      {/* CABEÇALHO */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: C.dark }}>📦 Materiais Operacionais</h1>
          <p style={{ fontSize: '0.85rem', color: C.mid, marginTop: 2 }}>
            Detalhes dos equipamentos · 17º Grupamento de Bombeiros
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

      {/* CARDS DE CATEGORIA */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 14, marginBottom: 24 }}>
        {abasMatOp.map(a => {
          const ativo = abaAtiva === a.aba;
          const pct   = a.total ? Math.round(a.op / a.total * 100) : 100;
          return (
            <div
              key={a.aba}
              onClick={() => setAbaAtiva(ativo ? null : a.aba)}
              style={{
                background: ativo ? C.red2 : '#fff',
                borderRadius: 10,
                padding: '22px 20px',
                boxShadow: ativo ? `0 4px 14px rgba(211,47,47,0.35)` : '0 2px 8px rgba(0,0,0,0.07)',
                borderLeft: `4px solid ${ativo ? '#fff' : C.border}`,
                cursor: 'pointer',
                transition: 'all 0.18s',
                userSelect: 'none',
              }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{a.icone}</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: ativo ? '#fff' : C.dark, lineHeight: 1 }}>{a.total}</div>
              <div style={{ fontSize: '0.75rem', color: ativo ? 'rgba(255,255,255,0.8)' : C.mid, marginTop: 4 }}>
                ✅ {a.op} · ❌ {a.bx}
              </div>
              <div style={{ fontSize: '0.85rem', color: ativo ? '#fff' : C.mid, marginTop: 8, fontWeight: 600 }}>{a.aba}</div>
              <div style={{ marginTop: 8, height: 4, borderRadius: 4, background: ativo ? 'rgba(255,255,255,0.25)' : '#f0f0f0', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: ativo ? '#fff' : (pct >= 90 ? C.green : pct >= 70 ? C.yellow : C.red2), borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: '0.72rem', color: ativo ? 'rgba(255,255,255,0.75)' : C.mid, marginTop: 3 }}>{pct}% disp.</div>
            </div>
          );
        })}
      </div>

      {/* TABELA — só aparece ao clicar em um card */}
      {abaObj ? (
        <div>
          <AbaHeader aba={abaObj} />
          <ResumoCards aba={abaObj} />
          <TabelaAba aba={abaObj} />
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: C.mid }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📦</div>
          <div style={{ fontWeight: 600, fontSize: '1rem' }}>Selecione uma categoria acima para ver os detalhes</div>
          <div style={{ fontSize: '0.85rem', marginTop: 6 }}>Clique em qualquer card para expandir a listagem completa</div>
        </div>
      )}
    </div>
  );
}

export default MatOperacionais;
