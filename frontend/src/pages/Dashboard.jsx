import React, { useState, useEffect, useCallback } from 'react';
import { getDashboardMacro, getDashboardAbastecimentos, getDashboardTarefas } from '../services/api';
import '../styles/Dashboard.css';

const REFRESH_INTERVAL = 5 * 60 * 1000;

const CHIP_COLORS = [
  '#CC1F1F', '#1d4ed8', '#15803d', '#7c3aed', '#b45309', '#0e7490', '#be185d', '#374151',
];

function TipoChip({ tipo, count, colorIndex }) {
  const bg = CHIP_COLORS[colorIndex % CHIP_COLORS.length];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: bg, color: 'white', borderRadius: 20,
      padding: '4px 12px', fontSize: '0.85rem', fontWeight: 700,
      margin: '4px',
    }}>
      {tipo} <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 10, padding: '1px 7px' }}>{count}</span>
    </span>
  );
}

function MacroCard({ icon, label, value, sub, variant }) {
  const borderColor = variant === 'alerta' ? '#dc2626' : variant === 'aviso' ? '#d97706' : '#e5e7eb';
  const bgColor = variant === 'alerta' ? '#fff5f5' : variant === 'aviso' ? '#fffbeb' : 'white';
  return (
    <div style={{
      background: bgColor, borderRadius: 10, padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: `4px solid ${borderColor}`,
    }}>
      <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>{sub}</div>}
      <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 6, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function Dashboard() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [ultimaSync, setUltimaSync] = useState(null);
  const [now, setNow] = useState(new Date());
  const [showTarefasPanel, setShowTarefasPanel] = useState(false);
  const [tarefasDetalhadas, setTarefasDetalhadas] = useState([]);
  const [showAbastPanel, setShowAbastPanel] = useState(false);
  const [abastecimentos, setAbastecimentos] = useState([]);
  const [abastLoading, setAbastLoading] = useState(false);
  const [abastBusca, setAbastBusca] = useState('');

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setSyncing(true);
    setError('');
    try {
      const data = await getDashboardMacro();
      setDados(data);
      setUltimaSync(new Date());
    } catch (e) {
      setError('Erro ao buscar dados do servidor. Verifique a conexão.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const iv = setInterval(() => loadData(), REFRESH_INTERVAL);
    return () => clearInterval(iv);
  }, [loadData]);

  const fmtMoeda = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const dataHora = now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
    + ', ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      {/* Sub-barra */}
      <div className="cbmesp-subbar">
        <span>Sistema de Gestão de Frota — Dashboard</span>
        <span>{dataHora}</span>
      </div>

      {/* Barra de ação */}
      <div className="dash-action-bar">
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>📊 Dashboard</h2>
        <button className="btn-sincronizar" onClick={() => loadData(true)} disabled={syncing}>
          {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar'}
        </button>
        <button
          className="btn-sincronizar"
          onClick={() => {
            setShowAbastPanel(true);
            if (abastecimentos.length === 0) {
              setAbastLoading(true);
              getDashboardAbastecimentos()
                .then(setAbastecimentos)
                .catch(err => console.error('Erro ao carregar abastecimentos:', err))
                .finally(() => setAbastLoading(false));
            }
          }}
          style={{ background: '#0e7490' }}
        >
          ⛽ Abastecimentos
        </button>
        {ultimaSync && (
          <span className="sync-info">
            Última sincronização: {ultimaSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {loading && <div className="dash-loading">⏳ Carregando dados do servidor...</div>}

      {error && !loading && (
        <div className="dash-error">
          <span>⚠️ {error}</span>
          <button className="btn-sincronizar" onClick={() => loadData(true)} style={{ marginLeft: 'auto' }}>
            🔄 Tentar novamente
          </button>
        </div>
      )}

      {!loading && dados && (
        <div style={{ padding: '0 20px 24px' }}>

          {/* LINHA 1 — Status da Frota */}
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
            Status da Frota
          </div>
          <div className="dash-macro-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
            <MacroCard icon="🟢" label="Operando" value={dados.frota.operando} />
            <MacroCard icon="🔴" label="Baixadas" value={dados.frota.baixadas} variant={dados.frota.baixadas > 0 ? 'alerta' : undefined} />
            <MacroCard icon="⏸️" label="Reserva" value={dados.frota.reserva} />
            <MacroCard icon="🚒" label="Total de Viaturas" value={dados.frota.total} />
          </div>

          {/* LINHA 2 — Indicadores Macro */}
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
            Indicadores Macro
          </div>
          <div className="dash-macro-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
            <MacroCard
              icon="🔔"
              label="Total de Alertas"
              value={dados.totalAlertas}
              variant={dados.totalAlertas > 0 ? 'alerta' : undefined}
            />
            <div
              onClick={() => {
                setShowTarefasPanel(true);
                if (tarefasDetalhadas.length === 0) {
                  getDashboardTarefas().then(setTarefasDetalhadas).catch(err => console.error('Erro ao carregar tarefas:', err));
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <MacroCard
                icon="📋"
                label="Tarefas Pendentes — clique para ver"
                value={dados.tarefasPendentes}
                variant={dados.tarefasPendentes > 0 ? 'aviso' : undefined}
              />
            </div>
            <MacroCard
              icon="🔧"
              label="Manutenções Realizadas"
              value={dados.manutencoesRealizadas}
            />
            <MacroCard
              icon="💰"
              label="Gasto Total Manutenções"
              value={fmtMoeda(dados.gastoTotal)}
            />
          </div>

          {/* LINHA 2b — Abastecimentos e FCD */}
          <div className="dash-macro-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
            <MacroCard
              icon="⛽"
              label="Último Abastecimento"
              value={dados.abastecimentos?.ultimoData || '—'}
              sub={dados.abastecimentos?.ultimoPrefixo && dados.abastecimentos.ultimoPrefixo !== '—'
                ? `Prefixo: ${dados.abastecimentos.ultimoPrefixo} — ${fmtMoeda(dados.abastecimentos.ultimoValor)}`
                : '—'}
            />
            <MacroCard
              icon="🛢️"
              label="Abastecimentos Registrados"
              value={dados.abastecimentos?.total ?? 0}
              sub={dados.abastecimentos?.gastoTotal > 0 ? `${fmtMoeda(dados.abastecimentos.gastoTotal)} total gasto` : '—'}
            />
            <MacroCard
              icon="📅"
              label="FCD — Registros Hoje / Total"
              value={`${dados.fcd?.hoje ?? 0} / ${dados.fcd?.total ?? 0}`}
              sub={dados.fcd?.total > 0 ? `${dados.fcd.total} registros totais` : 'Sem registros'}
            />
          </div>

          {/* LINHA 3 — Destaques */}
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
            Destaques
          </div>
          <div className="dash-highlight-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
            <MacroCard
              icon="🏆"
              label="Viatura que Mais Gastou"
              value={dados.viaturaTopGasto.valor > 0 ? dados.viaturaTopGasto.prefixo : '—'}
              sub={dados.viaturaTopGasto.valor > 0 ? fmtMoeda(dados.viaturaTopGasto.valor) : '—'}
            />
            <MacroCard
              icon="👴"
              label="Viatura Mais Velha da Frota"
              value={dados.viaturasMaisVelha.prefixo}
              sub={dados.viaturasMaisVelha.ano !== '—' ? `Ano: ${dados.viaturasMaisVelha.ano}` : '—'}
            />
            <div style={{ background: 'white', borderRadius: 10, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #e5e7eb' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>📝</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1a1a2e', marginBottom: 10 }}>Ordens de Serviço</div>
              {dados.os.total === 0 ? (
                <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Sem O.S. cadastradas</div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '4px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span>🟡 Abertas</span><strong>{dados.os.aberta}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '4px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span>🔵 Em Andamento</span><strong>{dados.os.andamento}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '4px 0' }}>
                    <span>🟢 Fechadas</span><strong>{dados.os.fechada}</strong>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* LINHA 4 — Tipos de Viatura */}
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
            Tipos de Viatura na Frota
          </div>
          <div style={{ background: 'white', borderRadius: 10, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            {Object.keys(dados.tiposViatura).length === 0 ? (
              <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Nenhum dado disponível</span>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {Object.entries(dados.tiposViatura)
                  .sort((a, b) => b[1] - a[1])
                  .map(([tipo, count], idx) => (
                    <TipoChip key={tipo} tipo={tipo} count={count} colorIndex={idx} />
                  ))}
              </div>
            )}
          </div>

        </div>
      )}

      {showTarefasPanel && (
        <div style={{
          position: 'fixed', top: 0, right: 0, width: 480, height: '100vh',
          background: 'white', boxShadow: '-4px 0 24px rgba(0,0,0,0.18)',
          zIndex: 1000, display: 'flex', flexDirection: 'column', overflowY: 'auto',
        }}>
          <div style={{
            background: '#1a1a2e', color: 'white', padding: '16px 20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            position: 'sticky', top: 0, zIndex: 1,
          }}>
            <strong style={{ fontSize: '1rem' }}>📋 Tarefas Pendentes</strong>
            <button
              onClick={() => setShowTarefasPanel(false)}
              style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.4rem', cursor: 'pointer' }}
            >✕</button>
          </div>
          <div style={{ padding: 16 }}>
            {tarefasDetalhadas.length === 0 ? (
              <div style={{ color: '#9ca3af', padding: 20, textAlign: 'center' }}>⏳ Carregando tarefas...</div>
            ) : (
              tarefasDetalhadas
                .filter(t => !String(t.status).toUpperCase().includes('CONCLU'))
                .map((t, i) => (
                  <div key={i} style={{
                    background: '#f9fafb', borderRadius: 8, padding: '12px 14px',
                    marginBottom: 10, borderLeft: `4px solid ${t.status ? '#d97706' : '#9ca3af'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong style={{ color: '#1a1a2e', fontSize: '0.92rem' }}>{t.prefixo}</strong>
                      <span style={{
                        background: t.status ? '#fef3c7' : '#f3f4f6',
                        color: t.status ? '#92400e' : '#6b7280',
                        padding: '2px 8px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600,
                      }}>
                        {t.status || 'SEM STATUS'}
                      </span>
                    </div>
                    {t.placa && <div style={{ color: '#6b7280', fontSize: '0.78rem' }}>🚗 {t.placa}</div>}
                    {t.descricao && <div style={{ color: '#374151', fontSize: '0.85rem', marginTop: 4 }}>{t.descricao}</div>}
                    {t.responsavel && <div style={{ color: '#6b7280', fontSize: '0.78rem', marginTop: 4 }}>👤 {t.responsavel}</div>}
                  </div>
                ))
            )}
          </div>
        </div>
      )}
      {showTarefasPanel && (
        <div
          onClick={() => setShowTarefasPanel(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 999 }}
        />
      )}

      {/* Abastecimentos Panel */}
      {showAbastPanel && (
        <>
          <div
            onClick={() => setShowAbastPanel(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 999 }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, width: 520, height: '100vh',
            background: 'white', boxShadow: '-4px 0 24px rgba(0,0,0,0.18)',
            zIndex: 1000, display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              background: '#0e7490', color: 'white', padding: '16px 20px',
              display: 'flex', flexDirection: 'column', gap: 8,
              position: 'sticky', top: 0, zIndex: 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '1rem' }}>⛽ Abastecimentos</strong>
                <button
                  onClick={() => setShowAbastPanel(false)}
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.4rem', cursor: 'pointer' }}
                >✕</button>
              </div>
              {abastecimentos.length > 0 && (
                <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', opacity: 0.9 }}>
                  <span>📋 {abastecimentos.length} registros</span>
                  <span>💧 {abastecimentos.reduce((s, a) => s + a.litros, 0).toFixed(1)} L total</span>
                  <span>💰 {fmtMoeda(abastecimentos.reduce((s, a) => s + a.valorTotal, 0))}</span>
                </div>
              )}
              <input
                value={abastBusca}
                onChange={e => setAbastBusca(e.target.value)}
                placeholder="🔍 Buscar por prefixo, placa ou posto..."
                style={{
                  padding: '6px 10px', borderRadius: 6, border: 'none',
                  fontSize: '0.85rem', width: '100%', boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: 16 }}>
              {abastLoading ? (
                <div style={{ color: '#9ca3af', padding: 20, textAlign: 'center' }}>⏳ Carregando abastecimentos...</div>
              ) : abastecimentos.length === 0 ? (
                <div style={{ color: '#9ca3af', padding: 20, textAlign: 'center' }}>Nenhum abastecimento registrado.</div>
              ) : (
                abastecimentos
                  .filter(a => {
                    if (!abastBusca) return true;
                    const b = abastBusca.toLowerCase();
                    return (
                      String(a.prefixo).toLowerCase().includes(b) ||
                      String(a.placa).toLowerCase().includes(b) ||
                      String(a.posto).toLowerCase().includes(b)
                    );
                  })
                  .map((a, i) => (
                    <div key={i} style={{
                      background: '#f0fdfa', borderRadius: 8, padding: '12px 14px',
                      marginBottom: 10, borderLeft: '4px solid #0e7490',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <strong style={{ color: '#1a1a2e', fontSize: '0.92rem' }}>{a.prefixo}</strong>
                        <span style={{ color: '#0e7490', fontWeight: 700, fontSize: '0.9rem' }}>
                          {fmtMoeda(a.valorTotal)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem', color: '#6b7280', flexWrap: 'wrap' }}>
                        {a.data && <span>📅 {a.data}</span>}
                        {a.placa && <span>🚗 {a.placa}</span>}
                        {a.km && <span>📏 {a.km} km</span>}
                        {a.litros > 0 && <span>💧 {a.litros} L</span>}
                        {a.posto && <span>⛽ {a.posto}</span>}
                      </div>
                      {a.obs && <div style={{ color: '#374151', fontSize: '0.8rem', marginTop: 4 }}>{a.obs}</div>}
                    </div>
                  ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
