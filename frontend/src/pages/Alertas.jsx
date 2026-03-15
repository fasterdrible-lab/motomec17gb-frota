import React, { useState, useEffect, useCallback } from 'react';
import { getAlertasDetalhados } from '../services/googleSheets';
import '../styles/Dashboard.css';

function Alertas() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [ultimaSync, setUltimaSync] = useState(null);
  const [tab, setTab] = useState('todos');

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setSyncing(true);
    setError('');
    try {
      const data = await getAlertasDetalhados();
      setAlertas(data);
      setUltimaSync(new Date());
    } catch (e) {
      setError('Erro ao buscar dados da planilha. Verifique a conexão e tente novamente.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const criticos = alertas.filter(a => a.nivel === 'critico');
  const avisos = alertas.filter(a => a.nivel === 'aviso');
  const filtrados = tab === 'todos' ? alertas : tab === 'criticos' ? criticos : avisos;

  const tabs = [
    { key: 'todos', label: `Todos (${alertas.length})` },
    { key: 'criticos', label: `Críticos (${criticos.length})` },
    { key: 'avisos', label: `Avisos (${avisos.length})` },
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
        <span>Central de Alertas</span>
        <span>🚨 {criticos.length} críticos · ⚠️ {avisos.length} avisos</span>
      </div>

      <div className="dash-action-bar">
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>🔔 Alertas</h2>
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
          {/* Contadores */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            <div style={{ background: 'white', borderRadius: 10, padding: '16px 20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{alertas.length}</div>
              <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Total de Alertas</div>
            </div>
            <div style={{ background: '#fee2e2', borderRadius: 10, padding: '16px 20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#dc2626' }}>{criticos.length}</div>
              <div style={{ color: '#dc2626', fontSize: '0.85rem' }}>🚨 Críticos</div>
            </div>
            <div style={{ background: '#fef3c7', borderRadius: 10, padding: '16px 20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#d97706' }}>{avisos.length}</div>
              <div style={{ color: '#d97706', fontSize: '0.85rem' }}>⚠️ Avisos</div>
            </div>
          </div>

          {/* Tabs */}
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

          {filtrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', background: 'white', borderRadius: 10 }}>
              ✅ Nenhum alerta nesta categoria.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtrados.map(a => (
                <div key={a.id} style={{
                  background: 'white', borderRadius: 10, padding: '14px 18px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderLeft: `4px solid ${a.nivel === 'critico' ? '#dc2626' : '#d97706'}`,
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <span style={{ fontSize: '1.6rem' }}>{a.nivel === 'critico' ? '🚨' : '⚠️'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: 2 }}>
                      {a.prefixo} · {a.tipo}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{a.descricao}</div>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
                    color: a.nivel === 'critico' ? '#dc2626' : '#d97706',
                    background: a.nivel === 'critico' ? '#fee2e2' : '#fef3c7',
                  }}>
                    {a.nivel === 'critico' ? 'CRÍTICO' : 'AVISO'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Alertas;
