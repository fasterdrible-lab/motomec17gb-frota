function getCell(row, idx) {
  if (!row.c || !row.c[idx]) return '';
  const cell = row.c[idx];
  if (cell.v == null) return '';
  return cell.v;
}

function getCellFormatted(row, idx) {
  if (!row.c || !row.c[idx]) return '';
  const cell = row.c[idx];
  if (cell.f != null) return cell.f;
  if (cell.v == null) return '';
  return cell.v;
}

function formatDateFromRaw(rawData) {
  if (rawData === null || rawData === undefined || rawData === '') return '-';
  const str = String(rawData);
  if (str === '') return '-';
  const matchDate = str.match(/Date\((\d+),(\d+),(\d+)/);
  if (matchDate) {
    const ano = matchDate[1];
    const mes = String(parseInt(matchDate[2]) + 1).padStart(2, '0');
    const dia = String(matchDate[3]).padStart(2, '0');
    return dia + '/' + mes + '/' + ano;
  }
  if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
    const parts = str.split('T')[0].split('-');
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }
  if (str.match(/^\d{2}\/\d{2}\/\d{4}/)) return str.substring(0, 10);
  return str;
}

function formatCellDate(row, idx) {
  if (!row.c || !row.c[idx]) return '-';
  const cell = row.c[idx];
  if (cell.f) return cell.f;
  if (cell.v == null) return '-';
  return formatDateFromRaw(cell.v);
}

      ultimoAbastData = formatCellDate(ultimo, 7);
    data: formatCellDate(r, 7);