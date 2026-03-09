import React, { useState, useEffect } from 'react';
import { getVehicles, getDrivers, getMaintenance, exportToSheets } from '../services/api';
import { formatCurrency, formatKm, getStatusColor, getStatusLabel } from '../utils/helpers';
import './Reports.css';

function StatBlock({ icon, label, value, note }) {
  return (
    <div className="report-stat">
      <span className="report-stat-icon">{icon}</span>
      <div>
        <p className="report-stat-value">{value}</p>
        <p className="report-stat-label">{label}</p>
        {note && <p className="report-stat-note">{note}</p>}
      </div>
    </div>
  );
}

export default function Reports() {
  const [vehicles, setVehicles]     = useState([]);
  const [drivers, setDrivers]       = useState([]);
  const [maintenance, setMaint]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [exporting, setExporting]   = useState(false);
  const [exportMsg, setExportMsg]   = useState(null);
  const [error, setError]           = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const [v, d, m] = await Promise.all([
          getVehicles().catch(() => []),
          getDrivers().catch(() => []),
          getMaintenance().catch(() => []),
        ]);
        if (!cancelled) {
          setVehicles(Array.isArray(v) ? v : v?.items ?? []);
          setDrivers(Array.isArray(d) ? d : d?.items ?? []);
          setMaint(Array.isArray(m) ? m : m?.items ?? []);
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

  const handleExport = async () => {
    try {
      setExporting(true);
      setExportMsg(null);
      const result = await exportToSheets();
      setExportMsg({ type: 'success', text: result?.message || 'Dados exportados com sucesso!' });
    } catch (err) {
      setExportMsg({ type: 'error', text: err.message });
    } finally {
      setExporting(false);
    }
  };

  const totalCost     = maintenance.reduce((s, m) => s + (Number(m.custo) || 0), 0);
  const avgCost       = maintenance.length ? totalCost / maintenance.length : 0;
  const pendingMaint  = maintenance.filter((m) => m.status === 'pendente').length;
  const doneMaint     = maintenance.filter((m) => m.status === 'concluido').length;
  const activeVehicles = vehicles.filter((v) => v.status === 'ativo' || v.status === 'disponivel').length;
  const activeDrivers  = drivers.filter((d) => d.status === 'ativo').length;

  const typeCounts = maintenance.reduce((acc, m) => {
    acc[m.tipo] = (acc[m.tipo] || 0) + 1;
    return acc;
  }, {});

  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📈 Relatórios</h1>
          <p className="page-subtitle">Visão analítica da sua frota</p>
        </div>
        <button
          className="btn btn-success"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? '⏳ Exportando…' : '📊 Exportar para Google Sheets'}
        </button>
      </div>

      {exportMsg && (
        <div className={`alert alert-${exportMsg.type}`}>
          {exportMsg.type === 'success' ? '✅' : '⚠️'} {exportMsg.text}
        </div>
      )}
      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {/* KPI Cards */}
      <section className="report-section">
        <h2 className="section-title">Indicadores Gerais</h2>
        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : (
          <div className="report-stats-grid">
            <StatBlock icon="🚗" label="Total de Veículos"  value={vehicles.length}  note={`${activeVehicles} ativos`} />
            <StatBlock icon="👤" label="Total de Motoristas" value={drivers.length}   note={`${activeDrivers} ativos`} />
            <StatBlock icon="🔧" label="Manutenções Totais"  value={maintenance.length} note={`${pendingMaint} pendentes`} />
            <StatBlock icon="✅" label="Manutenções Concluídas" value={doneMaint} />
            <StatBlock icon="💰" label="Custo Total"         value={formatCurrency(totalCost)} note={`Média: ${formatCurrency(avgCost)}`} />
            <StatBlock icon="🏆" label="Tipo Mais Frequente" value={topType ? topType[0] : '—'} note={topType ? `${topType[1]} vez(es)` : ''} />
          </div>
        )}
      </section>

      {/* Maintenance by Type */}
      <section className="report-section">
        <h2 className="section-title">Manutenção por Tipo</h2>
        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : Object.keys(typeCounts).length === 0 ? (
          <p className="empty-state">Nenhum registro de manutenção.</p>
        ) : (
          <div className="report-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Quantidade</th>
                  <th>% do Total</th>
                  <th>Barra</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(typeCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([tipo, count]) => {
                    const pct = maintenance.length ? Math.round((count / maintenance.length) * 100) : 0;
                    return (
                      <tr key={tipo}>
                        <td className="text-capitalize">{tipo}</td>
                        <td>{count}</td>
                        <td>{pct}%</td>
                        <td>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Vehicle Status Breakdown */}
      <section className="report-section">
        <h2 className="section-title">Status dos Veículos</h2>
        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : vehicles.length === 0 ? (
          <p className="empty-state">Nenhum veículo cadastrado.</p>
        ) : (
          <div className="status-grid">
            {Object.entries(
              vehicles.reduce((acc, v) => {
                const s = v.status || 'indefinido';
                acc[s] = (acc[s] || 0) + 1;
                return acc;
              }, {})
            ).map(([status, count]) => (
              <div key={status} className={`status-card badge-${getStatusColor(status)}`}>
                <span className="status-count">{count}</span>
                <span className="status-label">{getStatusLabel(status)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cost by Vehicle */}
      <section className="report-section">
        <h2 className="section-title">Custo de Manutenção por Veículo</h2>
        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : maintenance.length === 0 ? (
          <p className="empty-state">Nenhum registro de manutenção.</p>
        ) : (
          <div className="report-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Veículo (ID)</th>
                  <th>Quantidade de Serviços</th>
                  <th>Custo Total</th>
                  <th>Custo Médio</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(
                  maintenance.reduce((acc, m) => {
                    const key = m.vehicle_id || 'N/A';
                    if (!acc[key]) acc[key] = { count: 0, total: 0 };
                    acc[key].count += 1;
                    acc[key].total += Number(m.custo) || 0;
                    return acc;
                  }, {})
                )
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([vehicleId, stats]) => (
                    <tr key={vehicleId}>
                      <td>#{vehicleId}</td>
                      <td>{stats.count}</td>
                      <td>{formatCurrency(stats.total)}</td>
                      <td>{formatCurrency(stats.total / stats.count)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
