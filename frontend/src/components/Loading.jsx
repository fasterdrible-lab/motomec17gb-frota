import React from 'react';

export default function Loading({ text = 'Carregando...' }) {
  return (
    <div className="loading-container" role="status" aria-label={text}>
      <div className="loading-spinner" />
      {text && <p className="loading-text">{text}</p>}

      <style>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-10);
          gap: var(--spacing-3);
          min-height: 120px;
        }
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--color-border);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        .loading-text {
          font-size: 0.875rem;
          color: var(--color-text-muted);
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
