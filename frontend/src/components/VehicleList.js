import React, { useState, useEffect, useCallback } from 'react';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../services/api';
import { formatKm, formatDate, getStatusColor, getStatusLabel, debounce } from '../utils/helpers';
import './VehicleList.css';

const EMPTY_FORM = {
  placa: '', modelo: '', marca: '', ano: '', cor: '',
  km_atual: '', status: 'ativo', combustivel: 'flex',
  renavam: '', chassi: '', observacoes: '',
};

export default function VehicleList() {
  const [vehicles, setVehicles]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState(null);
  const [deleteId, setDeleteId]     = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getVehicles();
      setVehicles(Array.isArray(data) ? data : data?.items ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = vehicles.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      v.placa?.toLowerCase().includes(q) ||
      v.modelo?.toLowerCase().includes(q) ||
      v.marca?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (vehicle) => {
    setEditing(vehicle);
    setForm({ ...EMPTY_FORM, ...vehicle });
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
    if (!form.placa.trim()) return 'Placa é obrigatória.';
    if (!form.modelo.trim()) return 'Modelo é obrigatório.';
    if (!form.marca.trim()) return 'Marca é obrigatória.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setFormError(err); return; }
    try {
      setSubmitting(true);
      setFormError(null);
      if (editing) {
        await updateVehicle(editing.id, form);
      } else {
        await createVehicle(form);
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
      await deleteVehicle(deleteId);
      setDeleteId(null);
      await load();
    } catch (err) {
      setError(err.message);
      setDeleteId(null);
    }
  };

  return (
    <div className="vehicle-list">
      <div className="page-header">
        <div>
          <h1 className="page-title">🚗 Veículos</h1>
          <p className="page-subtitle">{vehicles.length} veículo(s) cadastrado(s)</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Novo Veículo</button>
      </div>

      <div className="filters-bar">
        <input
          type="search"
          className="search-input"
          placeholder="Buscar por placa, modelo ou marca…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="manutencao">Em Manutenção</option>
        </select>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {loading ? (
        <div className="loading-container"><div className="spinner" /><p>Carregando veículos…</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state-box">
          <span className="empty-icon">🚗</span>
          <p>{search || statusFilter ? 'Nenhum veículo encontrado com os filtros aplicados.' : 'Nenhum veículo cadastrado ainda.'}</p>
          {!search && !statusFilter && (
            <button className="btn btn-primary" onClick={openCreate}>Cadastrar primeiro veículo</button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Modelo</th>
                <th>Marca</th>
                <th>Ano</th>
                <th>KM Atual</th>
                <th>Combustível</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id}>
                  <td><code className="placa">{v.placa}</code></td>
                  <td>{v.modelo}</td>
                  <td>{v.marca}</td>
                  <td>{v.ano || '—'}</td>
                  <td>{formatKm(v.km_atual)}</td>
                  <td className="text-capitalize">{v.combustivel || '—'}</td>
                  <td>
                    <span className={`badge badge-${getStatusColor(v.status)}`}>
                      {getStatusLabel(v.status)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon btn-edit" onClick={() => openEdit(v)} title="Editar">✏️</button>
                      <button className="btn-icon btn-delete" onClick={() => setDeleteId(v.id)} title="Excluir">🗑️</button>
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
              <h2>{editing ? 'Editar Veículo' : 'Novo Veículo'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <div className="alert alert-error">{formError}</div>}
                <div className="form-grid">
                  <div className="form-group">
                    <label>Placa *</label>
                    <input name="placa" value={form.placa} onChange={handleChange} placeholder="ABC-1234" required />
                  </div>
                  <div className="form-group">
                    <label>Modelo *</label>
                    <input name="modelo" value={form.modelo} onChange={handleChange} placeholder="Ex: Civic" required />
                  </div>
                  <div className="form-group">
                    <label>Marca *</label>
                    <input name="marca" value={form.marca} onChange={handleChange} placeholder="Ex: Honda" required />
                  </div>
                  <div className="form-group">
                    <label>Ano</label>
                    <input name="ano" type="number" value={form.ano} onChange={handleChange} placeholder="2023" min="1900" max={new Date().getFullYear() + 1} />
                  </div>
                  <div className="form-group">
                    <label>Cor</label>
                    <input name="cor" value={form.cor} onChange={handleChange} placeholder="Branco" />
                  </div>
                  <div className="form-group">
                    <label>KM Atual</label>
                    <input name="km_atual" type="number" value={form.km_atual} onChange={handleChange} placeholder="0" min="0" />
                  </div>
                  <div className="form-group">
                    <label>Combustível</label>
                    <select name="combustivel" value={form.combustivel} onChange={handleChange}>
                      <option value="flex">Flex</option>
                      <option value="gasolina">Gasolina</option>
                      <option value="diesel">Diesel</option>
                      <option value="eletrico">Elétrico</option>
                      <option value="hibrido">Híbrido</option>
                      <option value="gnv">GNV</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" value={form.status} onChange={handleChange}>
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                      <option value="manutencao">Em Manutenção</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>RENAVAM</label>
                    <input name="renavam" value={form.renavam} onChange={handleChange} placeholder="00000000000" />
                  </div>
                  <div className="form-group">
                    <label>Chassi</label>
                    <input name="chassi" value={form.chassi} onChange={handleChange} placeholder="9BWZZZ377VT004251" />
                  </div>
                  <div className="form-group form-group-full">
                    <label>Observações</label>
                    <textarea name="observacoes" value={form.observacoes} onChange={handleChange} rows="2" placeholder="Observações adicionais…" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Salvando…' : editing ? 'Salvar Alterações' : 'Cadastrar Veículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmar Exclusão</h2>
              <button className="modal-close" onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.</p>
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
