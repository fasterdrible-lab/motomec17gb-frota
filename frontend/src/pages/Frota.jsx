import React, { useState, useEffect, useCallback } from 'react';
import { getFrotaCompleta } from '../services/googleSheets';
import '../styles/Dashboard.css';

const CATEGORIAS = [
  { key: 'todas', label: 'Todas' },
  { key: 'autobomba', label: 'Auto Bomba' },
  { key: 'resgate', label: 'Resgate' },
  { key: 'transporte', label: 'Transporte' },
  { key: 'operacional', label: 'Operacional' },
];

const TIPO_COLORS = {
  VO: '#CC1F1F',
  ABS: '#991B1B',
  AB: '#991B1B',
  ABE: '#92400e',
  ABP: '#991B1B',
  UR: '#1d4ed8',
  USA: '#1d4ed8',
  AF: '#1d4ed8',
  AS: '#4338ca',
  ASE: '#4338ca',
  MOB: '#d97706',
  TP: '#7c3aed',
  MO: '#374151',
  AO: '#374151',
  MT: '#475569',
  AC: '#15803d',
  AT: '#0e7490',
  EP: '#db2777',
  CA: '#65a30d',
  CO: '#15803d',
  UT: '#0e7490',
  GO: '#15803d',
  PP: '#db2777',
  SK: '#374151',
  AE: '#92400e',
  AG: '#374151',
  RE: '#4338ca',
  CM: '#374151',
};

function getTipoPrefix(prefixo) {
  const p = String(prefixo).toUpperCase().replace(/[-_\s].*$/, '');
  const m = p.match(/^([A-Z]+)/);
  return m ? m[1] : '?';
}

function getCategoriaViatura(prefixo) {
  const tipo = getTipoPrefix(prefixo);
  if (['AB', 'ABS', 'ABE', 'ABP'].some(t => tipo === t)) return 'autobomba';
  if (['UR', 'USA', 'AF', 'AS', 'ASE'].some(t => tipo === t)) return 'resgate';
  if (['TP', 'MO', 'AO', 'MT', 'VO'].some(t => tipo === t)) return 'transporte';
  return 'operacional';
}

function getStatusBadge(status) {
  if (status === 'baixada') return { label: 'Baixada', color: '#dc2626', bg: '#fee2e2' };
  if (status === 'reserva') return { label: 'Reserva', color: '#d97706', bg: '#fef3c7' };
  return { label: 'Operacional', color: '#16a34a', bg: '#dcfce7' };
}

function ViaturaCard({ v }) {
  const tipo = getTipoPrefix(v.prefixo);
  const tipoColor = TIPO_COLORS[tipo] || '#1a1a2e';
  const badge = getStatusBadge(v.status);

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: tipoColor, color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.7rem', fontWeight: 800, flexShrink: 0,
          letterSpacing: 0.5,
        }}>
          {tipo.length > 3 ? tipo.slice(0, 3) : tipo}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {v.prefixo}
          </div>
          {v.modelo && (
            <div style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 600 }}>{v.modelo}</div>
          )}
          {v.marca && (
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{v.marca}</div>
          )}
        </div>
        <span style={{
          background: badge.bg, color: badge.color,
          padding: '3px 9px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {badge.label}
        </span>
      </div>

      {/* Details */}
      <div style={{ fontSize: '0.82rem', color: '#374151', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px' }}>
        <div><span style={{ color: '#9ca3af', fontWeight: 600 }}>Placa: </span>{v.placa || '—'}</div>
        <div><span style={{ color: '#9ca3af', fontWeight: 600 }}>Posto: </span>{v.sgb || '—'}</div>
        <div><span style={{ color: '#9ca3af', fontWeight: 600 }}>Ano: </span>{v.ano || '—'}</div>
        <div><span style={{ color: '#9ca3af', fontWeight: 600 }}>KM: </span>{v.kmAtual ? v.kmAtual.toLocaleString('pt-BR') : '—'}</div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          onClick={() => alert(`OS para ${v.prefixo}`)}
          style={{
            flex: 1, background: '#CC1F1F', color: 'white', border: 'none',
            borderRadius: 8, padding: '8px 0', fontWeight: 700, fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          🔧 OS
        </button>
        <button
          style={{
            width: 38, background: 'white', border: '1.5px solid #d1d5db',
            borderRadius: 8, fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
            color: '#374151',
          }}
          title="Trocar viatura"
        >
          ⇄
        </button>
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
  const [categoriaSel, setCategoriaSel] = useState('todas');

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
    const matchBusca = !texto ||
      v.prefixo?.toLowerCase().includes(texto) ||
      v.placa?.toLowerCase().includes(texto) ||
      v.sgb?.toLowerCase().includes(texto);
    const matchCat = categoriaSel === 'todas' || getCategoriaViatura(v.prefixo) === categoriaSel;
    return matchBusca && matchCat;
  });

  return (
    <div style={{ padding: '0 0 32px' }}>
      {/* Page Header */}
      <div style={{
        background: '#1a1a2e', padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>Controle de Viaturas</div>
          <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Gestão de Frota - Corpo de Bombeiros</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {ultimaSync && (
            <span style={{ color: '#9ca3af', fontSize: '0.78rem' }}>
              Sinc.: {ultimaSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            className="btn-sincronizar"
            onClick={() => loadData(true)}
            disabled={syncing}
            style={{ fontSize: '0.82rem' }}
          >
            {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar'}
          </button>
          <button disabled style={{
            background: '#CC1F1F', color: 'white', border: 'none',
            borderRadius: 8, padding: '8px 16px', fontWeight: 700,
            fontSize: '0.85rem', cursor: 'not-allowed', opacity: 0.75,
          }}>
            + Nova Manutenção
          </button>
        </div>
      </div>

      {/* Category Tabs + Search */}
      <div style={{ background: 'white', borderBottom: '1.5px solid #e5e7eb', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', gap: 0 }}>
            {CATEGORIAS.map(cat => (
              <button
                key={cat.key}
                onClick={() => setCategoriaSel(cat.key)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '14px 18px', fontWeight: 700, fontSize: '0.88rem',
                  color: categoriaSel === cat.key ? '#CC1F1F' : '#6b7280',
                  borderBottom: categoriaSel === cat.key ? '2.5px solid #CC1F1F' : '2.5px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {cat.label}
                {cat.key !== 'todas' && (
                  <span style={{
                    marginLeft: 6, background: '#f3f4f6', color: '#374151',
                    borderRadius: 10, padding: '1px 7px', fontSize: '0.75rem', fontWeight: 600,
                  }}>
                    {frota.filter(v => getCategoriaViatura(v.prefixo) === cat.key).length}
                  </span>
                )}
                {cat.key === 'todas' && (
                  <span style={{
                    marginLeft: 6, background: '#f3f4f6', color: '#374151',
                    borderRadius: 10, padding: '1px 7px', fontSize: '0.75rem', fontWeight: 600,
                  }}>
                    {frota.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="🔍 Buscar por prefixo, placa ou posto..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{
              padding: '8px 14px', borderRadius: 8, border: '1px solid #d1d5db',
              fontSize: '0.88rem', width: 280,
            }}
          />
        </div>
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

      {!loading && !error && (
        <div style={{ padding: '20px 24px' }}>
          {frotaFiltrada.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', background: 'white', borderRadius: 10 }}>
              🔍 Nenhuma viatura encontrada.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}>
              {frotaFiltrada.map((v, i) => (
                <ViaturaCard key={i} v={v} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Frota;
