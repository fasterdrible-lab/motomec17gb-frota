import React, { useState, useEffect, useCallback } from 'react';
import { getManutencoes } from '../services/googleSheets';
import '../styles/Dashboard.css';

function Manutencao() {
  const [manutencoes, setManutencoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [ultimaSync, setUltimaSync] = useState(null);
  const [tab, setTab] = useState('todas');

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setSyncing(true);
    setError('');
    try {
      const data = await getManutencoes();
      setManutencoes(data);
      setUltimaSync(new Date());
    } catch (e) {
      setError('Erro ao buscar dados da planilha. Verifique a conexão e tente novamente.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtradas = tab === 'todas' ? manutencoes : manutencoes.filter(m => m.status === (tab === 'vencidas' ? 'vencida' : 'pendente'));

  const tabs = [
    { key: 'todas', label: `Todas (${manutencoes.length})` },
    { key: 'vencidas', label: `Vencidas (${manutencoes.filter(m => m.status === 'vencida').length})` },
    { key: 'pendentes', label: `Pendentes (${manutencoes.filter(m => m.status === 'pendente').length})` },
  ];

  return (
    <div>
      <div className="cbmesp-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '2rem' }}>🔥</span>
          <div>
            <div className="cbmesp-header-title">17º Grupamento de Bombeiros</div>
            <div className="cbmesp-header-subtitle">Corpo de Bombeiros Militar do Estado de São Paulo</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>🛡️ CBMESP</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>Secretaria da Segurança Pública</div>
        </div>
      </div>

      <div className="cbmesp-subbar">
        <span>Controle de Manutenção</span>
        <span>{manutencoes.filter(m => m.status === 'vencida').length} vencidas · {manutencoes.filter(m => m.status === 'pendente').length} pendentes</span>
      </div>

      <div className="dash-action-bar">
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>🔧 Manutenção</h2>
        <button className="btn-sincronizar" onClick={() => loadData(true)} disabled={syncing}>
          {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar'}
        </button>
        {ultimaSync && (
          <span className="sync-info">
            Última sinc.: {ultimaSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {loading && <div className="dash-loading">⏳ Carregando dados da planilha...</div>}

      {error && !loading && (
        <div className="dash-error">
          <span>⚠️ {error}</span>
          <button className="btn-sincronizar" onClick={() => loadData(true)} style={{ marginLeft: 'auto' }}>
            🔄 Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && (
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{
                  padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                  background: tab === t.key ? '#CC1F1F' : '#f3f4f6',
                  color: tab === t.key ? 'white' : '#374151',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {filtradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', background: 'white', borderRadius: 10 }}>
              ✅ Nenhuma manutenção encontrada nesta categoria.
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                    {['Prefixo', 'Tipo', 'Status', 'Detalhe'].map(col => (
                      <th key={col} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((m, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{m.prefixo}</td>
                      <td style={{ padding: '10px 14px' }}>{m.tipo}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {m.status === 'vencida' ? (
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', background: '#fee2e2' }}>Vencida</span>
                        ) : (
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, color: '#d97706', background: '#fef3c7' }}>Pendente</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#6b7280' }}>{m.detalhe}</td>
                    </tr>
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

export default Manutencao;
