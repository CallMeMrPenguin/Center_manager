/**
 * Mastery Rate Color Configuration & Tier System
 * ────────────────────────────────────────────────────────────────────────────
 * Manages custom color palettes and percentage thresholds for Mastery Rate
 * (Tỷ Lệ Nắm Vững) across Heatmap, Tooltips, Overview Cards, and Breakdown Tables.
 */

import { useState, useEffect } from 'react';

export interface MasteryTierConfig {
  id: 'level_4' | 'level_3' | 'level_2' | 'level_1';
  label: string;
  minPct: number;
  hex: string;
  badgeClass: string;
  textColor: string;
  barColor: string;
}

export interface MasteryColorSettings {
  paletteId: string;
  tiers: {
    level_4: MasteryTierConfig;
    level_3: MasteryTierConfig;
    level_2: MasteryTierConfig;
    level_1: MasteryTierConfig;
  };
}

export const MASTERY_PALETTES: Record<string, { name: string; colors: Record<string, string> }> = {
  emerald_classic: {
    name: 'Chuẩn Sư Phạm (Emerald / Lam / Vàng / Đỏ)',
    colors: {
      level_4: '#10b981', // Emerald
      level_3: '#3b82f6', // Blue
      level_2: '#f59e0b', // Amber
      level_1: '#f43f5e', // Rose
    },
  },
  neon_vibrant: {
    name: 'Neon Hiện Đại (Xanh Ngọc / Tím / Cam / Hồng)',
    colors: {
      level_4: '#06b6d4', // Cyan
      level_3: '#8b5cf6', // Purple
      level_2: '#f97316', // Orange
      level_1: '#ec4899', // Pink
    },
  },
  space_indigo: {
    name: 'Không Gian Tối (Bạc Hà / Chàm / Hổ Phách / Đỏ Thẫm)',
    colors: {
      level_4: '#34d399', // Mint
      level_3: '#6366f1', // Indigo
      level_2: '#eab308', // Yellow
      level_1: '#e11d48', // Crimson
    },
  },
};

export const DEFAULT_MASTERY_CONFIG: MasteryColorSettings = {
  paletteId: 'emerald_classic',
  tiers: {
    level_4: {
      id: 'level_4',
      label: 'Nắm Vững Cao',
      minPct: 75,
      hex: '#10b981',
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      barColor: 'bg-emerald-500',
    },
    level_3: {
      id: 'level_3',
      label: 'Đang Tiến Bộ',
      minPct: 60,
      hex: '#3b82f6',
      badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      barColor: 'bg-blue-500',
    },
    level_2: {
      id: 'level_2',
      label: 'Cần Củng Cố',
      minPct: 40,
      hex: '#f59e0b',
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
      textColor: 'text-amber-600 dark:text-amber-400',
      barColor: 'bg-amber-500',
    },
    level_1: {
      id: 'level_1',
      label: 'Chưa Đạt (Cần Kèm)',
      minPct: 0,
      hex: '#f43f5e',
      badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30',
      textColor: 'text-rose-600 dark:text-rose-400',
      barColor: 'bg-rose-500',
    },
  },
};

const STORAGE_KEY = 'app_mastery_rate_color_settings';
const EVENT_KEY = 'mastery-rate-colors-updated';

export function getMasteryRateConfig(): MasteryColorSettings {
  if (typeof window === 'undefined') return DEFAULT_MASTERY_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.tiers && parsed.tiers.level_4) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_MASTERY_CONFIG;
}

export function saveMasteryRateConfig(config: MasteryColorSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event(EVENT_KEY));
  } catch {}
}

export function resetMasteryRateConfig(): MasteryColorSettings {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event(EVENT_KEY));
    } catch {}
  }
  return DEFAULT_MASTERY_CONFIG;
}

/**
 * Resolves level-based badge, text color, and bar color for a given percentage.
 */
export function getMasteryRateStyle(pct?: number, customConfig?: MasteryColorSettings) {
  if (pct === undefined || pct === null || isNaN(Number(pct)) || Number(pct) < 0) {
    return {
      levelId: 'none' as const,
      label: 'Chưa kiểm tra',
      levelName: 'Chưa có',
      hex: '#64748b',
      textColor: 'text-slate-400 dark:text-slate-500',
      badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-white/5',
      barColor: 'bg-slate-400',
      minPct: 0,
    };
  }

  const val = Number(pct);
  const cfg = customConfig || getMasteryRateConfig();
  const { level_4, level_3, level_2, level_1 } = cfg.tiers;

  if (val >= (level_4.minPct || 75)) {
    return {
      levelId: 'level_4' as const,
      label: level_4.label,
      levelName: `Mức 4 (≥ ${level_4.minPct}%)`,
      hex: level_4.hex,
      textColor: level_4.textColor,
      badgeClass: level_4.badgeClass,
      barColor: level_4.barColor,
      minPct: level_4.minPct,
    };
  }

  if (val >= (level_3.minPct || 60)) {
    return {
      levelId: 'level_3' as const,
      label: level_3.label,
      levelName: `Mức 3 (${level_3.minPct}% – ${(level_4.minPct || 75) - 0.1}%)`,
      hex: level_3.hex,
      textColor: level_3.textColor,
      badgeClass: level_3.badgeClass,
      barColor: level_3.barColor,
      minPct: level_3.minPct,
    };
  }

  if (val >= (level_2.minPct || 40)) {
    return {
      levelId: 'level_2' as const,
      label: level_2.label,
      levelName: `Mức 2 (${level_2.minPct}% – ${(level_3.minPct || 60) - 0.1}%)`,
      hex: level_2.hex,
      textColor: level_2.textColor,
      badgeClass: level_2.badgeClass,
      barColor: level_2.barColor,
      minPct: level_2.minPct,
    };
  }

  return {
    levelId: 'level_1' as const,
    label: level_1.label,
    levelName: `Mức 1 (< ${level_2.minPct || 40}%)`,
    hex: level_1.hex,
    textColor: level_1.textColor,
    badgeClass: level_1.badgeClass,
    barColor: level_1.barColor,
    minPct: level_1.minPct,
  };
}

/**
 * React hook to listen for changes to mastery rate colors.
 */
export function useMasteryRateColors(): MasteryColorSettings {
  const [config, setConfig] = useState<MasteryColorSettings>(getMasteryRateConfig);

  useEffect(() => {
    const handleUpdate = () => {
      setConfig(getMasteryRateConfig());
    };
    window.addEventListener(EVENT_KEY, handleUpdate);
    return () => window.removeEventListener(EVENT_KEY, handleUpdate);
  }, []);

  return config;
}
