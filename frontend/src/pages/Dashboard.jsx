import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getFrotaStatus, getAlertasNaoLidos, getManutencoesPendentes } from '../services/api';
import AlertCard from '../components/AlertCard';

const COLORS = ['#16a34a', '#d97706', '#dc2626', '#6b7280'];

function Dashboard() {
  const [frotaStatus, setFrotaStatus] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [statusRes, alertasRes, pendentesRes] = await Promise.allSettled([
        getFrotaStatus(),
        getAlertasNaoLidos(),
        getManutencoesPendentes(),
      ]);
      if (statusRes.status === 'fulfilled') setFrotaStatus(statusRes.value.data);
      if (alertasRes.status === 'fulfilled') setAlertas(alertasRes.value.data || []);
      if (pendentesRes.status === 'fulfilled') setPendentes(pendentesRes.value.data || []);
    } catch (e) {
      setError('Erro ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) return <div className="loading">Carregando...</div>;

  const pieData = frotaStatus
    ? [
        { name: 'Operando', value: frotaStatus.operando || 0 },
        { name: 'Manutenção', value: frotaStatus.em_manutencao || 0 },
        { name: 'Baixada', value: frotaStatus.baixadas || 0 },
        { name: 'Reserva', value: frotaStatus.reserva || 0 },
      ]
    : [];

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>

      {error && <div className="error-msg">{error}</div>}

      <div className="stat-cards">
        <div className="stat-card primary">
          <div className="stat-card-icon">🚗</div>
          <div className="stat-card-label">Total de Viaturas</div>
          <div className="stat-card-value">{frotaStatus?.total_viaturas ?? '—'}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-card-icon">✅</div>
          <div className="stat-card-label">Operando</div>
          <div className="stat-card-value">{frotaStatus?.operando ?? '—'}</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-card-icon">🔴</div>
          <div className="stat-card-label">Baixadas</div>
          <div className="stat-card-value">{frotaStatus?.baixadas ?? '—'}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-card-icon">⚠️</div>
          <div className="stat-card-label">Alertas Críticos</div>
          <div className="stat-card-value">{frotaStatus?.alertas_criticos ?? '—'}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-container">
          <h3 className="chart-title">Distribuição da Frota</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">Sem dados de frota disponíveis.</div>
          )}
        </div>

        <div className="card">
          <div className="section-header">
            <h3 className="section-title">⚠️ Alertas Recentes</h3>
            <span className="text-muted">{alertas.length} não lidos</span>
          </div>
          {alertas.length === 0 ? (
            <div className="empty-state">Nenhum alerta pendente. ✅</div>
          ) : (
            alertas.slice(0, 5).map(alerta => (
              <AlertCard key={alerta.id} alerta={alerta} onUpdate={loadData} />
            ))
          )}
        </div>
      </div>

      <div className="card dashboard-grid-full" style={{ marginTop: 20 }}>
        <div className="section-header">
          <h3 className="section-title">🔧 Manutenções Pendentes</h3>
          <span className="text-muted">{pendentes.length} pendente(s)</span>
        </div>
        {pendentes.length === 0 ? (
          <div className="empty-state">Nenhuma manutenção pendente.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo</th>
                <th>Viatura ID</th>
                <th>KM Próximo</th>
                <th>Data Próxima</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pendentes.map(m => (
                <tr key={m.id}>
                  <td>{m.id}</td>
                  <td>{m.tipo}</td>
                  <td>{m.viatura_id}</td>
                  <td>{m.km_proximo?.toLocaleString('pt-BR')}</td>
                  <td>{m.data_proxima ? new Date(m.data_proxima).toLocaleDateString('pt-BR') : '—'}</td>
                  <td>
                    <span className={`status-badge status-manutencao`}>{m.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
