import React from 'react';
import useApi from '../hooks/useApi';
import { getFrotaStatus, getAlertas } from '../services/api';
import Loading from '../components/Loading';
import AlertCard from '../components/AlertCard';
import { formatCurrency, formatDate } from '../utils/formatters';
import '../styles/dashboard.css';

function StatCard({ label, value, icon, variant }) {
  return (
    <div className={`stat-card stat-${variant}`}>
      <span className="stat-icon">{icon}</span>
      <div className="stat-info-content">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: status, loading: loadingStatus, error: errorStatus } = useApi(getFrotaStatus);
  const { data: alertasData, loading: loadingAlertas }               = useApi(getAlertas, { limit: 5 });

  const alertas = Array.isArray(alertasData) ? alertasData : alertasData?.items || [];

  if (loadingStatus) return <Loading text="Carregando dashboard..." />;
  if (errorStatus)   return <p className="text-muted">Erro ao carregar dados: {errorStatus}</p>;

  const total      = status?.total_viaturas      ?? 0;
  const operacional = status?.operacional        ?? 0;
  const manutencao  = status?.manutencao         ?? 0;
  const inativo     = status?.inativo            ?? 0;
  const criticos    = status?.alertas_criticos   ?? 0;
  const pendentes   = status?.manutencoes_pendentes ?? 0;
  const gastosMes   = status?.gastos_mes         ?? 0;

  const opPct   = total ? Math.round((operacional / total) * 100) : 0;
  const manPct  = total ? Math.round((manutencao  / total) * 100) : 0;
  const inaPct  = total ? Math.round((inativo     / total) * 100) : 0;

  const atividades = status?.atividades_recentes || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral da frota — 17º GB</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="dashboard-grid">
        <StatCard label="Total de Viaturas"      value={total}    icon="🚒" variant="primary"  />
        <StatCard label="Alertas Críticos"        value={criticos} icon="🚨" variant="danger"   />
        <StatCard label="Manutenções Pendentes"   value={pendentes}icon="🔧" variant="warning"  />
        <StatCard label="Gastos do Mês"           value={formatCurrency(gastosMes)} icon="💰" variant="success" />
      </div>

      {/* Fleet status bar */}
      <div className="card mb-4">
        <div className="card-header">
          <h3>Status da Frota</h3>
          <span className="text-muted text-small">{total} viaturas no total</span>
        </div>
        <div className="status-bar-container">
          <div className="status-bar">
            <div
              className="status-bar-segment"
              style={{ width: `${opPct}%`,  background: 'var(--color-success)' }}
              title={`Operacional: ${operacional}`}
            />
            <div
              className="status-bar-segment"
              style={{ width: `${manPct}%`, background: 'var(--color-warning)' }}
              title={`Manutenção: ${manutencao}`}
            />
            <div
              className="status-bar-segment"
              style={{ width: `${inaPct}%`, background: 'var(--color-text-muted)' }}
              title={`Inativo: ${inativo}`}
            />
          </div>
          <div className="status-legend">
            <span className="status-legend-item">
              <span className="status-dot" style={{ background: 'var(--color-success)' }} />
              Operacional ({operacional})
            </span>
            <span className="status-legend-item">
              <span className="status-dot" style={{ background: 'var(--color-warning)' }} />
              Manutenção ({manutencao})
            </span>
            <span className="status-legend-item">
              <span className="status-dot" style={{ background: 'var(--color-text-muted)' }} />
              Inativo ({inativo})
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-row">
        {/* Recent alerts */}
        <div className="card">
          <div className="card-header">
            <h3>Alertas Recentes</h3>
          </div>
          {loadingAlertas ? (
            <Loading text="Carregando alertas..." />
          ) : alertas.length === 0 ? (
            <p className="text-muted text-center" style={{ padding: 'var(--spacing-6)' }}>
              ✅ Sem alertas no momento
            </p>
          ) : (
            <div className="alerta-list">
              {alertas.slice(0, 5).map((a) => (
                <AlertCard
                  key={a.id}
                  tipo={a.tipo || a.prioridade}
                  mensagem={a.mensagem}
                  viatura={a.viatura}
                  data={a.created_at || a.data}
                  lido={a.lido}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="card-header">
            <h3>Atividade Recente</h3>
          </div>
          {atividades.length === 0 ? (
            <p className="text-muted text-center" style={{ padding: 'var(--spacing-6)' }}>
              Nenhuma atividade registrada
            </p>
          ) : (
            <div className="activity-list">
              {atividades.map((at, i) => (
                <div key={i} className="activity-item">
                  <span className="activity-icon">{at.icon || '📝'}</span>
                  <div className="activity-content">
                    <p className="activity-message">{at.mensagem}</p>
                    <p className="activity-time">{formatDate(at.data)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
