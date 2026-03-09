import React, { useState, useEffect } from 'react';
import { getManutencoes, getManutencoesPendentes, getManutencoesVencidas, createManutencao } from '../services/api';

const emptyForm = {
  viatura_id: '',
  tipo: '',
  km_proximo: '',
  data_proxima: '',
  responsavel: '',
  observacoes: '',
};

const statusBadgeClass = (status) => {
  if (!status) return '';
  if (status === 'vencida') return 'status-badge status-baixada';
  if (status === 'concluida') return 'status-badge status-operando';
  return 'status-badge status-manutencao';
};

function Manutencao() {
  const [todas, setTodas] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [vencidas, setVencidas] = useState([]);
  const [activeTab, setActiveTab] = useState('todas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [todasRes, pendentesRes, vencidasRes] = await Promise.allSettled([
        getManutencoes(),
        getManutencoesPendentes(),
        getManutencoesVencidas(),
      ]);
      if (todasRes.status === 'fulfilled') setTodas(todasRes.value.data || []);
      if (pendentesRes.status === 'fulfilled') setPendentes(pendentesRes.value.data || []);
      if (vencidasRes.status === 'fulfilled') setVencidas(vencidasRes.value.data || []);
      setError('');
    } catch (e) {
      setError('Erro ao carregar manutenções.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createManutencao({
        ...formData,
        viatura_id: parseInt(formData.viatura_id),
        km_proximo: formData.km_proximo ? parseFloat(formData.km_proximo) : null,
      });
      setShowModal(false);
      setFormData(emptyForm);
      await loadData();
    } catch (e) {
      setError('Erro ao registrar manutenção.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentData = activeTab === 'todas' ? todas : activeTab === 'pendentes' ? pendentes : vencidas;

  const renderTable = (data) => (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Viatura ID</th>
          <th>Tipo</th>
          <th>Status</th>
          <th>KM Próximo</th>
          <th>Data Próxima</th>
          <th>Responsável</th>
          <th>Observações</th>
        </tr>
      </thead>
      <tbody>
        {data.map(m => (
          <tr key={m.id}>
            <td>{m.id}</td>
            <td>{m.viatura_id}</td>
            <td>{m.tipo}</td>
            <td><span className={statusBadgeClass(m.status)}>{m.status}</span></td>
            <td>{m.km_proximo?.toLocaleString('pt-BR') ?? '—'}</td>
            <td>{m.data_proxima ? new Date(m.data_proxima).toLocaleDateString('pt-BR') : '—'}</td>
            <td>{m.responsavel || '—'}</td>
            <td title={m.observacoes}>
              {m.observacoes ? m.observacoes.substring(0, 30) + (m.observacoes.length > 30 ? '…' : '') : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div>
      <div className="section-header">
        <h1 className="page-title" style={{ margin: 0 }}>Controle de Manutenção</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Registrar Manutenção</button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'todas' ? 'active' : ''}`}
          onClick={() => setActiveTab('todas')}
        >
          Todas ({todas.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'pendentes' ? 'active' : ''}`}
          onClick={() => setActiveTab('pendentes')}
        >
          Pendentes ({pendentes.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'vencidas' ? 'active' : ''}`}
          onClick={() => setActiveTab('vencidas')}
        >
          Vencidas ({vencidas.length})
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Carregando...</div>
        ) : currentData.length === 0 ? (
          <div className="empty-state">Nenhuma manutenção encontrada.</div>
        ) : (
          renderTable(currentData)
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Registrar Manutenção</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Viatura ID *</label>
                  <input
                    className="form-control"
                    name="viatura_id"
                    type="number"
                    value={formData.viatura_id}
                    onChange={handleChange}
                    required
                    placeholder="1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo *</label>
                  <input
                    className="form-control"
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    required
                    placeholder="Troca de óleo"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">KM Próximo</label>
                  <input
                    className="form-control"
                    name="km_proximo"
                    type="number"
                    value={formData.km_proximo}
                    onChange={handleChange}
                    placeholder="10000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Data Próxima</label>
                  <input
                    className="form-control"
                    name="data_proxima"
                    type="date"
                    value={formData.data_proxima}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Responsável</label>
                <input
                  className="form-control"
                  name="responsavel"
                  value={formData.responsavel}
                  onChange={handleChange}
                  placeholder="Nome do responsável"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Observações</label>
                <textarea
                  className="form-control"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Observações adicionais..."
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Manutencao;
