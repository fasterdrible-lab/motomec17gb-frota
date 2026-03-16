import React, { useState, useEffect, useCallback } from 'react';
import { getDashboardMacro, getTarefasCompletas } from '../services/googleSheets';
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

function MacroCard({ icon, label, value, sub, variant, onClick, clickable }) {
  const borderColor = variant === 'alerta' ? '#dc2626' : variant === 'aviso' ? '#d97706' : '#e5e7eb';
  const bgColor = variant === 'alerta' ? '#fff5f5' : variant === 'aviso' ? '#fffbeb' : 'white';
  return (
    <div
      onClick={onClick}
      style={{
        background: bgColor, borderRadius: 10, padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: `4px solid ${borderColor}`,
        cursor: clickable ? 'pointer' : 'default',
        transition: clickable ? 'box-shadow 0.15s, transform 0.1s' : undefined,
      }}
      onMouseEnter={e => { if (clickable) { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.16)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
      onMouseLeave={e => { if (clickable) { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = ''; } }}
    >
      <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>{sub}</div>}
      <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 6, fontWeight: 500 }}>{label}</div>
      {clickable && <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>Clique para detalhes →</div>}
    </div>
  );
}

function statusBadge(status) {
  const s = String(status).toUpperCase();
  if (s.includes('CONCLU')) return { label: status || 'CONCLUÍDA', bg: '#16a34a', color: 'white' };
  if (s.includes('ANDAMENTO')) return { label: status, bg: '#1d4ed8', color: 'white' };
  if (s.includes('PENDENTE')) return { label: status, bg: '#dc2626', color: 'white' };
  return { label: status || 'PENDENTE', bg: '#6b7280', color: 'white' };
}

function TarefasPanel({ onClose }) {
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    getTarefasCompletas().then(data => { setTarefas(data); setLoading(false); }).catch(err => { console.error('Erro ao carregar tarefas:', err); setLoading(false); });
  }, []);

  const filtered = tarefas.filter(t => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return (
      String(t.prefixo).toLowerCase().includes(q) ||
      String(t.descricao).toLowerCase().includes(q) ||
      String(t.placa).toLowerCase().includes(q)
    );
  });

  const pendentes = tarefas.filter(t => !String(t.status).toUpperCase().includes('CONCLU'));

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000,
        }}
      />
      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, maxWidth: '95vw',
        background: 'white', zIndex: 1001, display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.18)',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px', borderBottom: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#1a1a2e', color: 'white',
        }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>📋 Tarefas Pendentes</div>
            {!loading && <div style={{ fontSize: '0.78rem', color: '#d1d5db', marginTop: 2 }}>{pendentes.length} pendente(s) de {tarefas.length} total</div>}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
              borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: '1rem',
            }}
          >✕</button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
          <input
            type="text"
            placeholder="Buscar por prefixo, placa ou descrição..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db',
              fontSize: '0.88rem', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {loading && <div style={{ color: '#6b7280', textAlign: 'center', marginTop: 40 }}>⏳ Carregando tarefas...</div>}
          {!loading && filtered.length === 0 && (
            <div style={{ color: '#6b7280', textAlign: 'center', marginTop: 40 }}>Nenhuma tarefa encontrada.</div>
          )}
          {!loading && filtered.map((t, i) => {
            const badge = statusBadge(t.status);
            return (
              <div key={i} style={{
                background: '#f9fafb', borderRadius: 8, padding: '12px 14px', marginBottom: 10,
                borderLeft: `4px solid ${badge.bg}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a2e' }}>{t.prefixo}</span>
                    {t.placa && <span style={{ color: '#6b7280', fontSize: '0.82rem', marginLeft: 8 }}>{t.placa}</span>}
                  </div>
                  <span style={{
                    background: badge.bg, color: badge.color,
                    fontSize: '0.72rem', fontWeight: 700, borderRadius: 12,
                    padding: '2px 10px', whiteSpace: 'nowrap',
                  }}>{badge.label}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#374151' }}>{t.descricao || '—'}</div>
                {t.responsavel && <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 4 }}>Responsável: {t.responsavel}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </>
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
      setError('Erro ao buscar dados da planilha. Verifique a conexão.');
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
      {showTarefasPanel && <TarefasPanel onClose={() => setShowTarefasPanel(false)} />}
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
        {ultimaSync && (
          <span className="sync-info">
            Última sincronização: {ultimaSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
            <MacroCard
              icon="📋"
              label="Tarefas Pendentes"
              value={dados.tarefasPendentes}
              variant={dados.tarefasPendentes > 0 ? 'aviso' : undefined}
              onClick={() => setShowTarefasPanel(true)}
              clickable
            />
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
    </div>
  );
}

export default Dashboard;
