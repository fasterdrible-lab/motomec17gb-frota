import React from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { path: "/dashboard", icon: "📊", label: "Dashboard" },
  { path: "/frota", icon: "🚗", label: "Frota" },
  { path: "/manutencao", icon: "🔧", label: "Manutencao" },
  { path: "/alertas", icon: "⚠️", label: "Alertas" },
  { path: "/gastos", icon: "💰", label: "Gastos" },
  { path: "/tarefas", icon: "📋", label: "Tarefas" },
  { path: "/abastecimentos", icon: "⛽", label: "Abastecimentos" },
  { path: "/relatorios", icon: "📈", label: "Relatorios" },
  { path: "/configuracoes", icon: "⚙️", label: "Configuracoes" },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div>
          <div className="sidebar-title">MOTOMEC</div>
          <div className="sidebar-subtitle">17 GB</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
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
