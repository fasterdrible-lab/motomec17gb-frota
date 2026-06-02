import { publicConfig, requirePublicConfig } from '../config/publicConfig';

const SHEET_ID = requirePublicConfig(publicConfig.frotaSheetId, 'REACT_APP_FROTA_SHEET_ID');

async function fetchSheetData(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar aba "${sheetName}"`);
  const text = await res.text();
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/);
  if (!match) throw new Error(`Resposta invalida da aba "${sheetName}"`);
  return JSON.parse(match[1]);
}

function getCell(row, index) {
  try {
    const cell = row.c[index];
    if (!cell || cell.v === null || cell.v === undefined) return '';
    return cell.f || cell.v;
  } catch {
    return '';
  }
}

function isSyncRow(value) {
  const normalized = String(value).toUpperCase();
  return normalized.includes('SINCRONIZA') || normalized.includes('ULTIMA') || normalized.includes('ÃšLTIMA');
}

function formatSheetDate(value) {
  if (!value) return '';
  const text = String(value);
  const matchDate = text.match(/Date\((\d+),(\d+),(\d+)/);
  if (matchDate) {
    const year = matchDate[1];
    const month = String(Number(matchDate[2]) + 1).padStart(2, '0');
    const day = String(matchDate[3]).padStart(2, '0');
    return `${day}/${month}/${year}`;
  }
  return text;
}

function normalizePrefixo(value) {
  return String(value || '').trim().toUpperCase();
}

function mapSgbRows(rows, sgb) {
  return rows.reduce((acc, row) => {
    const prefixo = getCell(row, 0);
    if (!prefixo || isSyncRow(prefixo)) return acc;

    acc[normalizePrefixo(prefixo)] = {
      sgb,
      km: getCell(row, 2),
      vtrGarantia: formatSheetDate(getCell(row, 3)),
      proximaTrocaOleoKm: getCell(row, 4),
      proximaTrocaOleoTempo: formatSheetDate(getCell(row, 5)),
      revisaoFreioKm: getCell(row, 6),
      vencimentoBateria: formatSheetDate(getCell(row, 7)),
      statusOleoKm: getCell(row, 8),
      statusOleoTempo: getCell(row, 9),
      statusFreio: getCell(row, 10),
      statusBateria: getCell(row, 11),
      dataLavagemLubrificacao: formatSheetDate(getCell(row, 12)),
      pneusProximaTroca: getCell(row, 13),
      embreagemProximaTroca: getCell(row, 14),
      status: getCell(row, 15) || 'Operacional',
    };

    return acc;
  }, {});
}

export async function getFrotaDetalhada() {
  const [frotaData, sgb1Data, sgb2Data] = await Promise.all([
    fetchSheetData('FROTA'),
    fetchSheetData('1SGB'),
    fetchSheetData('2SGB'),
  ]);

  const sgbMap = {
    ...mapSgbRows(sgb1Data.table?.rows || [], '1SGB'),
    ...mapSgbRows(sgb2Data.table?.rows || [], '2SGB'),
  };

  const rows = (frotaData.table?.rows || []).filter(row => {
    const prefixo = getCell(row, 0);
    return prefixo && !isSyncRow(prefixo) && normalizePrefixo(prefixo) !== 'PREFIXO';
  });

  return rows.map(row => {
    const prefixo = getCell(row, 0);
    const sgb = sgbMap[normalizePrefixo(prefixo)] || {};
    const marca = getCell(row, 7);
    const modelo = getCell(row, 8);
    const anoFab = getCell(row, 10);
    const anoModelo = getCell(row, 11);

    return {
      prefixo,
      codigoFipe: getCell(row, 1),
      fipeEstimado: getCell(row, 2),
      opmcb: getCell(row, 3),
      posto: getCell(row, 4),
      proprietario: getCell(row, 5),
      placa: getCell(row, 6),
      marca,
      modelo,
      marcaModelo: [marca, modelo].filter(Boolean).join(' '),
      tipo: getCell(row, 9),
      anoFab,
      anoModelo,
      ano: anoModelo || anoFab,
      combustivel: getCell(row, 12),
      km: sgb.km || '',
      status: sgb.status || 'Operacional',
      sgb: sgb.sgb || '',
      vtrGarantia: sgb.vtrGarantia || '',
      proximaTrocaOleoKm: sgb.proximaTrocaOleoKm || '',
      proximaTrocaOleoTempo: sgb.proximaTrocaOleoTempo || '',
      revisaoFreioKm: sgb.revisaoFreioKm || '',
      vencimentoBateria: sgb.vencimentoBateria || '',
      statusOleoKm: sgb.statusOleoKm || '',
      statusOleoTempo: sgb.statusOleoTempo || '',
      statusFreio: sgb.statusFreio || '',
      statusBateria: sgb.statusBateria || '',
      dataLavagemLubrificacao: sgb.dataLavagemLubrificacao || '',
      pneusProximaTroca: sgb.pneusProximaTroca || '',
      embreagemProximaTroca: sgb.embreagemProximaTroca || '',
      chassi: '',
      numeroMotor: '',
      patrimonio: '',
      dataInclusaoFrota: '',
      tipoOleo: '',
      medidaPneu: '',
      tipoBateriaAmperagem: '',
      tipoOleoTransmissao: '',
      tipoOleoMotor: '',
      numeracaoRadio: '',
    };
  });
}

export function findViaturaByPrefixo(viaturas, prefixo) {
  const wanted = normalizePrefixo(prefixo);
  return viaturas.find(viatura => normalizePrefixo(viatura.prefixo) === wanted) || null;
}
