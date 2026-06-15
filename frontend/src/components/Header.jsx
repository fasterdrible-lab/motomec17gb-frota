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
    <div>
      <div
        style={{
          background: '#CC1F1F',
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={sidebarVisible ? 'Ocultar menu lateral' : 'Mostrar menu lateral'}
            title={sidebarVisible ? 'Ocultar menu lateral' : 'Mostrar menu lateral'}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.35)',
              background: 'rgba(255,255,255,0.12)',
              color: 'white',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Menu size={20} />
          </button>

          {showBack && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Voltar"
              title="Voltar"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.12)',
                color: 'white',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            >
              <ArrowLeft size={20} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <img
            src={logo17gb}
            alt="Brasao 17 GB"
            width={48}
            height={48}
            style={{ objectFit: 'contain' }}
          />
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '1.2rem' }}>
              17 Grupamento de Bombeiros
            </div>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem' }}>
              Corpo de Bombeiros Militar do Estado de Sao Paulo
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>
              CBMESP
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>
              Secretaria da Seguranca Publica
            </div>
          </div>
          <img
            src={logocb}
            alt="Brasao CBMESP"
            width={48}
            height={48}
            style={{ objectFit: 'contain' }}
          />
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sair"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: 8,
                color: 'white',
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            >
              Sair
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;
