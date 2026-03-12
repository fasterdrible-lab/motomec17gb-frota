import React, { useState, useEffect } from 'react';
import { getFrotaStatus } from '../services/api';

function Header() {
  const [status, setStatus] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    getFrotaStatus().then(r => setStatus(r.data)).catch(() => {});
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <h2>🚔 MOTOMEC 17º GB — Gestão de Frota</h2>
      </div>
      <div className="header-right">
        {status && (
          <div className="header-stats">
            <span className="header-stat">🚗 {status.total_viaturas} viaturas</span>
            <span className="header-stat">✅ {status.operando} operando</span>
            {status.alertas_criticos > 0 && (
              <span className="header-stat alert">🔴 {status.alertas_criticos} alertas críticos</span>
            )}
          </div>
        )}
        <div className="header-time">
          {now.toLocaleDateString('pt-BR')} {now.toLocaleTimeString('pt-BR')}
        </div>
      </div>
    </header>
  );
}

export default Header;
