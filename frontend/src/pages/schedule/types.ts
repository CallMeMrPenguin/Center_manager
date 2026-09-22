export interface ClassSession {
  id: number;
  class_id: number;
  class_name?: string;
  date: string;
  start_time: string;
  duration: number;
  status: string;
  teacher_id?: number;
  teacher_name?: string;
  notes?: string;
  color?: string;
  room?: string;
}

export interface DayCfg {
  checked: boolean;
  time: string;
  duration: number;
}

export const PALETTE_20 = [
  '#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899',
  '#06b6d4', '#f97316', '#84cc16', '#6366f1', '#fb7185',
  '#3b82f6', '#8b5cf6', '#14b8a6', '#eab308', '#22c55e',
  '#60a5fa', '#a855f7', '#f472b6', '#38bdf8', '#e879f9'
];

export function hexToHSL(hex: string) {
  if (!hex || typeof hex !== 'string') hex = '#2563eb';
  hex = hex.replace(/^#/, '');
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function getPremiumStyle(status: string, hexColor = '#2563eb', isDarkParam?: boolean) {
  if (status === 'Hủy') {
    return {
      bg: 'rgba(148,163,184,0.08)',
      border: 'rgba(148,163,184,0.25)',
      innerBorder: 'rgba(148,163,184,0.15)',
      color: '#94a3b8',
      shadow: '0 1px 3px rgba(0,0,0,0.3)',
    };
  }
  const isDark = isDarkParam !== undefined ? isDarkParam : (typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true);
  const { h, s: iS, l: iL } = hexToHSL(hexColor);
  const isDone = status === 'Đã học';
  const sat = isDone ? Math.max(25, Math.round(iS * 0.55)) : Math.min(85, Math.max(60, iS));
  const lightness = isDone ? 50 : Math.min(75, Math.max(50, iL));
  const alphaBg = isDark ? (isDone ? '0.12' : '0.18') : (isDone ? '0.14' : '0.20');
  const bg = `hsla(${h},${sat}%,${lightness}%,${alphaBg})`;
  const border = isDark ? `hsla(${h},${sat}%,${lightness}%,0.65)` : `hsla(${h},${sat}%,45%,0.55)`;
  const color = isDark ? `hsla(${h},95%,92%,0.98)` : `hsla(${h},95%,28%,0.98)`;
  // Clean enterprise card shadow (zero radioactive glow)
  const shadow = isDark ? '0 2px 6px rgba(0,0,0,0.35)' : '0 1px 3px rgba(0,0,0,0.08)';
  return { bg, border, innerBorder: isDark ? `hsla(${h},${sat}%,${lightness}%,0.35)` : `hsla(${h},${sat}%,45%,0.3)`, color, shadow };
}

export function getSessionColor(sess: ClassSession): string {
  if (sess.color && sess.color.startsWith('#')) return sess.color;
  const match = (sess.notes || '').match(/#COLOR:(#[0-9a-fA-F]{6})/);
  if (match) return match[1];
  const cid = sess.class_id || 1;
  return PALETTE_20[(cid * 3 + 1) % PALETTE_20.length];
}

export function parseTimeToMinutes(t: string): number {
  if (!t) return 0;
  const str = t.trim().toLowerCase();
  const isPM = str.includes('pm') || str.includes('ch');
  const isAM = str.includes('am') || str.includes('sa');
  const clean = str.replace(/[^0-9:]/g, '');
  const parts = clean.split(':').map(Number);
  let h = parts[0] || 0;
  const m = parts[1] || 0;
  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;
  return h * 60 + m;
}

export function formatMinutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function calcEndTime(start: string, mins: number): string {
  const startMin = parseTimeToMinutes(start);
  return formatMinutesToTime(startMin + mins);
}

export function timeToMin(t: string): number {
  return parseTimeToMinutes(t);
}

export const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
export const DAY_HDRS = ['THỨ 2', 'THỨ 3', 'THỨ 4', 'THỨ 5', 'THỨ 6', 'THỨ 7', 'CHỦ NHẬT'];
export const DAY_NUM: Record<string, number> = {
  'Thứ 2': 1,
  'Thứ 3': 2,
  'Thứ 4': 3,
  'Thứ 5': 4,
  'Thứ 6': 5,
  'Thứ 7': 6,
  'Chủ nhật': 0,
};
