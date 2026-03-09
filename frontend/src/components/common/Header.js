import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout, getCachedUser } from '../../services/auth';
import './Header.css';

export default function Header({ onMenuToggle }) {
  const navigate = useNavigate();
  const user = getCachedUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'US';

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="menu-toggle"
          onClick={onMenuToggle}
          aria-label="Alternar menu"
        >
          <span className="hamburger" />
          <span className="hamburger" />
          <span className="hamburger" />
        </button>

        <NavLink to="/" className="header-brand">
          <span className="brand-icon">🏍️</span>
          <span className="brand-name">MotoMec Frota</span>
        </NavLink>
      </div>

      <nav className="header-nav">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Dashboard
        </NavLink>
        <NavLink to="/vehicles" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Veículos
        </NavLink>
        <NavLink to="/drivers" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Motoristas
        </NavLink>
        <NavLink to="/maintenance" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Manutenção
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Relatórios
        </NavLink>
      </nav>

      <div className="header-right">
        <div className="user-menu" onClick={() => setDropdownOpen(!dropdownOpen)}>
          <div className="user-avatar">{initials}</div>
          <span className="user-name">{user?.username || 'Usuário'}</span>
          <span className="chevron">▾</span>

          {dropdownOpen && (
            <div className="user-dropdown">
              <div className="dropdown-info">
                <strong>{user?.username || 'Usuário'}</strong>
                <small>{user?.email || ''}</small>
              </div>
              <hr />
              <button className="dropdown-item" onClick={handleLogout}>
                🚪 Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
