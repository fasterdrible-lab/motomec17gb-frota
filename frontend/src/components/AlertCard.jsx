import React from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';

const PRIORITY_ICONS = {
  critico: '🚨',
  urgente: '⚠️',
  aviso:   'ℹ️',
  info:    '💡',
};

const PRIORITY_CLASSES = {
  critico: 'alerta-critico',
  urgente: 'alerta-urgente',
  aviso:   'alerta-aviso',
  info:    'alerta-info',
};

const TIPO_CLASSES = {
  critico: 'tipo-critico',
  urgente: 'tipo-urgente',
  aviso:   'tipo-aviso',
  info:    'tipo-info',
};

export default function AlertCard({ tipo, mensagem, viatura, data, lido, onMarcarLido, onResolver }) {
  const icon       = PRIORITY_ICONS[tipo] || '🔔';
  const cardClass  = PRIORITY_CLASSES[tipo] || '';
  const tipoClass  = TIPO_CLASSES[tipo] || '';

  return (
    <div className={`alerta-item ${cardClass} ${lido ? 'lido' : ''}`}>
      <span className="alerta-icon">{icon}</span>
      <div className="alerta-body">
        <span className={`alerta-tipo-badge ${tipoClass}`}>{tipo?.toUpperCase()}</span>
        <p className="alerta-mensagem">{mensagem}</p>
        <div className="alerta-meta">
          {viatura && <span>🚒 {viatura}</span>}
          {data    && <span>📅 {formatDate(data)}</span>}
          {lido    && <span>✓ Lido</span>}
        </div>
      </div>
      {(!lido || onResolver) && (
        <div className="alerta-actions">
          {!lido && onMarcarLido && (
            <button className="btn btn-outline btn-sm" onClick={onMarcarLido}>
              Marcar lido
            </button>
          )}
          {onResolver && (
            <button className="btn btn-success btn-sm" onClick={onResolver}>
              Resolver
            </button>
          )}
        </div>
      )}
    </div>
  );
}
