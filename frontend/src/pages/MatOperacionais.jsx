import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getMateriaisOperacionais } from '../services/logisticaSheets';
import { C, REFRESH_INTERVAL, KPICard, AbaHeader, TabelaAba } from '../components/LogisticaComponents';

const ABAS_MAT_OP = ['EPR', 'COMPRESSOR', 'EMBARCAÇÕES', 'CILÍNDROS', 'MS/MA/MP/SS', 'DESENCARCERADORES', 'EQUIP. DIVERSOS'];

function MatOperacionais() {
  const [matOp, setMatOp]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [syncing, setSyncing]       = useState(false);
  const [error, setError]           = useState('');
  const [ultimaSync, setUltimaSync] = useState(null);
  const [abaAtiva, setAbaAtiva]     = useState(null);
  const abaInicializada             = useRef(false);

  const loadData = useCallback(async (manual = false) => {
    if (manual) setSyncing(true);
    else setLoading(true);
    setError('');
    try {
      const result = await getMateriaisOperacionais();
      setMatOp(result);
      if (!abaInicializada.current) {
        const primeira = result.abas.find(a => ABAS_MAT_OP.includes(a.aba));
        if (primeira) {
          setAbaAtiva(primeira.aba);
          abaInicializada.current = true;
        }
      }
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
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>

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

      {/* KPIs GLOBAIS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        <KPICard icon="📦" label="Total de Equipamentos" value={totais.total} sub="Mat. Operacionais" />
        <KPICard icon="✅" label="Operando"  value={totais.op}  sub={`${pctGeral}% disponibilidade`} variant="success" />
        <KPICard icon="❌" label="Baixados"  value={totais.bx}  sub={`${100 - pctGeral}% indisponíveis`} variant={totais.bx > 20 ? 'danger' : 'warning'} />
        <KPICard icon="⚠️" label="TH Vencendo em 2026" value={thVencendo} sub="cilíndros" variant={thVencendo > 0 ? 'warning' : 'success'} />
        <KPICard icon="🚤" label="Embarcações"  value={`${matOp?.abas?.find(a=>a.aba==='EMBARCAÇÕES')?.op || 0}/${matOp?.abas?.find(a=>a.aba==='EMBARCAÇÕES')?.total || 0}`}  sub="operacionais" variant="success" />
        <KPICard icon="⚙️" label="Compressores" value={`${matOp?.abas?.find(a=>a.aba==='COMPRESSOR')?.op || 0}/${matOp?.abas?.find(a=>a.aba==='COMPRESSOR')?.total || 0}`} sub="operacionais" variant="info" />
      </div>

      {/* ABAS DE CATEGORIA */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {abasMatOp.map(a => (
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

export default MatOperacionais;
