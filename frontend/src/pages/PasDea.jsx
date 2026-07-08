import React, { useState, useEffect, useCallback } from 'react';
import { getMateriaisOperacionais } from '../services/logisticaSheets';
import { C, REFRESH_INTERVAL, KPICard, AbaHeader, TabelaAba } from '../components/LogisticaComponents';

function PasDea() {
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [syncing, setSyncing]       = useState(false);
  const [error, setError]           = useState('');
  const [ultimaSync, setUltimaSync] = useState(null);

  const loadData = useCallback(async (manual = false) => {
    if (manual) setSyncing(true);
    else setLoading(true);
    setError('');
    try {
      const result = await getMateriaisOperacionais();
      setData(result);
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
      <div style={{ color: C.mid }}>Carregando PAS DE DEA...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error && !data) return (
    <div style={{ padding: 40, textAlign: 'center', color: C.red2 }}>
      <div style={{ fontSize: '2rem', marginBottom: 12 }}>❌</div>
      <div style={{ fontWeight: 700 }}>{error}</div>
      <button onClick={() => loadData(true)} style={{ marginTop: 16, padding: '8px 20px', background: C.red2, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
        Tentar novamente
      </button>
    </div>
  );

  const pasDea = data?.abas?.find(a => a.aba === 'PAS DE DEA') || { aba: 'PAS DE DEA', icone: '🫀', rows: [], headers: [], op: 0, bx: 0, total: 0 };

  return (
    <div className="page-inner" style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* CABEÇALHO */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: C.dark }}>🫀 PAS DE DEA</h1>
          <p style={{ fontSize: '0.85rem', color: C.mid, marginTop: 2 }}>
            Solicitações de PAS e dispositivos DEA · 17º Grupamento de Bombeiros
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

      {/* KPIs */}
      <div className="grid-cols-3" style={{ marginBottom: 24 }}>
        <KPICard icon="🫀" label="PAS DE DEA solicitadas" value={pasDea.total} variant="info" />
        <KPICard icon="✅" label="Operando/ativas" value={pasDea.op} variant="success" />
        <KPICard icon="❌" label="Baixadas/inativas" value={pasDea.bx} variant={pasDea.bx > 0 ? 'warning' : 'default'} />
      </div>

      {/* TABELA */}
      <AbaHeader aba={pasDea} />
      <TabelaAba aba={pasDea} />
    </div>
  );
}

export default PasDea;
