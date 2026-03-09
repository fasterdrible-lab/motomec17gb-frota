import React, { useState } from 'react';
import useApi from '../hooks/useApi';
import { getAbastecimentos, createAbastecimento, getFrota } from '../services/api';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import { formatDate, formatCurrency } from '../utils/formatters';

const EMPTY_FORM = {
  viatura_id: '', data: '', km: '', litros: '', valor_litro: '',
  valor_total: '', posto: '', observacoes: '',
};

export default function Abastecimento() {
  const { data, loading, error, refetch } = useApi(getAbastecimentos);
  const { data: frotaData }               = useApi(getFrota);
  const registros  = Array.isArray(data) ? data : data?.items || [];
  const viaturas   = Array.isArray(frotaData) ? frotaData : frotaData?.items || [];

  const [filterViatura, setFilterViatura] = useState('');
  const [filterDe, setFilterDe]           = useState('');
  const [filterAte, setFilterAte]         = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');

  const filtered = registros.filter((r) => {
    const matchV = !filterViatura || String(r.viatura_id) === filterViatura;
    const matchDe = !filterDe || (r.data && r.data >= filterDe);
    const matchAte = !filterAte || (r.data && r.data <= filterAte);
    return matchV && matchDe && matchAte;
  });

  const totalLitros = filtered.reduce((s, r) => s + (parseFloat(r.litros) || 0), 0);
  const totalValor  = filtered.reduce((s, r) => s + (parseFloat(r.valor_total) || 0), 0);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => {
      const updated = { ...f, [name]: value };
      // auto-calc total
      if ((name === 'litros' || name === 'valor_litro') && updated.litros && updated.valor_litro) {
        updated.valor_total = (parseFloat(updated.litros) * parseFloat(updated.valor_litro)).toFixed(2);
      }
      return updated;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.viatura_id || !form.data || !form.litros) {
      setFormError('Viatura, data e litros são obrigatórios.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await createAbastecimento(form);
      await refetch();
      setModalOpen(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err?.response?.data?.detail || 'Erro ao registrar abastecimento.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading text="Carregando abastecimentos..." />;
  if (error)   return <p className="text-muted">Erro: {error}</p>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Abastecimento</h1>
          <p className="page-subtitle">{registros.length} registros</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setFormError(''); setModalOpen(true); }} type="button">
          + Registrar Abastecimento
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-5)' }}>
        <div className="card" style={{ padding: 'var(--spacing-4)' }}>
          <p className="text-muted text-small">Total de Registros</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{filtered.length}</p>
        </div>
        <div className="card" style={{ padding: 'var(--spacing-4)' }}>
          <p className="text-muted text-small">Total de Litros</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {totalLitros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} L
          </p>
        </div>
        <div className="card" style={{ padding: 'var(--spacing-4)' }}>
          <p className="text-muted text-small">Total em Combustível</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-danger)' }}>
            {formatCurrency(totalValor)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="form-group" style={{ minWidth: 200 }}>
          <select className="form-control" value={filterViatura} onChange={(e) => setFilterViatura(e.target.value)}>
            <option value="">Todas as viaturas</option>
            {viaturas.map((v) => <option key={v.id} value={String(v.id)}>{v.prefixo}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">De</label>
          <input type="date" className="form-control" value={filterDe} onChange={(e) => setFilterDe(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Até</label>
          <input type="date" className="form-control" value={filterAte} onChange={(e) => setFilterAte(e.target.value)} />
        </div>
        {(filterViatura || filterDe || filterAte) && (
          <button className="btn btn-outline btn-sm" onClick={() => { setFilterViatura(''); setFilterDe(''); setFilterAte(''); }} type="button">
            Limpar filtros
          </button>
        )}
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Viatura</th>
              <th>Data</th>
              <th>KM</th>
              <th>Litros</th>
              <th>Valor/L</th>
              <th>Total</th>
              <th>Posto</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted" style={{ padding: 'var(--spacing-8)' }}>
                  Nenhum registro encontrado
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, fontFamily: 'Courier New, monospace' }}>
                    {r.viatura_prefixo || r.viatura_id}
                  </td>
                  <td>{formatDate(r.data)}</td>
                  <td>{r.km?.toLocaleString('pt-BR')} km</td>
                  <td>{parseFloat(r.litros || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} L</td>
                  <td>{r.valor_litro ? formatCurrency(r.valor_litro) : '—'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--color-danger)' }}>{formatCurrency(r.valor_total)}</td>
                  <td className="text-muted text-small">{r.posto || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Abastecimento">
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
                <option value="">Selecione</option>
                {viaturas.map((v) => <option key={v.id} value={v.id}>{v.prefixo} — {v.modelo}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Data *</label>
              <input name="data" type="date" className="form-control" value={form.data} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">KM Atual</label>
              <input name="km" type="number" className="form-control" value={form.km} onChange={handleChange} min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Litros *</label>
              <input name="litros" type="number" className="form-control" value={form.litros} onChange={handleChange} step="0.01" min="0" required />
            </div>
            <div className="form-group">
              <label className="form-label">Valor por Litro (R$)</label>
              <input name="valor_litro" type="number" className="form-control" value={form.valor_litro} onChange={handleChange} step="0.001" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Valor Total (R$)</label>
              <input name="valor_total" type="number" className="form-control" value={form.valor_total} onChange={handleChange} step="0.01" min="0" />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Posto</label>
              <input name="posto" type="text" className="form-control" value={form.posto} onChange={handleChange} placeholder="Nome do posto" />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Observações</label>
              <textarea name="observacoes" className="form-control" value={form.observacoes} onChange={handleChange} rows={2} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-5)' }}>
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
