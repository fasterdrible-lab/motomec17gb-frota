import React, { useState, useEffect, useCallback } from 'react';
import { getStatusOperacional } from '../services/googleSheets';
import '../styles/Dashboard.css';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1q6wy9iO4aRDKMBPzxR9cISE7pCmUuIaYSRBdhUNlM4Q';

function Gastos() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setError('');
    try {
      const data = await getStatusOperacional();
      setStatus(data);
    } catch (e) {
      setError('Erro ao buscar dados da planilha.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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
        <span>Controle de Gastos</span>
        <span>Gerenciado via Planilha Google</span>
      </div>

      <div className="dash-action-bar">
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>💰 Controle de Gastos</h2>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        {/* Card informativo */}
        <div style={{
          background: 'white', borderRadius: 10, padding: '28px 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 20,
          borderLeft: '4px solid #CC1F1F',
        }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1a1a2e', marginBottom: 10 }}>
            📊 Dados gerenciados na Planilha Google
          </div>
          <p style={{ color: '#6b7280', marginBottom: 20, lineHeight: 1.6 }}>
            Os dados de gastos do 17º Grupamento de Bombeiros são gerenciados diretamente na
            Planilha Google Sheets. Para visualizar, inserir ou editar lançamentos de gastos,
            clique no botão abaixo para acessar a planilha.
          </p>
          <a
            href={SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block', padding: '12px 24px', background: '#CC1F1F', color: 'white',
              borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: '1rem',
            }}
          >
            📊 Abrir Planilha Google
          </a>
        </div>

        {/* Estatísticas básicas de frota */}
        {loading && <div className="dash-loading">⏳ Carregando estatísticas de frota...</div>}
        {error && !loading && (
          <div className="dash-error">
            <span>⚠️ {error}</span>
            <button className="btn-sincronizar" onClick={loadData} style={{ marginLeft: 'auto' }}>
              🔄 Tentar novamente
            </button>
          </div>
        )}
        {!loading && status && (
          <div>
            <div style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: 12, fontSize: '1rem' }}>
              📈 Resumo da Frota
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { icon: '📊', value: status.total, label: 'Total de Viaturas' },
                { icon: '🚗', value: status.operando, label: 'Operando' },
                { icon: '🚒', value: status.baixadas, label: 'Baixadas' },
                { icon: '⏸️', value: status.reserva, label: 'Reserva' },
              ].map((card, i) => (
                <div key={i} className="dash-stat-card">
                  <div className="dash-stat-icon">{card.icon}</div>
                  <div className="dash-stat-value">{card.value}</div>
                  <div className="dash-stat-label">{card.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Gastos;
