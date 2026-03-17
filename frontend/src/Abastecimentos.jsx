import React, { useState, useEffect, useCallback } from 'react';
import { getAbastecimentos } from '../services/googleSheets';

function Abastecimentos() {
  const [abastecimentos, setAbastecimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroCombustivel, setFiltroCombustivel] = useState('TODOS');

  const fmtMoeda = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const load = useCallback(async (isManual = false) => {
    if (isManual) setSyncing(true);
    else setLoading(true);
    try {
      const data = await getAbastecimentos();
      setAbastecimentos(data);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Data de hoje no formato DD/MM/AAAA
  const hoje = new Date();
  const hojeStr = `${String(hoje.getDate()).padStart(2,'0')}/${String(hoje.getMonth()+1).padStart(2,'0')}/${hoje.getFullYear()}`;

  // Abastecimentos de HOJE
  const abastHoje = abastecimentos.filter(a => String(a.data) === hojeStr);
  const viaturasHoje = [...new Set(abastHoje.map(a => a.prefixo))].length;
  const litrosHoje = abastHoje.reduce((s, a) => s + (a.litros || 0), 0);
  const valorHoje = abastHoje.reduce((s, a) => s + (a.valorTotal || 0), 0);

  // Por combustível hoje
  const porCombHoje = {};
  abastHoje.forEach(a => {
    const c = String(a.combustivel || 'N/A').toUpperCase();
    if (!porCombHoje[c]) porCombHoje[c] = { count: 0, litros: 0, valor: 0 };
    porCombHoje[c].count++;
    porCombHoje[c].litros += a.litros || 0;
    porCombHoje[c].valor += a.valorTotal || 0;
  });

  // Cores por combustível
  const corComb = {
    'ALCOOL': '#15803d', 'ÁLCOOL': '#15803d',
    'DIESEL S10': '#1d4ed8', 'DIESEL': '#1d4ed8',
    'GASOLINA': '#dc2626',
    'DEFAULT': '#6b7280'
  };
  const getCor = (c) => corComb[c] || corComb['DEFAULT'];

  // Lista filtrada
  const tipos = ['TODOS', ...new Set(abastecimentos.map(a => String(a.combustivel || 'N/A').toUpperCase()))];

  const filtrados = abastecimentos.filter(a => {
    const b = busca.toLowerCase();
    const matchBusca = !busca ||
      String(a.prefixo).toLowerCase().includes(b) ||
      String(a.placa).toLowerCase().includes(b) ||
      String(a.posto).toLowerCase().includes(b);
    const matchComb = filtroCombustivel === 'TODOS' ||
      String(a.combustivel).toUpperCase() === filtroCombustivel;
    return matchBusca && matchComb;
  });

  // Agrupado por data para tabela
  const porData = {};
  filtrados.forEach(a => {
    const d = a.data || 'Sem data';
    if (!porData[d]) porData[d] = [];
    porData[d].push(a);
  });
  const datasOrdenadas = Object.keys(porData).sort((a, b) => {
    const toDate = s => {
      const p = s.split('/');
      return p.length === 3 ? new Date(p[2], p[1]-1, p[0]) : new Date(0);
    };
    return toDate(b) - toDate(a);
  });

  return (
    <div style={{ padding: '0 0 32px', background: '#f3f4f6', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#1a1a2e', padding: '10px 24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600 }}>⛽ Sistema de Gestão de Frota — Abastecimentos</span>
        <button
          onClick={() => load(true)}
          disabled={syncing}
          style={{ background: '#0e7490', color: 'white', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
        >
          {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar'}
        </button>
      </div>

      <div style={{ padding: '20px 24px' }}>

        {/* CARD DESTAQUE — HOJE */}
        <div style={{
          background: 'linear-gradient(135deg, #0e7490, #0369a1)',
          borderRadius: 12, padding: '20px 24px', marginBottom: 20,
          color: 'white', boxShadow: '0 4px 16px rgba(14,116,144,0.3)'
        }}>
          <div style={{ fontSize: '0.8rem', opacity: 0.85, marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>
            📅 Abastecimentos Hoje — {hojeStr}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {[
              { label: 'Viaturas', value: viaturasHoje, icon: '🚒' },
              { label: 'Abastecimentos', value: abastHoje.length, icon: '⛽' },
              { label: 'Volume Total', value: `${litrosHoje.toFixed(1)} L`, icon: '🧴' },
              { label: 'Gasto Total', value: fmtMoeda(valorHoje), icon: '💰' },
            ].map(c => (
              <div key={c.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{c.icon} {c.value}</div>
                <div style={{ fontSize: '0.78rem', opacity: 0.85, marginTop: 2 }}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* Por combustível hoje */}
          {Object.keys(porCombHoje).length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.2)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {Object.entries(porCombHoje).map(([comb, dados]) => (
                <div key={comb} style={{
                  background: 'rgba(255,255,255,0.15)', borderRadius: 8,
                  padding: '8px 14px', fontSize: '0.82rem'
                }}>
                  <strong>{comb}</strong>: {dados.count} abast. · {dados.litros.toFixed(1)} L · {fmtMoeda(dados.valor)}
                </div>
              ))}
            </div>
          )}

          {abastHoje.length === 0 && (
            <div style={{ marginTop: 12, opacity: 0.7, fontSize: '0.85rem' }}>
              Nenhum abastecimento registrado hoje.
            </div>
          )}
        </div>

        {/* Cards totais do período */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Registros', value: abastecimentos.length, color: '#0e7490' },
            { label: 'Total Litros', value: `${abastecimentos.reduce((s,a)=>s+(a.litros||0),0).toFixed(1)} L`, color: '#15803d' },
            { label: 'Total Gasto', value: fmtMoeda(abastecimentos.reduce((s,a)=>s+(a.valorTotal||0),0)), color: '#d97706' },
            { label: 'Média por Abast.', value: fmtMoeda(abastecimentos.length > 0 ? abastecimentos.reduce((s,a)=>s+(a.valorTotal||0),0)/abastecimentos.length : 0), color: '#7c3aed' },
          ].map(c => (
            <div key={c.label} style={{
              background: 'white', borderRadius: 8, padding: '14px 18px',
              boxShadow: '0 1px 6px rgba(0,0,0,0.07)', borderTop: `3px solid ${c.color}`
            }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1a1a2e' }}>{c.value}</div>
              <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: 2 }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="🔍 Buscar prefixo, placa ou posto..."
            style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.88rem' }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {tipos.map(t => (
              <button key={t} onClick={() => setFiltroCombustivel(t)} style={{
                padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: '0.78rem', fontWeight: 600,
                background: filtroCombustivel === t ? getCor(t) : '#e5e7eb',
                color: filtroCombustivel === t ? 'white' : '#374151',
              }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Tabela agrupada por data */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af', background: 'white', borderRadius: 10 }}>
            ⏳ Carregando abastecimentos...
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af', background: 'white', borderRadius: 10 }}>
            Nenhum abastecimento encontrado
          </div>
        ) : (
          datasOrdenadas.map(data => {
            const linhas = porData[data];
            const viatDia = [...new Set(linhas.map(a => a.prefixo))].length;
            const litDia = linhas.reduce((s,a) => s+(a.litros||0), 0);
            const valDia = linhas.reduce((s,a) => s+(a.valorTotal||0), 0);
            const isHoje = data === hojeStr;

            return (
              <div key={data} style={{ marginBottom: 16 }}>
                {/* Cabeçalho do grupo de data */}
                <div style={{
                  background: isHoje ? '#0e7490' : '#1a1a2e',
                  color: 'white', padding: '8px 16px', borderRadius: '8px 8px 0 0',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    📅 {data} {isHoje && '— HOJE'}
                  </span>
                  <div style={{ display: 'flex', gap: 20, fontSize: '0.82rem', opacity: 0.9 }}>
                    <span>🚒 {viatDia} viatura{viatDia !== 1 ? 's' : ''}</span>
                    <span>⛽ {linhas.length} abast.</span>
                    <span>🧴 {litDia.toFixed(1)} L</span>
                    <span>💰 {fmtMoeda(valDia)}</span>
                  </div>
                </div>

                {/* Tabela do dia */}
                <div style={{ background: 'white', borderRadius: '0 0 8px 8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                        {['PREFIXO', 'PLACA', 'COMBUSTÍVEL', 'LITROS', 'VALOR', 'KM', 'POSTO', 'RESPONSÁVEL'].map(h => (
                          <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {linhas.map((a, i) => {
                        const comb = String(a.combustivel || '').toUpperCase();
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                            <td style={{ padding: '8px 14px', fontWeight: 700, color: '#1a1a2e', fontSize: '0.88rem' }}>{a.prefixo}</td>
                            <td style={{ padding: '8px 14px', color: '#374151', fontSize: '0.85rem' }}>{a.placa || '—'}</td>
                            <td style={{ padding: '8px 14px' }}>
                              <span style={{
                                background: getCor(comb) + '20',
                                color: getCor(comb),
                                padding: '3px 10px', borderRadius: 12,
                                fontSize: '0.75rem', fontWeight: 700
                              }}>{comb || '—'}</span>
                            </td>
                            <td style={{ padding: '8px 14px', color: '#0e7490', fontWeight: 700, fontSize: '0.85rem' }}>{a.litros > 0 ? `${a.litros} L` : '—'}</td>
                            <td style={{ padding: '8px 14px', color: '#15803d', fontWeight: 700, fontSize: '0.85rem' }}>{fmtMoeda(a.valorTotal)}</td>
                            <td style={{ padding: '8px 14px', color: '#374151', fontSize: '0.85rem' }}>{a.km ? Number(a.km).toLocaleString('pt-BR') : '—'}</td>
                            <td style={{ padding: '8px 14px', color: '#6b7280', fontSize: '0.82rem' }}>{a.posto || '—'}</td>
                            <td style={{ padding: '8px 14px', color: '#6b7280', fontSize: '0.82rem' }}>{a.responsavel || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Abastecimentos;