import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const submenuMotomec = [
  { path: '/frota', icon: '🚗', label: 'Frota' },
  { path: '/manutencao', icon: '🔧', label: 'Manutencao' },
  { path: '/alertas', icon: '⚠️', label: 'Alertas' },
  { path: '/gastos', icon: '💰', label: 'Gastos' },
  { path: '/tarefas', icon: '📋', label: 'Tarefas' },
  { path: '/abastecimentos', icon: '⛽', label: 'Abastecimentos' },
  { path: '/relatorios/motomec', icon: '📄', label: 'Relatório MOTOMEC' },
];

function Sidebar({ onClose }) {
  const location = useLocation();
  const isMotomecActive = submenuMotomec.some(item => location.pathname === item.path) || location.pathname === '/dashboard';
  const isLogisticaActive = location.pathname.startsWith('/logistica');
  const [motomecOpen, setMotomecOpen] = useState(isMotomecActive);
  const [logisticaOpen, setLogisticaOpen] = useState(isLogisticaActive);

  useEffect(() => {
    if (isLogisticaActive) {
      setLogisticaOpen(true);
    }
  }, [isLogisticaActive]);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand" style={{ justifyContent: 'space-between' }}>
        <div className="sidebar-title">Painel de Gestão</div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Ocultar menu lateral"
            title="Ocultar menu lateral"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.08)',
              color: 'white',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        <div
          className={`sidebar-item sidebar-main-item ${isMotomecActive ? 'active' : ''}`}
          onClick={() => setMotomecOpen(value => !value)}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          <span className="sidebar-icon">📊</span>
          <span style={{ flex: 1 }}>MOTOMEC</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{motomecOpen ? '▲' : '▼'}</span>
        </div>

        {motomecOpen && (
          <div className="sidebar-submenu">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `sidebar-item sidebar-sub-item ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon">🏠</span>
              <span>Início</span>
            </NavLink>
            {submenuMotomec.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `sidebar-item sidebar-sub-item ${isActive ? 'active' : ''}`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}

        <div className={`sidebar-item sidebar-main-item ${isLogisticaActive ? 'active' : ''}`} style={{ paddingRight: 12 }}>
          <NavLink
            to="/logistica"
            end
            className="sidebar-item"
            style={{
              flex: 1,
              padding: 0,
              margin: 0,
              borderLeft: 'none',
              background: 'transparent',
              color: 'inherit',
            }}
          >
            <span className="sidebar-icon">🚒</span>
            <span style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Logística</span>
          </NavLink>
          <button
            type="button"
            onClick={() => setLogisticaOpen(value => !value)}
            aria-label={logisticaOpen ? 'Ocultar subitens de logistica' : 'Mostrar subitens de logistica'}
            title={logisticaOpen ? 'Ocultar subitens de logistica' : 'Mostrar subitens de logistica'}
            style={{
              marginLeft: 8,
              width: 28,
              height: 28,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.08)',
              color: 'white',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {logisticaOpen ? '▲' : '▼'}
          </button>
        </div>

        {logisticaOpen && (
          <>
            <NavLink
              to="/logistica/mat-operacionais"
              className={({ isActive }) => `sidebar-item sidebar-sub-item ${isActive ? 'active' : ''}`}
              style={{ paddingLeft: 36, fontSize: '0.8rem', opacity: 0.85 }}
            >
              <span className="sidebar-icon">📦</span>
              <span>Mat. Operacionais</span>
            </NavLink>
            <NavLink
              to="/logistica/pas-dea-reparos"
              className={({ isActive }) => `sidebar-item sidebar-sub-item ${isActive ? 'active' : ''}`}
              style={{ paddingLeft: 36, fontSize: '0.8rem', opacity: 0.85 }}
            >
              <span className="sidebar-icon">🫀</span>
              <span>PAS/DEA &amp; Reparos</span>
            </NavLink>
            <NavLink
              to="/logistica/relatorio"
              className={({ isActive }) => `sidebar-item sidebar-sub-item ${isActive ? 'active' : ''}`}
              style={{ paddingLeft: 36, fontSize: '0.8rem', opacity: 0.85 }}
            >
              <span className="sidebar-icon">📄</span>
              <span>Relatório LOGÍSTICA</span>
            </NavLink>
          </>
        )}

        <NavLink
          to="/configuracoes"
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
        >
          <span className="sidebar-icon">⚙️</span>
          <span>CONFIGURAÇÕES</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <small>Sistema v2.0</small>
      </div>
    </aside>
  );
}

export default Sidebar;
