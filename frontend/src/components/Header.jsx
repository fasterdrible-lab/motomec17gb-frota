import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu } from 'lucide-react';

const logo17gb = `${import.meta.env.BASE_URL}assets/logo17gb.png`;
const logocb = `${import.meta.env.BASE_URL}assets/logocb.png`;

function Header({ onLogout, sidebarVisible, onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const showBack = location.pathname !== '/dashboard';

  return (
    <div className="brand-header">
      <div className="brand-header-nav">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarVisible ? 'Ocultar menu lateral' : 'Mostrar menu lateral'}
          title={sidebarVisible ? 'Ocultar menu lateral' : 'Mostrar menu lateral'}
          className="brand-header-icon-btn"
        >
          <Menu size={20} />
        </button>

        {showBack && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            title="Voltar"
            className="brand-header-icon-btn"
          >
            <ArrowLeft size={20} />
          </button>
        )}
      </div>

      <div className="brand-header-brand">
        <img src={logo17gb} alt="Brasão 17º GB" width={48} height={48} className="brand-header-logo" />
        <div className="brand-header-brand-text">
          <div className="brand-header-title">17º Grupamento de Bombeiros</div>
          <div className="brand-header-subtitle">Corpo de Bombeiros Militar do Estado de São Paulo</div>
        </div>
      </div>

      <div className="brand-header-org">
        <div className="brand-header-org-text">
          <div className="brand-header-org-title">CBMESP</div>
          <div className="brand-header-org-subtitle">Secretaria da Segurança Pública</div>
        </div>
        <img src={logocb} alt="Brasão CBMESP" width={48} height={48} className="brand-header-logo" />
        {onLogout && (
          <button onClick={onLogout} title="Sair" className="brand-header-logout">
            Sair
          </button>
        )}
      </div>
    </div>
  );
}

export default Header;
