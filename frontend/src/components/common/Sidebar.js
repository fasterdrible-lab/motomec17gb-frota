import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const navItems = [
  { to: '/',           label: 'Dashboard',   icon: '📊', end: true },
  { to: '/vehicles',   label: 'Veículos',     icon: '🚗' },
  { to: '/drivers',    label: 'Motoristas',   icon: '👤' },
  { to: '/maintenance',label: 'Manutenção',   icon: '🔧' },
  { to: '/reports',    label: 'Relatórios',   icon: '📈' },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-brand-icon">🏍️</span>
          <span className="sidebar-brand-name">MotoMec Frota</span>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-section-title">NAVEGAÇÃO</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
              onClick={onClose}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-version">v1.0.0</div>
          <div className="sidebar-footer-text">MotoMec © {new Date().getFullYear()}</div>
        </div>
      </aside>
    </>
  );
}
