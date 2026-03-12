import React, { useState, useEffect, useCallback } from 'react';
import { getAlertas, marcarAlertaLido } from '../services/api';
import AlertCard from '../components/AlertCard';

function Alertas() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('todos');

  const loadAlertas = useCallback(async () => {
    try {
      const res = await getAlertas();
      setAlertas(res.data || []);
      setError('');
    } catch (e) {
      setError('Erro ao carregar alertas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAlertas(); }, [loadAlertas]);

  const handleMarcarTodosLido = async () => {
    const naoLidos = alertas.filter(a => !a.lido);
    try {
      await Promise.all(naoLidos.map(a => marcarAlertaLido(a.id)));
      await loadAlertas();
    } catch (e) {
      setError('Erro ao marcar alertas como lidos.');
    }
  };

  const criticos = alertas.filter(a => a.nivel === 'critico');
  const naoLidos = alertas.filter(a => !a.lido);

  const filteredAlertas = (() => {
    if (filter === 'criticos') return alertas.filter(a => a.nivel === 'critico');
    if (filter === 'nao-lidos') return alertas.filter(a => !a.lido);
    return alertas;
  })();

  // Sort: critico first, then aviso, then info
  const sorted = [...filteredAlertas].sort((a, b) => {
    const order = { critico: 0, aviso: 1, info: 2 };
    return (order[a.nivel] ?? 3) - (order[b.nivel] ?? 3);
  });

  return (
    <div>
      <div className="section-header">
        <h1 className="page-title" style={{ margin: 0 }}>Central de Alertas</h1>
        {naoLidos.length > 0 && (
          <button className="btn-secondary" onClick={handleMarcarTodosLido}>
            ✅ Marcar todos como lido
          </button>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div style={{ marginBottom: 16, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
        Total: <strong>{alertas.length}</strong> alertas &nbsp;|&nbsp;
        Não lidos: <strong>{naoLidos.length}</strong> &nbsp;|&nbsp;
        Críticos: <strong>{criticos.length}</strong>
      </div>

      <div className="filter-bar" style={{ marginBottom: 20 }}>
        <button
          className={`tab-btn ${filter === 'todos' ? 'active' : ''}`}
          onClick={() => setFilter('todos')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          Todos
          {alertas.length > 0 && <span className="badge" style={{ background: '#6b7280' }}>{alertas.length}</span>}
        </button>
        <button
          className={`tab-btn ${filter === 'criticos' ? 'active' : ''}`}
          onClick={() => setFilter('criticos')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          Críticos
          {criticos.length > 0 && <span className="badge">{criticos.length}</span>}
        </button>
        <button
          className={`tab-btn ${filter === 'nao-lidos' ? 'active' : ''}`}
          onClick={() => setFilter('nao-lidos')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          Não Lidos
          {naoLidos.length > 0 && <span className="badge">{naoLidos.length}</span>}
        </button>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : sorted.length === 0 ? (
        <div className="empty-state">Nenhum alerta encontrado para o filtro selecionado. ✅</div>
      ) : (
        <div>
          {sorted.map(alerta => (
            <AlertCard key={alerta.id} alerta={alerta} onUpdate={loadAlertas} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Alertas;
