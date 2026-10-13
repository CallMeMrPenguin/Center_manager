export const ITEM_HEIGHT = 32;
export const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1 - 12
export const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 0 - 59
export const PERIODS = ['AM', 'PM'] as const;

export function parse24to12(val: string) {
  if (!val || !val.includes(':')) {
    return { h12: 6, m: 0, period: 'PM' as const, display: '06:00 PM' };
  }
  const [hStr, mStr] = val.split(':');
  let h24 = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  if (isNaN(h24)) h24 = 18;
  const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { h12, m, period, display: `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}` };
}

export function convert12to24(h12: number, m: number, period: 'AM' | 'PM'): string {
  let h24 = h12;
  if (period === 'PM') {
    h24 = h12 === 12 ? 12 : h12 + 12;
  } else {
    h24 = h12 === 12 ? 0 : h12;
  }
  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function parseUserTypedString(str: string): string | null {
  const clean = str.trim().toLowerCase();
  const isPM = clean.includes('pm') || clean.includes('chiều') || clean.includes('tối');
  const isAM = clean.includes('am') || clean.includes('sáng');

  const match = clean.match(/(\d{1,2})[:\s\.\-](\d{1,2})/);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = Math.min(59, Math.max(0, parseInt(match[2], 10)));
    if (isNaN(h)) return null;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    if (h >= 0 && h <= 23) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  return null;
}
