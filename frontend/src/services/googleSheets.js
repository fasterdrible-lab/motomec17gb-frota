const SHEET_ID = '1q6wy9iO4aRDKMBPzxR9cISE7pCmUuIaYSRBdhUNlM4Q';
const MS_PER_DAY = 86400000;

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
        if (dias >= 15) alertas.push({ tipo: '🚨 LAVAGEM', nivel: 'critico', prefixo });
        else if (dias >= 12) alertas.push({ tipo: '⚠️ LAVAGEM', nivel: 'aviso', prefixo });
      }
    }

    // Pneu (col N, idx 13)
    const kmPneu = parseFloat(getCell(r, 13)) || 0;
    if (kmPneu > 0) {
      if (kmAtual >= kmPneu) alertas.push({ tipo: '🚨 PNEU', nivel: 'critico', prefixo });
      else if (kmPneu - kmAtual <= 5000) alertas.push({ tipo: '⚠️ PNEU', nivel: 'aviso', prefixo });
    }

    // Embreagem (col O, idx 14)
    const kmEmb = parseFloat(getCell(r, 14)) || 0;
    if (kmEmb > 0) {
      if (kmAtual >= kmEmb) alertas.push({ tipo: '🚨 EMBREAGEM', nivel: 'critico', prefixo });
      else if (kmEmb - kmAtual <= 5000) alertas.push({ tipo: '⚠️ EMBREAGEM', nivel: 'aviso', prefixo });
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
