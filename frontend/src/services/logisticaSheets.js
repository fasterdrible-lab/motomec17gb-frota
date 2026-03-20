// ═══════════════════════════════════════════════════════════════════
// logisticaSheets.js — Integração com as planilhas de Logística
// 17º Grupamento de Bombeiros · Seção de Logística
// ═══════════════════════════════════════════════════════════════════

const SHEETS = {
  matOperacionais: {
    id: '1QAccPlASgG0sosEjkudXOice0VCG3YWXFloEMA8TOTI',
    abas: [
      'EPR',
      'COMPRESSOR',
      'EMBARCAÇÕES',
      'CILÍNDROS',
      'MS - MA - MP - SS',
      'DESENCARCERADORES',
      'EQUIPAMENTOS DIVERSOS',
    ],
  },
  planilha2: {
    id: '12-j2AL6r-Sf8PBXto5c54CgV_cip85qvziHqOXUVBeM',
    gid: '2136806454',
    nome: 'Planilha 2',
  },
  planilha3: {
    id: '1kLhkCtGEWn7fkiKzPZ6Aa-NhEDqYkA4tp4wgA42-t2I',
    gid: '1992950492',
    nome: 'Planilha 3',
  },
};

// ─── FETCH GENÉRICO ──────────────────────────────────────────────────────────
async function fetchGviz(sheetId, { sheetName, gid } = {}) {
  const base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
  const url = gid
    ? `${base}&gid=${gid}`
    : `${base}&sheet=${encodeURIComponent(sheetName)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/);
  if (!match) throw new Error('Resposta inválida do Google Sheets');
  return JSON.parse(match[1]);
}

function getCell(row, idx) {
  return row.c && row.c[idx] && row.c[idx].v != null ? row.c[idx].v : '';
}

function strCell(row, idx) {
  return String(getCell(row, idx)).trim();
}

// ─── PARSER DE LINHA → OBJETO ────────────────────────────────────────────────
function parseLinhas(gvizData, colunas) {
  const rows = gvizData?.table?.rows || [];
  return rows
    .filter(r => r.c && r.c.some(c => c && c.v != null))
    .map(r => {
      const obj = {};
      colunas.forEach((col, i) => {
        obj[col] = strCell(r, i);
      });
      return obj;
    })
    .filter(obj => {
      // Ignorar linhas de cabeçalho repetido ou linhas vazias
      const vals = Object.values(obj);
      const temConteudo = vals.some(v => v && v.length > 0);
      const ehCabecalho = vals.some(v =>
        ['PATRIMÔNIO', 'STATUS', 'TIPO', 'Nº SÉRIE', 'SÉRIE'].includes(v)
      );
      return temConteudo && !ehCabecalho;
    });
}

// ─── CONTAGEM POR STATUS ─────────────────────────────────────────────────────
export function contarStatus(rows, campoStatus = 'STATUS') {
  let op = 0, bx = 0;
  rows.forEach(r => {
    const v = String(r[campoStatus] || '').toUpperCase();
    if (v.includes('OPERANDO') || v.includes('ATIVO') || v.includes('OK')) op++;
    else if (v.includes('BAIXADO') || v.includes('INATIVO')) bx++;
  });
  return { op, bx, total: op + bx };
}

// ─── ABA EPR ─────────────────────────────────────────────────────────────────
async function getEPR() {
  const data = await fetchGviz(SHEETS.matOperacionais.id, { sheetName: 'EPR' });
  const rows = parseLinhas(data, ['PATRIMÔNIO', 'TIPO', 'MARCA', 'MODELO', 'STATUS', 'SGB', 'LOCALIZAÇÃO', 'MÁSCARA', 'OBSERVAÇÕES']);
  const validos = rows.filter(r => ['OPERANDO', 'BAIXADO'].includes(r.STATUS));
  return { aba: 'EPR', icone: '🛡️', rows: validos, ...contarStatus(validos) };
}

// ─── ABA COMPRESSOR ───────────────────────────────────────────────────────────
async function getCompressor() {
  const data = await fetchGviz(SHEETS.matOperacionais.id, { sheetName: 'COMPRESSOR' });
  const rows = parseLinhas(data, ['PATRIMÔNIO', 'TIPO', 'MARCA', 'MODELO', 'STATUS', 'SGB', 'LOCALIZAÇÃO', 'OBSERVAÇÕES']);
  const validos = rows.filter(r => ['OPERANDO', 'BAIXADO'].includes(r.STATUS));
  return { aba: 'COMPRESSOR', icone: '⚙️', rows: validos, ...contarStatus(validos) };
}

// ─── ABA EMBARCAÇÕES ─────────────────────────────────────────────────────────
async function getEmbarcacoes() {
  const data = await fetchGviz(SHEETS.matOperacionais.id, { sheetName: 'EMBARCAÇÕES' });
  const rows = parseLinhas(data, ['PATRIMÔNIO', 'TIPO', 'MARCA', 'MODELO', 'STATUS', 'SGB', 'LOCALIZAÇÃO', 'OBSERVAÇÕES']);
  const validos = rows.filter(r => ['OPERANDO', 'BAIXADO'].includes(r.STATUS));
  return { aba: 'EMBARCAÇÕES', icone: '🚤', rows: validos, ...contarStatus(validos) };
}

// ─── ABA CILÍNDROS ───────────────────────────────────────────────────────────
async function getCilindros() {
  const data = await fetchGviz(SHEETS.matOperacionais.id, { sheetName: 'CILÍNDROS' });
  const rows = parseLinhas(data, ['Nº SÉRIE', 'TIPO', 'SUBTIPO', 'STATUS', 'LOCALIZAÇÃO', 'VENCIMENTO TH', 'OBSERVAÇÕES']);
  const validos = rows.filter(r => ['OPERANDO', 'BAIXADO'].includes(r.STATUS));
  const fim2026 = new Date('2026-12-31');
  validos.forEach(r => {
    const d = new Date(r['VENCIMENTO TH']);
    r._thVencendo = !isNaN(d) && d <= fim2026;
  });
  const thVencendo = validos.filter(r => r._thVencendo).length;
  return { aba: 'CILÍNDROS', icone: '🫁', rows: validos, thVencendo, ...contarStatus(validos) };
}

// ─── ABA MS/MA/MP/SS ─────────────────────────────────────────────────────────
async function getMSSerra() {
  const data = await fetchGviz(SHEETS.matOperacionais.id, { sheetName: 'MS - MA - MP - SS' });
  const rows = parseLinhas(data, ['PATRIMÔNIO', 'TIPO', 'MARCA', 'MODELO', 'STATUS', 'SGB', 'LOCALIZAÇÃO', 'OBSERVAÇÕES']);
  const validos = rows.filter(r => ['OPERANDO', 'BAIXADO'].includes(r.STATUS));
  return { aba: 'MS/MA/MP/SS', icone: '🪚', rows: validos, ...contarStatus(validos) };
}

// ─── ABA DESENCARCERADORES ───────────────────────────────────────────────────
async function getDesencarceradores() {
  const data = await fetchGviz(SHEETS.matOperacionais.id, { sheetName: 'DESENCARCERADORES' });
  const rows = parseLinhas(data, ['PATRIMÔNIO', 'TIPO', 'MARCA', 'MODELO', 'STATUS', 'SGB', 'LOCALIZAÇÃO', 'OBSERVAÇÕES']);
  const validos = rows.filter(r => ['OPERANDO', 'BAIXADO'].includes(r.STATUS));
  return { aba: 'DESENCARCERADORES', icone: '🔧', rows: validos, ...contarStatus(validos) };
}

// ─── ABA EQUIPAMENTOS DIVERSOS ───────────────────────────────────────────────
async function getEquipDiversos() {
  const data = await fetchGviz(SHEETS.matOperacionais.id, { sheetName: 'EQUIPAMENTOS DIVERSOS' });
  const rows = parseLinhas(data, ['PATRIMÔNIO', 'TIPO', 'MARCA', 'MODELO', 'STATUS', 'SGB', 'LOCALIZAÇÃO', 'OBSERVAÇÕES']);
  const validos = rows.filter(r => ['OPERANDO', 'BAIXADO'].includes(r.STATUS));
  return { aba: 'EQUIP. DIVERSOS', icone: '📦', rows: validos, ...contarStatus(validos) };
}

// ─── PLANILHA 2 ──────────────────────────────────────────────────────────────
export async function getPlanilha2() {
  try {
    const data = await fetchGviz(SHEETS.planilha2.id, { gid: SHEETS.planilha2.gid });
    const headers = data?.table?.cols?.map(c => c.label || c.id || '') || [];
    const rows = (data?.table?.rows || []).map(r => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = strCell(r, i); });
      return obj;
    }).filter(obj => Object.values(obj).some(v => v));
    const statusKey = headers.find(h => h.toUpperCase().includes('STATUS') || h.toUpperCase().includes('SITUAÇÃO'));
    const counts = statusKey ? contarStatus(rows, statusKey) : { op: rows.length, bx: 0, total: rows.length };
    return { nome: SHEETS.planilha2.nome, headers, rows, ...counts };
  } catch (e) {
    return { nome: SHEETS.planilha2.nome, headers: [], rows: [], op: 0, bx: 0, total: 0, erro: e.message };
  }
}

// ─── PLANILHA 3 ──────────────────────────────────────────────────────────────
export async function getPlanilha3() {
  try {
    const data = await fetchGviz(SHEETS.planilha3.id, { gid: SHEETS.planilha3.gid });
    const headers = data?.table?.cols?.map(c => c.label || c.id || '') || [];
    const rows = (data?.table?.rows || []).map(r => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = strCell(r, i); });
      return obj;
    }).filter(obj => Object.values(obj).some(v => v));
    const statusKey = headers.find(h => h.toUpperCase().includes('STATUS') || h.toUpperCase().includes('SITUAÇÃO'));
    const counts = statusKey ? contarStatus(rows, statusKey) : { op: rows.length, bx: 0, total: rows.length };
    return { nome: SHEETS.planilha3.nome, headers, rows, ...counts };
  } catch (e) {
    return { nome: SHEETS.planilha3.nome, headers: [], rows: [], op: 0, bx: 0, total: 0, erro: e.message };
  }
}

// ─── EXPORTAÇÃO PRINCIPAL ────────────────────────────────────────────────────
export async function getMateriaisOperacionais() {
  const [epr, compressor, embarcacoes, cilindros, msSerra, desenc, diversos] =
    await Promise.allSettled([
      getEPR(), getCompressor(), getEmbarcacoes(), getCilindros(),
      getMSSerra(), getDesencarceradores(), getEquipDiversos(),
    ]);

  const abas = [epr, compressor, embarcacoes, cilindros, msSerra, desenc, diversos]
    .map(r => r.status === 'fulfilled' ? r.value : null)
    .filter(Boolean);

  const totais = abas.reduce(
    (acc, a) => ({ total: acc.total + a.total, op: acc.op + a.op, bx: acc.bx + a.bx }),
    { total: 0, op: 0, bx: 0 }
  );
  const thVencendo = abas.find(a => a.aba === 'CILÍNDROS')?.thVencendo || 0;

  return { abas, totais, thVencendo };
}
