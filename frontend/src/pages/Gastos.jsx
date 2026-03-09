import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getGastos, getRelatorioMensal, createAbastecimento } from '../services/api';
import api from '../services/api';

const emptyForm = {
  viatura_id: '',
  categoria: 'abastecimento',
  descricao: '',
  valor: '',
  data: new Date().toISOString().split('T')[0],
};

function Gastos() {
  const [gastos, setGastos] = useState([]);
  const [relatorio, setRelatorio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [gastosRes, relatorioRes] = await Promise.allSettled([
        getGastos(),
        getRelatorioMensal(currentYear, currentMonth),
      ]);
      if (gastosRes.status === 'fulfilled') setGastos(gastosRes.value.data || []);
      if (relatorioRes.status === 'fulfilled') setRelatorio(relatorioRes.value.data);
      setError('');
    } catch (e) {
      setError('Erro ao carregar dados de gastos.');
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        viatura_id: parseInt(formData.viatura_id),
        valor: parseFloat(formData.valor),
      };
      if (formData.categoria === 'abastecimento') {
        await createAbastecimento(payload);
      } else {
        await api.post('/api/gastos/', payload);
      }
      setShowModal(false);
      setFormData(emptyForm);
      await loadData();
    } catch (e) {
      setError('Erro ao registrar gasto.');
    } finally {
      setSubmitting(false);
    }
  };

  // Group gastos by categoria for chart
  const chartData = (() => {
    const grouped = {};
    gastos.forEach(g => {
      const cat = g.categoria || 'outros';
      grouped[cat] = (grouped[cat] || 0) + (g.valor || 0);
    });
    return Object.entries(grouped).map(([categoria, total]) => ({ categoria, total }));
  })();

  const formatCurrency = (v) =>
    v != null ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';

  return (
    <div>
      <div className="section-header">
        <h1 className="page-title" style={{ margin: 0 }}>Controle de Gastos</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Registrar Gasto</button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {relatorio && (
        <div className="stat-cards">
          <div className="stat-card primary">
            <div className="stat-card-icon">⛽</div>
            <div className="stat-card-label">Abastecimento (mês)</div>
            <div className="stat-card-value" style={{ fontSize: '1.4rem' }}>
              {formatCurrency(relatorio.total_abastecimento)}
            </div>
          </div>
          <div className="stat-card warning">
            <div className="stat-card-icon">🔧</div>
            <div className="stat-card-label">Manutenção (mês)</div>
            <div className="stat-card-value" style={{ fontSize: '1.4rem' }}>
              {formatCurrency(relatorio.total_manutencao)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">📦</div>
            <div className="stat-card-label">Outros (mês)</div>
            <div className="stat-card-value" style={{ fontSize: '1.4rem' }}>
              {formatCurrency(relatorio.total_outros)}
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-card-icon">💰</div>
            <div className="stat-card-label">Total Geral (mês)</div>
            <div className="stat-card-value" style={{ fontSize: '1.4rem' }}>
              {formatCurrency(relatorio.total_geral)}
            </div>
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="chart-container mb-20" style={{ marginBottom: 20 }}>
          <h3 className="chart-title">Gastos por Categoria</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoria" />
              <YAxis />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="total" fill="#1565C0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <div className="section-header">
          <h3 className="section-title">Todos os Gastos</h3>
          <span className="text-muted">{gastos.length} registro(s)</span>
        </div>
        {loading ? (
          <div className="loading">Carregando...</div>
        ) : gastos.length === 0 ? (
          <div className="empty-state">Nenhum gasto registrado.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Viatura ID</th>
                <th>Categoria</th>
                <th>Descrição</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {gastos.map((g, i) => (
                <tr key={g.id || i}>
                  <td>{g.data ? new Date(g.data).toLocaleDateString('pt-BR') : '—'}</td>
                  <td>{g.viatura_id}</td>
                  <td>{g.categoria}</td>
                  <td>{g.descricao || '—'}</td>
                  <td>{formatCurrency(g.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Registrar Gasto</h2>
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
                  <label className="form-label">Categoria *</label>
                  <select className="form-control" name="categoria" value={formData.categoria} onChange={handleChange}>
                    <option value="abastecimento">Abastecimento</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <input
                  className="form-control"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleChange}
                  placeholder="Descrição do gasto"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Valor (R$) *</label>
                  <input
                    className="form-control"
                    name="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={handleChange}
                    required
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Data *</label>
                  <input
                    className="form-control"
                    name="data"
                    type="date"
                    value={formData.data}
                    onChange={handleChange}
                    required
                  />
                </div>
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

export default Gastos;
