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

/**
 * Universal Date/Time Formatter: HH:mm:ss DD/MM/YY or DD/MM/YY
 * Example: '2026-08-16 10:30:00' -> '10:30:00 16/08/26'
 * Example: '2026-08-16' -> '16/08/26'
 */
export function formatDateTime(val: string | Date | null | undefined): string {
  if (!val) return '';
  try {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.includes('-')) {
        const parts = trimmed.split(/[\sT]+/);
        const dateParts = parts[0].split('-');
        if (dateParts.length >= 3) {
          const dd = dateParts[2].padStart(2, '0');
          const mm = dateParts[1].padStart(2, '0');
          const yy = dateParts[0].slice(-2);
          const dateFormatted = `${dd}/${mm}/${yy}`;
          if (parts[1]) {
            const timeParts = parts[1].split(':');
            const hh = (timeParts[0] || '00').padStart(2, '0');
            const min = (timeParts[1] || '00').padStart(2, '0');
            const ss = (timeParts[2] || '00').split('.')[0].padStart(2, '0');
            return `${hh}:${min}:${ss} ${dateFormatted}`;
          }
          return dateFormatted;
        }
      }
    }
    const d = typeof val === 'string' ? new Date(val) : val;
    if (isNaN(d.getTime())) return String(val);
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${hh}:${min}:${ss} ${dd}/${mm}/${yy}`;
  } catch {
    return String(val);
  }
}


