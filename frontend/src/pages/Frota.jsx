import React, { useState, useEffect } from 'react';
import { getFrota, createViatura } from '../services/api';
import ViaturaCard from '../components/ViaturaCard';

const emptyForm = {
  placa: '',
  prefixo: '',
  modelo: '',
  marca: '',
  ano: '',
  unidade: '',
  status: 'operando',
  km_atual: '',
};

function Frota() {
  const [viaturas, setViaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUnidade, setFilterUnidade] = useState('');

  const loadFrota = async () => {
    try {
      setLoading(true);
      const res = await getFrota();
      setViaturas(res.data || []);
      setError('');
    } catch (e) {
      setError('Erro ao carregar frota. Verifique a conexão com o backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFrota(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createViatura({
        ...formData,
        ano: formData.ano ? parseInt(formData.ano) : null,
        km_atual: formData.km_atual ? parseFloat(formData.km_atual) : 0,
      });
      setShowModal(false);
      setFormData(emptyForm);
      await loadFrota();
    } catch (e) {
      setError('Erro ao criar viatura. Verifique os dados e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const unidades = [...new Set(viaturas.map(v => v.unidade).filter(Boolean))];

  const filtered = viaturas.filter(v => {
    const matchSearch =
      !search ||
      v.placa?.toLowerCase().includes(search.toLowerCase()) ||
      v.prefixo?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || v.status === filterStatus;
    const matchUnidade = !filterUnidade || v.unidade === filterUnidade;
    return matchSearch && matchStatus && matchUnidade;
  });

  return (
    <div>
      <div className="section-header">
        <h1 className="page-title" style={{ margin: 0 }}>Gestão de Frota</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Nova Viatura</button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Buscar por placa ou prefixo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ minWidth: 220 }}
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os Status</option>
          <option value="operando">Operando</option>
          <option value="manutencao">Manutenção</option>
          <option value="baixada">Baixada</option>
          <option value="reserva">Reserva</option>
        </select>
        <select value={filterUnidade} onChange={e => setFilterUnidade(e.target.value)}>
          <option value="">Todas as Unidades</option>
          {unidades.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      <p className="text-muted mb-16">{filtered.length} viatura(s) encontrada(s)</p>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">Nenhuma viatura encontrada.</div>
      ) : (
        <div className="viaturas-grid">
          {filtered.map(v => <ViaturaCard key={v.id} viatura={v} />)}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Nova Viatura</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Placa *</label>
                  <input
                    className="form-control"
                    name="placa"
                    value={formData.placa}
                    onChange={handleChange}
                    required
                    placeholder="ABC-1234"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Prefixo *</label>
                  <input
                    className="form-control"
                    name="prefixo"
                    value={formData.prefixo}
                    onChange={handleChange}
                    required
                    placeholder="PM-0001"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Marca</label>
                  <input
                    className="form-control"
                    name="marca"
                    value={formData.marca}
                    onChange={handleChange}
                    placeholder="Honda"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Modelo</label>
                  <input
                    className="form-control"
                    name="modelo"
                    value={formData.modelo}
                    onChange={handleChange}
                    placeholder="CB 500"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ano</label>
                  <input
                    className="form-control"
                    name="ano"
                    type="number"
                    value={formData.ano}
                    onChange={handleChange}
                    placeholder="2022"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">KM Atual</label>
                  <input
                    className="form-control"
                    name="km_atual"
                    type="number"
                    value={formData.km_atual}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Unidade</label>
                  <input
                    className="form-control"
                    name="unidade"
                    value={formData.unidade}
                    onChange={handleChange}
                    placeholder="17º GB"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" name="status" value={formData.status} onChange={handleChange}>
                    <option value="operando">Operando</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="baixada">Baixada</option>
                    <option value="reserva">Reserva</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar Viatura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Frota;
