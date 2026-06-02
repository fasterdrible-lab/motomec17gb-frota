import React, { useState, useEffect, useCallback } from 'react';
import { getTarefasCompletas } from '../services/googleSheets';

const STATUS_COLORS = {
  PENDENTE: { bg: '#fef3c7', color: '#92400e', border: '#d97706' },
  ANDAMENTO: { bg: '#dbeafe', color: '#1e40af', border: '#2563eb' },
  CONCLUIDA: { bg: '#dcfce7', color: '#166534', border: '#16a34a' },
  '': { bg: '#f3f4f6', color: '#6b7280', border: '#9ca3af' },
};

function getStatusKey(task) {
  const u = String(task?.statusKey || task?.status || '').toUpperCase();
  if (u.includes('CONCLU')) return 'CONCLUIDA';
  if (u.includes('ANDAM')) return 'ANDAMENTO';
  if (u.includes('PENDENTE')) return 'PENDENTE';
  return '';
}

export default function Tarefas() {
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('TODAS');
  const [busca, setBusca] = useState('');

  const loadTarefas = useCallback(async (isManual = false) => {
    if (isManual) setSyncing(true);
    else setLoading(true);
    try {
      const data = await getTarefasCompletas();
      setTarefas(data);
    } catch (err) {
      console.error('Erro ao carregar tarefas:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => { loadTarefas(); }, [loadTarefas]);

  const filtradas = tarefas.filter(t => {
    const sk = getStatusKey(t);
    if (filtroStatus === 'PENDENTE' && sk !== 'PENDENTE' && sk !== '') return false;
    if (filtroStatus === 'ANDAMENTO' && sk !== 'ANDAMENTO') return false;
    if (filtroStatus === 'CONCLUIDA' && sk !== 'CONCLUIDA') return false;
    if (busca) {
      const b = busca.toLowerCase();
      return (
        t.prefixo?.toLowerCase().includes(b) ||
        t.placa?.toLowerCase().includes(b) ||
        t.descricao?.toLowerCase().includes(b)
      );
    }
    return true;
  });

  const total = tarefas.length;
  const pendentes = tarefas.filter(t => {
    const sk = getStatusKey(t);
    return sk === 'PENDENTE' || sk === '';
  }).length;
  const andamento = tarefas.filter(t => getStatusKey(t) === 'ANDAMENTO').length;
  const concluidas = tarefas.filter(t => getStatusKey(t) === 'CONCLUIDA').length;

  return (
    <div style={{ padding: '0 0 32px' }}>
      <div style={{ background: '#1a1a1a', padding: '8px 20px', color: 'white', fontSize: '0.9rem' }}>
        Sistema de Gestão de Frota — Tarefas
      </div>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>
            📋 Tarefas
          </h2>
          <button
            onClick={() => loadTarefas(true)}
            disabled={syncing}
            style={{
              background: '#1a1a2e', color: 'white', border: 'none', borderRadius: 6,
              padding: '8px 16px', cursor: syncing ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem', fontWeight: 600, opacity: syncing ? 0.7 : 1,
            }}
          >
            {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar'}
          </button>
        </div>

        {/* Contadores */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total de Tarefas', value: total, color: '#2563eb' },
            { label: 'Pendentes', value: pendentes, color: '#d97706' },
            { label: 'Andamento', value: andamento, color: '#2563eb' },
            { label: 'Concluídas', value: concluidas, color: '#16a34a' },
          ].map(c => (
            <div key={c.label} style={{
              background: 'white', borderRadius: 8, padding: '14px 18px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderTop: `3px solid ${c.color}`,
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e' }}>{c.value}</div>
              <div style={{ color: '#6b7280', fontSize: '0.82rem' }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="🔍 Buscar por prefixo, placa ou descrição..."
            style={{
              flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 6,
              border: '1px solid #d1d5db', fontSize: '0.9rem',
            }}
          />
          {['TODAS', 'PENDENTE', 'ANDAMENTO', 'CONCLUIDA'].map(s => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              style={{
                padding: '7px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.82rem',
                background: filtroStatus === s ? '#1a1a2e' : '#f3f4f6',
                color: filtroStatus === s ? 'white' : '#374151',
              }}
            >{s}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>⏳ Carregando tarefas...</div>
        ) : (
          <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  {['PREFIXO', 'PLACA', 'DESCRIÇÃO', 'RESPONSÁVEL', 'STATUS'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left',
                      fontSize: '0.78rem', fontWeight: 700, color: '#6b7280',
                      letterSpacing: 0.5, textTransform: 'uppercase',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                      Nenhuma tarefa encontrada
                    </td>
                  </tr>
                ) : filtradas.map((t, i) => {
                  const sk = getStatusKey(t);
                  const sc = STATUS_COLORS[sk] || STATUS_COLORS[''];
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1a1a2e', fontSize: '0.9rem' }}>{t.prefixo}</td>
                      <td style={{ padding: '10px 14px', color: '#374151', fontSize: '0.88rem' }}>{t.placa}</td>
                      <td style={{ padding: '10px 14px', color: '#374151', fontSize: '0.88rem', maxWidth: 300 }}>{t.descricao || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: '0.85rem' }}>{t.responsavel || '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          background: sc.bg, color: sc.color,
                          border: `1px solid ${sc.border}`,
                          padding: '3px 10px', borderRadius: 12,
                          fontSize: '0.78rem', fontWeight: 600,
                        }}>
                          {sk || 'SEM STATUS'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
