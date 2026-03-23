import React from "react";

function Header() {
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
            src={process.env.PUBLIC_URL + "/logo17gb.png"}
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "white", fontWeight: 700, fontSize: "0.85rem" }}>
              CBMESP
            </div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.75rem" }}>
              Secretaria da Seguranca Publica
            </div>
          </div>
          <img
            src={process.env.PUBLIC_URL + "/logocb.png"}
            alt="Brasao CBMESP"
            width={48}
            height={48}
            style={{ objectFit: "contain" }}
          />
        </div>
      </div>
    </div>
  );
}

export default Header;
