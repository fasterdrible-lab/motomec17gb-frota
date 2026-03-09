import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <span className="footer-brand">🏍️ MotoMec Frota</span>
        <span className="footer-separator">·</span>
        <span className="footer-text">
          Sistema de Gerenciamento de Frota
        </span>
        <span className="footer-separator">·</span>
        <span className="footer-copy">
          © {new Date().getFullYear()} MotoMec
        </span>
      </div>
    </footer>
  );
}
