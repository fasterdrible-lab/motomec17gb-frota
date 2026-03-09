import React from 'react';
import { getStatusColor } from '../utils/formatters';
import { formatCurrency, formatKm } from '../utils/formatters';

const STATUS_LABELS = {
  operacional: 'Operacional',
  manutencao:  'Manutenção',
  inativo:     'Inativo',
  reserva:     'Reserva',
  critico:     'Crítico',
};

export default function ViaturaCard({ prefixo, modelo, placa, status, km_atual, valor_fipe }) {
  const badgeClass = getStatusColor(status);
  const label      = STATUS_LABELS[status?.toLowerCase()] || status;

  return (
    <div className="viatura-card">
      <div className="viatura-card-header">
        <span className="viatura-prefixo">{prefixo}</span>
        <span className={`badge ${badgeClass}`}>{label}</span>
      </div>
      <p className="viatura-modelo">{modelo}</p>
      <div className="viatura-details">
        <span className="viatura-placa">🚗 {placa}</span>
        <span className="viatura-km">📍 {formatKm(km_atual)}</span>
        {valor_fipe != null && (
          <span className="viatura-fipe">💰 {formatCurrency(valor_fipe)}</span>
        )}
      </div>

      <style>{`
        .viatura-card {
          background: #fff;
          border-radius: var(--radius-lg);
          padding: var(--spacing-4);
          box-shadow: var(--shadow-sm);
          transition: box-shadow var(--transition), transform var(--transition);
        }
        .viatura-card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
        .viatura-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--spacing-2);
        }
        .viatura-prefixo {
          font-size: 1.1rem;
          font-weight: 700;
          font-family: 'Courier New', monospace;
          color: var(--color-secondary);
        }
        .viatura-modelo {
          font-size: 0.9rem;
          color: var(--color-text-muted);
          margin-bottom: var(--spacing-3);
        }
        .viatura-details {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-3);
        }
        .viatura-placa,
        .viatura-km,
        .viatura-fipe {
          font-size: 0.8rem;
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  );
}
