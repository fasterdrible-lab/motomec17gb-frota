import React, { useState, useEffect, useCallback } from 'react';
import { getGastosPorViatura } from '../services/googleSheets';
import '../styles/Dashboard.css';

function Gastos() {
  const [dados, setDados] = useState({ viaturas: [], listaGastos: [], totalGeral: 0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [ultimaSync, setUltimaSync] = useState(null);
  const [expandido, setExpandido] = useState(null); // prefixo da viatura expandida

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setSyncing(true);
    setError('');
    try {
      const data = await getGastosPorViatura();
      setDados(data);
      setUltimaSync(new Date());
    } catch (e) {
      setError('Erro ao buscar dados da planilha. Verifique a conexão e tente novamente.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const fmtMoeda = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div>
      {/* Barra de ação */}
      <div className="dash-action-bar">
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>💰 Controle de Gastos</h2>
        <button className="btn-sincronizar" onClick={() => loadData(true)} disabled={syncing}>
          {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar'}
        </button>
        {ultimaSync && (
          <span className="sync-info">
            Última sinc.: {ultimaSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Cards de resumo */}
      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, padding: '0 20px 20px' }}>
          <CardStat icon="💰" value={fmtMoeda(dados.totalGeral)} label="Gasto Total" cor="#CC1F1F" />
          <CardStat icon="🚒" value={dados.viaturas.length} label="Viaturas com Gastos" cor="#2563eb" />
          <CardStat icon="🔧" value={dados.listaGastos.length} label="Registros de Serviço" cor="#16a34a" />
          {dados.viaturas.length > 0 && (
            <CardStat icon="💸" value={dados.viaturas[0].prefixo} label={`Mais cara: ${fmtMoeda(dados.viaturas[0].totalGasto)}`} cor="#d97706" />
          )}
        </div>
      )}

      {loading && <div className="dash-loading">⏳ Carregando dados da planilha...</div>}

      {error && !loading && (
        <div className="dash-error">
          <span>⚠️ {error}</span>
          <button className="btn-sincronizar" onClick={() => loadData(true)} style={{ marginLeft: 'auto' }}>
            🔄 Tentar novamente
          </button>
        </div>
      )}

      {/* Tabela de gastos por viatura */}
      {!loading && !error && (
        <div style={{ padding: '0 20px 20px' }}>
          {dados.viaturas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', background: 'white', borderRadius: 10 }}>
              📋 Nenhum gasto registrado. Os dados serão exibidos quando houver lançamentos na aba RIV da planilha.
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                    {['', 'Prefixo', 'Placa', 'Nº Serviços', 'Total Gasto'].map(col => (
                      <th key={col} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dados.viaturas.map((v) => (
                    <React.Fragment key={v.prefixo}>
                      <tr
                        style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: expandido === v.prefixo ? '#fef9f0' : 'white' }}
                        onClick={() => setExpandido(expandido === v.prefixo ? null : v.prefixo)}
                      >
                        <td style={{ padding: '10px 14px', color: '#9ca3af' }}>{expandido === v.prefixo ? '▼' : '▶'}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700 }}>{v.prefixo}</td>
                        <td style={{ padding: '10px 14px' }}>{v.placa}</td>
                        <td style={{ padding: '10px 14px' }}>{v.qtdServicos}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#CC1F1F' }}>{fmtMoeda(v.totalGasto)}</td>
                      </tr>
                      {expandido === v.prefixo && v.servicos.map((s, j) => (
                        <tr key={j} style={{ background: '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
                          <td></td>
                          <td colSpan={2} style={{ padding: '8px 14px', color: '#374151', fontSize: '0.82rem' }}>
                            {s.tipoServico || s.descricao || '—'}
                          </td>
                          <td style={{ padding: '8px 14px', color: '#6b7280', fontSize: '0.82rem' }}>{s.data || '—'}</td>
                          <td style={{ padding: '8px 14px', fontSize: '0.82rem', color: s.custo > 0 ? '#374151' : '#9ca3af' }}>{s.custo > 0 ? fmtMoeda(s.custo) : '—'}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CardStat({ icon, value, label, cor }) {
  return (
    <div style={{ background: 'white', borderRadius: 10, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: `3px solid ${cor}` }}>
      <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1a2e' }}>{value}</div>
      <div style={{ color: '#6b7280', fontSize: '0.82rem', marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default Gastos;

