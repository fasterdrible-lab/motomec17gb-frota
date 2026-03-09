import React from 'react';
import { useNavigate } from 'react-router-dom';
import { removeToken, getCurrentUser } from '../services/auth';
import useApi from '../hooks/useApi';
import { getAlertas } from '../services/api';

export default function Header() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const { data: alertasData } = useApi(getAlertas, { lido: false });
  const unreadCount = Array.isArray(alertasData)
    ? alertasData.filter((a) => !a.lido).length
    : alertasData?.total_nao_lidos || 0;

  function handleLogout() {
    removeToken();
    navigate('/login', { replace: true });
  }

  const userName = user?.nome || user?.name || user?.sub || 'Usuário';

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="header-title">Sistema de Frota — 17º GB</h1>
      </div>

      <div className="header-right">
        <button
          className="header-alerts"
          onClick={() => navigate('/alertas')}
          aria-label={`${unreadCount} alertas não lidos`}
          type="button"
        >
          🔔
          {unreadCount > 0 && (
            <span className="header-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>

        <div className="header-user">
          <span className="header-user-icon">👤</span>
          <span className="header-user-name">{userName}</span>
        </div>

        <button className="btn btn-outline btn-sm" onClick={handleLogout} type="button">
          Sair
        </button>
      </div>

      <style>{`
        .app-header {
          position: sticky;
          top: 0;
          height: var(--header-height);
          background: var(--header-bg);
          border-bottom: 1px solid var(--header-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--spacing-6);
          z-index: var(--z-header);
          box-shadow: var(--shadow-sm);
        }

        .header-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-text);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: var(--spacing-4);
        }

        .header-alerts {
          position: relative;
          font-size: 1.3rem;
          line-height: 1;
          padding: var(--spacing-1);
          border-radius: var(--radius-md);
          transition: background var(--transition);
        }

        .header-alerts:hover {
          background: var(--color-bg-alt);
        }

        .header-badge {
          position: absolute;
          top: -4px;
          right: -6px;
          background: var(--color-danger);
          color: #fff;
          font-size: 0.65rem;
          font-weight: 700;
          min-width: 18px;
          height: 18px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
        }

        .header-user {
          display: flex;
          align-items: center;
          gap: var(--spacing-2);
        }

        .header-user-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text);
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 600px) {
          .header-title   { display: none; }
          .header-user-name { display: none; }
        }
      `}</style>
    </header>
  );
}
