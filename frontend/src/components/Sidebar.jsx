import React from 'react';
import { NavLink } from 'react-router-dom';
import LogoCBMESP from './LogoCBMESP';

const navItems = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/frota', icon: '🚗', label: 'Frota' },
  { path: '/manutencao', icon: '🔧', label: 'Manutenção' },
  { path: '/alertas', icon: '⚠️', label: 'Alertas' },
  { path: '/gastos', icon: '💰', label: 'Gastos' },
  { path: '/tarefas', icon: '📋', label: 'Tarefas' },
  { path: '/relatorios', icon: '📈', label: 'Relatórios' },
  { path: '/configuracoes', icon: '⚙️', label: 'Configurações' },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <LogoCBMESP size={60} />
        <div>
          <div className="sidebar-title">MOTOMEC</div>
          <div className="sidebar-subtitle">17º GB</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <small>Sistema v2.0</small>
      </div>
    </aside>
  );
}

export default Sidebar;
