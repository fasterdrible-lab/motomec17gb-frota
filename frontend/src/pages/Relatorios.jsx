import React, { useState } from 'react';
import useApi from '../hooks/useApi';
import { getRelatorioMensal, getRelatorioAnual, getFrotaStatus } from '../services/api';
import Loading from '../components/Loading';
import { formatCurrency, formatDate, currentYear, currentMonth } from '../utils/formatters';
import { MESES } from '../services/constants';

export default function Relatorios() {
  const now = new Date();
  const [mes, setMes]   = useState(currentMonth());
  const [ano, setAno]   = useState(currentYear());
  const [tab, setTab]   = useState('mensal');

  const { data: mensal, loading: loadingM, error: errorM, refetch: refetchM } =
    useApi(getRelatorioMensal, mes, ano);
  const { data: anual, loading: loadingA, error: errorA, refetch: refetchA } =
    useApi(getRelatorioAnual, ano);
  const { data: status, loading: loadingS } = useApi(getFrotaStatus);

  const anos = Array.from({ length: 5 }, (_, i) => currentYear() - i);

  function handlePrint() {
    window.print();
  }

  function Section({ title, children }) {
    return (
      <div className="card mb-4">
        <div className="card-header"><h3>{title}</h3></div>
        {children}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Relatórios</h1>
          <p className="page-subtitle">Análise e exportação de dados da frota</p>
        </div>
        <button className="btn btn-outline" onClick={handlePrint} type="button">
          🖨️ Imprimir
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-5)', borderBottom: '2px solid var(--color-border)' }}>
        {[
          { key: 'mensal',  label: 'Mensal'         },
          { key: 'anual',   label: 'Anual'           },
          { key: 'frota',   label: 'Status da Frota' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={{
              padding: 'var(--spacing-2) var(--spacing-4)',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: tab === t.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: tab === t.key ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-2px',
              background: 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Period selector */}
      {(tab === 'mensal' || tab === 'anual') && (
        <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'flex-end', marginBottom: 'var(--spacing-5)', flexWrap: 'wrap' }}>
          {tab === 'mensal' && (
            <div className="form-group">
              <label className="form-label">Mês</label>
              <select className="form-control" value={mes} onChange={(e) => setMes(Number(e.target.value))}>
                {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Ano</label>
            <select className="form-control" value={ano} onChange={(e) => setAno(Number(e.target.value))}>
              {anos.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={() => { tab === 'mensal' ? refetchM() : refetchA(); }}
          >
            🔄 Atualizar
          </button>
        </div>
      )}

      {/* Mensal */}
      {tab === 'mensal' && (
        <>
          {loadingM ? <Loading text="Gerando relatório mensal..." /> :
           errorM   ? <p className="text-muted">Erro: {errorM}</p> :
           !mensal  ? <p className="text-muted">Nenhum dado disponível</p> : (
            <>
              <Section title={`Resumo — ${MESES[mes - 1]} / ${ano}`}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-4)', padding: 'var(--spacing-2) 0' }}>
                  {[
                    { label: 'Total de Gastos',       value: formatCurrency(mensal.total_gastos),       icon: '💰' },
                    { label: 'Gasto c/ Combustível',  value: formatCurrency(mensal.gasto_combustivel),  icon: '⛽' },
                    { label: 'Gasto c/ Manutenção',   value: formatCurrency(mensal.gasto_manutencao),   icon: '🔧' },
                    { label: 'Abastecimentos',         value: mensal.total_abastecimentos ?? 0,          icon: '🔢' },
                    { label: 'Manutenções Realizadas', value: mensal.total_manutencoes ?? 0,             icon: '✅' },
                  ].map((item) => (
                    <div key={item.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem' }}>{item.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: '1.2rem', margin: '4px 0' }}>{item.value}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </Section>

              {mensal.por_viatura && mensal.por_viatura.length > 0 && (
                <Section title="Gastos por Viatura">
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Viatura</th>
                          <th>Combustível</th>
                          <th>Manutenção</th>
                          <th>Outros</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mensal.por_viatura.map((v) => (
                          <tr key={v.prefixo || v.viatura_id}>
                            <td style={{ fontWeight: 600, fontFamily: 'Courier New, monospace' }}>{v.prefixo}</td>
                            <td>{formatCurrency(v.combustivel)}</td>
                            <td>{formatCurrency(v.manutencao)}</td>
                            <td>{formatCurrency(v.outros)}</td>
                            <td style={{ fontWeight: 700 }}>{formatCurrency(v.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
              )}
            </>
          )}
        </>
      )}

      {/* Anual */}
      {tab === 'anual' && (
        <>
          {loadingA ? <Loading text="Gerando relatório anual..." /> :
           errorA   ? <p className="text-muted">Erro: {errorA}</p> :
           !anual   ? <p className="text-muted">Nenhum dado disponível</p> : (
            <>
              <Section title={`Resumo Anual — ${ano}`}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-4)', padding: 'var(--spacing-2) 0' }}>
                  {[
                    { label: 'Total de Gastos',  value: formatCurrency(anual.total_gastos), icon: '💰' },
                    { label: 'Abastecimentos',   value: anual.total_abastecimentos ?? 0,    icon: '⛽' },
                    { label: 'Manutenções',      value: anual.total_manutencoes ?? 0,       icon: '🔧' },
                  ].map((item) => (
                    <div key={item.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem' }}>{item.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: '1.2rem', margin: '4px 0' }}>{item.value}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </Section>

              {anual.por_mes && anual.por_mes.length > 0 && (
                <Section title="Gastos por Mês">
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Mês</th>
                          <th>Combustível</th>
                          <th>Manutenção</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {anual.por_mes.map((m) => (
                          <tr key={m.mes}>
                            <td>{MESES[(m.mes || 1) - 1]}</td>
                            <td>{formatCurrency(m.combustivel)}</td>
                            <td>{formatCurrency(m.manutencao)}</td>
                            <td style={{ fontWeight: 700 }}>{formatCurrency(m.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
              )}
            </>
          )}
        </>
      )}

      {/* Fleet status */}
      {tab === 'frota' && (
        <>
          {loadingS ? <Loading text="Carregando status..." /> : !status ? null : (
            <Section title="Status Atual da Frota">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-4)', padding: 'var(--spacing-2) 0' }}>
                {[
                  { label: 'Total de Viaturas', value: status.total_viaturas ?? 0,    icon: '🚒' },
                  { label: 'Operacionais',       value: status.operacional    ?? 0,    icon: '✅' },
                  { label: 'Em Manutenção',      value: status.manutencao     ?? 0,    icon: '🔧' },
                  { label: 'Inativas',           value: status.inativo        ?? 0,    icon: '⛔' },
                  { label: 'Alertas Críticos',   value: status.alertas_criticos ?? 0,  icon: '🚨' },
                ].map((item) => (
                  <div key={item.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem' }}>{item.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '1.5rem', margin: '4px 0' }}>{item.value}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}
