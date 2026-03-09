/**
 * Format a date string or Date object to Brazilian locale (DD/MM/YYYY).
 */
export function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format a number as Brazilian currency (R$).
 */
export function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

/**
 * Format a number as kilometers (e.g. 12.345 km).
 */
export function formatKm(km) {
  if (km === null || km === undefined || km === '') return '—';
  const num = Number(km);
  if (isNaN(num)) return '—';
  return `${new Intl.NumberFormat('pt-BR').format(num)} km`;
}

/**
 * Return a CSS class or hex color based on vehicle/driver status.
 */
export function getStatusColor(status) {
  const map = {
    ativo:       'success',
    active:      'success',
    disponivel:  'success',
    available:   'success',
    inativo:     'default',
    inactive:    'default',
    manutencao:  'warning',
    maintenance: 'warning',
    critico:     'danger',
    critical:    'danger',
    pendente:    'warning',
    pending:     'warning',
    concluido:   'success',
    completed:   'success',
    cancelado:   'default',
    cancelled:   'default',
  };
  return map[(status || '').toLowerCase()] || 'default';
}

/**
 * Truncate text to the given length, adding an ellipsis if needed.
 */
export function truncateText(text, length = 50) {
  if (!text) return '';
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

/**
 * Return a human-readable label for a status value.
 */
export function getStatusLabel(status) {
  const labels = {
    ativo:       'Ativo',
    inativo:     'Inativo',
    disponivel:  'Disponível',
    manutencao:  'Em Manutenção',
    critico:     'Crítico',
    pendente:    'Pendente',
    concluido:   'Concluído',
    cancelado:   'Cancelado',
    active:      'Ativo',
    inactive:    'Inativo',
    available:   'Disponível',
    maintenance: 'Em Manutenção',
    critical:    'Crítico',
    pending:     'Pendente',
    completed:   'Concluído',
    cancelled:   'Cancelado',
  };
  return labels[(status || '').toLowerCase()] || status || '—';
}

/**
 * Debounce a function call.
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
