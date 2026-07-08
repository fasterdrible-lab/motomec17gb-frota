import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMateriaisOperacionais } from '../services/logisticaSheets';
import { C, KPICard, ProgressBar } from '../components/LogisticaComponents';
import '../styles/Dashboard.css';

function RelatorioLogistica() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [ultimaSync, setUltimaSync] = useState(null);

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setSyncing(true);
    setError('');
    try {
      const data = await getMateriaisOperacionais();
      setDados(data);
      setUltimaSync(new Date());
    } catch (e) {
      setError('Erro ao buscar dados da logística. Verifique a conexão e tente novamente.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const abasResumo = dados?.abas || [];

  const exportarTxt = () => {
    if (!dados) return;
    const { totais, thVencendo } = dados;
    const geradoEm = ultimaSync || new Date();
    const linhas = [
      '='.repeat(60),
      'RELATÓRIO LOGÍSTICA — 17º GRUPAMENTO DE BOMBEIROS / CBMESP',
      `Gerado em: ${geradoEm.toLocaleString('pt-BR')}`,
      '='.repeat(60),
      '',
      'RESUMO GERAL',
      '-'.repeat(40),
      `Total de equipamentos : ${totais.total}`,
      `Operando              : ${totais.op}`,
      `Baixados              : ${totais.bx}`,
      `TH vencendo em 2026   : ${thVencendo}`,
      '',
      'ABAS DE LOGÍSTICA',
      '-'.repeat(40),
      ...abasResumo.map(aba => {
        const pct = aba.total ? Math.round(aba.op / aba.total * 100) : 100;
        return [
          `${aba.aba}`,
          `  Total     : ${aba.total}`,
          `  Operando  : ${aba.op}`,
          `  Baixados  : ${aba.bx}`,
          `  Disp.     : ${pct}%`,
        ].join('\n');
      }),
      '',
      '='.repeat(60),
    ];
    const blob = new Blob([linhas.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-logistica-${geradoEm.toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pctGeral = dados?.totais?.total ? Math.round(dados.totais.op / dados.totais.total * 100) : 0;
  const compressores = dados?.abas?.[1] || { total: 0, op: 0, bx: 0 };
  const embarcacoes = dados?.abas?.[2] || { total: 0, op: 0, bx: 0 };
  const pasDea = dados?.abas?.[7] || { total: 0, op: 0, bx: 0 };
  const reparos = dados?.abas?.[8] || { total: 0, op: 0, bx: 0 };

  return (
    <div>
      <div className="dash-action-bar">
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>📄 Relatório LOGÍSTICA</h2>
        <button className="btn-sincronizar" onClick={() => loadData(true)} disabled={syncing}>
          {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar'}
        </button>
        {dados && (
          <button
            onClick={exportarTxt}
            style={{ padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#1a1a2e', color: 'white', fontWeight: 600, fontSize: '0.875rem' }}
          >
            ⬇️ Exportar Relatório .txt
          </button>
        )}
        {ultimaSync && (
          <span className="sync-info">
            Última sinc.: {ultimaSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {loading && <div className="dash-loading">⏳ Carregando dados da logística...</div>}

      {error && !loading && (
        <div className="dash-error">
          <span>⚠️ {error}</span>
          <button className="btn-sincronizar" onClick={() => loadData(true)} style={{ marginLeft: 'auto' }}>
            🔄 Tentar novamente
          </button>
        </div>
      )}

      {!loading && dados && (
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: 12, fontSize: '1rem' }}>🚚 Resumo Geral</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 16 }}>
              <KPICard icon="📦" label="Total de Equipamentos" value={dados.totais.total} sub="Mat. Operacionais" />
              <KPICard icon="✅" label="Operando" value={dados.totais.op} sub={`${pctGeral}% disponibilidade`} variant="success" />
              <KPICard icon="❌" label="Baixados" value={dados.totais.bx} sub={`${100 - pctGeral}% indisponíveis`} variant={dados.totais.bx > 20 ? 'danger' : 'warning'} />
              <KPICard icon="⚠️" label="TH Vencendo em 2026" value={dados.thVencendo} sub="cilíndros" variant={dados.thVencendo > 0 ? 'warning' : 'success'} />
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 10, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: 14, fontSize: '1rem' }}>📌 Destaques Operacionais</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ fontSize: '0.8rem', color: C.mid, fontWeight: 600 }}>PAS DE DEA</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: C.dark, lineHeight: 1.1 }}>{pasDea.total}</div>
                <div style={{ fontSize: '0.8rem', color: C.mid, marginTop: 4 }}>Solicitações registradas</div>
              </div>
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ fontSize: '0.8rem', color: C.mid, fontWeight: 600 }}>Reparos</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: C.dark, lineHeight: 1.1 }}>{reparos.total}</div>
                <div style={{ fontSize: '0.8rem', color: C.mid, marginTop: 4 }}>Registros em andamento</div>
              </div>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ fontSize: '0.8rem', color: C.mid, fontWeight: 600 }}>Embarcações</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: C.dark, lineHeight: 1.1 }}>
                  {embarcacoes.op}/{embarcacoes.total}
                </div>
                <div style={{ fontSize: '0.8rem', color: C.mid, marginTop: 4 }}>Operacionais</div>
              </div>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ fontSize: '0.8rem', color: C.mid, fontWeight: 600 }}>Compressores</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: C.dark, lineHeight: 1.1 }}>
                  {compressores.op}/{compressores.total}
                </div>
                <div style={{ fontSize: '0.8rem', color: C.mid, marginTop: 4 }}>Operacionais</div>
              </div>
            </div>
          </div>

          <div style={{
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
            padding: '16px 20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: C.dark }}>Disponibilidade Geral</span>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: pctGeral >= 90 ? C.green : pctGeral >= 70 ? C.yellow : C.red2 }}>
                {pctGeral}%
              </span>
            </div>
            <ProgressBar pct={pctGeral} />
            <div style={{ fontSize: '0.75rem', color: C.mid, marginTop: 6 }}>
              {dados.totais.op} operando · {dados.totais.bx} baixados · {dados.totais.total} total
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 10, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: 14, fontSize: '1rem' }}>📋 Resumo por Categoria</div>
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
                  {abasResumo.map((a, i) => {
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
                            color: pct >= 90 ? '#15803d' : pct >= 70 ? '#92400e' : '#dc2626',
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
      )}
    </div>
  );
}

export default RelatorioLogistica;
