import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const submenuMotomec = [
  { path: "/frota", icon: "🚗", label: "Frota" },
  { path: "/manutencao", icon: "🔧", label: "Manutencao" },
  { path: "/alertas", icon: "⚠️", label: "Alertas" },
  { path: "/gastos", icon: "💰", label: "Gastos" },
  { path: "/tarefas", icon: "📋", label: "Tarefas" },
  { path: "/abastecimentos", icon: "⛽", label: "Abastecimentos" },
];

function Sidebar() {
  const location = useLocation();
  const isMotomecActive = submenuMotomec.some(item => location.pathname === item.path) || location.pathname === "/dashboard";
  const [motomecOpen, setMotomecOpen] = useState(isMotomecActive);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div>
          <div className="sidebar-title">SITE</div>
          <div className="sidebar-subtitle">17º Grupamento</div>
        </div>
      </div>
      <nav className="sidebar-nav">

        {/* ABA PRINCIPAL: MOTOMEC */}
        <div
          className={`sidebar-item sidebar-main-item ${isMotomecActive ? "active" : ""}`}
          onClick={() => setMotomecOpen(o => !o)}
          style={{ cursor: "pointer", userSelect: "none" }}
        >
          <span className="sidebar-icon">📊</span>
          <span style={{ flex: 1 }}>MOTOMEC</span>
          <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>{motomecOpen ? "▲" : "▼"}</span>
        </div>

        {/* SUBMENU MOTOMEC */}
        {motomecOpen && (
          <div className="sidebar-submenu">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `sidebar-item sidebar-sub-item ${isActive ? "active" : ""}`}
            >
              <span className="sidebar-icon">🏠</span>
              <span>Início</span>
            </NavLink>
            {submenuMotomec.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `sidebar-item sidebar-sub-item ${isActive ? "active" : ""}`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}

        {/* ABA PRINCIPAL: LOGÍSTICA */}
        <NavLink
          to="/logistica"
          end
          className={({ isActive }) => `sidebar-item sidebar-main-item ${isActive ? "active" : ""}`}
        >
          <span className="sidebar-icon">🚒</span>
          <span>Logística</span>
        </NavLink>

        {/* SUB-ITENS DE LOGÍSTICA */}
        <NavLink
          to="/logistica/mat-operacionais"
          className={({ isActive }) => `sidebar-item sidebar-sub-item ${isActive ? "active" : ""}`}
          style={{ paddingLeft: 36, fontSize: '0.8rem', opacity: 0.85 }}
        >
          <span className="sidebar-icon">📦</span>
          <span>Mat. Operacionais</span>
        </NavLink>
        <NavLink
          to="/logistica/pas-dea-reparos"
          className={({ isActive }) => `sidebar-item sidebar-sub-item ${isActive ? "active" : ""}`}
          style={{ paddingLeft: 36, fontSize: '0.8rem', opacity: 0.85 }}
        >
          <span className="sidebar-icon">🫀</span>
          <span>PAS/DEA &amp; Reparos</span>
        </NavLink>

        {/* Relatórios e Configurações */}
        <NavLink
          to="/relatorios"
          className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
        >
          <span className="sidebar-icon">📈</span>
          <span>Relatorios</span>
        </NavLink>

        <NavLink
          to="/configuracoes"
          className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
        >
          <span className="sidebar-icon">⚙️</span>
          <span>Configuracoes</span>
        </NavLink>

      </nav>
      <div className="sidebar-footer">
        <small>Sistema v2.0</small>
      </div>
    </aside>
  );
}

export default Sidebar;