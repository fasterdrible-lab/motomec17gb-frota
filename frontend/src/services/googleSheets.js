const SHEET_ID = '1q6wy9iO4aRDKMBPzxR9cISE7pCmUuIaYSRBdhUNlM4Q';
const TAREFAS_GID = '1988288811';
const MS_PER_DAY = 86400000;
const KM_THRESHOLD_PENDING = 3000;
const KM_THRESHOLD_WARNING = 5000;
const WASHING_CRITICAL_DAYS = 15;
const WASHING_WARNING_DAYS = 12;

async function fetchSheetData(sheetName, gid = null) {
  const base = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
  const url = gid
    ? `${base}&gid=${gid}`
    : `${base}&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar aba ${sheetName}`);