import React, { useState, useEffect } from 'react';
import { getVehicles, getDrivers, getAlerts } from '../services/api';
import { formatKm, formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../utils/helpers';
import './Dashboard.css';

function StatCard({ icon, label, value, sub, colorClass, loading }) {
  return (
    <div className={`stat-card ${colorClass || ''}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <p className="stat-label">{label}</p>
        {loading ? (
          <div className="stat-skeleton" />
        ) : (
          <p className="stat-value">{value}</p>
        )}
        {sub && <p className="stat-sub">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [vehicles, setVehicles]     = useState([]);
  const [drivers, setDrivers]       = useState([]);
  const [alerts, setAlerts]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [v, d, a] = await Promise.all([
          getVehicles().catch(() => []),
          getDrivers().catch(() => []),
          getAlerts().catch(() => []),
        ]);
        if (!cancelled) {
          setVehicles(Array.isArray(v) ? v : v?.items ?? []);
          setDrivers(Array.isArray(d) ? d : d?.items ?? []);
          setAlerts(Array.isArray(a) ? a : a?.items ?? []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const activeVehicles  = vehicles.filter((v) => v.status === 'ativo' || v.status === 'disponivel').length;
  const activeDrivers   = drivers.filter((d) => d.status === 'ativo').length;
  const criticalAlerts  = alerts.filter((a) => a.severity === 'critico' || a.severity === 'critical').length;

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Visão geral da frota em tempo real</p>
      </div>

      {error && (
        <div className="alert alert-error">
          ⚠️ Não foi possível carregar os dados: {error}
        </div>
      )}

      <div className="stats-grid">
        <StatCard
          icon="🚗"
          label="Total de Veículos"
          value={vehicles.length}
          sub={`${activeVehicles} ativos`}
          colorClass="stat-blue"
          loading={loading}
        />
        <StatCard
          icon="👤"
          label="Motoristas Ativos"
          value={activeDrivers}
          sub={`de ${drivers.length} cadastrados`}
          colorClass="stat-green"
          loading={loading}
        />
        <StatCard
          icon="🔧"
          label="Manutenções Pendentes"
          value={alerts.length}
          sub="agendadas ou atrasadas"
          colorClass="stat-yellow"
          loading={loading}
        />
        <StatCard
          icon="🚨"
          label="Alertas Críticos"
          value={criticalAlerts}
          sub="requerem atenção imediata"
          colorClass={criticalAlerts > 0 ? 'stat-red' : 'stat-green'}
          loading={loading}
        />
      </div>

      <div className="dashboard-grid">
        {/* Recent Vehicles */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">🚗 Veículos Recentes</h2>
            <a href="/vehicles" className="card-link">Ver todos →</a>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="loading-container"><div className="spinner" /></div>
            ) : vehicles.length === 0 ? (
              <p className="empty-state">Nenhum veículo cadastrado.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Placa</th>
                    <th>Modelo</th>
                    <th>KM Atual</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.slice(0, 5).map((v) => (
                    <tr key={v.id}>
                      <td><code className="placa">{v.placa}</code></td>
                      <td>{v.modelo}</td>
                      <td>{formatKm(v.km_atual)}</td>
                      <td>
                        <span className={`badge badge-${getStatusColor(v.status)}`}>
                          {getStatusLabel(v.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Alerts */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">⚠️ Alertas de Manutenção</h2>
            <a href="/maintenance" className="card-link">Ver todos →</a>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="loading-container"><div className="spinner" /></div>
            ) : alerts.length === 0 ? (
              <div className="empty-state success-state">
                ✅ Nenhum alerta pendente!
              </div>
            ) : (
              <ul className="alert-list">
                {alerts.slice(0, 6).map((a, i) => (
                  <li key={a.id || i} className={`alert-item alert-item-${getStatusColor(a.severity || 'warning')}`}>
                    <div className="alert-item-icon">
                      {a.severity === 'critico' || a.severity === 'critical' ? '🚨' : '⚠️'}
                    </div>
                    <div className="alert-item-body">
                      <p className="alert-item-title">{a.descricao || a.description || 'Manutenção necessária'}</p>
                      <p className="alert-item-sub">
                        {a.veiculo || a.vehicle_placa || ''} · {formatDate(a.data_prevista || a.due_date)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Recent Drivers */}
      <section className="card mt-card">
        <div className="card-header">
          <h2 className="card-title">👤 Motoristas</h2>
          <a href="/drivers" className="card-link">Ver todos →</a>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="loading-container"><div className="spinner" /></div>
          ) : drivers.length === 0 ? (
            <p className="empty-state">Nenhum motorista cadastrado.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CNH</th>
                  <th>Categoria</th>
                  <th>Telefone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {drivers.slice(0, 5).map((d) => (
                  <tr key={d.id}>
                    <td>{d.nome}</td>
                    <td>{d.cnh}</td>
                    <td><span className="badge badge-info">{d.categoria_cnh}</span></td>
                    <td>{d.telefone || '—'}</td>
                    <td>
                      <span className={`badge badge-${getStatusColor(d.status)}`}>
                        {getStatusLabel(d.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
