import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/dashboard',    icon: '📊', label: 'Dashboard'      },
  { to: '/frota',        icon: '🚒', label: 'Frota'          },
  { to: '/manutencao',   icon: '🔧', label: 'Manutenção'     },
  { to: '/abastecimento',icon: '⛽', label: 'Abastecimento'  },
  { to: '/gastos',       icon: '💰', label: 'Gastos'         },
  { to: '/alertas',      icon: '🔔', label: 'Alertas'        },
  { to: '/relatorios',   icon: '📋', label: 'Relatórios'     },
  { to: '/configuracoes',icon: '⚙️', label: 'Configurações'  },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">🚒</span>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-title">17º GB</span>
          <span className="sidebar-brand-sub">Gestão de Frota</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Navegação principal">
        {NAV_ITEMS.map(({ to, icon, label }) => {
          const active = pathname === to || (to !== '/' && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={`sidebar-link ${active ? 'active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="sidebar-link-icon" aria-hidden="true">{icon}</span>
              <span className="sidebar-link-label">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-version">v1.0.0</span>
      </div>

      <style>{`
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: var(--sidebar-width);
          height: 100vh;
          background: var(--sidebar-bg);
          display: flex;
          flex-direction: column;
          z-index: var(--z-sidebar);
          overflow-y: auto;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          padding: var(--spacing-5) var(--spacing-4);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
        }

        .sidebar-brand-icon {
          font-size: 1.8rem;
        }

        .sidebar-brand-text {
          display: flex;
          flex-direction: column;
        }

        .sidebar-brand-title {
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
        }

        .sidebar-brand-sub {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
        }

        .sidebar-nav {
          flex: 1;
          padding: var(--spacing-3) 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          padding: var(--spacing-3) var(--spacing-4);
          color: var(--sidebar-text);
          font-size: 0.875rem;
          font-weight: 500;
          border-left: 3px solid transparent;
          transition: background var(--transition), color var(--transition), border-color var(--transition);
        }

        .sidebar-link:hover {
          background: var(--sidebar-hover);
          color: #fff;
        }

        .sidebar-link.active {
          background: var(--sidebar-active);
          color: #fff;
          border-left-color: var(--sidebar-active-border);
        }

        .sidebar-link-icon {
          font-size: 1.1rem;
          flex-shrink: 0;
          width: 22px;
          text-align: center;
        }

        .sidebar-footer {
          padding: var(--spacing-4);
          border-top: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
        }

        .sidebar-version {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.3);
        }

        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
            transition: transform var(--transition-slow);
          }
        }
      `}</style>
    </aside>
  );
}
