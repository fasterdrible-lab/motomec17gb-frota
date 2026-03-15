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

function getCell(row, idx) {
  return row.c && row.c[idx] && row.c[idx].v != null ? row.c[idx].v : '';
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
