import React, { useState } from 'react';
import useApi from '../hooks/useApi';
import { getFrota, createViatura, updateViatura, deleteViatura } from '../services/api';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import { formatKm, formatCurrency, getStatusColor } from '../utils/formatters';
import { STATUS_VIATURA, UNIDADES } from '../services/constants';
import '../styles/frota.css';

const EMPTY_FORM = {
  prefixo: '', modelo: '', placa: '', unidade: '', status: 'operacional',
  km_atual: '', ano: '', valor_fipe: '', observacoes: '',
};

export default function Frota() {
  const { data, loading, error, refetch } = useApi(getFrota);
  const viaturas = Array.isArray(data) ? data : data?.items || [];

  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUnidade, setFilterUnidade] = useState('');

  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');

  const filtered = viaturas.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      v.prefixo?.toLowerCase().includes(q) ||
      v.modelo?.toLowerCase().includes(q) ||
      v.placa?.toLowerCase().includes(q);
    const matchStatus  = !filterStatus  || v.status  === filterStatus;
    const matchUnidade = !filterUnidade || v.unidade === filterUnidade;
    return matchSearch && matchStatus && matchUnidade;
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(v) {
    setEditing(v);
    setForm({ ...EMPTY_FORM, ...v });
    setFormError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.prefixo || !form.modelo || !form.placa) {
      setFormError('Preencha os campos obrigatórios: Prefixo, Modelo e Placa.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await updateViatura(editing.id, form);
      } else {
        await createViatura(form);
      }
      await refetch();
      closeModal();
    } catch (err) {
      setFormError(err?.response?.data?.detail || 'Erro ao salvar viatura.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(v) {
    if (!window.confirm(`Excluir viatura ${v.prefixo}? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteViatura(v.id);
      await refetch();
    } catch (err) {
      alert(err?.response?.data?.detail || 'Erro ao excluir viatura.');
    }
  }

  if (loading) return <Loading text="Carregando frota..." />;
  if (error)   return <p className="text-muted">Erro ao carregar frota: {error}</p>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Frota</h1>
          <p className="page-subtitle">{viaturas.length} viaturas cadastradas</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} type="button">
          + Nova Viatura
        </button>
      </div>

      {/* Filters */}
      <div className="frota-filters">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            className="form-control"
            placeholder="Buscar por prefixo, modelo ou placa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="form-group">
          <select
            className="form-control"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            {STATUS_VIATURA.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <select
            className="form-control"
            value={filterUnidade}
            onChange={(e) => setFilterUnidade(e.target.value)}
          >
            <option value="">Todas as unidades</option>
            {UNIDADES.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="results-count">{filtered.length} resultado(s)</p>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Prefixo</th>
              <th>Modelo</th>
              <th>Placa</th>
              <th>Unidade</th>
              <th>Status</th>
              <th>KM Atual</th>
              <th>Valor FIPE</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-muted" style={{ padding: 'var(--spacing-8)' }}>
                  Nenhuma viatura encontrada
                </td>
              </tr>
            ) : (
              filtered.map((v) => (
                <tr key={v.id}>
                  <td className="td-prefixo">{v.prefixo}</td>
                  <td>{v.modelo}</td>
                  <td>{v.placa}</td>
                  <td>{v.unidade}</td>
                  <td>
                    <span className={`badge ${getStatusColor(v.status)}`}>
                      {STATUS_VIATURA.find((s) => s.value === v.status)?.label || v.status}
                    </span>
                  </td>
                  <td>{formatKm(v.km_atual)}</td>
                  <td className="fipe-value">{v.valor_fipe ? formatCurrency(v.valor_fipe) : '—'}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(v)} type="button">
                        ✏️
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v)} type="button">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? `Editar Viatura — ${editing.prefixo}` : 'Nova Viatura'}
      >
        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.875rem' }}>
              ⚠️ {formError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
            <div className="form-group">
              <label className="form-label">Prefixo *</label>
              <input name="prefixo" className="form-control" value={form.prefixo} onChange={handleChange} placeholder="Ex: AB-001" required />
            </div>
            <div className="form-group">
              <label className="form-label">Placa *</label>
              <input name="placa" className="form-control" value={form.placa} onChange={handleChange} placeholder="ABC-1234" required />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Modelo *</label>
              <input name="modelo" className="form-control" value={form.modelo} onChange={handleChange} placeholder="Ex: Caminhão Auto Bomba Tanque" required />
            </div>
            <div className="form-group">
              <label className="form-label">Unidade</label>
              <select name="unidade" className="form-control" value={form.unidade} onChange={handleChange}>
                <option value="">Selecione</option>
                {UNIDADES.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select name="status" className="form-control" value={form.status} onChange={handleChange}>
                {STATUS_VIATURA.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">KM Atual</label>
              <input name="km_atual" type="number" className="form-control" value={form.km_atual} onChange={handleChange} placeholder="0" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Ano</label>
              <input name="ano" type="number" className="form-control" value={form.ano} onChange={handleChange} placeholder="2024" min="1900" max="2100" />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Valor FIPE (R$)</label>
              <input name="valor_fipe" type="number" className="form-control" value={form.valor_fipe} onChange={handleChange} placeholder="0.00" step="0.01" min="0" />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Observações</label>
              <textarea name="observacoes" className="form-control" value={form.observacoes} onChange={handleChange} rows={3} placeholder="Observações adicionais..." />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-5)' }}>
            <button type="button" className="btn btn-outline" onClick={closeModal}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : (editing ? 'Salvar Alterações' : 'Cadastrar Viatura')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
