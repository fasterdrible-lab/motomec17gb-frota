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
  ].filter(r => getCell(r, 0)); // prefixo não vazio

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
  const rows = (data.table?.rows || []).filter(r => getCell(r, 2));
  let pendente = 0, andamento = 0, concluida = 0;
  rows.forEach(r => {
    const s = String(getCell(r, 4)).toUpperCase();
    if (s.includes('PENDENTE')) pendente++;
    else if (s.includes('ANDAMENTO')) andamento++;
    else if (s.includes('CONCLU')) concluida++;
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
  ].filter(r => getCell(r, 0));

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
    modelo: getCell(r, 3),
    marca: getCell(r, 4),
    ano: getCell(r, 5),
    cor: getCell(r, 6),
    chassi: getCell(r, 7),
    renavam: getCell(r, 8),
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
    ...(sgb1.table?.rows || []).filter(r => getCell(r, 0)).map(r => mapViaturaRow(r, '1SGB')),
    ...(sgb2.table?.rows || []).filter(r => getCell(r, 0)).map(r => mapViaturaRow(r, '2SGB')),
  ];
}

export async function getManutencoes() {
  const [sgb1, sgb2] = await Promise.all([
    fetchSheetData('1SGB'),
    fetchSheetData('2SGB'),
  ]);
  const allRows = [
    ...(sgb1.table?.rows || []).filter(r => getCell(r, 0)),
    ...(sgb2.table?.rows || []).filter(r => getCell(r, 0)),
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

    checkKm(9, 'Óleo Motor');
    checkKm(10, 'Filtro Ar');
    checkKm(13, 'Pneu');
    checkKm(14, 'Embreagem');

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
  ].filter(r => getCell(r, 0));

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
  const rows = (data.table?.rows || []).filter(r => getCell(r, 1));
  return rows.map(r => ({
    id: getCell(r, 0),
    titulo: getCell(r, 1),
    descricao: getCell(r, 2),
    responsavel: getCell(r, 3),
    status: getCell(r, 4) || 'PENDENTE',
    prioridade: getCell(r, 5) || 'MÉDIA',
    dataInicio: getCell(r, 6),
    dataFim: getCell(r, 7),
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
  const [sgb1, sgb2, tarefasData, manutencoesData, osData] = await Promise.allSettled([
    fetchSheetData('1SGB'),
    fetchSheetData('2SGB'),
    fetchSheetData('TAREFAS'),
    fetchSheetData('RIV 2026'),
    fetchSheetData('OS'),
  ]);

  const frotaRows = [
    ...(sgb1.status === 'fulfilled' ? (sgb1.value.table?.rows || []) : []),
    ...(sgb2.status === 'fulfilled' ? (sgb2.value.table?.rows || []) : []),
  ].filter(r => getCell(r, 0));

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
  const tarefasRows = tarefasData.status === 'fulfilled'
    ? (tarefasData.value.table?.rows || []).filter(r => getCell(r, 2))
    : [];
  let tarefasPendentes = 0;
  tarefasRows.forEach(r => {
    const s = String(getCell(r, 4)).toUpperCase();
    if (!s.includes('CONCLU')) tarefasPendentes++;
  });

  // 4. Manutenções e gastos (aba MANUTENCOES)
  const mRows = manutencoesData.status === 'fulfilled'
    ? (manutencoesData.value.table?.rows || []).filter(r => getCell(r, 0) && !isSyncRow(getCell(r, 0)))
    : [];
  const gastosPorViatura = {};
  let gastoTotal = 0;
  let manutencoesRealizadas = 0;
  mRows.forEach(r => {
    const prefixo = getCell(r, 0);
    if (!prefixo) return;
    // Coluna G (índice 6) = VALOR, pode vir como número ou string "R$11.099,70"
    const custoRaw = getCell(r, 6);
    const custo = typeof custoRaw === 'number'
      ? custoRaw
      : parseFloat(String(custoRaw).replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
    gastosPorViatura[prefixo] = (gastosPorViatura[prefixo] || 0) + custo;
    gastoTotal += custo;
    manutencoesRealizadas++; // toda linha com prefixo = manutenção realizada
  });
  if (mRows.length === 0) {
    frotaRows.forEach(r => {
      const kmAtual = parseFloat(getCell(r, 2)) || 0;
      [9, 10, 13, 14].forEach(col => {
        const kmLimite = parseFloat(getCell(r, col)) || 0;
        if (kmLimite > 0 && kmAtual >= kmLimite) manutencoesRealizadas++;
      });
    });
  }
  let viaturaTopGasto = { prefixo: '—', valor: 0 };
  const entries = Object.entries(gastosPorViatura);
  if (entries.length > 0) {
    const [pref, val] = entries.reduce((a, b) => b[1] > a[1] ? b : a);
    viaturaTopGasto = { prefixo: pref, valor: val };
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

  // 7. OS Status
  const osRows = osData.status === 'fulfilled'
    ? (osData.value.table?.rows || []).filter(r => getCell(r, 0))
    : [];
  let osAberta = 0, osFechada = 0, osAndamento = 0;
  osRows.forEach(r => {
    const s = String(getCell(r, 3)).toUpperCase();
    if (s.includes('ABERTA')) osAberta++;
    else if (s.includes('FECHADA') || s.includes('CONCLU')) osFechada++;
    else if (s.includes('ANDAMENTO')) osAndamento++;
  });

  return {
    frota: { total: frotaRows.length, operando, baixadas, reserva },
    totalAlertas,
    tarefasPendentes,
    gastoTotal,
    manutencoesRealizadas,
    viaturaTopGasto,
    viaturasMaisVelha,
    tiposViatura,
    os: { total: osRows.length, aberta: osAberta, fechada: osFechada, andamento: osAndamento },
  };
}

export async function getGastosPorViatura() {
  // Tentar primeiro 'RIV 2026/2027', depois 'RIV 2026', depois '1SGB'+'2SGB' como fallback
  let mRows = [];

  const [riv1, riv2] = await Promise.allSettled([
    fetchSheetData('RIV 2026/2027'),
    fetchSheetData('RIV 2026'),
  ]);

  const rivData = riv1.status === 'fulfilled' ? riv1.value :
                  riv2.status === 'fulfilled' ? riv2.value : null;

  if (rivData && rivData.table?.rows) {
    mRows = rivData.table.rows.filter(r => getCell(r, 0) && !isSyncRow(getCell(r, 0)));
  }

  // Estrutura da aba RIV: col A (idx 0) = Prefixo/VTR, col B = Placa, col C = Tipo Serviço,
  // col D = Data, col E = KM, col F = Descrição, col G (idx 6) = Valor

  const gastosPorViatura = {};
  const listaGastos = [];

  mRows.forEach(r => {
    const prefixo = getCell(r, 0);
    const placa = getCell(r, 1);
    const tipoServico = getCell(r, 2) || getCell(r, 3) || '';
    const data = getCell(r, 3) || getCell(r, 4) || '';
    const km = getCell(r, 4) || getCell(r, 5) || '';
    const descricao = getCell(r, 5) || getCell(r, 6) || '';
    const custoRaw = getCell(r, 6);
    const custo = typeof custoRaw === 'number'
      ? custoRaw
      : parseFloat(String(custoRaw).replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')) || 0;

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
