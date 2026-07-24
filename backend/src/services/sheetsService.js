'use strict';

const { env } = require('../config/env');

const MS_PER_DAY = 86400000;
const KM_THRESHOLD_WARNING = 5000;   // = ALERTA_KM_AVISO no Apps Script
const LAVAGEM_DIAS = 15;              // = LAVAGEM_DIAS no Apps Script
const ALERTA_DIAS_AVISO = 3;         // = ALERTA_DIAS_AVISO no Apps Script
const MIN_VALID_YEAR = 1900;

// Override temporário até correção manual na aba 2SGB col P
const STATUS_OVERRIDES = { 'UR-17208': '', 'UR-17211': '' };

async function fetchSheetData(sheetName, gid = null) {
  const base = `https://docs.google.com/spreadsheets/d/${env.sheetsId}/gviz/tq?tqx=out:json`;
  const url = gid
    ? `${base}&gid=${gid}`
    : `${base}&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar aba "${sheetName}"`);
  const text = await res.text();
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/);
  if (!match) throw new Error(`Resposta inválida da aba "${sheetName}"`);
  return JSON.parse(match[1]);
}

function isSyncRow(val) {
  const s = String(val).toUpperCase();
  return s.includes('SINCRONIZA') || s.includes('ÚLTIMA') || s.includes('LTIMA');
}

function getCell(row, idx) {
  return row.c && row.c[idx] && row.c[idx].v != null ? row.c[idx].v : '';
}

function getCellFormatted(row, idx) {
  if (!row.c || !row.c[idx]) return '';
  const cell = row.c[idx];
  if (cell.v == null) return '';
  return cell.f != null ? String(cell.f) : String(cell.v);
}

// 1SGB ganhou uma coluna nova ("KM ATUAL", tipo data) entre KM ANTERIOR e
// VTR EM GARANTIA, deslocando tudo a partir de VTR EM GARANTIA (indice
// semantico 3) uma posicao pra direita em relacao a 2SGB. O indice 2 (km,
// que em 1SGB aponta pra KM ANTERIOR) fica de fora do deslocamento de
// proposito: KM ANTERIOR ainda guarda um numero de km valido, enquanto a
// nova coluna "KM ATUAL" guarda datas — ver Issue 031 em tasks.md.
function getSgbIndex(semanticIdx, sgb) {
  return sgb === '1SGB' && semanticIdx >= 3 ? semanticIdx + 1 : semanticIdx;
}

function getSgbCell(row, semanticIdx, sgb) {
  return getCell(row, getSgbIndex(semanticIdx, sgb));
}

function getSgbCellFormatted(row, semanticIdx, sgb) {
  return getCellFormatted(row, getSgbIndex(semanticIdx, sgb));
}

function parseCusto(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const str = String(val).replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(str) || 0;
}

function formatDateFromRaw(rawData) {
  if (!rawData) return '-';
  const str = String(rawData);
  const matchDate = str.match(/Date\((\d+),(\d+),(\d+)/);
  if (matchDate) {
    const ano = matchDate[1];
    const mes = String(parseInt(matchDate[2]) + 1).padStart(2, '0');
    const dia = String(matchDate[3]).padStart(2, '0');
    return `${dia}/${mes}/${ano}`;
  }
  if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
    const parts = str.split('T')[0].split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  if (str.match(/^\d{2}\/\d{2}\/\d{4}/)) return str.substring(0, 10);
  return str;
}

function extractYear(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val > MIN_VALID_YEAR ? val : 0;
  const str = String(val);
  const dateMatch = str.match(/Date\((\d{4})/);
  if (dateMatch) return parseInt(dateMatch[1]);
  const yearMatch = str.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) return parseInt(yearMatch[0]);
  return 0;
}

function findCustoInRow(r) {
  const colF = parseCusto(getCell(r, 5));
  if (colF > 0) return colF;
  for (let col = 6; col <= 14; col++) {
    const val = getCell(r, col);
    if (!val) continue;
    if (typeof val === 'string' && (val.includes('R$') || /\d[.,]\d/.test(val))) {
      const custo = parseCusto(val);
      if (custo > 0) return custo;
    }
  }
  for (let col = 9; col <= 14; col++) {
    const custo = parseCusto(getCell(r, col));
    if (custo > 0) return custo;
  }
  for (let col = 6; col <= 8; col++) {
    const custo = parseCusto(getCell(r, col));
    if (custo > 0) return custo;
  }
  return 0;
}

async function getGastosTotais() {
  const data = await fetchSheetData('GASTOS').catch(() => null);
  if (!data) return { total: 0, viaturaDestaque: '—', maiorGasto: 0 };
  const rows = (data.table?.rows || []).filter(r => {
    const prefixo = getCell(r, 0);
    return prefixo && prefixo !== 'PREFIXO' && !isSyncRow(prefixo);
  });
  let total = 0, maiorGasto = 0, viaturaDestaque = '—';
  rows.forEach(r => {
    const prefixo = getCell(r, 0);
    const gasto = parseCusto(getCell(r, 2));
    total += gasto;
    if (gasto > maiorGasto) { maiorGasto = gasto; viaturaDestaque = prefixo; }
  });
  return { total, viaturaDestaque, maiorGasto };
}

async function getOrdensServico() {
  const data = await fetchSheetData('CONTROLE O.S.').catch(() => null);
  if (!data) return { executadas: 0, emAndamento: 0, pendentes: 0 };
  const rows = (data.table?.rows || []).filter(r => getCell(r, 0) && !isSyncRow(getCell(r, 0)));
  let executadas = 0, emAndamento = 0, pendentes = 0;
  rows.forEach(r => {
    const situacao = String(getCell(r, 4)).toUpperCase().trim();
    if (!situacao) return;
    if (situacao.includes('EXECUTADO')) executadas++;
    else if (situacao.includes('OFICINA')) emAndamento++;
    else if (situacao.includes('ORCAMENTO') || situacao.includes('ORÇAMENTO') || situacao.includes('AGENDAR')) pendentes++;
  });
  return { executadas, emAndamento, pendentes };
}

async function getFCDResumo() {
  const [fcd1, fcd2] = await Promise.allSettled([
    fetchSheetData('FCD'),
    fetchSheetData('FCD_2026'),
  ]);
  const fcdData = fcd1.status === 'fulfilled' ? fcd1.value :
                  fcd2.status === 'fulfilled' ? fcd2.value : null;
  if (!fcdData || !fcdData.table?.rows) return { total: 0, hoje: 0 };
  const hoje = new Date().toLocaleDateString('pt-BR');
  const rows = (fcdData.table?.rows || []).filter(r => {
    const col0 = getCell(r, 0);
    return col0 && !isSyncRow(col0) && String(col0).toUpperCase() !== 'DATA';
  });
  const hojeRegistros = rows.filter(r => {
    const d = getCell(r, 0);
    return String(d).includes(hoje) || (d && new Date(d).toLocaleDateString('pt-BR') === hoje);
  }).length;
  return { total: rows.length, hoje: hojeRegistros };
}

async function getDashboardMacro() {
  const [frotaData, sgb1, sgb2, tarefasData, gastosResult, osResult, abastData, fcdResumo] = await Promise.all([
    fetchSheetData('FROTA'),
    fetchSheetData('1SGB'),
    fetchSheetData('2SGB'),
    fetchSheetData('TAREFAS', env.tarefasGid).catch(() => null),
    getGastosTotais(),
    getOrdensServico(),
    fetchSheetData('ABAST. VTR').catch(() => null),
    getFCDResumo().catch(() => ({ total: 0, hoje: 0 })),
  ]);

  // FROTA é a fonte de verdade para contagem total
  const frotaRows = (frotaData.table?.rows || []).filter(r => {
    const p = String(getCell(r, 0)).toUpperCase().trim();
    return p && p !== 'PREFIXO' && !isSyncRow(p);
  });

  // Mapa prefixo → dados do SGB (status + alertas)
  // __sgb marca a origem de cada linha pra getSgbCell aplicar o deslocamento de colunas do 1SGB.
  const sgbRows = [
    ...(sgb1.table?.rows || []).filter(r => getCell(r, 0) && !isSyncRow(getCell(r, 0))).map(r => ({ ...r, __sgb: '1SGB' })),
    ...(sgb2.table?.rows || []).filter(r => getCell(r, 0) && !isSyncRow(getCell(r, 0))).map(r => ({ ...r, __sgb: '2SGB' })),
  ];
  const sgbMap = {};
  sgbRows.forEach(r => {
    const p = String(getCell(r, 0)).toUpperCase().trim();
    sgbMap[p] = r;
  });

  // Contar status usando FROTA como base, SGB para status (sem status = operando)
  let operando = 0, baixadas = 0, reserva = 0;
  frotaRows.forEach(r => {
    const p = String(getCell(r, 0)).toUpperCase().trim();
    const sgbRow = sgbMap[p];
    const rawS = sgbRow ? String(getSgbCell(sgbRow, 15, sgbRow.__sgb)).toUpperCase() : '';
    const s = p in STATUS_OVERRIDES ? STATUS_OVERRIDES[p] : rawS;
    if (s.includes('BAIXA')) baixadas++;
    else if (s.includes('RESERVA')) reserva++;
    else operando++;
  });

  // Alertas — mesma lógica do Apps Script (calcularAlertas)
  // Índices semânticos (2SGB nativo): I(8)/J(9)/K(10)/L(11) = status pré-computados pelo Apps Script (VENCIDO/A VENCER/OK)
  // M(12)/N(13)/O(14) = valores brutos (data lavagem, km pneu, km embreagem)
  const hoje = new Date();
  let totalAlertas = 0;
  sgbRows.forEach(r => {
    const kmAtual = parseFloat(getCell(r, 2)) || 0;

    // I — Óleo KM (pré-computado pelo Apps Script)
    const sOleoKm = String(getSgbCell(r, 8, r.__sgb)).toUpperCase();
    if (sOleoKm.includes('VENCIDO') || sOleoKm.includes('A VENCER')) totalAlertas++;

    // J — Óleo Tempo (pré-computado)
    const sOleoTempo = String(getSgbCell(r, 9, r.__sgb)).toUpperCase();
    if (sOleoTempo.includes('VENCIDO') || sOleoTempo.includes('A VENCER')) totalAlertas++;

    // K — Freio (pré-computado)
    const sFreio = String(getSgbCell(r, 10, r.__sgb)).toUpperCase();
    if (sFreio.includes('VENCIDO') || sFreio.includes('A VENCER')) totalAlertas++;

    // L — Bateria (pré-computado)
    const sBateria = String(getSgbCell(r, 11, r.__sgb)).toUpperCase();
    if (sBateria.includes('VENCIDO') || sBateria.includes('A VENCER')) totalAlertas++;

    // M — Lavagem (data bruta): alerta quando df <= ALERTA_DIAS_AVISO ou vencido
    const lavagem = getSgbCell(r, 12, r.__sgb);
    if (lavagem) {
      const parts = String(lavagem).split('/');
      if (parts.length === 3) {
        const dataLav = new Date(parts[2], parts[1] - 1, parts[0]);
        const diasPassados = Math.floor((hoje - dataLav) / MS_PER_DAY);
        const diasFaltando = LAVAGEM_DIAS - diasPassados;
        if (diasFaltando <= ALERTA_DIAS_AVISO) totalAlertas++;
      }
    }

    // N — Pneu (km bruto)
    const kmPneu = parseFloat(getSgbCell(r, 13, r.__sgb)) || 0;
    if (kmPneu > 0 && (kmAtual >= kmPneu || kmPneu - kmAtual <= KM_THRESHOLD_WARNING)) totalAlertas++;

    // O — Embreagem (km bruto)
    const kmEmb = parseFloat(getSgbCell(r, 14, r.__sgb)) || 0;
    if (kmEmb > 0 && (kmAtual >= kmEmb || kmEmb - kmAtual <= KM_THRESHOLD_WARNING)) totalAlertas++;
  });

  const tarefasRows = ((tarefasData && tarefasData.table?.rows) || []).filter(r => {
    const prefixo = getCell(r, 0);
    return prefixo && prefixo !== 'PREFIXO' && !isSyncRow(prefixo);
  });
  let tarefasPendentes = 0;
  tarefasRows.forEach(r => {
    const s = String(getCell(r, 4)).toUpperCase();
    if (s.includes('PENDENTE') || s.includes('ANDAMENTO')) tarefasPendentes++;
  });

  let manutencoesRealizadas = 0;
  const rivData = await fetchSheetData('RIV_2026').catch(() => null);
  if (rivData) {
    manutencoesRealizadas = (rivData.table?.rows || [])
      .filter(r => getCell(r, 0) && !isSyncRow(getCell(r, 0))).length;
  }

  // Viatura mais velha: usar colunas do FROTA (col 10 = anoFab, col 11 = anoModelo)
  let viaturasMaisVelha = { prefixo: '—', ano: '—' };
  let menorAno = Infinity;
  frotaRows.forEach(r => {
    const prefixo = getCell(r, 0);
    const ano = extractYear(getCell(r, 11)) || extractYear(getCell(r, 10));
    if (ano > MIN_VALID_YEAR && ano < menorAno) {
      menorAno = ano;
      viaturasMaisVelha = { prefixo, ano };
    }
  });

  // Tipos de viatura: usar FROTA (prefixo já limpo)
  const tiposViatura = {};
  frotaRows.forEach(r => {
    const prefixo = String(getCell(r, 0));
    const match = prefixo.match(/^([A-Za-z]+)/);
    const tipo = match ? match[1].toUpperCase() : 'OUTRO';
    tiposViatura[tipo] = (tiposViatura[tipo] || 0) + 1;
  });

  let totalAbastecimentos = 0, gastoTotalAbast = 0;
  let ultimoAbastData = '-', ultimoAbastPrefixo = '-', ultimoAbastValor = 0;
  if (abastData && abastData.table?.rows) {
    const abastRows = (abastData.table.rows || []).filter(r => {
      const prefixo = getCell(r, 5);
      const email = getCell(r, 1);
      return prefixo &&
        !isSyncRow(prefixo) &&
        !String(prefixo).toUpperCase().includes('PREFIXO') &&
        !String(email).toUpperCase().includes('E-MAIL');
    });
    totalAbastecimentos = abastRows.length;
    abastRows.forEach(r => { gastoTotalAbast += parseCusto(getCell(r, 10)); });
    if (abastRows.length > 0) {
      const ultimo = abastRows[abastRows.length - 1];
      ultimoAbastData = formatDateFromRaw(getCell(ultimo, 7));
      ultimoAbastPrefixo = getCell(ultimo, 5);
      ultimoAbastValor = parseCusto(getCell(ultimo, 10));
    }
  }

  return {
    frota: { total: frotaRows.length, operando, baixadas, reserva },
    totalAlertas,
    tarefasPendentes,
    gastoTotal: gastosResult.total,
    manutencoesRealizadas,
    viaturaTopGasto: { prefixo: gastosResult.viaturaDestaque, valor: gastosResult.maiorGasto || 0 },
    viaturasMaisVelha,
    tiposViatura,
    os: {
      total: osResult.executadas + osResult.emAndamento + osResult.pendentes,
      aberta: osResult.pendentes,
      fechada: osResult.executadas,
      andamento: osResult.emAndamento,
    },
    abastecimentos: {
      total: totalAbastecimentos,
      gastoTotal: gastoTotalAbast,
      ultimoData: ultimoAbastData,
      ultimoPrefixo: ultimoAbastPrefixo,
      ultimoValor: ultimoAbastValor,
    },
    fcd: { total: fcdResumo.total, hoje: fcdResumo.hoje },
  };
}

async function getAbastecimentos() {
  const data = await fetchSheetData('ABAST. VTR');
  const rows = (data.table?.rows || []).filter(r => {
    const prefixo = getCell(r, 5);
    const email = getCell(r, 1);
    if (!prefixo) return false;
    if (isSyncRow(prefixo) || isSyncRow(email)) return false;
    if (String(prefixo).toUpperCase().includes('PREFIXO')) return false;
    if (String(email).toUpperCase().includes('E-MAIL')) return false;
    return true;
  });
  return rows.map(r => ({
    data: formatDateFromRaw(getCell(r, 7)),
    prefixo: getCell(r, 5),
    placa: getCell(r, 6),
    km: getCell(r, 8),
    litros: parseFloat(String(getCell(r, 9)).replace(',', '.')) || 0,
    valorTotal: parseCusto(getCell(r, 10)),
    posto: getCell(r, 11) || '',
    combustivel: getCell(r, 12) || '',
    responsavel: getCell(r, 3) || '',
    unidade: getCell(r, 4) || '',
    obs: '',
  })).sort((a, b) => String(b.data).localeCompare(String(a.data)));
}

async function getTarefasCompletas() {
  const data = await fetchSheetData('TAREFAS', env.tarefasGid);
  const rows = (data.table?.rows || []).filter(r => {
    const prefixo = getCell(r, 0);
    return prefixo && prefixo !== 'PREFIXO' && !isSyncRow(prefixo);
  });
  return rows
    .map(r => ({
      prefixo: getCell(r, 0),
      placa: getCell(r, 1),
      descricao: getCell(r, 2),
      responsavel: getCell(r, 3),
      status: getCell(r, 4) || '',
    }))
    .map(t => {
      const s = String(t.status).toUpperCase();
      let statusKey = '';
      if (s.includes('CONCLU') || s.includes('FINAL')) statusKey = 'CONCLUIDA';
      else if (s.includes('ANDAM')) statusKey = 'ANDAMENTO';
      else if (s.includes('PENDENTE')) statusKey = 'PENDENTE';
      return { ...t, statusKey };
    });
}

function mapSgbDetalhado(rows, sgb) {
  return rows.reduce((acc, row) => {
    const prefixo = getCell(row, 0);
    if (!prefixo || isSyncRow(prefixo)) return acc;
    acc[String(prefixo).toUpperCase().trim()] = {
      sgb,
      km: getCellFormatted(row, 2),
      vtrGarantia: getSgbCellFormatted(row, 3, sgb),
      proximaTrocaOleoKm: getSgbCellFormatted(row, 4, sgb),
      proximaTrocaOleoTempo: getSgbCellFormatted(row, 5, sgb),
      revisaoFreioKm: getSgbCellFormatted(row, 6, sgb),
      vencimentoBateria: getSgbCellFormatted(row, 7, sgb),
      statusOleoKm: getSgbCellFormatted(row, 8, sgb),
      statusOleoTempo: getSgbCellFormatted(row, 9, sgb),
      statusFreio: getSgbCellFormatted(row, 10, sgb),
      statusBateria: getSgbCellFormatted(row, 11, sgb),
      dataLavagemLubrificacao: getSgbCellFormatted(row, 12, sgb),
      pneusProximaTroca: getSgbCellFormatted(row, 13, sgb),
      embreagemProximaTroca: getSgbCellFormatted(row, 14, sgb),
      status: getSgbCellFormatted(row, 15, sgb),
    };
    return acc;
  }, {});
}

async function getFrotaDetalhada() {
  const [frotaData, sgb1Data, sgb2Data] = await Promise.all([
    fetchSheetData('FROTA'),
    fetchSheetData('1SGB'),
    fetchSheetData('2SGB'),
  ]);

  const sgbMap = {
    ...mapSgbDetalhado(
      (sgb1Data.table?.rows || []).filter(r => getCell(r, 0) && !isSyncRow(getCell(r, 0))),
      '1SGB'
    ),
    ...mapSgbDetalhado(
      (sgb2Data.table?.rows || []).filter(r => getCell(r, 0) && !isSyncRow(getCell(r, 0))),
      '2SGB'
    ),
  };

  const frotaRows = (frotaData.table?.rows || []).filter(r => {
    const p = String(getCell(r, 0)).toUpperCase().trim();
    return p && p !== 'PREFIXO' && !isSyncRow(p);
  });

  return frotaRows.map(r => {
    const prefixo = getCellFormatted(r, 0);
    const p = String(prefixo).toUpperCase().trim();
    const sgb = sgbMap[p] || {};
    const rawStatus = sgb.status || '';
    const status = p in STATUS_OVERRIDES ? STATUS_OVERRIDES[p] : rawStatus;
    const marca = getCellFormatted(r, 7);
    const modelo = getCellFormatted(r, 8);
    const anoFab = getCellFormatted(r, 10);
    const anoModelo = getCellFormatted(r, 11);

    return {
      prefixo,
      codigoFipe: getCellFormatted(r, 1),
      fipeEstimado: getCellFormatted(r, 2),
      opmcb: getCellFormatted(r, 3),
      posto: getCellFormatted(r, 4),
      proprietario: getCellFormatted(r, 5),
      placa: getCellFormatted(r, 6),
      marca,
      modelo,
      marcaModelo: [marca, modelo].filter(Boolean).join(' '),
      tipo: getCellFormatted(r, 9),
      anoFab,
      anoModelo,
      ano: anoModelo || anoFab,
      combustivel: getCellFormatted(r, 12),
      km: sgb.km || '',
      status: status || 'Operacional',
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

module.exports = { getDashboardMacro, getAbastecimentos, getTarefasCompletas, getFrotaDetalhada };
