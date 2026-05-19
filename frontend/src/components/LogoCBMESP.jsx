import React from "react";

const publicUrl = (process.env.PUBLIC_URL || "").replace(/\/$/, "");

function LogoCBMESP({ size = 40 }) {
  return (
    <img
      src={`${publicUrl}/logo17gb.png`}
      alt="Brasao 17 Grupamento de Bombeiros"
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
  );
}

export default LogoCBMESP;
