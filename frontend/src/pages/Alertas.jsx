import React, { useState } from 'react';
import useApi from '../hooks/useApi';
import { getAlertas, markAlertaLido, resolveAlerta } from '../services/api';
import Loading from '../components/Loading';
import AlertCard from '../components/AlertCard';
import { TIPOS_ALERTA, PRIORIDADES_ALERTA } from '../services/constants';
import '../styles/alertas.css';

export default function Alertas() {
  const { data, loading, error, refetch } = useApi(getAlertas);
  const alertas = Array.isArray(data) ? data : data?.items || [];

  const [filterTipo, setFilterTipo]         = useState('');
  const [filterPrioridade, setFilterPrioridade] = useState('');
  const [filterLido, setFilterLido]         = useState('');

  const filtered = alertas.filter((a) => {
    const matchTipo = !filterTipo || a.tipo === filterTipo;
    const matchPrio = !filterPrioridade || (a.tipo || a.prioridade) === filterPrioridade;
    const matchLido =
      filterLido === ''  ? true :
      filterLido === '0' ? !a.lido :
      filterLido === '1' ? a.lido : true;
    return matchTipo && matchPrio && matchLido;
  });

  const unreadCount = alertas.filter((a) => !a.lido).length;

  async function handleMarcarLido(id) {
    try {
      await markAlertaLido(id);
      await refetch();
    } catch (err) {
      alert('Erro ao marcar como lido.');
    }
  }

  async function handleResolver(id) {
    try {
      await resolveAlerta(id);
      await refetch();
    } catch (err) {
      alert('Erro ao resolver alerta.');
    }
  }

  async function handleMarcarTodosLidos() {
    const naoLidos = alertas.filter((a) => !a.lido);
    await Promise.all(naoLidos.map((a) => markAlertaLido(a.id).catch(() => {})));
    await refetch();
  }

  if (loading) return <Loading text="Carregando alertas..." />;
  if (error)   return <p className="text-muted">Erro ao carregar alertas: {error}</p>;

  return (
    <div>
      <div className="alertas-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Alertas
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </h1>
          <p className="page-subtitle">{alertas.length} alertas no total</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-outline" onClick={handleMarcarTodosLidos} type="button">
            ✓ Marcar todos como lidos
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="alertas-filters mb-4">
        <select
          className="form-control"
          style={{ minWidth: 160 }}
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          {TIPOS_ALERTA.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        <select
          className="form-control"
          style={{ minWidth: 140 }}
          value={filterPrioridade}
          onChange={(e) => setFilterPrioridade(e.target.value)}
        >
          <option value="">Todas as prioridades</option>
          {PRIORIDADES_ALERTA.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>

        <select
          className="form-control"
          style={{ minWidth: 130 }}
          value={filterLido}
          onChange={(e) => setFilterLido(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="0">Não lidos</option>
          <option value="1">Lidos</option>
        </select>

        {(filterTipo || filterPrioridade || filterLido !== '') && (
          <button
            className="btn btn-outline btn-sm"
            type="button"
            onClick={() => { setFilterTipo(''); setFilterPrioridade(''); setFilterLido(''); }}
          >
            Limpar
          </button>
        )}
      </div>

      <p className="results-count">{filtered.length} alerta(s)</p>

      <div className="alerta-list" style={{ marginTop: 'var(--spacing-3)' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <p>Nenhum alerta encontrado</p>
          </div>
        ) : (
          filtered.map((a) => (
            <AlertCard
              key={a.id}
              tipo={a.tipo || a.prioridade}
              mensagem={a.mensagem}
              viatura={a.viatura_prefixo || a.viatura}
              data={a.created_at || a.data}
              lido={a.lido}
              onMarcarLido={() => handleMarcarLido(a.id)}
              onResolver={a.status !== 'resolvido' ? () => handleResolver(a.id) : null}
            />
          ))
        )}
      </div>
    </div>
  );
}
