// ═══════════════════════════════════════════════════════════════════
// logisticaSheets.js — Integração com as planilhas de Logística
// 17º Grupamento de Bombeiros · Seção de Logística
// ═══════════════════════════════════════════════════════════════════

import { publicConfig, requirePublicConfig } from '../config/publicConfig';

const SHEET_ID = requirePublicConfig(publicConfig.logisticaSheetId, 'REACT_APP_LOGISTICA_SHEET_ID');

// GIDs de cada aba
const GIDS = {
  EPR:                   requirePublicConfig(publicConfig.logisticaGids.EPR, 'REACT_APP_LOGISTICA_GID_EPR'),
  COMPRESSOR:            requirePublicConfig(publicConfig.logisticaGids.COMPRESSOR, 'REACT_APP_LOGISTICA_GID_COMPRESSOR'),
  EMBARCACOES:           requirePublicConfig(publicConfig.logisticaGids.EMBARCACOES, 'REACT_APP_LOGISTICA_GID_EMBARCACOES'),
  CILINDROS:             requirePublicConfig(publicConfig.logisticaGids.CILINDROS, 'REACT_APP_LOGISTICA_GID_CILINDROS'),
  MS_MA_MP_SS:           requirePublicConfig(publicConfig.logisticaGids.MS_MA_MP_SS, 'REACT_APP_LOGISTICA_GID_MS_MA_MP_SS'),
  DESENCARCERADORES:     requirePublicConfig(publicConfig.logisticaGids.DESENCARCERADORES, 'REACT_APP_LOGISTICA_GID_DESENCARCERADORES'),
  EQUIP_DIVERSOS:        requirePublicConfig(publicConfig.logisticaGids.EQUIP_DIVERSOS, 'REACT_APP_LOGISTICA_GID_EQUIP_DIVERSOS'),
  PAS_DE_DEA:            requirePublicConfig(publicConfig.logisticaGids.PAS_DE_DEA, 'REACT_APP_LOGISTICA_GID_PAS_DE_DEA'),
  REPAROS:               requirePublicConfig(publicConfig.logisticaGids.REPAROS, 'REACT_APP_LOGISTICA_GID_REPAROS'),
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
      const vals = Object.values(obj);
      const temConteudo = vals.some(v => v && v.length > 0);
      const ehCabecalho = vals.some(v =>
        ['PATRIMÔNIO', 'STATUS', 'TIPO', 'Nº SÉRIE', 'SÉRIE'].includes(v)
      );
      return temConteudo && !ehCabecalho;
    });
}

// ─── PARSER GENÉRICO (cabeçalho automático) ──────────────────────────────────
function parseGenerico(gvizData) {
  const headers = gvizData?.table?.cols?.map(c => c.label || c.id || '') || [];
  const colsVis = headers.filter(h => h && !h.startsWith('Unnamed'));
  const rows = (gvizData?.table?.rows || [])
    .filter(r => r.c && r.c.some(c => c && c.v != null))
    .map(r => {
      const obj = {};
      colsVis.forEach((h, i) => { obj[h] = strCell(r, i); });
      return obj;
    })
    .filter(obj => Object.values(obj).some(v => v));
  return { headers: colsVis, rows };
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
  const data = await fetchGviz(SHEET_ID, { gid: GIDS.EPR });
  const rows = parseLinhas(data, ['PATRIMÔNIO', 'TIPO', 'MARCA', 'MODELO', 'STATUS', 'SGB', 'LOCALIZAÇÃO', 'MÁSCARA', 'OBSERVAÇÕES']);
  const validos = rows.filter(r => ['OPERANDO', 'BAIXADO'].includes(r.STATUS));
  return { aba: 'EPR', icone: '🛡️', rows: validos, ...contarStatus(validos) };
}

// ─── ABA COMPRESSOR ───────────────────────────────────────────────────────────
async function getCompressor() {
  const data = await fetchGviz(SHEET_ID, { gid: GIDS.COMPRESSOR });
  const rows = parseLinhas(data, ['PATRIMÔNIO', 'TIPO', 'MARCA', 'MODELO', 'STATUS', 'SGB', 'LOCALIZAÇÃO', 'OBSERVAÇÕES']);
  const validos = rows.filter(r => ['OPERANDO', 'BAIXADO'].includes(r.STATUS));
  return { aba: 'COMPRESSOR', icone: '⚙️', rows: validos, ...contarStatus(validos) };
}

// ─── ABA EMBARCAÇÕES ─────────────────────────────────────────────────────────
async function getEmbarcacoes() {
  const data = await fetchGviz(SHEET_ID, { gid: GIDS.EMBARCACOES });
  const rows = parseLinhas(data, ['PATRIMÔNIO', 'TIPO', 'MARCA', 'MODELO', 'STATUS', 'SGB', 'LOCALIZAÇÃO', 'OBSERVAÇÕES']);
  const validos = rows.filter(r => ['OPERANDO', 'BAIXADO'].includes(r.STATUS));
  return { aba: 'EMBARCAÇÕES', icone: '🚤', rows: validos, ...contarStatus(validos) };
}

// ─── ABA CILÍNDROS ───────────────────────────────────────────────────────────
async function getCilindros() {
  const data = await fetchGviz(SHEET_ID, { gid: GIDS.CILINDROS });
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
  const data = await fetchGviz(SHEET_ID, { gid: GIDS.MS_MA_MP_SS });
  const rows = parseLinhas(data, ['PATRIMÔNIO', 'TIPO', 'MARCA', 'MODELO', 'STATUS', 'SGB', 'LOCALIZAÇÃO', 'OBSERVAÇÕES']);
  const validos = rows.filter(r => ['OPERANDO', 'BAIXADO'].includes(r.STATUS));
  return { aba: 'MS/MA/MP/SS', icone: '🪚', rows: validos, ...contarStatus(validos) };
}

// ─── ABA DESENCARCERADORES ───────────────────────────────────────────────────
async function getDesencarceradores() {
  const data = await fetchGviz(SHEET_ID, { gid: GIDS.DESENCARCERADORES });
  const rows = parseLinhas(data, ['PATRIMÔNIO', 'TIPO', 'MARCA', 'MODELO', 'STATUS', 'SGB', 'LOCALIZAÇÃO', 'OBSERVAÇÕES']);
  const validos = rows.filter(r => ['OPERANDO', 'BAIXADO'].includes(r.STATUS));
  return { aba: 'DESENCARCERADORES', icone: '🔧', rows: validos, ...contarStatus(validos) };
}

// ─── ABA EQUIPAMENTOS DIVERSOS ───────────────────────────────────────────────
async function getEquipDiversos() {
  const data = await fetchGviz(SHEET_ID, { gid: GIDS.EQUIP_DIVERSOS });
  const rows = parseLinhas(data, ['PATRIMÔNIO', 'TIPO', 'MARCA', 'MODELO', 'STATUS', 'SGB', 'LOCALIZAÇÃO', 'OBSERVAÇÕES']);
  const validos = rows.filter(r => ['OPERANDO', 'BAIXADO'].includes(r.STATUS));
  return { aba: 'EQUIP. DIVERSOS', icone: '📦', rows: validos, ...contarStatus(validos) };
}

// ─── ABA PAS DE DEA ──────────────────────────────────────────────────────────
async function getPasDea() {
  try {
    const data = await fetchGviz(SHEET_ID, { gid: GIDS.PAS_DE_DEA });
    const { headers, rows } = parseGenerico(data);
    const statusKey = headers.find(h => h.toUpperCase().includes('STATUS') || h.toUpperCase().includes('SITUAÇÃO'));
    const validos = statusKey ? rows.filter(r => ['OPERANDO', 'BAIXADO'].includes((r[statusKey] || '').toUpperCase())) : rows;
    const counts = statusKey ? contarStatus(validos, statusKey) : { op: rows.length, bx: 0, total: rows.length };
    return { aba: 'PAS DE DEA', icone: '🫀', headers, rows: validos.length ? validos : rows, ...counts };
  } catch (e) {
    return { aba: 'PAS DE DEA', icone: '🫀', headers: [], rows: [], op: 0, bx: 0, total: 0, erro: e.message };
  }
}

// ─── ABA REPAROS ─────────────────────────────────────────────────────────────
async function getReparos() {
  try {
    const data = await fetchGviz(SHEET_ID, { gid: GIDS.REPAROS });
    const { headers, rows } = parseGenerico(data);
    const statusKey = headers.find(h => h.toUpperCase().includes('STATUS') || h.toUpperCase().includes('SITUAÇÃO'));
    const counts = statusKey ? contarStatus(rows, statusKey) : { op: rows.length, bx: 0, total: rows.length };
    return { aba: 'REPAROS', icone: '🛠️', headers, rows, ...counts };
  } catch (e) {
    return { aba: 'REPAROS', icone: '🛠️', headers: [], rows: [], op: 0, bx: 0, total: 0, erro: e.message };
  }
}

// ─── EXPORTAÇÃO PRINCIPAL ────────────────────────────────────────────────────
export async function getMateriaisOperacionais() {
  const [epr, compressor, embarcacoes, cilindros, msSerra, desenc, diversos, pasDea, reparos] =
    await Promise.allSettled([
      getEPR(), getCompressor(), getEmbarcacoes(), getCilindros(),
      getMSSerra(), getDesencarceradores(), getEquipDiversos(),
      getPasDea(), getReparos(),
    ]);

  const abas = [epr, compressor, embarcacoes, cilindros, msSerra, desenc, diversos, pasDea, reparos]
    .map(r => r.status === 'fulfilled' ? r.value : null)
    .filter(Boolean);

  const totais = abas.reduce(
    (acc, a) => ({ total: acc.total + a.total, op: acc.op + a.op, bx: acc.bx + a.bx }),
    { total: 0, op: 0, bx: 0 }
  );
  const thVencendo = abas.find(a => a.aba === 'CILÍNDROS')?.thVencendo || 0;

  return { abas, totais, thVencendo };
}

// ─── EXPORTAÇÕES LEGADAS (compatibilidade) ───────────────────────────────────
export async function getPlanilha2() {
  return { nome: 'Planilha 2', headers: [], rows: [], op: 0, bx: 0, total: 0, erro: 'Não configurada' };
}

export async function getPlanilha3() {
  return { nome: 'Planilha 3', headers: [], rows: [], op: 0, bx: 0, total: 0, erro: 'Não configurada' };
}
