import React, { useState, useEffect, useCallback } from 'react';
import { getDadosRelatorio } from '../services/googleSheets';
import '../styles/Dashboard.css';

function Relatorios() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [ultimaSync, setUltimaSync] = useState(null);

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setSyncing(true);
    setError('');
    try {
      const data = await getDadosRelatorio();
      setDados(data);
      setUltimaSync(new Date());
    } catch (e) {
      setError('Erro ao buscar dados da planilha. Verifique a conexão e tente novamente.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const exportarTxt = () => {
    if (!dados) return;
    const { frotaStatus, manutencoes, alertas, tarefas, geradoEm } = dados;
    const linhas = [
      '='.repeat(60),
      `RELATÓRIO DE FROTA — 17º GRUPAMENTO DE BOMBEIROS / CBMESP`,
      `Gerado em: ${geradoEm.toLocaleString('pt-BR')}`,
      '='.repeat(60),
      '',
      'STATUS DA FROTA',
      '-'.repeat(40),
      `Total de viaturas : ${frotaStatus.total}`,
      `Operando          : ${frotaStatus.operando}`,
      `Baixadas          : ${frotaStatus.baixadas}`,
      `Reserva           : ${frotaStatus.reserva}`,
      '',
      'MANUTENÇÕES',
      '-'.repeat(40),
      `Vencidas  : ${manutencoes.filter(m => m.status === 'vencida').length}`,
      `Pendentes : ${manutencoes.filter(m => m.status === 'pendente').length}`,
      '',
      'ALERTAS',
      '-'.repeat(40),
      `Críticos : ${alertas.filter(a => a.nivel === 'critico').length}`,
      `Avisos   : ${alertas.filter(a => a.nivel === 'aviso').length}`,
      '',
      'TAREFAS',
      '-'.repeat(40),
      `Total      : ${tarefas.total}`,
      `Pendentes  : ${tarefas.pendente}`,
      `Em Andamento: ${tarefas.andamento}`,
      `Concluídas : ${tarefas.concluida}`,
      '',
      '='.repeat(60),
    ];
    const blob = new Blob([linhas.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-frota-${geradoEm.toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const CardStat = ({ icon, value, label, cor }) => (
    <div style={{ background: 'white', borderRadius: 10, padding: '20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div style={{ fontSize: '2rem', marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: cor || '#1a1a2e' }}>{value}</div>
      <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{label}</div>
    </div>
  );

  return (
    <div>
      <div className="cbmesp-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '2rem' }}>🔥</span>
          <div>
            <div className="cbmesp-header-title">17º Grupamento de Bombeiros</div>
            <div className="cbmesp-header-subtitle">Corpo de Bombeiros Militar do Estado de São Paulo</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>🛡️ CBMESP</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>Secretaria da Segurança Pública</div>
        </div>
      </div>

      <div className="cbmesp-subbar">
        <span>Relatórios e KPIs</span>
        {ultimaSync && <span>Dados de {ultimaSync.toLocaleString('pt-BR')}</span>}
      </div>

      <div className="dash-action-bar">
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>📄 Relatórios</h2>
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

      {loading && <div className="dash-loading">⏳ Carregando dados da planilha...</div>}

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
          {/* Status da Frota */}
          <div>
            <div style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: 12, fontSize: '1rem' }}>🚒 Status da Frota</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <CardStat icon="📊" value={dados.frotaStatus.total} label="Total de Viaturas" />
              <CardStat icon="🚗" value={dados.frotaStatus.operando} label="Operando" cor="#16a34a" />
              <CardStat icon="🚒" value={dados.frotaStatus.baixadas} label="Baixadas" cor="#dc2626" />
              <CardStat icon="⏸️" value={dados.frotaStatus.reserva} label="Reserva" cor="#d97706" />
            </div>
          </div>

          {/* Manutenções */}
          <div style={{ background: 'white', borderRadius: 10, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: 14, fontSize: '1rem' }}>🔧 Manutenções</div>
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#dc2626' }}>
                  {dados.manutencoes.filter(m => m.status === 'vencida').length}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Vencidas</div>
              </div>
              <div style={{ width: 1, background: '#e5e7eb' }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#d97706' }}>
                  {dados.manutencoes.filter(m => m.status === 'pendente').length}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Pendentes</div>
              </div>
              <div style={{ width: 1, background: '#e5e7eb' }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1a1a2e' }}>
                  {dados.manutencoes.length}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Total</div>
              </div>
            </div>
          </div>

          {/* Alertas */}
          <div style={{ background: 'white', borderRadius: 10, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: 14, fontSize: '1rem' }}>🔔 Alertas</div>
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#dc2626' }}>
                  {dados.alertas.filter(a => a.nivel === 'critico').length}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>🚨 Críticos</div>
              </div>
              <div style={{ width: 1, background: '#e5e7eb' }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#d97706' }}>
                  {dados.alertas.filter(a => a.nivel === 'aviso').length}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>⚠️ Avisos</div>
              </div>
              <div style={{ width: 1, background: '#e5e7eb' }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1a1a2e' }}>
                  {dados.alertas.length}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Total</div>
              </div>
            </div>
          </div>

          {/* Tarefas */}
          <div style={{ background: 'white', borderRadius: 10, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: 14, fontSize: '1rem' }}>📋 Tarefas</div>
            <div style={{ display: 'flex', gap: 20 }}>
              {[
                { value: dados.tarefas.pendente, label: '🔴 Pendente', cor: '#dc2626' },
                { value: dados.tarefas.andamento, label: '🟡 Em Andamento', cor: '#d97706' },
                { value: dados.tarefas.concluida, label: '🟢 Concluída', cor: '#16a34a' },
                { value: dados.tarefas.total, label: '📝 Total', cor: '#1a1a2e' },
              ].map((item, i, arr) => (
                <React.Fragment key={i}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: item.cor }}>{item.value}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{item.label}</div>
                  </div>
                  {i < arr.length - 1 && <div style={{ width: 1, background: '#e5e7eb' }} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Relatorios;
