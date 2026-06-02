import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageState from '../components/PageState';
import { getFrotaDetalhada } from '../services/frotaService';

function getStatusColor(status) {
  const s = String(status).toUpperCase();
  if (s.includes('BAIXA')) return { bg: '#fff3f3', border: '#e53935', badge: '#e53935', label: 'Baixada' };
  if (s.includes('RESERVA')) return { bg: '#fffde7', border: '#f9a825', badge: '#f9a825', label: 'Reserva' };
  return { bg: '#f0fff4', border: '#43a047', badge: '#43a047', label: 'Operacional' };
}

function getTipoColor(tipo) {
  const t = String(tipo).toUpperCase();
  if (t.includes('ABS')) return '#1565C0';
  if (t.includes('UR')) return '#6a1b9a';
  if (t.includes('VO')) return '#e65100';
  if (t.includes('BUS') || t.includes('MIC')) return '#00838f';
  if (t.includes('VTR') || t.includes('VB')) return '#2e7d32';
  return '#546e7a';
}

export default function Frota() {
  const navigate = useNavigate();
  const [viaturas, setViaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const lista = await getFrotaDetalhada();
      setViaturas(lista);
    } catch (e) {
      setErro('Erro ao carregar dados da frota: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const abrirManutencao = (viatura) => {
    localStorage.setItem('motomec:lastViatura', JSON.stringify(viatura));
    navigate(`/manutencao?prefixo=${encodeURIComponent(viatura.prefixo)}`, {
      state: { viatura },
    });
  };

  const tipos = ['TODOS', ...Array.from(new Set(viaturas.map(v => {
    const match = String(v.prefixo).match(/^([A-Za-z]+)/);
    return match ? match[1].toUpperCase() : 'OUTRO';
  }))).sort()];

  const viaturasFiltradas = viaturas.filter(v => {
    const prefixoTipo = (() => {
      const match = String(v.prefixo).match(/^([A-Za-z]+)/);
      return match ? match[1].toUpperCase() : 'OUTRO';
    })();
    const matchTipo = filtroTipo === 'TODOS' || prefixoTipo === filtroTipo;
    const matchStatus = filtroStatus === 'TODOS' ||
      (filtroStatus === 'OPERACIONAL' && !String(v.status).toUpperCase().includes('BAIXA') && !String(v.status).toUpperCase().includes('RESERVA')) ||
      (filtroStatus === 'BAIXADA' && String(v.status).toUpperCase().includes('BAIXA')) ||
      (filtroStatus === 'RESERVA' && String(v.status).toUpperCase().includes('RESERVA'));
    const q = busca.toLowerCase();
    const matchBusca = !q ||
      String(v.prefixo).toLowerCase().includes(q) ||
      String(v.placa).toLowerCase().includes(q) ||
      String(v.modelo).toLowerCase().includes(q) ||
      String(v.marca).toLowerCase().includes(q) ||
      String(v.posto).toLowerCase().includes(q);
    return matchTipo && matchStatus && matchBusca;
  });

  return (
    <div style={{ padding: '24px', background: '#f4f6f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: '#1a237e', fontWeight: 700 }}>
            Frota - 17GB
          </h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>
            {viaturas.length} viaturas cadastradas - {viaturasFiltradas.length} exibidas
          </p>
        </div>
        <button
          onClick={carregarDados}
          disabled={loading}
          style={{
            background: '#1565C0', color: '#fff', border: 'none',
            borderRadius: 8, padding: '10px 20px', cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600, opacity: loading ? 0.7 : 1
          }}
        >
          Atualizar
        </button>
      </div>

      <div style={{
        background: '#fff', borderRadius: 12, padding: '16px 20px',
        marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Buscar por prefixo, placa, modelo, posto..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{
            flex: '1 1 260px', padding: '10px 14px', borderRadius: 8,
            border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none'
          }}
        />
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0',
            fontSize: 14, background: '#fff', cursor: 'pointer'
          }}
        >
          {tipos.map(t => <option key={t} value={t}>{t === 'TODOS' ? 'Todos os Tipos' : t}</option>)}
        </select>
        <select
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0',
            fontSize: 14, background: '#fff', cursor: 'pointer'
          }}
        >
          <option value="TODOS">Todos os Status</option>
          <option value="OPERACIONAL">Operacional</option>
          <option value="RESERVA">Reserva</option>
          <option value="BAIXADA">Baixada</option>
        </select>
      </div>

      {loading && (
        <PageState
          variant="loading"
          title="Carregando viaturas"
          message="Buscando os dados da frota e cruzando as informacoes das abas SGB."
        />
      )}

      {erro && !loading && (
        <PageState
          variant="error"
          title="Nao foi possivel carregar a frota"
          message={erro}
          actionLabel="Tentar novamente"
          onAction={carregarDados}
        />
      )}

      {!loading && !erro && viaturasFiltradas.length === 0 && (
        <PageState
          variant="empty"
          title="Nenhuma viatura encontrada"
          message="Ajuste os filtros ou refaca a busca para localizar outra viatura."
        />
      )}

      {!loading && !erro && viaturasFiltradas.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20
        }}>
          {viaturasFiltradas.map(v => {
            const statusStyle = getStatusColor(v.status);
            const tipoColor = getTipoColor(v.prefixo);
            const prefixoTipo = (() => {
              const match = String(v.prefixo).match(/^([A-Za-z]+)/);
              return match ? match[1].toUpperCase() : 'VTR';
            })();

            return (
              <div
                key={v.prefixo}
                role="button"
                tabIndex={0}
                aria-label={`Abrir manutencao da viatura ${v.prefixo}`}
                onClick={() => abrirManutencao(v)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    abrirManutencao(v);
                  }
                }}
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                  border: `2px solid ${statusStyle.border}`,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.13)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)'; }}
              >
                <div style={{
                  background: tipoColor, color: '#fff',
                  padding: '12px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: 1 }}>
                    {v.prefixo}
                  </span>
                  <span style={{
                    background: 'rgba(255,255,255,0.25)', borderRadius: 20,
                    padding: '2px 12px', fontSize: 12, fontWeight: 600
                  }}>
                    {prefixoTipo}
                  </span>
                </div>

                <div style={{ padding: '14px 16px', flex: 1 }}>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1a237e' }}>
                      {v.modelo || '-'}
                    </div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      {v.marca || '-'}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: 13 }}>
                    <div>
                      <span style={{ color: '#999', fontSize: 11, display: 'block' }}>PLACA</span>
                      <span style={{ fontWeight: 600 }}>{v.placa || '-'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#999', fontSize: 11, display: 'block' }}>ANO FAB/MOD</span>
                      <span style={{ fontWeight: 600 }}>{v.anoFab || '-'}{v.anoModelo ? `/${v.anoModelo}` : ''}</span>
                    </div>
                    <div>
                      <span style={{ color: '#999', fontSize: 11, display: 'block' }}>POSTO</span>
                      <span style={{ fontWeight: 600 }}>{v.posto || '-'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#999', fontSize: 11, display: 'block' }}>KM ATUAL</span>
                      <span style={{ fontWeight: 600 }}>{v.km || '-'}</span>
                    </div>
                    {v.fipeEstimado && (
                      <div style={{ gridColumn: '1/-1' }}>
                        <span style={{ color: '#999', fontSize: 11, display: 'block' }}>FIPE ESTIMADO</span>
                        <span style={{ fontWeight: 600, color: '#2e7d32' }}>{v.fipeEstimado}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{
                  padding: '10px 16px',
                  background: statusStyle.bg,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderTop: `1px solid ${statusStyle.border}22`
                }}>
                  <span style={{
                    background: statusStyle.badge, color: '#fff',
                    borderRadius: 20, padding: '3px 14px',
                    fontSize: 12, fontWeight: 700
                  }}>
                    {statusStyle.label}
                  </span>
                  <span style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>
                    Abrir manutencao
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
