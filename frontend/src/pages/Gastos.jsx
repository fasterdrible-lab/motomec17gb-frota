import React, { useState } from 'react';
import useApi from '../hooks/useApi';
import { getGastos, createGasto, getFrota } from '../services/api';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import GastoCard from '../components/GastoCard';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CATEGORIAS_GASTO } from '../services/constants';

const EMPTY_FORM = {
  viatura_id: '', categoria: '', descricao: '', valor: '', data: '', observacoes: '',
};

export default function Gastos() {
  const { data, loading, error, refetch } = useApi(getGastos);
  const { data: frotaData }               = useApi(getFrota);
  const gastos   = Array.isArray(data) ? data : data?.items || [];
  const viaturas = Array.isArray(frotaData) ? frotaData : frotaData?.items || [];

  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterViatura, setFilterViatura]     = useState('');
  const [filterDe, setFilterDe]               = useState('');
  const [filterAte, setFilterAte]             = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');

  const filtered = gastos.filter((g) => {
    const matchCat = !filterCategoria || g.categoria === filterCategoria;
    const matchV   = !filterViatura   || String(g.viatura_id) === filterViatura;
    const matchDe  = !filterDe  || (g.data && g.data >= filterDe);
    const matchAte = !filterAte || (g.data && g.data <= filterAte);
    return matchCat && matchV && matchDe && matchAte;
  });

  // Group totals by category
  const byCategoria = CATEGORIAS_GASTO.map((cat) => ({
    ...cat,
    total: gastos
      .filter((g) => g.categoria === cat.value)
      .reduce((s, g) => s + (parseFloat(g.valor) || 0), 0),
  })).filter((c) => c.total > 0);

  const totalGeral = filtered.reduce((s, g) => s + (parseFloat(g.valor) || 0), 0);

  // Bar chart: max category value for scaling
  const maxCat = byCategoria.length ? Math.max(...byCategoria.map((c) => c.total)) : 1;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.viatura_id || !form.categoria || !form.valor) {
      setFormError('Viatura, categoria e valor são obrigatórios.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await createGasto(form);
      await refetch();
      setModalOpen(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err?.response?.data?.detail || 'Erro ao registrar gasto.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading text="Carregando gastos..." />;
  if (error)   return <p className="text-muted">Erro: {error}</p>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gastos</h1>
          <p className="page-subtitle">{gastos.length} registros</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setFormError(''); setModalOpen(true); }} type="button">
          + Registrar Gasto
        </button>
      </div>

      {/* Category summary */}
      {byCategoria.length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <h3>Total por Categoria</h3>
            <span style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{formatCurrency(gastos.reduce((s, g) => s + (parseFloat(g.valor) || 0), 0))}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            {byCategoria.map((c) => (
              <div key={c.value}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 4 }}>
                  <span>{c.label}</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(c.total)}</span>
                </div>
                <div style={{ height: 8, background: 'var(--color-bg-alt)', borderRadius: 999 }}>
                  <div style={{
                    height: '100%',
                    width: `${(c.total / maxCat) * 100}%`,
                    background: 'var(--color-primary)',
                    borderRadius: 999,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar">
        <div className="form-group" style={{ minWidth: 170 }}>
          <select className="form-control" value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)}>
            <option value="">Todas as categorias</option>
            {CATEGORIAS_GASTO.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ minWidth: 170 }}>
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
        {(filterCategoria || filterViatura || filterDe || filterAte) && (
          <button className="btn btn-outline btn-sm" type="button" onClick={() => { setFilterCategoria(''); setFilterViatura(''); setFilterDe(''); setFilterAte(''); }}>
            Limpar
          </button>
        )}
      </div>

      <p className="results-count">{filtered.length} resultado(s) — Total: <strong>{formatCurrency(totalGeral)}</strong></p>

      {/* Expense cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-3)' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <p>Nenhum gasto encontrado</p>
          </div>
        ) : (
          filtered.map((g) => (
            <GastoCard
              key={g.id}
              categoria={g.categoria}
              descricao={g.descricao}
              valor={g.valor}
              data={g.data}
              viatura={g.viatura_prefixo || g.viatura_id}
            />
          ))
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Gasto">
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
              <label className="form-label">Categoria *</label>
              <select name="categoria" className="form-control" value={form.categoria} onChange={handleChange} required>
                <option value="">Selecione</option>
                {CATEGORIAS_GASTO.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Descrição</label>
              <input name="descricao" className="form-control" value={form.descricao} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Valor (R$) *</label>
              <input name="valor" type="number" className="form-control" value={form.valor} onChange={handleChange} step="0.01" min="0" required />
            </div>
            <div className="form-group">
              <label className="form-label">Data</label>
              <input name="data" type="date" className="form-control" value={form.data} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Observações</label>
              <textarea name="observacoes" className="form-control" value={form.observacoes} onChange={handleChange} rows={2} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-5)' }}>
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Registrar Gasto'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
