import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import DetalhesViaturaManutencao from '../components/DetalhesViaturaManutencao';
import { findViaturaByPrefixo, getFrotaDetalhada } from '../services/frotaService';
import { getManutencoes } from '../services/googleSheets';
import '../styles/Dashboard.css';

function normalizePrefixo(value) {
  return String(value || '').trim().toUpperCase();
}

const serviceTabs = [
  { key: 'todos', label: 'Todos' },
  { key: 'realizados', label: 'Servicos realizados' },
  { key: 'oleo', label: 'Troca de oleo' },
  { key: 'pneus', label: 'Pneus' },
  { key: 'bateria', label: 'Bateria' },
];

function matchesServiceCategory(manutencao, category) {
  const text = `${manutencao.tipo || ''} ${manutencao.status || ''} ${manutencao.detalhe || ''}`.toLowerCase();
  if (category === 'todos') return true;
  if (category === 'realizados') {
    return text.includes('realiz') || text.includes('conclu') || text.includes('execut');
  }
  if (category === 'oleo') return text.includes('oleo') || text.includes('óleo');
  if (category === 'pneus') return text.includes('pneu');
  if (category === 'bateria') return text.includes('bateria');
  return true;
}

function Manutencao() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const prefixoParam = searchParams.get('prefixo') || '';
  const persistedViatura = useMemo(() => {
    try {
      const raw = localStorage.getItem('motomec:lastViatura');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  const ignorePersistedSelection = useMemo(() => {
    const flag = sessionStorage.getItem('motomec:manutencao-ignore-last') === '1';
    if (flag) {
      sessionStorage.removeItem('motomec:manutencao-ignore-last');
    }
    return flag;
  }, []);
  const initialViatura = location.state?.viatura || (!ignorePersistedSelection ? persistedViatura : null) || null;
  const selectedPrefixo = prefixoParam || initialViatura?.prefixo || '';

  const [manutencoes, setManutencoes] = useState([]);
  const [viaturaSelecionada, setViaturaSelecionada] = useState(initialViatura);
  const [viaturaNaoEncontrada, setViaturaNaoEncontrada] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [ultimaSync, setUltimaSync] = useState(null);
  const [tab, setTab] = useState('todas');
  const [serviceTab, setServiceTab] = useState('todos');
  const [serviceSearch, setServiceSearch] = useState('');

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setSyncing(true);
    setError('');
    setViaturaNaoEncontrada(false);

    try {
      const [manutencoesData, frotaData] = await Promise.all([
        getManutencoes(),
        selectedPrefixo && (!initialViatura || prefixoParam) ? getFrotaDetalhada() : Promise.resolve([]),
      ]);

      setManutencoes(manutencoesData);

      if (selectedPrefixo) {
        const fromState = location.state?.viatura;
        const fromStorage = persistedViatura;
        const localMatch = fromState && normalizePrefixo(fromState.prefixo) === normalizePrefixo(selectedPrefixo)
          ? fromState
          : fromStorage && normalizePrefixo(fromStorage.prefixo) === normalizePrefixo(selectedPrefixo)
            ? fromStorage
            : null;
        const found = localMatch || findViaturaByPrefixo(frotaData, selectedPrefixo);

        setViaturaSelecionada(found || null);
        setViaturaNaoEncontrada(Boolean(prefixoParam) && !found);
      } else {
        setViaturaSelecionada(initialViatura);
      }

      setUltimaSync(new Date());
    } catch (e) {
      setError('Erro ao buscar dados da planilha. Verifique a conexao e tente novamente.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [initialViatura, location.state, persistedViatura, prefixoParam, selectedPrefixo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const manutencoesDaViatura = useMemo(() => {
    const selectedPrefixo = prefixoParam || viaturaSelecionada?.prefixo || persistedViatura?.prefixo || '';
    if (!selectedPrefixo) return manutencoes;
    return manutencoes.filter(m => normalizePrefixo(m.prefixo) === normalizePrefixo(selectedPrefixo));
  }, [manutencoes, persistedViatura, prefixoParam, viaturaSelecionada]);

  const statusFiltradas = useMemo(() => {
    if (tab === 'todas') return manutencoesDaViatura;
    return manutencoesDaViatura.filter(m => m.status === (tab === 'vencidas' ? 'vencida' : 'pendente'));
  }, [manutencoesDaViatura, tab]);

  const filtradas = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase();
    return statusFiltradas.filter(m => {
      const serviceMatch = matchesServiceCategory(m, serviceTab);
      const searchMatch = !q || `${m.prefixo} ${m.tipo} ${m.status} ${m.detalhe}`.toLowerCase().includes(q);
      return serviceMatch && searchMatch;
    });
  }, [serviceSearch, serviceTab, statusFiltradas]);

  const tabs = [
    { key: 'todas', label: `Todas (${manutencoesDaViatura.length})` },
    { key: 'vencidas', label: `Vencidas (${manutencoesDaViatura.filter(m => m.status === 'vencida').length})` },
    { key: 'pendentes', label: `Pendentes (${manutencoesDaViatura.filter(m => m.status === 'pendente').length})` },
  ];

  const clearViatura = () => {
    sessionStorage.setItem('motomec:manutencao-ignore-last', '1');
    setViaturaSelecionada(null);
    setViaturaNaoEncontrada(false);
    navigate('/manutencao');
  };

  return (
    <div>
      <div className="dash-action-bar">
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>
          Manutencao
          {prefixoParam && <span style={{ color: '#CC1F1F' }}> · {prefixoParam}</span>}
        </h2>
        <button className="btn-sincronizar" onClick={() => loadData(true)} disabled={syncing}>
          {syncing ? 'Sincronizando...' : 'Sincronizar'}
        </button>
        {ultimaSync && (
          <span className="sync-info">
            Ultima sinc.: {ultimaSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {loading && <div className="dash-loading">Carregando dados da planilha...</div>}

      {error && !loading && (
        <div className="dash-error">
          <span>{error}</span>
          <button className="btn-sincronizar" onClick={() => loadData(true)} style={{ marginLeft: 'auto' }}>
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && (
        <div style={{ padding: '0 20px 20px' }}>
          {viaturaNaoEncontrada && (
            <div className="error-msg">
              Viatura não encontrada
            </div>
          )}

          {viaturaSelecionada && (
            <DetalhesViaturaManutencao viatura={viaturaSelecionada} onClear={clearViatura} />
          )}

          <div className="card mb-20">
            <div className="section-header">
              <div>
                <h3 className="section-title">Pesquisa de servicos</h3>
                <div className="text-muted" style={{ marginTop: 4 }}>
                  Area preparada para consultar servicos realizados, troca de oleo, pneus e bateria.
                </div>
              </div>
            </div>

            <div className="filter-bar" style={{ marginBottom: 0 }}>
              <input
                type="text"
                placeholder="Pesquisar por prefixo, tipo, status ou detalhe..."
                value={serviceSearch}
                onChange={e => setServiceSearch(e.target.value)}
                style={{ minWidth: 260, flex: '1 1 260px' }}
              />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {serviceTabs.map(item => (
                  <button
                    key={item.key}
                    type="button"
                    className="btn-small"
                    onClick={() => setServiceTab(item.key)}
                    style={{
                      background: serviceTab === item.key ? '#CC1F1F' : 'white',
                      color: serviceTab === item.key ? 'white' : 'var(--color-text-muted)',
                      borderColor: serviceTab === item.key ? '#CC1F1F' : 'var(--color-border)',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{
                  padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                  background: tab === t.key ? '#CC1F1F' : '#f3f4f6',
                  color: tab === t.key ? 'white' : '#374151',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {filtradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', background: 'white', borderRadius: 10 }}>
              {prefixoParam
                ? 'Nenhuma manutencao encontrada para esta viatura nos filtros selecionados.'
                : 'Nenhuma manutencao encontrada nesta categoria.'}
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                    {['Prefixo', 'Tipo', 'Status', 'Detalhe'].map(col => (
                      <th key={col} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((m, i) => (
                    <tr key={`${m.prefixo}-${m.tipo}-${i}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{m.prefixo}</td>
                      <td style={{ padding: '10px 14px' }}>{m.tipo}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {m.status === 'vencida' ? (
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', background: '#fee2e2' }}>Vencida</span>
                        ) : (
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, color: '#d97706', background: '#fef3c7' }}>Pendente</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#6b7280' }}>{m.detalhe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Manutencao;
