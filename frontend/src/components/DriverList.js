import React, { useState, useEffect, useCallback } from 'react';
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../services/api';
import { formatDate, getStatusColor, getStatusLabel } from '../utils/helpers';
import './VehicleList.css';

const EMPTY_FORM = {
  nome: '', cpf: '', cnh: '', categoria_cnh: 'B',
  validade_cnh: '', telefone: '', email: '',
  status: 'ativo', observacoes: '',
};

export default function DriverList() {
  const [drivers, setDrivers]       = useState([]);
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
      const data = await getDrivers();
      setDrivers(Array.isArray(data) ? data : data?.items ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = drivers.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      d.nome?.toLowerCase().includes(q) ||
      d.cpf?.includes(q) ||
      d.cnh?.includes(q) ||
      d.telefone?.includes(q);
    const matchStatus = !statusFilter || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (driver) => {
    setEditing(driver);
    setForm({ ...EMPTY_FORM, ...driver });
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
    if (!form.nome.trim()) return 'Nome é obrigatório.';
    if (!form.cpf.trim())  return 'CPF é obrigatório.';
    if (!form.cnh.trim())  return 'Número da CNH é obrigatório.';
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
        await updateDriver(editing.id, form);
      } else {
        await createDriver(form);
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
      await deleteDriver(deleteId);
      setDeleteId(null);
      await load();
    } catch (err) {
      setError(err.message);
      setDeleteId(null);
    }
  };

  return (
    <div className="driver-list">
      <div className="page-header">
        <div>
          <h1 className="page-title">👤 Motoristas</h1>
          <p className="page-subtitle">{drivers.length} motorista(s) cadastrado(s)</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Novo Motorista</button>
      </div>

      <div className="filters-bar">
        <input
          type="search"
          className="search-input"
          placeholder="Buscar por nome, CPF ou CNH…"
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
        </select>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {loading ? (
        <div className="loading-container"><div className="spinner" /><p>Carregando motoristas…</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state-box">
          <span className="empty-icon">👤</span>
          <p>{search || statusFilter ? 'Nenhum motorista encontrado com os filtros aplicados.' : 'Nenhum motorista cadastrado ainda.'}</p>
          {!search && !statusFilter && (
            <button className="btn btn-primary" onClick={openCreate}>Cadastrar primeiro motorista</button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>CNH</th>
                <th>Categoria</th>
                <th>Validade CNH</th>
                <th>Telefone</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td><strong>{d.nome}</strong></td>
                  <td>{d.cpf}</td>
                  <td>{d.cnh}</td>
                  <td><span className="badge badge-info">{d.categoria_cnh}</span></td>
                  <td>{formatDate(d.validade_cnh)}</td>
                  <td>{d.telefone || '—'}</td>
                  <td>
                    <span className={`badge badge-${getStatusColor(d.status)}`}>
                      {getStatusLabel(d.status)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon btn-edit" onClick={() => openEdit(d)} title="Editar">✏️</button>
                      <button className="btn-icon btn-delete" onClick={() => setDeleteId(d.id)} title="Excluir">🗑️</button>
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
              <h2>{editing ? 'Editar Motorista' : 'Novo Motorista'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <div className="alert alert-error">{formError}</div>}
                <div className="form-grid">
                  <div className="form-group form-group-full">
                    <label>Nome Completo *</label>
                    <input name="nome" value={form.nome} onChange={handleChange} placeholder="João da Silva" required />
                  </div>
                  <div className="form-group">
                    <label>CPF *</label>
                    <input name="cpf" value={form.cpf} onChange={handleChange} placeholder="000.000.000-00" required />
                  </div>
                  <div className="form-group">
                    <label>Telefone</label>
                    <input name="telefone" value={form.telefone} onChange={handleChange} placeholder="(11) 99999-0000" />
                  </div>
                  <div className="form-group">
                    <label>Número CNH *</label>
                    <input name="cnh" value={form.cnh} onChange={handleChange} placeholder="00000000000" required />
                  </div>
                  <div className="form-group">
                    <label>Categoria CNH</label>
                    <select name="categoria_cnh" value={form.categoria_cnh} onChange={handleChange}>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Validade da CNH</label>
                    <input name="validade_cnh" type="date" value={form.validade_cnh} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>E-mail</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="joao@email.com" />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" value={form.status} onChange={handleChange}>
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
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
                  {submitting ? 'Salvando…' : editing ? 'Salvar Alterações' : 'Cadastrar Motorista'}
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
              <p>Tem certeza que deseja excluir este motorista? Esta ação não pode ser desfeita.</p>
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
