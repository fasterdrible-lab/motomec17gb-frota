'use strict';

const { env } = require('../config/env');

const MS_PER_DAY = 86400000;
const KM_THRESHOLD_WARNING = 5000;
const WASHING_WARNING_DAYS = 12;
const MIN_VALID_YEAR = 1900;

async function fetchSheetData(sheetName, gid = null) {
  const base = `https://docs.google.com/spreadsheets/d/${env.sheetsId}/gviz/tq?tqx=out:json`;
  const url = gid
    ? `${base}&gid=${gid}`
    : `${base}&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar aba "${sheetName}"`);
  const text = await res.text();
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/);
  if (!match) throw new Error(`Resposta invalida da aba "${sheetName}"`);
  return JSON.parse(match[1]);
}

function isSyncRow(val) {
  const s = String(val).toUpperCase();
  return s.includes('SINCRONIZA') || s.includes('ÚLTIMA') || s.includes('LTIMA');
}

function getCell(row, idx) {
  return row.c && row.c[idx] && row.c[idx].v != null ? row.c[idx].v : '';
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
  const [sgb1, sgb2, tarefasData, gastosResult, osResult, abastData, fcdResumo] = await Promise.all([
    fetchSheetData('1SGB'),
    fetchSheetData('2SGB'),
    fetchSheetData('TAREFAS', env.tarefasGid).catch(() => null),
    getGastosTotais(),
    getOrdensServico(),
    fetchSheetData('ABAST. VTR').catch(() => null),
    getFCDResumo().catch(() => ({ total: 0, hoje: 0 })),
  ]);

  const frotaRows = [
    ...(sgb1.table?.rows || []),
    ...(sgb2.table?.rows || []),
  ].filter(r => getCell(r, 0) && !isSyncRow(getCell(r, 0)));

  let operando = 0, baixadas = 0, reserva = 0;
  frotaRows.forEach(r => {
    const s = String(getCell(r, 15)).toUpperCase();
    if (s.includes('BAIXA')) baixadas++;
    else if (s.includes('RESERVA')) reserva++;
    else operando++;
  });

  const hoje = new Date();
  let totalAlertas = 0;
  frotaRows.forEach(r => {
    const kmAtual = parseFloat(getCell(r, 2)) || 0;
    const bateria = String(getCell(r, 11)).toUpperCase();
    if (bateria.includes('VENCIDO') || bateria.includes('A VENCER')) totalAlertas++;
    const lavagem = getCell(r, 12);
    if (lavagem) {
      const parts = String(lavagem).split('/');
      if (parts.length === 3) {
        const dataLav = new Date(parts[2], parts[1] - 1, parts[0]);
        const dias = Math.floor((hoje - dataLav) / MS_PER_DAY);
        if (dias >= WASHING_WARNING_DAYS) totalAlertas++;
      }
    }
    const kmPneu = parseFloat(getCell(r, 13)) || 0;
    if (kmPneu > 0 && (kmAtual >= kmPneu || kmPneu - kmAtual <= KM_THRESHOLD_WARNING)) totalAlertas++;
    const kmEmb = parseFloat(getCell(r, 14)) || 0;
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

  let viaturasMaisVelha = { prefixo: '—', ano: '—' };
  let menorAno = Infinity;
  frotaRows.forEach(r => {
    const prefixo = getCell(r, 0);
    const ano = extractYear(getCell(r, 5)) || extractYear(getCell(r, 3));
    if (ano > MIN_VALID_YEAR && ano < menorAno) {
      menorAno = ano;
      viaturasMaisVelha = { prefixo, ano };
    }
  });

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

module.exports = { getDashboardMacro, getAbastecimentos, getTarefasCompletas };
