import React from "react";

const logo17gb = `${process.env.PUBLIC_URL || ""}/assets/logo17gb.png`;

function LogoCBMESP({ size = 40 }) {
  return (
    <img
      src={logo17gb}
      alt="Brasao 17 Grupamento de Bombeiros"
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
  );
}

export default LogoCBMESP;
