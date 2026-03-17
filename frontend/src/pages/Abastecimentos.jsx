import React, { useState, useEffect, useCallback } from 'react';
import { getAbastecimentos } from '../services/googleSheets';

function Abastecimentos() {
  const [abastecimentos, setAbastecimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [busca, setBusca] = useState('');

  const fmtMoeda = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const load = useCallback(async (isManual = false) => {
    if (isManual) setSyncing(true);
    else setLoading(true);
    try {
      const data = await getAbastecimentos();
      setAbastecimentos(data);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtrados = abastecimentos.filter(a => {
    if (!busca) return true;
    const b = busca.toLowerCase();
    return (
      String(a.prefixo).toLowerCase().includes(b) ||
      String(a.placa).toLowerCase().includes(b) ||
      String(a.posto).toLowerCase().includes(b)
    );
  });

  const totalLitros = filtrados.reduce((s, a) => s + (a.litros || 0), 0);
  const totalValor = filtrados.reduce((s, a) => s + (a.valorTotal || 0), 0);
  const mediaPorAbast = filtrados.length > 0 ? totalValor / filtrados.length : 0;

  const porViatura = {};
  filtrados.forEach(a => {
    if (!porViatura[a.prefixo]) {
      porViatura[a.prefixo] = { prefixo: a.prefixo, placa: a.placa, total: 0, litros: 0, count: 0 };
    }
    porViatura[a.prefixo].total += a.valorTotal || 0;
    porViatura[a.prefixo].litros += a.litros || 0;
    porViatura[a.prefixo].count++;
  });
  const topViaturas = Object.values(porViatura).sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <div style={{ padding: '0 0 32px' }}>
      <div style={{ background: '#1a1a1a', padding: '8px 20px', color: 'white', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
        <span>Sistema de Gestao de Frota - Abastecimentos</span>
      </div>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>⛽ Abastecimentos</h2>
          <button
            onClick={() => load(true)}
            disabled={syncing}
            style={{ background: '#0e7490', color: 'white', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
          >
            {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total de Registros', value: filtrados.length, color: '#0e7490' },
            { label: 'Total em Litros', value: `${totalLitros.toFixed(1)} L`, color: '#15803d' },
            { label: 'Total Gasto', value: fmtMoeda(totalValor), color: '#d97706' },
            { label: 'Media por Abastecimento', value: fmtMoeda(mediaPorAbast), color: '#7c3aed' },
          ].map(c => (
            <div key={c.label} style={{ background: 'white', borderRadius: 8, padding: '14px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderTop: `3px solid ${c.color}` }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1a2e' }}>{c.value}</div>
              <div style={{ color: '#6b7280', fontSize: '0.82rem' }}>{c.label}</div>
            </div>
          ))}
        </div>

        {topViaturas.length > 0 && (
          <div style={{ background: 'white', borderRadius: 10, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              🏆 Top 5 Viaturas por Gasto
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {topViaturas.map((v, i) => (
                <div key={v.prefixo} style={{ background: '#f0fdfa', borderRadius: 8, padding: '10px 16px', borderLeft: '4px solid #0e7490', minWidth: 150 }}>
                  <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.9rem' }}>{i + 1}. {v.prefixo}</div>
                  <div style={{ color: '#0e7490', fontWeight: 700, fontSize: '0.95rem' }}>{fmtMoeda(v.total)}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{v.count} abast. · {v.litros.toFixed(1)} L</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="🔍 Buscar por prefixo, placa ou posto..."
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>⏳ Carregando abastecimentos...</div>
        ) : (
          <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  {['DATA', 'PREFIXO', 'PLACA', 'KM', 'LITROS', 'VALOR', 'POSTO', 'OBS'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Nenhum abastecimento encontrado</td>
                  </tr>
                ) : filtrados.map((a, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '9px 14px', color: '#374151', fontSize: '0.85rem' }}>{String(a.data).includes('Date') ? '-' : a.data}</td>
                    <td style={{ padding: '9px 14px', fontWeight: 700, color: '#1a1a2e', fontSize: '0.88rem' }}>{a.prefixo}</td>
                    <td style={{ padding: '9px 14px', color: '#374151', fontSize: '0.85rem' }}>{a.placa}</td>
                    <td style={{ padding: '9px 14px', color: '#374151', fontSize: '0.85rem' }}>{a.km || '-'}</td>
                    <td style={{ padding: '9px 14px', color: '#0e7490', fontSize: '0.85rem', fontWeight: 600 }}>{a.litros > 0 ? `${a.litros} L` : '-'}</td>
                    <td style={{ padding: '9px 14px', color: '#15803d', fontSize: '0.85rem', fontWeight: 700 }}>{fmtMoeda(a.valorTotal)}</td>
                    <td style={{ padding: '9px 14px', color: '#6b7280', fontSize: '0.82rem' }}>{a.posto || '-'}</td>
                    <td style={{ padding: '9px 14px', color: '#9ca3af', fontSize: '0.80rem' }}>{a.obs || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Abastecimentos;