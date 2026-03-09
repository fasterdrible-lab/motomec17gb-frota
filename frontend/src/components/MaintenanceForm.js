import React, { useState, useEffect } from 'react';
import {
  getMaintenance,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  getVehicles,
} from '../services/api';
import { formatDate, formatCurrency, formatKm, getStatusColor, getStatusLabel } from '../utils/helpers';
import './VehicleList.css';
import './MaintenanceForm.css';

const EMPTY_FORM = {
  vehicle_id: '', tipo: 'preventiva', descricao: '',
  custo: '', data_servico: '', km_servico: '',
  fornecedor: '', status: 'pendente', observacoes: '',
};

const TIPOS = [
  { value: 'preventiva',  label: 'Preventiva' },
  { value: 'corretiva',   label: 'Corretiva' },
  { value: 'revisao',     label: 'Revisão' },
  { value: 'pneu',        label: 'Troca de Pneu' },
  { value: 'oleo',        label: 'Troca de Óleo' },
  { value: 'freios',      label: 'Freios' },
  { value: 'eletrica',    label: 'Elétrica' },
  { value: 'funilaria',   label: 'Funilaria/Pintura' },
  { value: 'outro',       label: 'Outro' },
];

export default function MaintenanceForm() {
  const [records, setRecords]       = useState([]);
  const [vehicles, setVehicles]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState(null);
  const [deleteId, setDeleteId]     = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [m, v] = await Promise.all([
        getMaintenance().catch(() => []),
        getVehicles().catch(() => []),
      ]);
      setRecords(Array.isArray(m) ? m : m?.items ?? []);
      setVehicles(Array.isArray(v) ? v : v?.items ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.descricao?.toLowerCase().includes(q) ||
      r.fornecedor?.toLowerCase().includes(q) ||
      r.tipo?.toLowerCase().includes(q);
    const matchType = !typeFilter || r.tipo === typeFilter;
    return matchSearch && matchType;
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setForm({ ...EMPTY_FORM, ...record });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.vehicle_id) return 'Selecione um veículo.';
    if (!form.tipo)        return 'Tipo de manutenção é obrigatório.';
    if (!form.descricao.trim()) return 'Descrição é obrigatória.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setFormError(err); return; }
    try {
      setSubmitting(true);
      setFormError(null);
      const payload = {
        ...form,
        custo:       form.custo      ? Number(form.custo)      : null,
        km_servico:  form.km_servico ? Number(form.km_servico) : null,
        vehicle_id:  Number(form.vehicle_id),
      };
      if (editing) {
        await updateMaintenance(editing.id, payload);
      } else {
        await createMaintenance(payload);
      }
      closeModal();
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMaintenance(deleteId);
      setDeleteId(null);
      await load();
    } catch (err) {
      setError(err.message);
      setDeleteId(null);
    }
  };

  const vehicleLabel = (id) => {
    const v = vehicles.find((v) => String(v.id) === String(id));
    return v ? `${v.placa} – ${v.modelo}` : '—';
  };

  const totalCost = records.reduce((sum, r) => sum + (Number(r.custo) || 0), 0);

  return (
    <div className="maintenance-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔧 Manutenção</h1>
          <p className="page-subtitle">
            {records.length} registro(s) · Custo total: {formatCurrency(totalCost)}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Novo Registro</button>
      </div>

      <div className="filters-bar">
        <input
          type="search"
          className="search-input"
          placeholder="Buscar por descrição, tipo ou fornecedor…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {loading ? (
        <div className="loading-container"><div className="spinner" /><p>Carregando registros…</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state-box">
          <span className="empty-icon">🔧</span>
          <p>{search || typeFilter ? 'Nenhum registro encontrado.' : 'Nenhum registro de manutenção ainda.'}</p>
          {!search && !typeFilter && (
            <button className="btn btn-primary" onClick={openCreate}>Adicionar primeiro registro</button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Veículo</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Data</th>
                <th>KM</th>
                <th>Custo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td><code className="placa">{vehicleLabel(r.vehicle_id)}</code></td>
                  <td className="text-capitalize">{r.tipo}</td>
                  <td>{r.descricao}</td>
                  <td>{formatDate(r.data_servico)}</td>
                  <td>{formatKm(r.km_servico)}</td>
                  <td>{formatCurrency(r.custo)}</td>
                  <td>
                    <span className={`badge badge-${getStatusColor(r.status)}`}>
                      {getStatusLabel(r.status)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon btn-edit" onClick={() => openEdit(r)} title="Editar">✏️</button>
                      <button className="btn-icon btn-delete" onClick={() => setDeleteId(r.id)} title="Excluir">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Editar Manutenção' : 'Novo Registro de Manutenção'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <div className="alert alert-error">{formError}</div>}
                <div className="form-grid">
                  <div className="form-group form-group-full">
                    <label>Veículo *</label>
                    <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange} required>
                      <option value="">Selecione um veículo…</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.placa} – {v.modelo} ({v.marca})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tipo de Manutenção *</label>
                    <select name="tipo" value={form.tipo} onChange={handleChange} required>
                      {TIPOS.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" value={form.status} onChange={handleChange}>
                      <option value="pendente">Pendente</option>
                      <option value="concluido">Concluído</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                  <div className="form-group form-group-full">
                    <label>Descrição *</label>
                    <textarea name="descricao" value={form.descricao} onChange={handleChange} rows="2" placeholder="Descreva o serviço realizado ou a ser realizado…" required />
                  </div>
                  <div className="form-group">
                    <label>Data do Serviço</label>
                    <input name="data_servico" type="date" value={form.data_servico} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>KM no Serviço</label>
                    <input name="km_servico" type="number" value={form.km_servico} onChange={handleChange} placeholder="0" min="0" />
                  </div>
                  <div className="form-group">
                    <label>Custo (R$)</label>
                    <input name="custo" type="number" value={form.custo} onChange={handleChange} placeholder="0.00" min="0" step="0.01" />
                  </div>
                  <div className="form-group">
                    <label>Fornecedor / Oficina</label>
                    <input name="fornecedor" value={form.fornecedor} onChange={handleChange} placeholder="Nome da oficina" />
                  </div>
                  <div className="form-group form-group-full">
                    <label>Observações</label>
                    <textarea name="observacoes" value={form.observacoes} onChange={handleChange} rows="2" placeholder="Informações adicionais…" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Salvando…' : editing ? 'Salvar Alterações' : 'Registrar Manutenção'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmar Exclusão</h2>
              <button className="modal-close" onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Tem certeza que deseja excluir este registro de manutenção?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Confirmar Exclusão</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
