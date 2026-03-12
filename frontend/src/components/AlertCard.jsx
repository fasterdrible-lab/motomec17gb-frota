import React from 'react';
import { marcarAlertaLido } from '../services/api';

const nivelEmoji = { critico: '🔴', aviso: '🟡', info: '🔵' };
const nivelClass = { critico: 'alert-critico', aviso: 'alert-aviso', info: 'alert-info' };

function AlertCard({ alerta, onUpdate }) {
  const handleLido = async () => {
    try {
      await marcarAlertaLido(alerta.id);
      if (onUpdate) onUpdate();
    } catch (e) {}
  };

  return (
    <div className={`alert-card ${nivelClass[alerta.nivel] || 'alert-info'}`}>
      <div className="alert-card-header">
        <span>
          {nivelEmoji[alerta.nivel] || '🔵'}{' '}
          <strong>{alerta.nivel ? alerta.nivel.toUpperCase() : 'INFO'}</strong>
        </span>
        <span className="alert-card-tipo">{alerta.tipo}</span>
      </div>
      <p className="alert-card-msg">{alerta.mensagem}</p>
      <div className="alert-card-footer">
        <small>{new Date(alerta.data_criacao).toLocaleString('pt-BR')}</small>
        {!alerta.lido && (
          <button className="btn-small" onClick={handleLido}>Marcar como lido</button>
        )}
      </div>
    </div>
  );
}

export default AlertCard;
