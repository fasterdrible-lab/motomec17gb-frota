import React from 'react';

const fixedFields = [
  { label: 'PREFIXO', key: 'prefixo' },
  { label: 'MARCA MODELO', key: 'marcaModelo' },
  { label: 'CHASSI', key: 'chassi' },
  { label: 'Ano', key: 'ano' },
  { label: 'Placa', key: 'placa' },
  { label: 'Nº motor', key: 'numeroMotor' },
  { label: 'Patrimonio', key: 'patrimonio' },
  { label: 'Data inclusao na frota', key: 'dataInclusaoFrota' },
  { label: 'Tipo', key: 'tipo' },
  { label: 'Tipo de oleo', key: 'tipoOleo' },
  { label: 'Medida pneu', key: 'medidaPneu' },
  { label: 'Tipo de bateria / amperagem', key: 'tipoBateriaAmperagem' },
  { label: 'Tipo oleo transmissao', key: 'tipoOleoTransmissao' },
  { label: 'Tipo oleo motor', key: 'tipoOleoMotor' },
  { label: 'Numeracao de radio', key: 'numeracaoRadio' },
];

const operationalFields = [
  { label: 'KM atual', key: 'km' },
  { label: 'Prox. troca oleo KM', key: 'proximaTrocaOleoKm' },
  { label: 'Prox. troca oleo tempo', key: 'proximaTrocaOleoTempo' },
  { label: 'Status oleo KM', key: 'statusOleoKm' },
  { label: 'Status oleo tempo', key: 'statusOleoTempo' },
  { label: 'Revisao freio KM', key: 'revisaoFreioKm' },
  { label: 'Status freio', key: 'statusFreio' },
  { label: 'Bateria', key: 'statusBateria' },
  { label: 'Vencimento bateria', key: 'vencimentoBateria' },
  { label: 'Pneus prox. troca', key: 'pneusProximaTroca' },
  { label: 'Embreagem prox. troca', key: 'embreagemProximaTroca' },
  { label: 'Lavagem/lubrificacao', key: 'dataLavagemLubrificacao' },
];

function getValue(viatura, key) {
  const value = viatura?.[key];
  if (value === null || value === undefined || value === '') return 'Nao informado';
  return value;
}

function DetailGrid({ fields, viatura }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: 12,
    }}>
      {fields.map(field => (
        <div key={field.key} style={{
          border: '1px solid var(--color-border)',
          borderRadius: 8,
          padding: '10px 12px',
          background: '#f9fafb',
        }}>
          <div style={{
            color: 'var(--color-text-muted)',
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            fontWeight: 700,
            marginBottom: 4,
          }}>
            {field.label}
          </div>
          <div style={{ fontWeight: 650, color: 'var(--color-text)', wordBreak: 'break-word' }}>
            {getValue(viatura, field.key)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DetalhesViaturaManutencao({ viatura, onClear }) {
  if (!viatura) return null;

  return (
    <div className="card mb-20">
      <div className="section-header">
        <div>
          <h3 className="section-title">Detalhes da viatura {viatura.prefixo}</h3>
          <div className="text-muted" style={{ marginTop: 4 }}>
            Dados cadastrais e operacionais carregados da base de frota.
          </div>
        </div>
        {onClear && (
          <button className="btn-small" type="button" onClick={onClear}>
            Ver todas
          </button>
        )}
      </div>

      <DetailGrid fields={fixedFields} viatura={viatura} />

      <div style={{ marginTop: 18, marginBottom: 10, fontWeight: 700, color: 'var(--color-text)' }}>
        Dados operacionais de manutencao
      </div>
      <DetailGrid fields={operationalFields} viatura={viatura} />
    </div>
  );
}
