import React from 'react';

function Header() {
  return (
    <div>
      <div style={{
        background: '#CC1F1F',
        padding: '14px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Bras%C3%A3o_do_Corpo_de_Bombeiros_Militar_do_Estado_de_S%C3%A3o_Paulo.svg/240px-Bras%C3%A3o_do_Corpo_de_Bombeiros_Militar_do_Estado_de_S%C3%A3o_Paulo.svg.png"
            alt="CBMESP"
            style={{ width: 40, height: 40, objectFit: 'contain' }}
          />
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '1.2rem' }}>
              17º Grupamento de Bombeiros
            </div>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem' }}>
              Corpo de Bombeiros Militar do Estado de São Paulo
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
            🛡️ CBMESP
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>
            Secretaria da Segurança Pública
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;
