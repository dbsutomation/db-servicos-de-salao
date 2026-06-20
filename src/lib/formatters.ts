export function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word)
    .join(' ');
}

/**
 * Keep only digits.
 */
export function onlyDigits(str: string): string {
  return (str || '').replace(/\D/g, '');
}

/**
 * Normalize a Brazilian phone to digits only, capped at 11 digits (DD + 9).
 */
export function normalizePhone(str: string): string {
  return onlyDigits(str).slice(0, 11);
}

/**
 * Format a Brazilian phone as the user types: (DD) NNNNN-NNNN or (DD) NNNN-NNNN.
 * Accepts any input (masked or unmasked) and returns the masked display value.
 */
export function formatPhoneMask(value: string): string {
  const digits = normalizePhone(value);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Format a numeric/string input as Brazilian currency mask "R$ 0,00" while typing.
 * Returns the masked display string. Use parseCurrency to read the numeric value.
 */
export function formatCurrencyMask(value: string | number): string {
  const digits = onlyDigits(String(value ?? ''));
  if (!digits) return '';
  const intVal = parseInt(digits, 10);
  const reais = intVal / 100;
  return reais.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Parse a masked currency string back to a Number (e.g. "R$ 1.234,56" -> 1234.56).
 */
export function parseCurrency(value: string | number): number {
  if (typeof value === 'number') return isFinite(value) ? value : 0;
  const digits = onlyDigits(value);
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

/**
 * Clamp a commission value to the 0-100 integer range.
 */
export function clampCommission(value: string | number): string {
  const n = typeof value === 'number' ? value : parseInt(onlyDigits(String(value)) || '0', 10);
  if (isNaN(n)) return '0';
  return String(Math.max(0, Math.min(100, n)));
}
