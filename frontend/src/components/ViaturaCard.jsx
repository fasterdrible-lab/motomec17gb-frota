import React from 'react';

const statusInfo = {
  operando: { label: 'Operando', class: 'status-operando', icon: '✅' },
  manutencao: { label: 'Manutenção', class: 'status-manutencao', icon: '🔧' },
  baixada: { label: 'Baixada', class: 'status-baixada', icon: '🔴' },
  reserva: { label: 'Reserva', class: 'status-reserva', icon: '⏸️' },
};

function ViaturaCard({ viatura, onClick }) {
  const info = statusInfo[viatura.status] || statusInfo.operando;
  return (
    <div
      className="viatura-card card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="viatura-card-header">
        <strong>{viatura.prefixo}</strong>
        <span className={`status-badge ${info.class}`}>
          {info.icon} {info.label}
        </span>
      </div>
      <div className="viatura-card-body">
        <div>{viatura.marca} {viatura.modelo}</div>
        <div className="viatura-placa">{viatura.placa}</div>
      </div>
      <div className="viatura-card-footer">
        <span>🛣️ {viatura.km_atual?.toLocaleString('pt-BR')} km</span>
        {viatura.valor_fipe > 0 && (
          <span>💰 R$ {viatura.valor_fipe?.toLocaleString('pt-BR')}</span>
        )}
      </div>
    </div>
  );
}

export default ViaturaCard;
