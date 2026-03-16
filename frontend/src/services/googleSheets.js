const SHEET_ID = '1q6wy9iO4aRDKMBPzxR9cISE7pCmUuIaYSRBdhUNlM4Q';
const MS_PER_DAY = 86400000;
const KM_THRESHOLD_PENDING = 3000;
const KM_THRESHOLD_WARNING = 5000;
const WASHING_CRITICAL_DAYS = 15;
const WASHING_WARNING_DAYS = 12;

async function fetchSheetData(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  const text = await res.text();
  // Remove JSONP wrapper: /*O_o*/google.visualization.Query.setResponse({...});
  const json = text.replace(/^[^{]*/, '').replace(/\);?\s*$/, '');
  return JSON.parse(json);
}

const MIN_VALID_YEAR = 1900;

function isSyncRow(val) {
  return String(val).toUpperCase().includes('SINCRONIZA');
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

function findCustoInRow(r) {
  // Prioritize col F (idx 5) as cost based on RIV sheet structure
  const colF = parseCusto(getCell(r, 5));
  if (colF > 0) return colF;

  // Then scan cols 6-14 for monetary-looking values
  for (let col = 6; col <= 14; col++) {
    const val = getCell(r, col);
    if (!val) continue;
    // Prefer values that look like monetary amounts (contain R$, comma, or decimal point)
    if (typeof val === 'string' && (val.includes('R$') || /\d[.,]\d/.test(val))) {
      const custo = parseCusto(val);
      if (custo > 0) return custo;
    }
  }
  // Second pass: accept any numeric value from col 9+ (KM cols are usually 2-8)
  for (let col = 9; col <= 14; col++) {
    const val = getCell(r, col);
    const custo = parseCusto(val);
    if (custo > 0) return custo;
  }
  // Last resort: try cols 6-8 as plain numbers
  for (let col = 6; col <= 8; col++) {
    const custo = parseCusto(getCell(r, col));
    if (custo > 0) return custo;
  }
  return 0;
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


export async function getStatusOperacional() {
  const [sgb1, sgb2] = await Promise.all([
    fetchSheetData('1SGB'),
    fetchSheetData('2SGB'),
  ]);
  const rows = [
    ...(sgb1.table?.rows || []),
    ...(sgb2.table?.rows || []),
  ].filter(r => getCell(r, 0) && !isSyncRow(getCell(r, 0))); // prefixo não vazio

  let operando = 0, baixadas = 0, reserva = 0;
  rows.forEach(r => {
    const status = String(getCell(r, 15)).toUpperCase();
    if (status.includes('BAIXA')) baixadas++;
    else if (status.includes('RESERVA')) reserva++;
    else operando++;
  });
  return { total: rows.length, operando, baixadas, reserva };
}

export async function getTarefas() {
  const data = await fetchSheetData('TAREFAS');
  const rows = (data.table?.rows || []).filter(r => {
    const prefixo = getCell(r, 0);
    return prefixo && prefixo !== 'PREFIXO' && !isSyncRow(prefixo);
  });
  let pendente = 0, andamento = 0, concluida = 0;
  rows.forEach(r => {
    const s = String(getCell(r, 4)).toUpperCase();
    if (s.includes('CONCLU')) concluida++;
    else if (s.includes('ANDAMENTO')) andamento++;
    else pendente++;
  });
  return { total: rows.length, pendente, andamento, concluida };
}

export async function getAlertas() {
  const [sgb1, sgb2] = await Promise.all([
    fetchSheetData('1SGB'),
    fetchSheetData('2SGB'),
  ]);
  const rows = [
    ...(sgb1.table?.rows || []),
    ...(sgb2.table?.rows || []),
  ].filter(r => getCell(r, 0) && !isSyncRow(getCell(r, 0)));

  const alertas = [];
  const hoje = new Date();

  rows.forEach(r => {
    const prefixo = getCell(r, 0);
    const kmAtual = parseFloat(getCell(r, 2)) || 0;

    // Bateria (col L, idx 11)
    const bateria = String(getCell(r, 11)).toUpperCase();
    if (bateria.includes('VENCIDO')) alertas.push({ tipo: '🚨 BATERIA', nivel: 'critico', prefixo });
    else if (bateria.includes('A VENCER')) alertas.push({ tipo: '⚠️ BATERIA', nivel: 'aviso', prefixo });

    // Lavagem (col M, idx 12)
    const lavagem = getCell(r, 12);
    if (lavagem) {
      const parts = String(lavagem).split('/');
      if (parts.length === 3) {
        const dataLav = new Date(parts[2], parts[1] - 1, parts[0]);
        const dias = Math.floor((hoje - dataLav) / MS_PER_DAY);
        if (dias >= WASHING_CRITICAL_DAYS) alertas.push({ tipo: '🚨 LAVAGEM', nivel: 'critico', prefixo });
        else if (dias >= WASHING_WARNING_DAYS) alertas.push({ tipo: '⚠️ LAVAGEM', nivel: 'aviso', prefixo });
      }
    }

    // Pneu (col N, idx 13)
    const kmPneu = parseFloat(getCell(r, 13)) || 0;
    if (kmPneu > 0) {
      if (kmAtual >= kmPneu) alertas.push({ tipo: '🚨 PNEU', nivel: 'critico', prefixo });
      else if (kmPneu - kmAtual <= KM_THRESHOLD_WARNING) alertas.push({ tipo: '⚠️ PNEU', nivel: 'aviso', prefixo });
    }

    // Embreagem (col O, idx 14)
    const kmEmb = parseFloat(getCell(r, 14)) || 0;
    if (kmEmb > 0) {
      if (kmAtual >= kmEmb) alertas.push({ tipo: '🚨 EMBREAGEM', nivel: 'critico', prefixo });
      else if (kmEmb - kmAtual <= KM_THRESHOLD_WARNING) alertas.push({ tipo: '⚠️ EMBREAGEM', nivel: 'aviso', prefixo });
    }
  });

  // Agrupar por tipo e contar
  const agrupado = {};
  alertas.forEach(a => {
    if (!agrupado[a.tipo]) agrupado[a.tipo] = { tipo: a.tipo, nivel: a.nivel, count: 0 };
    agrupado[a.tipo].count++;
  });
  return Object.values(agrupado).sort((a, b) => {
    if (a.nivel === 'critico' && b.nivel !== 'critico') return -1;
    if (b.nivel === 'critico' && a.nivel !== 'critico') return 1;
    return 0;
  });
}

function normalizeStatus(rawStatus) {
  const s = String(rawStatus).toUpperCase();
  if (s.includes('BAIXA')) return 'baixada';
  if (s.includes('RESERVA')) return 'reserva';
  return 'operando';
}

function mapViaturaRow(r, sgb) {
  return {
    prefixo: getCell(r, 0),
    placa: getCell(r, 1),
    kmAtual: parseFloat(getCell(r, 2)) || 0,
    modelo: '',   // não existe na planilha operacional
    marca: '',    // não existe na planilha operacional
    ano: '',      // não existe na planilha operacional
    cor: '',      // não existe na planilha operacional
    chassi: '',   // não existe na planilha operacional
    renavam: '',  // não existe na planilha operacional
    status: normalizeStatus(getCell(r, 15)),
    sgb,
  };
}

export async function getFrotaCompleta() {
  const [sgb1, sgb2] = await Promise.all([
    fetchSheetData('1SGB'),
    fetchSheetData('2SGB'),
  ]);
  return [
    ...(sgb1.table?.rows || []).filter(r => getCell(r, 0) && !isSyncRow(getCell(r, 0))).map(r => mapViaturaRow(r, '1SGB')),
    ...(sgb2.table?.rows || []).filter(r => getCell(r, 0) && !isSyncRow(getCell(r, 0))).map(r => mapViaturaRow(r, '2SGB')),
  ];
}

export async function getManutencoes() {
  const [sgb1, sgb2] = await Promise.all([
    fetchSheetData('1SGB'),
    fetchSheetData('2SGB'),
  ]);
  const allRows = [
    ...(sgb1.table?.rows || []).filter(r => getCell(r, 0) && !isSyncRow(getCell(r, 0))),
    ...(sgb2.table?.rows || []).filter(r => getCell(r, 0) && !isSyncRow(getCell(r, 0))),
  ];

  const manutencoes = [];

  allRows.forEach(r => {
    const prefixo = getCell(r, 0);
    const kmAtual = parseFloat(getCell(r, 2)) || 0;

    const checkKm = (col, tipo) => {
      const kmLimite = parseFloat(getCell(r, col)) || 0;
      if (kmLimite <= 0) return;
      if (kmAtual >= kmLimite) {
        manutencoes.push({ prefixo, tipo, status: 'vencida', detalhe: `KM atual ${kmAtual} ≥ limite ${kmLimite}` });
      } else if (kmLimite - kmAtual <= KM_THRESHOLD_PENDING) {
        manutencoes.push({ prefixo, tipo, status: 'pendente', detalhe: `Faltam ${kmLimite - kmAtual} km` });
      }
    };

    checkKm(4, 'Óleo Motor');   // índice 4 = PRÓX TROCA ÓLEO (KM)
    checkKm(6, 'Freio');        // índice 6 = REVISÃO: FREIO (KM)
    checkKm(13, 'Pneu');        // índice 13 = PNEUS: KM PRÓX TROCA
    checkKm(14, 'Embreagem');   // índice 14 = KM TROCA: EMBREAGEM

    // STATUS: ÓLEO KM (idx 8) e STATUS: ÓLEO TEMPO (idx 9) — fallback quando KM não preenchido
    const jaTemOleo = manutencoes.some(m => m.prefixo === prefixo && m.tipo === 'Óleo Motor');
    if (!jaTemOleo) {
      const statusOleo = String(getCell(r, 8)).toUpperCase();
      const statusOleoTempo = String(getCell(r, 9)).toUpperCase();
      if (statusOleo.includes('VENCIDO') || statusOleoTempo.includes('VENCIDO')) {
        manutencoes.push({ prefixo, tipo: 'Óleo Motor', status: 'vencida', detalhe: 'Status indicado na planilha: VENCIDO' });
      } else if (statusOleo.includes('A VENCER') || statusOleoTempo.includes('A VENCER') || statusOleo.includes('PENDENTE') || statusOleoTempo.includes('PENDENTE')) {
        manutencoes.push({ prefixo, tipo: 'Óleo Motor', status: 'pendente', detalhe: 'Status indicado na planilha: A VENCER' });
      }
    }

    // STATUS: REVISÃO FREIO (idx 10) — fallback quando KM não preenchido
    const jaTemFreio = manutencoes.some(m => m.prefixo === prefixo && m.tipo === 'Freio');
    if (!jaTemFreio) {
      const statusFreio = String(getCell(r, 10)).toUpperCase();
      if (statusFreio.includes('VENCIDO')) {
        manutencoes.push({ prefixo, tipo: 'Freio', status: 'vencida', detalhe: 'Status indicado na planilha: VENCIDO' });
      } else if (statusFreio.includes('A VENCER') || statusFreio.includes('PENDENTE')) {
        manutencoes.push({ prefixo, tipo: 'Freio', status: 'pendente', detalhe: 'Status indicado na planilha: A VENCER' });
      }
    }

    const bateria = String(getCell(r, 11)).toUpperCase();
    if (bateria.includes('VENCIDO')) {
      manutencoes.push({ prefixo, tipo: 'Bateria', status: 'vencida', detalhe: 'Bateria vencida' });
    } else if (bateria.includes('A VENCER')) {
      manutencoes.push({ prefixo, tipo: 'Bateria', status: 'pendente', detalhe: 'Bateria a vencer' });
    }
  });

  return manutencoes;
}

export async function getAlertasDetalhados() {
  const [sgb1, sgb2] = await Promise.all([
    fetchSheetData('1SGB'),
    fetchSheetData('2SGB'),
  ]);
  const rows = [
    ...(sgb1.table?.rows || []),
    ...(sgb2.table?.rows || []),
  ].filter(r => getCell(r, 0) && !isSyncRow(getCell(r, 0)));

  const alertas = [];
  const hoje = new Date();
  let idCounter = 1;

  rows.forEach(r => {
    const prefixo = getCell(r, 0);
    const kmAtual = parseFloat(getCell(r, 2)) || 0;

    const bateria = String(getCell(r, 11)).toUpperCase();
    if (bateria.includes('VENCIDO')) {
      alertas.push({ id: idCounter++, prefixo, tipo: 'Bateria', nivel: 'critico', descricao: `${prefixo}: Bateria VENCIDA`, lido: false });
    } else if (bateria.includes('A VENCER')) {
      alertas.push({ id: idCounter++, prefixo, tipo: 'Bateria', nivel: 'aviso', descricao: `${prefixo}: Bateria a vencer em breve`, lido: false });
    }

    const lavagem = getCell(r, 12);
    if (lavagem) {
      const parts = String(lavagem).split('/');
      if (parts.length === 3) {
        const dataLav = new Date(parts[2], parts[1] - 1, parts[0]);
        const dias = Math.floor((hoje - dataLav) / MS_PER_DAY);
        if (dias >= WASHING_CRITICAL_DAYS) {
          alertas.push({ id: idCounter++, prefixo, tipo: 'Lavagem', nivel: 'critico', descricao: `${prefixo}: Última lavagem há ${dias} dias`, lido: false });
        } else if (dias >= WASHING_WARNING_DAYS) {
          alertas.push({ id: idCounter++, prefixo, tipo: 'Lavagem', nivel: 'aviso', descricao: `${prefixo}: Lavagem necessária em breve (${dias} dias)`, lido: false });
        }
      }
    }

    const kmPneu = parseFloat(getCell(r, 13)) || 0;
    if (kmPneu > 0) {
      if (kmAtual >= kmPneu) {
        alertas.push({ id: idCounter++, prefixo, tipo: 'Pneu', nivel: 'critico', descricao: `${prefixo}: Troca de pneu vencida (KM ${kmAtual}/${kmPneu})`, lido: false });
      } else if (kmPneu - kmAtual <= KM_THRESHOLD_WARNING) {
        alertas.push({ id: idCounter++, prefixo, tipo: 'Pneu', nivel: 'aviso', descricao: `${prefixo}: Pneu próximo do limite (faltam ${kmPneu - kmAtual} km)`, lido: false });
      }
    }

    const kmEmb = parseFloat(getCell(r, 14)) || 0;
    if (kmEmb > 0) {
      if (kmAtual >= kmEmb) {
        alertas.push({ id: idCounter++, prefixo, tipo: 'Embreagem', nivel: 'critico', descricao: `${prefixo}: Troca de embreagem vencida (KM ${kmAtual}/${kmEmb})`, lido: false });
      } else if (kmEmb - kmAtual <= KM_THRESHOLD_WARNING) {
        alertas.push({ id: idCounter++, prefixo, tipo: 'Embreagem', nivel: 'aviso', descricao: `${prefixo}: Embreagem próxima do limite (faltam ${kmEmb - kmAtual} km)`, lido: false });
      }
    }
  });

  return alertas.sort((a, b) => {
    if (a.nivel === 'critico' && b.nivel !== 'critico') return -1;
    if (b.nivel === 'critico' && a.nivel !== 'critico') return 1;
    return 0;
  });
}

export async function getTarefasCompletas() {
  const data = await fetchSheetData('TAREFAS');
  const rows = (data.table?.rows || []).filter(r => {
    const prefixo = getCell(r, 0);
    return prefixo && prefixo !== 'PREFIXO' && !isSyncRow(prefixo);
  });
  return rows.map(r => ({
    prefixo: getCell(r, 0),
    placa: getCell(r, 1),
    descricao: getCell(r, 2),
    responsavel: getCell(r, 3),
    status: getCell(r, 4) || '',
  }));
}

export async function getDadosRelatorio() {
  const [frotaStatus, manutencoes, alertas, tarefas] = await Promise.all([
    getStatusOperacional(),
    getManutencoes(),
    getAlertas(),
    getTarefas(),
  ]);
  return {
    frotaStatus,
    manutencoes,
    alertas,
    tarefas,
    geradoEm: new Date(),
  };
}

export async function getDashboardMacro() {
  const [sgb1, sgb2, tarefasData, gastosResult, osResult, abastData, fcdResumo] = await Promise.all([
    fetchSheetData('1SGB'),
    fetchSheetData('2SGB'),
    fetchSheetData('TAREFAS'),
    getGastosTotais(),
    getOrdensServico(),
    fetchSheetData('ABASTECIMENTO').catch(() => null),
    getFCDResumo().catch(() => ({ total: 0, hoje: 0 })),
  ]);

  const frotaRows = [
    ...(sgb1.table?.rows || []),
    ...(sgb2.table?.rows || []),
  ].filter(r => getCell(r, 0) && !isSyncRow(getCell(r, 0)));

  // 1. Status viaturas
  let operando = 0, baixadas = 0, reserva = 0;
  frotaRows.forEach(r => {
    const s = String(getCell(r, 15)).toUpperCase();
    if (s.includes('BAIXA')) baixadas++;
    else if (s.includes('RESERVA')) reserva++;
    else operando++;
  });

  // 2. Total de alertas
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

  // 3. Tarefas pendentes
  const tarefasRows = (tarefasData.table?.rows || []).filter(r => {
    const prefixo = getCell(r, 0);
    return prefixo && prefixo !== 'PREFIXO' && !isSyncRow(prefixo);
  });
  let tarefasPendentes = 0;
  tarefasRows.forEach(r => {
    const s = String(getCell(r, 4)).toUpperCase();
    if (!s.includes('CONCLU')) tarefasPendentes++;
  });

  // 4. Manutenções realizadas (conta linhas da aba RIV_2026)
  let manutencoesRealizadas = 0;
  const rivData = await fetchSheetData('RIV_2026').catch(() => null);
  if (rivData) {
    manutencoesRealizadas = (rivData.table?.rows || [])
      .filter(r => getCell(r, 0) && !isSyncRow(getCell(r, 0))).length;
  }

  // 5. Viatura mais velha
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

  // 6. Tipos de viatura
  const tiposViatura = {};
  frotaRows.forEach(r => {
    const prefixo = String(getCell(r, 0));
    const match = prefixo.match(/^([A-Za-z]+)/);
    const tipo = match ? match[1].toUpperCase() : 'OUTRO';
    tiposViatura[tipo] = (tiposViatura[tipo] || 0) + 1;
  });

  // 7. Abastecimentos
  let totalAbastecimentos = 0;
  let gastoTotalAbast = 0;
  let ultimoAbastData = '—';
  let ultimoAbastPrefixo = '—';
  let ultimoAbastValor = 0;

  if (abastData && abastData.table?.rows) {
    const abastRows = (abastData.table.rows || []).filter(r => {
      const prefixo = getCell(r, 1);
      return prefixo && prefixo !== 'PREFIXO' && prefixo !== 'VTR' && !isSyncRow(prefixo);
    });
    totalAbastecimentos = abastRows.length;
    abastRows.forEach(r => { gastoTotalAbast += parseCusto(getCell(r, 5)); });
    if (abastRows.length > 0) {
      const ultimo = abastRows[abastRows.length - 1];
      ultimoAbastData = getCell(ultimo, 0);
      ultimoAbastPrefixo = getCell(ultimo, 1);
      ultimoAbastValor = parseCusto(getCell(ultimo, 5));
    }
  }

  return {
    frota: { total: frotaRows.length, operando, baixadas, reserva },
    totalAlertas,
    tarefasPendentes,
    gastoTotal: gastosResult.total,
    manutencoesRealizadas,
    viaturaTopGasto: { prefixo: gastosResult.viaturaDestaque, valor: gastosResult.total },
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

export async function getGastosPorViatura() {
  // Try multiple sheet name variants for maximum compatibility
  const sheetNamesToTry = [
    'RIV 2026/2027',
    'RIV 2026',
    'RIV_2026',
    'RIV_2026/2027',
    '1SGB',
    '2SGB',
  ];

  let mRows = [];
  let foundSheetName = null;

  for (const sheetName of sheetNamesToTry) {
    try {
      const rivData = await fetchSheetData(sheetName);
      if (rivData && rivData.table?.rows && rivData.table.rows.length > 0) {
        const filtered = rivData.table.rows.filter(r => {
          const col0 = getCell(r, 0);
          return col0 && !isSyncRow(col0) && String(col0).toUpperCase() !== 'PREFIXO' && String(col0).toUpperCase() !== 'VTR';
        });
        if (filtered.length > 0) {
          mRows = filtered;
          foundSheetName = sheetName;
          console.log(`[Gastos] Aba encontrada: "${sheetName}" — ${filtered.length} linhas`);
          break;
        }
      }
    } catch (e) {
      // try next
    }
  }

  if (!foundSheetName) {
    console.warn('[Gastos] Nenhuma aba RIV encontrada. Dados de gastos indisponíveis.');
  }

  // Estrutura da aba RIV: col A (idx 0) = Prefixo/VTR, col B = Placa, col C = Tipo Serviço,
  // col D = Data, col E = KM, col F = Descrição, col G+ = Valor (posição pode variar)

  const gastosPorViatura = {};
  const listaGastos = [];

  mRows.forEach(r => {
    const prefixo = getCell(r, 0);
    const placa = getCell(r, 1);
    const tipoServico = getCell(r, 2) || getCell(r, 3) || '';
    const data = getCell(r, 3) || getCell(r, 4) || '';
    const km = getCell(r, 4) || getCell(r, 5) || '';
    const descricao = getCell(r, 5) || getCell(r, 6) || '';
    // Scan columns dynamically to find the monetary cost value
    const custo = findCustoInRow(r);

    if (!prefixo) return;

    if (!gastosPorViatura[prefixo]) {
      gastosPorViatura[prefixo] = { prefixo, placa, totalGasto: 0, qtdServicos: 0, servicos: [] };
    }
    gastosPorViatura[prefixo].totalGasto += custo;
    gastosPorViatura[prefixo].qtdServicos++;
    gastosPorViatura[prefixo].servicos.push({ tipoServico, data, km, descricao, custo });

    listaGastos.push({ prefixo, placa, tipoServico, data, km, descricao, custo });
  });

  const viaturas = Object.values(gastosPorViatura)
    .sort((a, b) => b.totalGasto - a.totalGasto);

  const totalGeral = viaturas.reduce((sum, v) => sum + v.totalGasto, 0);

  return { viaturas, listaGastos, totalGeral };
}

export async function getAbastecimentos() {
  const data = await fetchSheetData('ABASTECIMENTO');
  const rows = (data.table?.rows || []).filter(r => {
    const prefixo = getCell(r, 1);
    return prefixo && prefixo !== 'PREFIXO' && prefixo !== 'VTR' && !isSyncRow(prefixo);
  });
  return rows.map(r => ({
    data: getCell(r, 0),
    prefixo: getCell(r, 1),
    placa: getCell(r, 2),
    km: getCell(r, 3),
    litros: parseFloat(String(getCell(r, 4)).replace(',', '.')) || 0,
    valorTotal: parseCusto(getCell(r, 5)),
    posto: getCell(r, 6) || '',
    obs: getCell(r, 7) || '',
  })).sort((a, b) => String(b.data).localeCompare(String(a.data)));
}

export async function getFCDResumo() {
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
    return String(d).includes(hoje) ||
           (d && new Date(d).toLocaleDateString('pt-BR') === hoje);
  }).length;

  return { total: rows.length, hoje: hojeRegistros };
}
export async function getGastosTotais() {
  const data = await fetchSheetData('GASTOS').catch(() => null);
  if (!data) return { total: 0, viaturaDestaque: '—' };

  const rows = (data.table?.rows || []).filter(r => {
    const prefixo = getCell(r, 0);
    return prefixo && prefixo !== 'PREFIXO' && !isSyncRow(prefixo);
  });

  let total = 0;
  let maiorGasto = 0;
  let viaturaDestaque = '—';

  rows.forEach(r => {
    const prefixo = getCell(r, 0);
    const gasto = parseCusto(getCell(r, 2)); // coluna C = índice 2
    total += gasto;
    if (gasto > maiorGasto) {
      maiorGasto = gasto;
      viaturaDestaque = prefixo;
    }
  });

  return { total, viaturaDestaque };
}

// ORDENS DE SERVIÇO — lê da aba CONTROLE O.S., coluna E
export async function getOrdensServico() {
  const data = await fetchSheetData('CONTROLE O.S.').catch(() => null);
  if (!data) return { executadas: 0, emAndamento: 0, pendentes: 0 };

  const rows = (data.table?.rows || []).filter(r => getCell(r, 0) && !isSyncRow(getCell(r, 0)));

  let executadas = 0, emAndamento = 0, pendentes = 0;

  rows.forEach(r => {
    const situacao = String(getCell(r, 4)).toUpperCase().trim(); // coluna E = índice 4
    if (!situacao) return;
    if (situacao.includes('EXECUTADO')) executadas++;
    else if (situacao.includes('OFICINA')) emAndamento++;
    else if (
      situacao.includes('ORÇAMENTO') ||
      situacao.includes('ORCAMENTO') ||
      situacao.includes('AGENDAR')
    ) pendentes++;
  });

  return { executadas, emAndamento, pendentes };
}
