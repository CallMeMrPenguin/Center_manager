export function getLocalDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function notifyDataChanged() {
  window.dispatchEvent(new CustomEvent('data-changed'));
}

/**
 * Truncate numbers to 1 figure after '.' without rounding up or down
 * Example: 6.21 -> '6.2', 6.28 -> '6.2', 8.86 -> '8.8'
 */
export function format1Dec(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '';
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(num)) return String(val);
  const truncated = Math.floor(num * 10 + 0.0000001) / 10;
  return truncated.toFixed(1);
}

export function trunc1Dec(val: number): number {
  if (isNaN(val)) return 0;
  return Math.floor(val * 10 + 0.0000001) / 10;
}

/**
 * Automatically removes leading option labels like "A. ", "B. ", "a) ", "C: ", "D - ", "1. " from option strings
 * so options won't display redundant prefixes when rendered alongside option letter badges.
 */
export function cleanOptionPrefix(opt: string): string {
  if (typeof opt !== 'string') return String(opt || '');
  const trimmed = opt.trim();
  const cleaned = trimmed.replace(/^[A-Da-d0-9][.\):\-]\s*/, '').trim();
  return cleaned || trimmed;
}

