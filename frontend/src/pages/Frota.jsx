import React, { useState, useEffect, useCallback } from 'react';
import { getFrotaCompleta } from '../services/googleSheets';
import '../styles/Dashboard.css';

const statusBadge = (status) => {
  if (status === 'baixada') return { label: 'Baixada', color: '#dc2626', bg: '#fee2e2' };
  if (status === 'reserva') return { label: 'Reserva', color: '#d97706', bg: '#fef3c7' };
  return { label: 'Operando', color: '#16a34a', bg: '#dcfce7' };
};

function Frota() {
  const [frota, setFrota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [ultimaSync, setUltimaSync] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroSgb, setFiltroSgb] = useState('todos');

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setSyncing(true);
    setError('');
    try {
      const data = await getFrotaCompleta();
      setFrota(data);
      setUltimaSync(new Date());
    } catch (e) {
      setError('Erro ao buscar dados da planilha. Verifique a conexão e tente novamente.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const frotaFiltrada = frota.filter(v => {
    const texto = busca.toLowerCase();
    const matchBusca = !texto || v.prefixo.toLowerCase().includes(texto) || v.placa.toLowerCase().includes(texto);
    const matchStatus = filtroStatus === 'todos' || v.status === filtroStatus;
    const matchSgb = filtroSgb === 'todos' || v.sgb === filtroSgb;
    return matchBusca && matchStatus && matchSgb;
  });

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
        <span>Controle de Frota</span>
        <span>{frota.length} viaturas cadastradas</span>
      </div>

      <div className="dash-action-bar" style={{ flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>🚒 Frota</h2>
        <input
          type="text"
          placeholder="Buscar por prefixo ou placa..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem', flex: 1, minWidth: 180 }}
        />
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }}>
          <option value="todos">Todos os status</option>
          <option value="operando">Operando</option>
          <option value="reserva">Reserva</option>
          <option value="baixada">Baixada</option>
        </select>
        <select value={filtroSgb} onChange={e => setFiltroSgb(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }}>
          <option value="todos">Todos os SGB</option>
          <option value="1SGB">1SGB</option>
          <option value="2SGB">2SGB</option>
        </select>
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
          {frotaFiltrada.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', background: 'white', borderRadius: 10 }}>
              🔍 Nenhuma viatura encontrada com os filtros selecionados.
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                    {['Prefixo', 'Placa', 'KM Atual', 'Modelo', 'Marca', 'Ano', 'Status', 'SGB'].map(col => (
                      <th key={col} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {frotaFiltrada.map((v, i) => {
                    const badge = statusBadge(v.status);
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{v.prefixo}</td>
                        <td style={{ padding: '10px 14px' }}>{v.placa}</td>
                        <td style={{ padding: '10px 14px' }}>{v.kmAtual ? v.kmAtual.toLocaleString('pt-BR') : '—'}</td>
                        <td style={{ padding: '10px 14px' }}>{v.modelo || '—'}</td>
                        <td style={{ padding: '10px 14px' }}>{v.marca || '—'}</td>
                        <td style={{ padding: '10px 14px' }}>{v.ano || '—'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, color: badge.color, background: badge.bg }}>
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, background: '#e0e7ff', color: '#3730a3' }}>
                            {v.sgb}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Frota;
