import React from 'react';

const DEFAULT_STATES = {
  loading: {
    title: 'Carregando dados',
    message: 'Aguarde enquanto buscamos as informacoes da tela.',
  },
  error: {
    title: 'Nao foi possivel carregar os dados',
    message: 'Tente novamente em instantes.',
  },
  empty: {
    title: 'Nenhum resultado encontrado',
    message: 'Ajuste os filtros e tente novamente.',
  },
};

export default function PageState({
  variant = 'loading',
  title,
  message,
  actionLabel,
  onAction,
  actionDisabled = false,
  className = '',
  style,
}) {
  const state = DEFAULT_STATES[variant] || DEFAULT_STATES.loading;
  const rootClassName = ['page-state', `page-state-${variant}`, className].filter(Boolean).join(' ');

  return (
    <div
      className={rootClassName}
      style={style}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'loading' ? 'polite' : undefined}
    >
      <div className="page-state-card">
        <div className="page-state-title">{title || state.title}</div>
        <p className="page-state-message">{message || state.message}</p>
        {actionLabel && onAction ? (
          <button
            type="button"
            className="btn-primary page-state-action"
            onClick={onAction}
            disabled={actionDisabled}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
