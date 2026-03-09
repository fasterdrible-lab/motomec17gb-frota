import React, { useState, useEffect } from 'react';
import { getFrotaStatus, getRelatorioDiario, getRelatorioAnual } from '../services/api';

function Relatorios() {
  const [frotaStatus, setFrotaStatus] = useState(null);
  const [diario, setDiario] = useState(null);
  const [anual, setAnual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const now = new Date();
  const currentYear = now.getFullYear();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statusRes, diarioRes, anualRes] = await Promise.allSettled([
          getFrotaStatus(),
          getRelatorioDiario(),
          getRelatorioAnual(currentYear),
        ]);
        if (statusRes.status === 'fulfilled') setFrotaStatus(statusRes.value.data);
        if (diarioRes.status === 'fulfilled') setDiario(diarioRes.value.data);
        if (anualRes.status === 'fulfilled') setAnual(anualRes.value.data);
      } catch (e) {
        setError('Erro ao carregar relatórios.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentYear]);

  const handleExportar = () => {
    const lines = [
      '================================================',
      'MOTOTEC 17º GB — RELATÓRIO DO SISTEMA DE FROTA',
      '================================================',
      `Data/Hora: ${now.toLocaleString('pt-BR')}`,
      '',
      '--- STATUS DA FROTA ---',
      `Total de Viaturas: ${frotaStatus?.total_viaturas ?? 'N/A'}`,
      `Operando:          ${frotaStatus?.operando ?? 'N/A'}`,
      `Em Manutenção:     ${frotaStatus?.em_manutencao ?? 'N/A'}`,
      `Baixadas:          ${frotaStatus?.baixadas ?? 'N/A'}`,
      `Reserva:           ${frotaStatus?.reserva ?? 'N/A'}`,
      '',
      '--- ALERTAS ---',
      `Alertas Críticos:  ${frotaStatus?.alertas_criticos ?? 'N/A'}`,
      `Alertas Pendentes: ${frotaStatus?.alertas_pendentes ?? 'N/A'}`,
      '',
      '================================================',
      'Gerado pelo Sistema Mototec 17º GB v2.0',
      '================================================',
    ];
    const text = lines.join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-frota-${now.toLocaleDateString('pt-BR').replace(/\//g, '-')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderKvTable = (data) => {
    if (!data || typeof data !== 'object') return <div className="empty-state">Dados não disponíveis.</div>;
    const entries = Object.entries(data).filter(([, v]) => typeof v !== 'object');
    if (entries.length === 0) return <div className="empty-state">Dados não disponíveis.</div>;
    return (
      <table className="data-table">
        <thead>
          <tr><th>Métrica</th><th>Valor</th></tr>
        </thead>
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key}>
              <td>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
              <td>{typeof value === 'number' ? value.toLocaleString('pt-BR') : String(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div>
      <div className="section-header">
        <h1 className="page-title" style={{ margin: 0 }}>Relatórios e KPIs</h1>
        <button className="btn-primary" onClick={handleExportar}>⬇️ Exportar Relatório</button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {frotaStatus && (
        <div className="kpi-grid mb-24" style={{ marginBottom: 24 }}>
          <div className="stat-card primary">
            <div className="stat-card-icon">🚗</div>
            <div className="stat-card-label">Total Viaturas</div>
            <div className="stat-card-value">{frotaStatus.total_viaturas ?? '—'}</div>
          </div>
          <div className="stat-card success">
            <div className="stat-card-icon">✅</div>
            <div className="stat-card-label">Operando</div>
            <div className="stat-card-value">{frotaStatus.operando ?? '—'}</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-card-icon">🔧</div>
            <div className="stat-card-label">Em Manutenção</div>
            <div className="stat-card-value">{frotaStatus.em_manutencao ?? '—'}</div>
          </div>
          <div className="stat-card danger">
            <div className="stat-card-icon">🔴</div>
            <div className="stat-card-label">Baixadas</div>
            <div className="stat-card-value">{frotaStatus.baixadas ?? '—'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">⚠️</div>
            <div className="stat-card-label">Alertas Críticos</div>
            <div className="stat-card-value">{frotaStatus.alertas_criticos ?? '—'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">📋</div>
            <div className="stat-card-label">Alertas Pendentes</div>
            <div className="stat-card-value">{frotaStatus.alertas_pendentes ?? '—'}</div>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card">
          <h3 className="section-title" style={{ marginBottom: 16 }}>📅 Relatório Diário</h3>
          {diario ? renderKvTable(diario) : <div className="empty-state">Dados não disponíveis.</div>}
        </div>
        <div className="card">
          <h3 className="section-title" style={{ marginBottom: 16 }}>📆 Relatório Anual {currentYear}</h3>
          {anual ? renderKvTable(anual) : <div className="empty-state">Dados não disponíveis.</div>}
        </div>
      </div>
    </div>
  );
}

export default Relatorios;
