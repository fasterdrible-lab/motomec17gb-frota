import React, { useEffect, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMateriaisOperacionais } from '../services/logisticaSheets';
import { C, REFRESH_INTERVAL, KPICard, ProgressBar } from '../components/LogisticaComponents';

const ABAS_MAT_OP = ['EPR', 'COMPRESSOR', 'EMBARCAÇÕES', 'CILÍNDROS', 'MS/MA/MP/SS', 'DESENCARCERADORES', 'EQUIP. DIVERSOS'];

// ─── PÁGINA MACRO ─────────────────────────────────────────────────────────────
function Logistica() {
  const [matOp, setMatOp]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [syncing, setSyncing]       = useState(false);
  const [error, setError]           = useState('');
  const [ultimaSync, setUltimaSync] = useState(null);

  const loadData = useCallback(async (manual = false) => {
    if (manual) setSyncing(true);
    else setLoading(true);
    setError('');
    try {
      const matResult = await getMateriaisOperacionais();
      setMatOp(matResult);
      setUltimaSync(new Date());
    } catch (e) {
      setError('Erro ao carregar dados: ' + e.message);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const t = setInterval(() => loadData(), REFRESH_INTERVAL);
    return () => clearInterval(t);
  }, [loadData]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 16 }}>
      <div style={{
        width: 40, height: 40, border: `4px solid #e5e7eb`,
        borderTopColor: C.red2, borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      }} />
      <div style={{ color: C.mid }}>Carregando dados das planilhas de logística...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error && !matOp) return (
    <div style={{ padding: 40, textAlign: 'center', color: C.red2 }}>
      <div style={{ fontSize: '2rem', marginBottom: 12 }}>❌</div>
      <div style={{ fontWeight: 700 }}>{error}</div>
      <button onClick={() => loadData(true)} style={{ marginTop: 16, padding: '8px 20px', background: C.red2, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
        Tentar novamente
      </button>
    </div>
  );

  const totais    = matOp?.totais    || { total: 0, op: 0, bx: 0 };
  const thVencendo = matOp?.thVencendo || 0;
  const pctGeral  = totais.total ? Math.round(totais.op / totais.total * 100) : 0;

  const abasPorNome = name => matOp?.abas?.find(a => a.aba === name) || { op: 0, bx: 0, total: 0 };
  const pasDea  = abasPorNome('PAS DE DEA');
  const reparos = abasPorNome('REPAROS');

  const abasMatOp = (matOp?.abas || []).filter(a => ABAS_MAT_OP.includes(a.aba));

  return (
    <div className="page-inner">

      {/* CABEÇALHO */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: C.dark }}>🚒 Painel de Logística</h1>
          <p style={{ fontSize: '0.85rem', color: C.mid, marginTop: 2 }}>
            Visão macro · 17º Grupamento de Bombeiros
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {ultimaSync && (
            <span style={{ fontSize: '0.75rem', color: C.mid }}>
              Última sync: {ultimaSync.toLocaleTimeString('pt-BR')}
            </span>
          )}
          <button
            onClick={() => loadData(true)}
            disabled={syncing}
            style={{
              padding: '8px 16px', background: syncing ? '#e5e7eb' : C.red2,
              color: syncing ? C.mid : '#fff', border: 'none', borderRadius: 8,
              cursor: syncing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.82rem',
            }}
          >
            {syncing ? '⟳ Atualizando...' : '⟳ Atualizar'}
          </button>
        </div>
      </div>

      {/* KPIs GLOBAIS */}
      <div className="grid-cols-6" style={{ marginBottom: 24 }}>
        <KPICard icon="📦" label="Total de Equipamentos" value={totais.total} sub="Mat. Operacionais" />
        <KPICard icon="✅" label="Operando"  value={totais.op}  sub={`${pctGeral}% disponibilidade`} variant="success" />
        <KPICard icon="❌" label="Baixados"  value={totais.bx}  sub={`${100 - pctGeral}% indisponíveis`} variant={totais.bx > 20 ? 'danger' : 'warning'} />
        <KPICard icon="⚠️" label="TH Vencendo em 2026" value={thVencendo} sub="cilíndros" variant={thVencendo > 0 ? 'warning' : 'success'} />
        <KPICard icon="🚤" label="Embarcações"  value={`${abasPorNome('EMBARCAÇÕES').op}/${abasPorNome('EMBARCAÇÕES').total}`}  sub="operacionais" variant="success" />
        <KPICard icon="⚙️" label="Compressores" value={`${abasPorNome('COMPRESSOR').op}/${abasPorNome('COMPRESSOR').total}`} sub="operacionais" variant="info" />
      </div>

      {/* CARDS MACRO: PAS DE DEA · REPAROS · ALERTAS · DISPONIBILIDADE */}
      {(() => {
        const alertas = [
          thVencendo > 0 && { txt: `${thVencendo} cilíndros com TH vencendo em 2026`, crit: true },
          (abasPorNome('COMPRESSOR').bx || 0) >= 3 && { txt: `Compressores: ${abasPorNome('COMPRESSOR').op}/${abasPorNome('COMPRESSOR').total} operando`, crit: true },
          (abasPorNome('EPR').bx || 0) > 0 && { txt: `EPR: ${abasPorNome('EPR').bx} unidades baixadas`, crit: false },
        ].filter(Boolean);
        const pctColor = pctGeral >= 90 ? C.green : pctGeral >= 70 ? C.yellow : C.red2;

        const cardBase = {
          borderRadius: 10,
          padding: '18px 20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        };
        const btnBase = {
          flexShrink: 0, padding: '7px 14px',
          borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
          textDecoration: 'none', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer',
        };
        const infoBlock = { fontSize: '0.8rem', color: C.mid, marginTop: 6, fontWeight: 500 };

        return (
          <div className="grid-cols-4" style={{ marginBottom: 24 }}>

            {/* PAS DE DEA */}
            <div style={{ ...cardBase, background: '#eff6ff', borderLeft: '4px solid #1565C0' }}>
              <div>
                <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>🫀</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: C.dark, lineHeight: 1 }}>{pasDea.total}</div>
                <div style={infoBlock}>PAS DE DEA solicitadas</div>
              </div>
              <Link to="/logistica/pas-dea" style={{ ...btnBase, background: '#1565C0', color: '#fff' }}>Ver →</Link>
            </div>

            {/* REPAROS */}
            <div style={{ ...cardBase, background: '#fff7ed', borderLeft: `4px solid ${C.orange}` }}>
              <div>
                <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>🛠️</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: C.dark, lineHeight: 1 }}>
                  {reparos.total}
                  {reparos.bx > 0 && <span style={{ fontSize: '0.78rem', color: C.red2, marginLeft: 6, fontWeight: 700 }}>({reparos.bx} bx)</span>}
                </div>
                <div style={infoBlock}>Reparos em andamento</div>
              </div>
              <Link to="/logistica/reparos" style={{ ...btnBase, background: C.orange, color: '#fff' }}>Ver →</Link>
            </div>

            {/* ALERTAS */}
            <div style={{ ...cardBase, background: alertas.length > 0 ? '#fffbeb' : '#f0fdf4', borderLeft: `4px solid ${alertas.length > 0 ? '#FFC107' : C.green}` }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>{alertas.length > 0 ? '⚠️' : '✅'}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: alertas.length > 0 ? '#E65100' : C.green, lineHeight: 1 }}>{alertas.length}</div>
                <div style={infoBlock}>Alertas prioritários</div>
                {alertas[0] && (
                  <div style={{ fontSize: '0.7rem', color: alertas[0].crit ? C.red2 : '#92400e', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {alertas[0].txt}{alertas.length > 1 ? ` +${alertas.length - 1}` : ''}
                  </div>
                )}
              </div>
              <Link to="/logistica/mat-operacionais" style={{ ...btnBase, background: alertas.length > 0 ? '#E65100' : C.green, color: '#fff' }}>Ver →</Link>
            </div>

            {/* DISPONIBILIDADE GERAL */}
            <div style={{ ...cardBase, background: '#fff', borderLeft: `4px solid ${pctColor}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>📊</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: pctColor, lineHeight: 1 }}>{pctGeral}%</div>
                <div style={infoBlock}>Disponibilidade Geral</div>
                <div style={{ marginTop: 6 }}><ProgressBar pct={pctGeral} /></div>
              </div>
              <Link to="/logistica/mat-operacionais" style={{ ...btnBase, background: pctColor, color: '#fff' }}>Ver →</Link>
            </div>

          </div>
        );
      })()}

      {/* RESUMO POR CATEGORIA */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: C.dark }}>📋 Resumo por Categoria</h2>
          <Link to="/logistica/mat-operacionais" style={{
            padding: '7px 14px', background: C.red2, color: '#fff',
            borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none',
          }}>Ver detalhes completos →</Link>
        </div>
        <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead style={{ background: '#263238', color: '#fff' }}>
              <tr>
                {['Categoria', 'Total', 'Operando', 'Baixados', '% Disp.'].map(col => (
                  <th key={col} style={{
                    padding: '10px 16px', textAlign: col === 'Categoria' ? 'left' : 'center',
                    fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px',
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {abasMatOp.map((a, i) => {
                const pct = a.total ? Math.round(a.op / a.total * 100) : 100;
                return (
                  <tr key={a.aba} style={{ borderBottom: '1px solid #ECEFF1', background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 600 }}>{a.icone} {a.aba}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>{a.total}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: C.green, fontWeight: 600 }}>{a.op}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: a.bx > 0 ? C.red2 : C.mid, fontWeight: a.bx > 0 ? 600 : 400 }}>{a.bx}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                      <span style={{
                        background: pct >= 90 ? '#dcfce7' : pct >= 70 ? '#fffbeb' : '#fee2e2',
                        color:      pct >= 90 ? '#15803d' : pct >= 70 ? '#92400e' : '#dc2626',
                        padding: '3px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700,
                      }}>{pct}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* LINKS PARA ABAS LATERAIS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        <Link to="/logistica/mat-operacionais" style={{ textDecoration: 'none' }}>
          <div style={{
            background: `linear-gradient(135deg, ${C.red2}, ${C.orange})`,
            borderRadius: 12, padding: '20px 24px', color: '#fff', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(211,47,47,0.3)',
          }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>📦</div>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>Materiais Operacionais</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>
              EPR, Compressor, Embarcações, Cilíndros, MS/MA/MP/SS, Desencarceradores, Equip. Diversos
            </div>
            <div style={{ marginTop: 12, fontSize: '0.78rem', fontWeight: 600 }}>Acessar detalhes →</div>
          </div>
        </Link>

        <Link to="/logistica/pas-dea" style={{ textDecoration: 'none' }}>
          <div style={{
            background: `linear-gradient(135deg, #1565C0, #0d47a1)`,
            borderRadius: 12, padding: '20px 24px', color: '#fff', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(21,101,192,0.3)',
          }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🫀</div>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>PAS DE DEA</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>
              Solicitações de PAS e dispositivos DEA
            </div>
            <div style={{ marginTop: 12, fontSize: '0.78rem', fontWeight: 600 }}>Acessar detalhes →</div>
          </div>
        </Link>

        <Link to="/logistica/reparos" style={{ textDecoration: 'none' }}>
          <div style={{
            background: `linear-gradient(135deg, ${C.orange}, #bf360c)`,
            borderRadius: 12, padding: '20px 24px', color: '#fff', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(230,74,25,0.3)',
          }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🛠️</div>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>Reparos</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>
              Registro de reparos em andamento e histórico de manutenções
            </div>
            <div style={{ marginTop: 12, fontSize: '0.78rem', fontWeight: 600 }}>Acessar detalhes →</div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default Logistica;