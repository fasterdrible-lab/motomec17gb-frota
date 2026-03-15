import React from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';

const CATEGORY_ICONS = {
  combustivel:   '⛽',
  manutencao:    '🔧',
  pneus:         '🔴',
  lubrificantes: '🛢️',
  pecas:         '⚙️',
  servicos:      '🛠️',
  licenciamento: '📄',
  outros:        '📦',
};

export default function GastoCard({ categoria, descricao, valor, data, viatura }) {
  const icon = CATEGORY_ICONS[categoria?.toLowerCase()] || '💰';

  return (
    <div className="gasto-card">
      <div className="gasto-icon-wrap">
        <span className="gasto-icon">{icon}</span>
      </div>
      <div className="gasto-info">
        <p className="gasto-categoria">{categoria}</p>
        <p className="gasto-descricao">{descricao}</p>
        <div className="gasto-meta">
          {viatura && <span>🚒 {viatura}</span>}
          {data    && <span>📅 {formatDate(data)}</span>}
        </div>
      </div>
      <div className="gasto-valor">{formatCurrency(valor)}</div>

      <style>{`
        .gasto-card {
          background: #fff;
          border-radius: var(--radius-lg);
          padding: var(--spacing-4);
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
        }
        .gasto-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background: var(--color-bg-alt);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          flex-shrink: 0;
        }
        .gasto-info {
          flex: 1;
          min-width: 0;
        }
        .gasto-categoria {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--color-text-muted);
        }
        .gasto-descricao {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--color-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .gasto-meta {
          display: flex;
          gap: var(--spacing-3);
          font-size: 0.78rem;
          color: var(--color-text-muted);
          margin-top: 2px;
        }
        .gasto-valor {
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-danger);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
