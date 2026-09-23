/**
 * CENTER MANAGER APP — CENTRALIZED COLOR SYSTEM & THEME CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════
 * Manages complete Dark Space and Light Executive theme tokens,
 * CSS variables, chart palettes, and real-time document styling.
 */

import { applyButtonShade } from './utils/buttonShade';

export type ThemeMode = 'dark' | 'light';

export const DARK_THEME_COLORS = {
  // ─── 1. SURFACES & BACKGROUNDS ───────────────────────────────────────────
  appBackground: '#08090d',
  sidebarBackground: '#0d1017',
  cardBackground: '#161922',
  cardBackgroundRaised: '#202534',
  cardBackgroundHighlight: '#2a3144',
  navBackground: '#0d1017',
  modalBackdrop: 'rgba(0, 0, 0, 0.85)',

  // ─── 2. BORDERS ─────────────────────────────────────────────────────────
  borderPrimary: '#2e374a',
  borderSubtle: '#222736',
  borderActive: '#2563eb',
  borderHover: '#3b82f6',
  borderGlow: 'rgba(37, 99, 235, 0.35)',

  // ─── 3. TYPOGRAPHY ──────────────────────────────────────────────────────
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  textSubtle: '#64748b',

  // ─── 4. ACCENT & BRAND ──────────────────────────────────────────────────
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  primaryGlow: 'rgba(37, 99, 235, 0.45)',
  primaryLight: 'rgba(37, 99, 235, 0.15)',

  indigo: '#2563eb',
  indigoHover: '#1d4ed8',
  indigoGlow: 'rgba(37, 99, 235, 0.45)',
  indigoLight: 'rgba(37, 99, 235, 0.15)',

  // ─── 5. SEMANTIC STATUS ─────────────────────────────────────────────────
  success: '#10b981',
  successText: '#34d399',
  successBg: 'rgba(16, 185, 129, 0.15)',
  successBorder: 'rgba(16, 185, 129, 0.35)',

  warning: '#f59e0b',
  warningText: '#fbbf24',
  warningBg: 'rgba(245, 158, 11, 0.15)',
  warningBorder: 'rgba(245, 158, 11, 0.35)',

  danger: '#ef4444',
  dangerText: '#f87171',
  dangerBg: 'rgba(239, 68, 68, 0.15)',
  dangerBorder: 'rgba(239, 68, 68, 0.35)',

  info: '#06b6d4',
  infoText: '#22d3ee',
  infoBg: 'rgba(6, 182, 212, 0.15)',
  infoBorder: 'rgba(6, 182, 212, 0.35)',

  purple: '#06b6d4',
  purpleText: '#22d3ee',
  purpleBg: 'rgba(6, 182, 212, 0.15)',
  purpleBorder: 'rgba(6, 182, 212, 0.35)',

  // ─── 6. TIERS ───────────────────────────────────────────────────────────
  tiers: {
    tier8_quanQuan: '#10b981',
    tier7_caoThu: '#06b6d4',
    tier6_tinhAnh: '#3b82f6',
    tier5_kimCuong: '#0ea5e9',
    tier4_bachKim: '#38bdf8',
    tier3_vang: '#f59e0b',
    tier2_bac: '#94a3b8',
    tier1_dong: '#d97706',
  },

  // ─── 7. CHARTS ──────────────────────────────────────────────────────────
  charts: {
    check1_vocab: '#3b82f6',
    check2_grammar: '#06b6d4',
    homework: '#10b981',
    ema_overall: '#f59e0b',
    gridLine: 'rgba(255, 255, 255, 0.08)',
    axisText: '#94a3b8',
  },
} as const;

export const LIGHT_THEME_COLORS = {
  // ─── 1. SURFACES & BACKGROUNDS (Pro Anti-Glare Slate) ────────────────────
  appBackground: '#f1f5f9', // Slate 100 - Clean Light Canvas
  sidebarBackground: '#ffffff',
  cardBackground: '#ffffff',
  cardBackgroundRaised: '#f8fafc', // Slate 50
  cardBackgroundHighlight: '#e2e8f0', // Slate 200
  navBackground: '#f1f5f9',
  modalBackdrop: 'rgba(15, 23, 42, 0.65)',

  // ─── 2. BORDERS ─────────────────────────────────────────────────────────
  borderPrimary: '#cbd5e1', // Slate 300 - Crisp boundary on white cards
  borderSubtle: '#e2e8f0', // Slate 200
  borderActive: '#2563eb', // Blue 600
  borderHover: '#94a3b8', // Slate 400
  borderGlow: 'rgba(37, 99, 235, 0.2)',

  // ─── 3. TYPOGRAPHY (High Contrast WCAG AAA) ─────────────────────────────
  textPrimary: '#0f172a', // Slate 900
  textSecondary: '#334155', // Slate 700
  textMuted: '#64748b', // Slate 500
  textSubtle: '#94a3b8', // Slate 400

  // ─── 4. ACCENT & BRAND ──────────────────────────────────────────────────
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  primaryGlow: 'rgba(37, 99, 235, 0.25)',
  primaryLight: 'rgba(37, 99, 235, 0.08)',

  indigo: '#4f46e5', // Indigo 600
  indigoHover: '#4338ca',
  indigoGlow: 'rgba(79, 70, 229, 0.25)',
  indigoLight: 'rgba(79, 70, 229, 0.08)',

  // ─── 5. SEMANTIC STATUS ─────────────────────────────────────────────────
  success: '#059669',
  successText: '#065f46',
  successBg: 'rgba(5, 150, 105, 0.1)',
  successBorder: '#a7f3d0',

  warning: '#d97706',
  warningText: '#92400e',
  warningBg: 'rgba(217, 119, 6, 0.1)',
  warningBorder: '#fde68a',

  danger: '#dc2626',
  dangerText: '#991b1b',
  dangerBg: 'rgba(220, 38, 38, 0.1)',
  dangerBorder: '#fecaca',

  info: '#0284c7',
  infoText: '#075985',
  infoBg: 'rgba(2, 132, 199, 0.1)',
  infoBorder: '#bae6fd',

  purple: '#7c3aed',
  purpleText: '#5b21b6',
  purpleBg: 'rgba(124, 58, 237, 0.1)',
  purpleBorder: '#ddd6fe',

  // ─── 6. TIERS ───────────────────────────────────────────────────────────
  tiers: {
    tier8_quanQuan: '#059669',
    tier7_caoThu: '#0284c7',
    tier6_tinhAnh: '#2563eb',
    tier5_kimCuong: '#7c3aed',
    tier4_bachKim: '#db2777',
    tier3_vang: '#d97706',
    tier2_bac: '#64748b',
    tier1_dong: '#b45309',
  },

  // ─── 7. CHARTS ──────────────────────────────────────────────────────────
  charts: {
    check1_vocab: '#2563eb',
    check2_grammar: '#06b6d4',
    homework: '#059669',
    ema_overall: '#d97706',
    gridLine: 'rgba(15, 23, 42, 0.08)',
    axisText: '#64748b',
  },
} as const;

export const THEME_COLORS = LIGHT_THEME_COLORS;
export type ThemeColorsType = typeof LIGHT_THEME_COLORS;

export function getStoredTheme(): ThemeMode {
  return 'light';
}

export function setStoredTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem('app_theme', 'light');
  } catch {}
}

/**
 * Applies active theme tokens to CSS custom properties and document elements.
 */
export const applyTheme = (mode?: ThemeMode, customTheme?: any) => {
  const tokens = LIGHT_THEME_COLORS;
  const root = document.documentElement;

  // 1. Enforce light theme classes and color scheme
  root.classList.remove('dark');
  root.classList.add('light');
  root.style.colorScheme = 'light';
  try {
    localStorage.setItem('app_theme', 'light');
  } catch {}

  // 3. Update CSS variables
  root.style.setProperty('--background', tokens.appBackground);
  root.style.setProperty('--surface', tokens.cardBackground);
  root.style.setProperty('--surface-nav', tokens.navBackground);
  root.style.setProperty('--surface-raised', tokens.cardBackgroundRaised);
  root.style.setProperty('--surface-highlight', tokens.cardBackgroundHighlight);

  root.style.setProperty('--border-color', tokens.borderPrimary);
  root.style.setProperty('--border-subtle', tokens.borderSubtle);
  root.style.setProperty('--border-active', tokens.borderActive);

  root.style.setProperty('--foreground', tokens.textPrimary);
  root.style.setProperty('--text-main', tokens.textPrimary);
  root.style.setProperty('--text-muted', tokens.textMuted);
  root.style.setProperty('--text-subtle', tokens.textSubtle);

  root.style.setProperty('--primary', tokens.primary);
  root.style.setProperty('--primary-hover', tokens.primaryHover);
  root.style.setProperty('--primary-glow', tokens.primaryGlow);
  root.style.setProperty('--primary-light', tokens.primaryLight);

  root.style.setProperty('--indigo', tokens.indigo);
  root.style.setProperty('--indigo-glow', tokens.indigoGlow);

  root.style.setProperty('--success', tokens.success);
  root.style.setProperty('--success-bg', tokens.successBg);
  root.style.setProperty('--warning', tokens.warning);
  root.style.setProperty('--warning-bg', tokens.warningBg);
  root.style.setProperty('--danger', tokens.danger);
  root.style.setProperty('--danger-bg', tokens.dangerBg);
  root.style.setProperty('--info', tokens.info);
  root.style.setProperty('--purple', tokens.purple);

  // Theme Mode flag for CSS
  root.style.setProperty('--theme-mode', 'light');

  // Apply customizable button shade
  applyButtonShade();

  // 4. Force synchronous reflow to ensure the browser commits all new colors in one paint without transitions
  if (typeof window !== 'undefined' && document.body) {
    window.getComputedStyle(document.body).opacity;
  }

  // 5. Remove the transition disabler after the new theme has painted, restoring normal hover effects
  if (typeof window !== 'undefined') {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById('theme-transition-killer');
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
    });
  }
};
