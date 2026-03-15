import React, { useState, useEffect, useCallback } from 'react';
import { getStatusOperacional, getTarefas, getAlertas } from '../services/googleSheets';
import '../styles/Dashboard.css';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos

function Dashboard() {
  const [status, setStatus] = useState(null);
  const [tarefas, setTarefas] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [ultimaSync, setUltimaSync] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setSyncing(true);
    setError('');
    try {
      const [statusData, tarefasData, alertasData] = await Promise.all([
        getStatusOperacional(),
        getTarefas(),
        getAlertas(),
      ]);
      setStatus(statusData);
      setTarefas(tarefasData);
      setAlertas(alertasData);
      setUltimaSync(new Date());
    } catch (e) {
      setError('Erro ao buscar dados da planilha. Verifique a conexão e tente novamente.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loadData]);

  const dataFormatada = now.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaFormatada = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      {/* Header CBMESP */}
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

      {/* Sub-barra */}
      <div className="cbmesp-subbar">
        <span>Sistema de Gestão de Frota</span>
        <span>{dataFormatada}, {horaFormatada}</span>
      </div>

      {/* Barra de ação */}
      <div className="dash-action-bar">
        <h2>Dashboard</h2>
        <button
          className="btn-sincronizar"
          onClick={() => loadData(true)}
          disabled={syncing}
        >
          {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar'}
        </button>
        {ultimaSync && (
          <span className="sync-info">
            Última sincronização: {ultimaSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Estado de carregamento */}
      {loading && (
        <div className="dash-loading">⏳ Carregando dados da planilha...</div>
      )}

      {/* Estado de erro */}
      {error && !loading && (
        <div className="dash-error">
          <span>⚠️ {error}</span>
          <button className="btn-sincronizar" onClick={() => loadData(true)} style={{ marginLeft: 'auto' }}>
            🔄 Tentar novamente
          </button>
        </div>
      )}

      {/* Cards status operacional */}
      {!loading && status && (
        <div className="dash-stat-grid">
          <div className="dash-stat-card">
            <div className="dash-stat-icon">🚒</div>
            <div className="dash-stat-value">{status.baixadas}</div>
            <div className="dash-stat-label">Baixadas</div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon">🚗</div>
            <div className="dash-stat-value">{status.operando}</div>
            <div className="dash-stat-label">Operando</div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon">⏸️</div>
            <div className="dash-stat-value">{status.reserva}</div>
            <div className="dash-stat-label">Reserva</div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon">📊</div>
            <div className="dash-stat-value">{status.total}</div>
            <div className="dash-stat-label">Total</div>
          </div>
        </div>
      )}

      {/* Tarefas + Alertas */}
      {!loading && tarefas && (
        <div className="dash-two-col">
          {/* Tarefas */}
          <div className="dash-card">
            <div className="dash-card-title">📋 TAREFAS</div>
            <div className="dash-task-row">
              <span>📝 Total</span>
              <strong>{tarefas.total}</strong>
            </div>
            <div className="dash-task-row">
              <span>🔴 Pendente</span>
              <strong>{tarefas.pendente}</strong>
            </div>
            <div className="dash-task-row">
              <span>🟡 Em Andamento</span>
              <strong>{tarefas.andamento}</strong>
            </div>
            <div className="dash-task-row">
              <span>🟢 Concluída</span>
              <strong>{tarefas.concluida}</strong>
            </div>
          </div>

          {/* Alertas */}
          <div className="dash-card">
            <div className="dash-card-title">⏰ ALERTAS</div>
            {alertas.length === 0 ? (
              <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>✅ Nenhum alerta no momento.</div>
            ) : (
              alertas.map((a, i) => (
                <div
                  key={i}
                  className={`dash-alerta-item ${a.nivel === 'critico' ? 'dash-alerta-critico' : 'dash-alerta-aviso'}`}
                >
                  <span style={{ flex: 1 }}>{a.tipo}</span>
                  <span style={{ fontWeight: 700 }}>({a.count})</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
