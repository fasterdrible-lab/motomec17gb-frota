import React from 'react';

function LogoCBMESP({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Brasão CBMESP"
    >
      {/* Escudo */}
      <path
        d="M50 5 L90 20 L90 55 Q90 80 50 95 Q10 80 10 55 L10 20 Z"
        fill="white"
        stroke="white"
        strokeWidth="2"
      />
      {/* Chama externa */}
      <path
        d="M50 25 C45 35 35 40 38 55 C40 65 50 70 50 70 C50 70 60 65 62 55 C65 40 55 35 50 25Z"
        fill="#CC1F1F"
      />
      {/* Chama interna */}
      <path
        d="M50 35 C47 42 42 46 44 55 C46 62 50 65 50 65 C50 65 54 62 56 55 C58 46 53 42 50 35Z"
        fill="#FF6B35"
      />
      {/* Sigla CB */}
      <text
        x="50"
        y="88"
        textAnchor="middle"
        fill="#CC1F1F"
        fontSize="14"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        CB
      </text>
    </svg>
  );
}

export default LogoCBMESP;
