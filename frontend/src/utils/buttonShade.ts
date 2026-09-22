/**
 * BUTTON SHADE / INTENSITY CONTROLLER
 * ────────────────────────────────────────────────────────────────────────────
 * Allows user to dynamically customize the tone/intensity of neutral buttons
 * across the application via CSS custom properties and LocalStorage.
 */

export interface ShadeConfig {
  level: number;
  label: string;
  desc: string;
  lightBg: string;
  lightHover: string;
  darkBg: string;
  darkHover: string;
}

export const SHADE_LEVELS: Record<number, ShadeConfig> = {
  1: {
    level: 1,
    label: 'Rất nhạt',
    desc: 'Tông sáng nhẹ nhàng (Ultra Soft)',
    lightBg: '#f8fafc', // slate-50
    lightHover: '#f1f5f9', // slate-100
    darkBg: '#121626',
    darkHover: '#181e30',
  },
  2: {
    level: 2,
    label: 'Nhạt (Chuẩn)',
    desc: 'Tông cân bằng thanh lịch (Soft Slate)',
    lightBg: '#f1f5f9', // slate-100
    lightHover: '#e2e8f0', // slate-200
    darkBg: '#181d2e',
    darkHover: '#222b44',
  },
  3: {
    level: 3,
    label: 'Vừa',
    desc: 'Độ tương phản vừa phải (Medium)',
    lightBg: '#e9edf4',
    lightHover: '#dbe2ec',
    darkBg: '#1c2236',
    darkHover: '#262f48',
  },
  4: {
    level: 4,
    label: 'Đậm',
    desc: 'Độ nổi bật rõ rệt (Contrast)',
    lightBg: '#e2e8f0', // slate-200
    lightHover: '#cbd5e1', // slate-300
    darkBg: '#20263c',
    darkHover: '#2c3552',
  },
  5: {
    level: 5,
    label: 'Rất đậm',
    desc: 'Đậm màu sắc nét (Deep Slate)',
    lightBg: '#cbd5e1', // slate-300
    lightHover: '#94a3b8', // slate-400
    darkBg: '#28304a',
    darkHover: '#364164',
  },
};

const STORAGE_KEY = 'app_button_shade_level';

export function getStoredButtonShade(): number {
  if (typeof window === 'undefined') return 2;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = parseInt(raw || '2', 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) {
      return parsed;
    }
  } catch {}
  return 2; // Default to Level 2 (Soft)
}

export function applyButtonShade(level: number): void {
  if (typeof document === 'undefined') return;
  const cfg = SHADE_LEVELS[level] || SHADE_LEVELS[2];
  const root = document.documentElement;

  root.style.setProperty('--btn-neutral-bg', cfg.lightBg);
  root.style.setProperty('--btn-neutral-hover', cfg.lightHover);
  root.style.setProperty('--btn-neutral-dark-bg', cfg.darkBg);
  root.style.setProperty('--btn-neutral-dark-hover', cfg.darkHover);
}

export function setStoredButtonShade(level: number): void {
  const safeLevel = Math.max(1, Math.min(5, Math.round(level)));
  try {
    localStorage.setItem(STORAGE_KEY, String(safeLevel));
  } catch {}
  applyButtonShade(safeLevel);
}

// Auto-apply on script load in browser
if (typeof window !== 'undefined') {
  applyButtonShade(getStoredButtonShade());
}
