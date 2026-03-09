import React, { useState } from 'react';
import useApi from '../hooks/useApi';
import { getManutencoes, createManutencao, updateManutencao } from '../services/api';
import { getFrota } from '../services/api';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import { formatDate, formatKm } from '../utils/formatters';
import { TIPOS_MANUTENCAO } from '../services/constants';

const TABS = [
  { key: 'pendente', label: 'Pendentes' },
  { key: 'vencida',  label: 'Vencidas'  },
  { key: 'historico',label: 'Histórico' },
];

const EMPTY_FORM = {
  viatura_id: '', tipo: '', data_realizacao: '', data_proximo: '',
  km_proximo: '', km_realizacao: '', descricao: '', status: 'pendente', custo: '',
};

function statusBadge(status, dataProximo) {
  const hoje = new Date();
  const proximo = dataProximo ? new Date(dataProximo) : null;

  if (status === 'concluida') return <span className="badge badge-success">Concluída</span>;
  if (proximo && proximo < hoje) return <span className="badge badge-danger">Vencida</span>;
  return <span className="badge badge-warning">Pendente</span>;
}

export default function Manutencao() {
  const { data, loading, error, refetch } = useApi(getManutencoes);
  const { data: frotaData }               = useApi(getFrota);
  const manutencoes = Array.isArray(data) ? data : data?.items || [];
  const viaturas    = Array.isArray(frotaData) ? frotaData : frotaData?.items || [];

  const [tab, setTab]           = useState('pendente');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState('');

  const hoje = new Date();

  const filtered = manutencoes.filter((m) => {
    const proximo = m.data_proximo ? new Date(m.data_proximo) : null;
    if (tab === 'pendente')  return m.status === 'pendente' && (!proximo || proximo >= hoje);
    if (tab === 'vencida')   return m.status === 'pendente' && proximo && proximo < hoje;
    if (tab === 'historico') return m.status === 'concluida';
    return true;
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(m) {
    setEditing(m);
    setForm({ ...EMPTY_FORM, ...m });
    setFormError('');
    setModalOpen(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.viatura_id || !form.tipo) {
      setFormError('Selecione a viatura e o tipo de manutenção.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await updateManutencao(editing.id, form);
      } else {
        await createManutencao(form);
      }
      await refetch();
      setModalOpen(false);
    } catch (err) {
      setFormError(err?.response?.data?.detail || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading text="Carregando manutenções..." />;
  if (error)   return <p className="text-muted">Erro: {error}</p>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manutenção</h1>
          <p className="page-subtitle">{manutencoes.length} registros</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} type="button">
          + Nova Manutenção
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)', borderBottom: '2px solid var(--color-border)' }}>
        {TABS.map((t) => (
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
              transition: 'color var(--transition)',
            }}
          >
            {t.label}
            {t.key !== 'historico' && (
              <span style={{
                marginLeft: 6,
                background: tab === t.key ? 'var(--color-primary)' : 'var(--color-bg-alt)',
                color: tab === t.key ? '#fff' : 'var(--color-text-muted)',
                borderRadius: 999,
                fontSize: '0.7rem',
                padding: '1px 7px',
                fontWeight: 700,
              }}>
                {manutencoes.filter((m) => {
                  const d = m.data_proximo ? new Date(m.data_proximo) : null;
                  if (t.key === 'pendente') return m.status === 'pendente' && (!d || d >= hoje);
                  if (t.key === 'vencida')  return m.status === 'pendente' && d && d < hoje;
                  return false;
                }).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Viatura</th>
              <th>Tipo</th>
              <th>Próxima Data</th>
              <th>Próximo KM</th>
              <th>KM Realização</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted" style={{ padding: 'var(--spacing-8)' }}>
                  Nenhum registro encontrado nesta aba
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600, fontFamily: 'Courier New, monospace' }}>
                    {m.viatura_prefixo || m.viatura_id}
                  </td>
                  <td>{TIPOS_MANUTENCAO.find((t) => t.value === m.tipo)?.label || m.tipo}</td>
                  <td style={{ color: m.data_proximo && new Date(m.data_proximo) < hoje ? 'var(--color-danger)' : 'inherit' }}>
                    {formatDate(m.data_proximo)}
                  </td>
                  <td>{formatKm(m.km_proximo)}</td>
                  <td>{formatKm(m.km_realizacao)}</td>
                  <td>{statusBadge(m.status, m.data_proximo)}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(m)} type="button">
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Manutenção' : 'Nova Manutenção'}
      >
        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.875rem' }}>
              ⚠️ {formError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
            <div className="form-group">
              <label className="form-label">Viatura *</label>
              <select name="viatura_id" className="form-control" value={form.viatura_id} onChange={handleChange} required>
                <option value="">Selecione a viatura</option>
                {viaturas.map((v) => (
                  <option key={v.id} value={v.id}>{v.prefixo} — {v.modelo}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tipo *</label>
              <select name="tipo" className="form-control" value={form.tipo} onChange={handleChange} required>
                <option value="">Selecione</option>
                {TIPOS_MANUTENCAO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Data de Realização</label>
              <input name="data_realizacao" type="date" className="form-control" value={form.data_realizacao} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Próxima Data</label>
              <input name="data_proximo" type="date" className="form-control" value={form.data_proximo} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">KM de Realização</label>
              <input name="km_realizacao" type="number" className="form-control" value={form.km_realizacao} onChange={handleChange} min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Próximo KM</label>
              <input name="km_proximo" type="number" className="form-control" value={form.km_proximo} onChange={handleChange} min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Custo (R$)</label>
              <input name="custo" type="number" className="form-control" value={form.custo} onChange={handleChange} step="0.01" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select name="status" className="form-control" value={form.status} onChange={handleChange}>
                <option value="pendente">Pendente</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Descrição</label>
              <textarea name="descricao" className="form-control" value={form.descricao} onChange={handleChange} rows={3} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-5)' }}>
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
