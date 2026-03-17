import React from "react";

function LogoCBMESP({ size = 40 }) {
  return (
    <img
      src="/logo17gb.png"
      alt="Brasao 17 Grupamento de Bombeiros"
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
  );
}

export default LogoCBMESP;
