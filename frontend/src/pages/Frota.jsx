import React, { useState, useEffect, useCallback } from 'react';

const SHEET_ID = '1q6wy9iO4aRDKMBPzxR9cISE7pCmUuIaYSRBdhUNlM4Q';

async function fetchSheetData(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  const text = await res.text();
  const json = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/)[1]);
  return json;
}

function getCell(row, index) {
  try {
    const cell = row.c[index];
    if (!cell || cell.v === null || cell.v === undefined) return '';
    return cell.f || cell.v;
  } catch {
    return '';
  }
}

function isSyncRow(val) {
  return String(val).toUpperCase().includes('SINCRONIZA') || String(val).toUpperCase().includes('ÚLTIMA');
}

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
      const [frotaData, sgb1Data, sgb2Data] = await Promise.all([
        fetchSheetData('FROTA'),
        fetchSheetData('1SGB'),
        fetchSheetData('2SGB'),
      ]);

      // Mapear KM e Status das abas SGB
      const sgbMap = {};
      [...(sgb1Data.table?.rows || []), ...(sgb2Data.table?.rows || [])].forEach(row => {
        const prefixo = getCell(row, 0);
        if (prefixo && !isSyncRow(prefixo)) {
          sgbMap[prefixo] = {
            km: getCell(row, 2),
            status: getCell(row, 15) || 'Operacional',
            sgb: getCell(row, 16) || '',
          };
        }
      });

      // Montar lista de viaturas da aba FROTA
      const rows = (frotaData.table?.rows || []).filter(row => {
        const prefixo = getCell(row, 0);
        return prefixo && !isSyncRow(prefixo) && prefixo !== 'PREFIXO';
      });

      const lista = rows.map(row => {
        const prefixo = getCell(row, 0);
        const sgb = sgbMap[prefixo] || {};
        return {
          prefixo,
          codigoFipe: getCell(row, 1),
          fipeEstimado: getCell(row, 2),
          opmcb: getCell(row, 3),
          posto: getCell(row, 4),
          proprietario: getCell(row, 5),
          placa: getCell(row, 6),
          marca: getCell(row, 7),
          modelo: getCell(row, 8),
          tipo: getCell(row, 9),
          anoFab: getCell(row, 10),
          anoModelo: getCell(row, 11),
          km: sgb.km || '—',
          status: sgb.status || 'Operacional',
          sgb: sgb.sgb || '',
        };
      });

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

  // Tipos únicos para filtro
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

      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: '#1a237e', fontWeight: 700 }}>
            🚒 Frota — 17º GB
          </h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>
            {viaturas.length} viaturas cadastradas · {viaturasFiltradas.length} exibidas
          </p>
        </div>
        <button
          onClick={carregarDados}
          style={{
            background: '#1565C0', color: '#fff', border: 'none',
            borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600
          }}
        >
          🔄 Atualizar
        </button>
      </div>

      {/* Filtros */}
      <div style={{
        background: '#fff', borderRadius: 12, padding: '16px 20px',
        marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="🔍 Buscar por prefixo, placa, modelo, posto..."
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
          <option value="OPERACIONAL">✅ Operacional</option>
          <option value="RESERVA">⚠️ Reserva</option>
          <option value="BAIXADA">🔴 Baixada</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: '#1565C0', fontSize: 18 }}>
          ⏳ Carregando viaturas...
        </div>
      )}

      {/* Erro */}
      {erro && !loading && (
        <div style={{
          background: '#fff3f3', border: '1px solid #e53935', borderRadius: 10,
          padding: 20, color: '#c62828', textAlign: 'center'
        }}>
          ⚠️ {erro}
        </div>
      )}

      {/* Cards */}
      {!loading && !erro && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20
        }}>
          {viaturasFiltradas.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#999', padding: 60 }}>
              Nenhuma viatura encontrada com os filtros selecionados.
            </div>
          )}
          {viaturasFiltradas.map(v => {
            const statusStyle = getStatusColor(v.status);
            const tipoColor = getTipoColor(v.prefixo);
            const prefixoTipo = (() => {
              const match = String(v.prefixo).match(/^([A-Za-z]+)/);
              return match ? match[1].toUpperCase() : 'VTR';
            })();

            return (
              <div key={v.prefixo} style={{
                background: '#fff',
                borderRadius: 14,
                boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                border: `2px solid ${statusStyle.border}`,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.13)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)'; }}
              >
                {/* Cabeçalho do Card */}
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

                {/* Corpo do Card */}
                <div style={{ padding: '14px 16px', flex: 1 }}>
                  {/* Modelo e Marca */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1a237e' }}>
                      {v.modelo || '—'}
                    </div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      {v.marca || '—'}
                    </div>
                  </div>

                  {/* Informações em grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: 13 }}>
                    <div>
                      <span style={{ color: '#999', fontSize: 11, display: 'block' }}>PLACA</span>
                      <span style={{ fontWeight: 600 }}>{v.placa || '—'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#999', fontSize: 11, display: 'block' }}>ANO FAB/MOD</span>
                      <span style={{ fontWeight: 600 }}>{v.anoFab || '—'}{v.anoModelo ? `/${v.anoModelo}` : ''}</span>
                    </div>
                    <div>
                      <span style={{ color: '#999', fontSize: 11, display: 'block' }}>POSTO</span>
                      <span style={{ fontWeight: 600 }}>{v.posto || '—'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#999', fontSize: 11, display: 'block' }}>KM ATUAL</span>
                      <span style={{ fontWeight: 600 }}>{v.km || '—'}</span>
                    </div>
                    {v.fipeEstimado && (
                      <div style={{ gridColumn: '1/-1' }}>
                        <span style={{ color: '#999', fontSize: 11, display: 'block' }}>FIPE ESTIMADO</span>
                        <span style={{ fontWeight: 600, color: '#2e7d32' }}>{v.fipeEstimado}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rodapé do Card */}
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
                  {v.sgb && (
                    <span style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>
                      {v.sgb}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}