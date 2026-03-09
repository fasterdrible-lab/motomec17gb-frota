/**
 * Format a number as Brazilian currency: R$ 1.234,56
 */
export function formatCurrency(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
}

/**
 * Format an ISO date string or Date object as DD/MM/YYYY
 */
export function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString('pt-BR');
}

/**
 * Format an ISO datetime string as DD/MM/YYYY HH:mm
 */
export function formatDatetime(datetime) {
  if (!datetime) return '—';
  const d = new Date(datetime);
  if (isNaN(d.getTime())) return datetime;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a km number as "1.234 km"
 */
export function formatKm(km) {
  if (km === null || km === undefined) return '—';
  return new Intl.NumberFormat('pt-BR').format(Number(km)) + ' km';
}

/**
 * Returns a CSS class name corresponding to a viatura status
 */
export function getStatusColor(status) {
  const map = {
    operacional: 'badge-success',
    manutencao:  'badge-warning',
    inativo:     'badge-secondary',
    reserva:     'badge-info',
    critico:     'badge-danger',
  };
  return map[status?.toLowerCase()] || 'badge-secondary';
}

/**
 * Returns a CSS class name for alert priority
 */
export function getAlertaColor(tipo) {
  const map = {
    critico: 'badge-danger',
    urgente: 'badge-warning',
    aviso:   'badge-info',
    info:    'badge-secondary',
  };
  return map[tipo?.toLowerCase()] || 'badge-secondary';
}

/**
 * Truncate a string to maxLength characters
 */
export function truncate(str, maxLength = 50) {
  if (!str) return '';
  return str.length > maxLength ? str.slice(0, maxLength) + '…' : str;
}

/**
 * Get current year as number
 */
export function currentYear() {
  return new Date().getFullYear();
}

/**
 * Get current month (1-12) as number
 */
export function currentMonth() {
  return new Date().getMonth() + 1;
}
