import React from "react";

const publicUrl = process.env.PUBLIC_URL || "";
const logo17gb = `${publicUrl}/assets/logo17gb.png`;
const logocb = `${publicUrl}/assets/logocb.png`;

function Header({ onLogout }) {
  return (
    <div>
      <div style={{
        background: "#CC1F1F",
        padding: "14px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src={logo17gb}
            alt="Brasao 17 GB"
            width={48}
            height={48}
            style={{ objectFit: "contain" }}
          />
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: "1.2rem" }}>
              17 Grupamento de Bombeiros
            </div>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.78rem" }}>
              Corpo de Bombeiros Militar do Estado de Sao Paulo
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "white", fontWeight: 700, fontSize: "0.85rem" }}>
              CBMESP
            </div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.75rem" }}>
              Secretaria da Seguranca Publica
            </div>
          </div>
          <img
            src={logocb}
            alt="Brasao CBMESP"
            width={48}
            height={48}
            style={{ objectFit: "contain" }}
          />
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sair"
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.4)",
                borderRadius: 8,
                color: "white",
                padding: "6px 14px",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "background 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.28)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
            >
              ⏻ Sair
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;
