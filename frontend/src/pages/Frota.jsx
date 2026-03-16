import React, { useState, useEffect, useCallback } from 'react';
import { getFrotaCompleta } from '../services/googleSheets';
import '../styles/Dashboard.css';

const statusBadge = (status) => {
  if (status === 'baixada') return { label: 'Baixada', color: '#dc2626', bg: '#fee2e2' };
  if (status === 'reserva') return { label: 'Reserva', color: '#d97706', bg: '#fef3c7' };
  return { label: 'Operando', color: '#16a34a', bg: '#dcfce7' };
};

// Categoria groups: each entry has the category label, group ID, fixed count, and prefixo prefixes
const CATEGORIAS = [
  { grupo: '1',  label: 'Socorro de Incêndio (AB, ABS)',               fixado: 12, prefixos: ['ABS', 'AB'] },
  { grupo: '2',  label: 'Suporte básico de vida (UR e USA)',            fixado: 8,  prefixos: ['USA', 'UR'] },
  { grupo: '3',  label: 'Operacional de Comando (AC, CO)',              fixado: 2,  prefixos: ['AC', 'CO'] },
  { grupo: '4',  label: 'Abastecimento de água (AT, CM, RE)',           fixado: 3,  prefixos: ['AT', 'CM', 'RE'] },
  { grupo: '5A', label: 'Especiais aéreas (ABE, ABP, AE, SK)',          fixado: 1,  prefixos: ['ABE', 'ABP', 'AE', 'SK'] },
  { grupo: '5B', label: 'Especiais de Salvamento (AF, AS, ASE, GO, PP)',fixado: 1,  prefixos: ['ASE', 'AF', 'AS', 'GO', 'PP'] },
  { grupo: '7',  label: 'Supervisão (TP ou VO) Pequena',               fixado: 8,  prefixos: ['TP', 'VO'] },
  { grupo: '8',  label: 'Intervenção Rápida (MOB)',                     fixado: 18, prefixos: ['MOB'] },
  { grupo: '9',  label: 'Apoio Operacional (VO) Grande',               fixado: 2,  prefixos: [] },
  { grupo: '11', label: 'Transporte de Tropa (MO e AO)',               fixado: 1,  prefixos: ['MO', 'AO'] },
  { grupo: '12', label: 'Apoio Logístico (CA, UT, AG)',                fixado: 4,  prefixos: ['CA', 'UT', 'AG'] },
  { grupo: '14', label: 'Viaturas Administrativas (MT)',               fixado: 5,  prefixos: ['MT'] },
  { grupo: '17', label: 'Educação Pública (EP)',                       fixado: 2,  prefixos: ['EP'] },
];

// Group 7 and 9 both have 'VO' prefix — group 7 is "Supervisão Pequena" and group 9 is "Apoio Operacional Grande"
// We handle this by keeping group 7 first (it has TP and VO), and group 9 also has VO.
// In practice, the category is determined by the FIRST matching group in order.
// To differentiate, group 9 is placed AFTER group 7, so VO vehicles are only matched once (to group 7).
// If a distinction is needed, consider appending a "G" suffix in data — but we keep it simple here.

function getPrefixoCategory(prefixo) {
  const p = String(prefixo).toUpperCase().trim();
  for (const cat of CATEGORIAS) {
    for (const px of cat.prefixos) {
      if (p.startsWith(px)) return cat;
    }
  }
  return null;
}

function PorCategoriaView({ frota }) {
  const rows = CATEGORIAS.map(cat => {
    // Count vehicles matching this category that haven't been matched by an earlier category
    const viaturas = frota.filter(v => {
      const matched = getPrefixoCategory(v.prefixo);
      return matched && matched.grupo === cat.grupo;
    });
    const existente = viaturas.length;
    const vaga = cat.fixado - existente;
    const operando = viaturas.filter(v => v.status === 'operando').length;
    const baixada = viaturas.filter(v => v.status === 'baixada').length;
    const reserva = viaturas.filter(v => v.status === 'reserva').length;
    return { ...cat, existente, vaga, operando, baixada, reserva };
  });

  const totalFixado = rows.reduce((s, r) => s + r.fixado, 0);
  const totalExistente = rows.reduce((s, r) => s + r.existente, 0);

  const vagaStyle = (vaga) => {
    if (vaga < 0) return { background: '#fee2e2', color: '#991b1b', fontWeight: 700 };
    if (vaga > 0) return { background: '#dcfce7', color: '#166534', fontWeight: 700 };
    return { background: '#f3f4f6', color: '#374151', fontWeight: 600 };
  };

  return (
    <div style={{ padding: '0 20px 20px' }}>
      <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: '#1a1a2e', color: 'white' }}>
              {['Categoria', 'Grupo', 'Fixado', 'Existente', 'Vaga', 'Operando', 'Baixada', 'Reserva'].map(col => (
                <th key={col} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.grupo} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                <td style={{ padding: '10px 14px', fontWeight: 500, color: '#1a1a2e' }}>{row.label}</td>
                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                  <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 700 }}>
                    {row.grupo}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600 }}>{row.fixado}</td>
                <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#1a1a2e' }}>{row.existente}</td>
                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.82rem', ...vagaStyle(row.vaga) }}>
                    {row.vaga > 0 ? `+${row.vaga}` : row.vaga}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>{row.operando || '—'}</td>
                <td style={{ padding: '10px 14px', textAlign: 'center', color: '#dc2626', fontWeight: 600 }}>{row.baixada || '—'}</td>
                <td style={{ padding: '10px 14px', textAlign: 'center', color: '#d97706', fontWeight: 600 }}>{row.reserva || '—'}</td>
              </tr>
            ))}
            <tr style={{ background: '#1a1a2e', color: 'white', fontWeight: 700 }}>
              <td style={{ padding: '11px 14px' }}>Total de Viaturas</td>
              <td></td>
              <td style={{ padding: '11px 14px', textAlign: 'center' }}>{totalFixado}</td>
              <td style={{ padding: '11px 14px', textAlign: 'center' }}>{totalExistente}</td>
              <td colSpan={4}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Frota() {
  const [frota, setFrota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [ultimaSync, setUltimaSync] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroSgb, setFiltroSgb] = useState('todos');
  const [aba, setAba] = useState('todas');

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setSyncing(true);
    setError('');
    try {
      const data = await getFrotaCompleta();
      setFrota(data);
      setUltimaSync(new Date());
    } catch (e) {
      setError('Erro ao buscar dados da planilha. Verifique a conexão e tente novamente.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const frotaFiltrada = frota.filter(v => {
    const texto = busca.toLowerCase();
    const matchBusca = !texto || v.prefixo.toLowerCase().includes(texto) || v.placa.toLowerCase().includes(texto);
    const matchStatus = filtroStatus === 'todos' || v.status === filtroStatus;
    const matchSgb = filtroSgb === 'todos' || v.sgb === filtroSgb;
    return matchBusca && matchStatus && matchSgb;
  });

  const tabStyle = (active) => ({
    padding: '7px 18px', borderRadius: 6, border: 'none', cursor: 'pointer',
    fontWeight: 600, fontSize: '0.88rem',
    background: active ? '#1a1a2e' : '#f3f4f6',
    color: active ? 'white' : '#374151',
    transition: 'background 0.15s',
  });

  return (
    <div>
      <div className="dash-action-bar" style={{ flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>🚒 Frota</h2>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={tabStyle(aba === 'todas')} onClick={() => setAba('todas')}>Todas</button>
          <button style={tabStyle(aba === 'categoria')} onClick={() => setAba('categoria')}>Por Categoria</button>
        </div>

        {aba === 'todas' && (
          <>
            <input
              type="text"
              placeholder="Buscar por prefixo ou placa..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem', flex: 1, minWidth: 180 }}
            />
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }}>
              <option value="todos">Todos os status</option>
              <option value="operando">Operando</option>
              <option value="reserva">Reserva</option>
              <option value="baixada">Baixada</option>
            </select>
            <select value={filtroSgb} onChange={e => setFiltroSgb(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }}>
              <option value="todos">Todos os SGB</option>
              <option value="1SGB">1SGB</option>
              <option value="2SGB">2SGB</option>
            </select>
          </>
        )}

        <button className="btn-sincronizar" onClick={() => loadData(true)} disabled={syncing}>
          {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar'}
        </button>
        {ultimaSync && (
          <span className="sync-info">
            Última sinc.: {ultimaSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {loading && <div className="dash-loading">⏳ Carregando dados da planilha...</div>}

      {error && !loading && (
        <div className="dash-error">
          <span>⚠️ {error}</span>
          <button className="btn-sincronizar" onClick={() => loadData(true)} style={{ marginLeft: 'auto' }}>
            🔄 Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && aba === 'categoria' && (
        <PorCategoriaView frota={frota} />
      )}

      {!loading && !error && aba === 'todas' && (
        <div style={{ padding: '0 20px 20px' }}>
          {frotaFiltrada.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', background: 'white', borderRadius: 10 }}>
              🔍 Nenhuma viatura encontrada com os filtros selecionados.
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                    {['Prefixo', 'Placa', 'KM Atual', 'Modelo', 'Marca', 'Ano', 'Status', 'SGB'].map(col => (
                      <th key={col} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {frotaFiltrada.map((v, i) => {
                    const badge = statusBadge(v.status);
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{v.prefixo}</td>
                        <td style={{ padding: '10px 14px' }}>{v.placa}</td>
                        <td style={{ padding: '10px 14px' }}>{v.kmAtual ? v.kmAtual.toLocaleString('pt-BR') : '—'}</td>
                        <td style={{ padding: '10px 14px' }}>{v.modelo || '—'}</td>
                        <td style={{ padding: '10px 14px' }}>{v.marca || '—'}</td>
                        <td style={{ padding: '10px 14px' }}>{v.ano || '—'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, color: badge.color, background: badge.bg }}>
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, background: '#e0e7ff', color: '#3730a3' }}>
                            {v.sgb}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Frota;
