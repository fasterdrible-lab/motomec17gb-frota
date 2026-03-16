import React, { useState, useEffect } from 'react';
import { getTarefasCompletas } from '../services/googleSheets';

const STATUS_FILTERS = [
  { key: 'TODAS', label: 'Todas' },
  { key: 'PENDENTE', label: 'Pendente' },
  { key: 'ANDAMENTO', label: 'Em Andamento' },
  { key: 'CONCLUIDA', label: 'Concluída' },
];

function getStatusInfo(status) {
  const s = String(status).toUpperCase();
  if (s.includes('CONCLU')) return { label: status || 'CONCLUÍDA', bg: '#16a34a', color: 'white', key: 'CONCLUIDA' };
  if (s.includes('ANDAMENTO')) return { label: status, bg: '#1d4ed8', color: 'white', key: 'ANDAMENTO' };
  return { label: status || 'PENDENTE', bg: '#dc2626', color: 'white', key: 'PENDENTE' };
}

function Tarefas() {
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODAS');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    getTarefasCompletas()
      .then(data => { setTarefas(data); setLoading(false); })
      .catch(err => { console.error('Erro ao buscar tarefas:', err); setError('Erro ao buscar tarefas. Verifique a conexão.'); setLoading(false); });
  }, []);

  const filtered = tarefas.filter(t => {
    const statusInfo = getStatusInfo(t.status);
    if (filtroStatus !== 'TODAS' && statusInfo.key !== filtroStatus) return false;
    if (busca) {
      const q = busca.toLowerCase();
      return (
        String(t.prefixo).toLowerCase().includes(q) ||
        String(t.placa).toLowerCase().includes(q) ||
        String(t.descricao).toLowerCase().includes(q)
      );
    }
    return true;
  });

  const total = tarefas.length;
  const pendentes = tarefas.filter(t => getStatusInfo(t.status).key === 'PENDENTE').length;
  const emAndamento = tarefas.filter(t => getStatusInfo(t.status).key === 'ANDAMENTO').length;
  const concluidas = tarefas.filter(t => getStatusInfo(t.status).key === 'CONCLUIDA').length;

  return (
    <div>
      <div className="cbmesp-subbar">
        <span>Sistema de Gestão de Frota — Tarefas</span>
      </div>

      <div className="dash-action-bar">
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>📋 Tarefas</h2>
      </div>

      {loading && <div className="dash-loading">⏳ Carregando tarefas...</div>}

      {error && !loading && (
        <div className="dash-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      {!loading && !error && (
        <div style={{ padding: '0 20px 24px' }}>
          {/* Counters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Total', value: total, bg: '#1a1a2e', icon: '📋' },
              { label: 'Pendentes', value: pendentes, bg: '#dc2626', icon: '🔴' },
              { label: 'Em Andamento', value: emAndamento, bg: '#1d4ed8', icon: '🔵' },
              { label: 'Concluídas', value: concluidas, bg: '#16a34a', icon: '🟢' },
            ].map(c => (
              <div key={c.label} style={{
                background: 'white', borderRadius: 10, padding: '16px 20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: `4px solid ${c.bg}`,
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{c.icon}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>{c.value}</div>
                <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 6 }}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFiltroStatus(f.key)}
                  style={{
                    padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    fontWeight: filtroStatus === f.key ? 700 : 400,
                    background: filtroStatus === f.key ? '#1a1a2e' : '#f3f4f6',
                    color: filtroStatus === f.key ? 'white' : '#374151',
                    fontSize: '0.85rem',
                  }}
                >{f.label}</button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Buscar por prefixo, placa ou descrição..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{
                padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db',
                fontSize: '0.88rem', minWidth: 260,
              }}
            />
          </div>

          {/* Table */}
          <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#1a1a2e', color: 'white' }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700 }}>PREFIXO</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700 }}>PLACA</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700 }}>DESCRIÇÃO</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700 }}>RESPONSÁVEL</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700 }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
                      Nenhuma tarefa encontrada.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t, i) => {
                    const badge = getStatusInfo(t.status);
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1a1a2e' }}>{t.prefixo}</td>
                        <td style={{ padding: '10px 14px', color: '#374151' }}>{t.placa || '—'}</td>
                        <td style={{ padding: '10px 14px', color: '#374151' }}>{t.descricao || '—'}</td>
                        <td style={{ padding: '10px 14px', color: '#6b7280' }}>{t.responsavel || '—'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            background: badge.bg, color: badge.color,
                            fontSize: '0.75rem', fontWeight: 700, borderRadius: 12,
                            padding: '3px 10px',
                          }}>{badge.label}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: 8 }}>
              Exibindo {filtered.length} de {total} tarefa(s)
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Tarefas;
