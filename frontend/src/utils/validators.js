/**
 * Check that a value is not empty
 */
export function isRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

/**
 * Validate an e-mail address
 */
export function validateEmail(email) {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * Validate a Brazilian vehicle plate (old: ABC-1234 or new Mercosul: ABC1D23)
 */
export function validatePlaca(placa) {
  if (!placa) return false;
  const old_ = /^[A-Z]{3}-?\d{4}$/i;
  const mercosul = /^[A-Z]{3}\d[A-Z]\d{2}$/i;
  return old_.test(placa.trim()) || mercosul.test(placa.trim());
}

/**
 * Validate a positive number
 */
export function validatePositiveNumber(value) {
  const n = Number(value);
  return !isNaN(n) && n > 0;
}

/**
 * Validate a Brazilian CPF (basic format check)
 */
export function validateCPF(cpf) {
  if (!cpf) return false;
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.length === 11;
}

/**
 * Returns an error message string or null
 */
export function getFieldError(name, value) {
  switch (name) {
    case 'email':
      return validateEmail(value) ? null : 'E-mail inválido';
    case 'placa':
      return validatePlaca(value) ? null : 'Placa inválida (ex: ABC-1234 ou ABC1D23)';
    default:
      return isRequired(value) ? null : 'Campo obrigatório';
  }
}
