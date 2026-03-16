import React from 'react';

function LogoCBMESP({ size = 40 }) {
  return (
    <img
      src="/logo17gb.svg"
      alt="Brasão 17º Grupamento de Bombeiros"
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
    />
  );
}

export default LogoCBMESP;
