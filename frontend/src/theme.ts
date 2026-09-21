/**
 * CENTER MANAGER APP — CENTRALIZED COLOR SYSTEM & THEME CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════
 * Manages complete Dark Space and Light Executive theme tokens,
 * CSS variables, chart palettes, and real-time document styling.
 */

export type ThemeMode = 'dark' | 'light';

export const DARK_THEME_COLORS = {
  // ─── 1. SURFACES & BACKGROUNDS ───────────────────────────────────────────
  appBackground: '#07090e',
  sidebarBackground: '#0c0f1e',
  cardBackground: '#0c0f1e',
  cardBackgroundRaised: '#121626',
  cardBackgroundHighlight: '#1a223e',
  navBackground: '#090d16',
  modalBackdrop: 'rgba(0, 0, 0, 0.85)',

  // ─── 2. BORDERS ─────────────────────────────────────────────────────────
  borderPrimary: '#212c4b',
  borderSubtle: '#181f36',
  borderActive: '#5c36f5',
  borderHover: '#3b82f6',
  borderGlow: 'rgba(92, 54, 245, 0.4)',

  // ─── 3. TYPOGRAPHY ──────────────────────────────────────────────────────
  textPrimary: '#ffffff',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  textSubtle: '#64748b',

  // ─── 4. ACCENT & BRAND ──────────────────────────────────────────────────
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  primaryGlow: 'rgba(37, 99, 235, 0.45)',
  primaryLight: 'rgba(37, 99, 235, 0.15)',

  indigo: '#5c36f5',
  indigoHover: '#4f2ee0',
  indigoGlow: 'rgba(92, 54, 245, 0.5)',
  indigoLight: 'rgba(92, 54, 245, 0.15)',

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

  purple: '#a855f7',
  purpleText: '#c084fc',
  purpleBg: 'rgba(168, 85, 247, 0.15)',
  purpleBorder: 'rgba(168, 85, 247, 0.35)',

  // ─── 6. TIERS ───────────────────────────────────────────────────────────
  tiers: {
    tier8_quanQuan: '#10b981',
    tier7_caoThu: '#06b6d4',
    tier6_tinhAnh: '#3b82f6',
    tier5_kimCuong: '#8b5cf6',
    tier4_bachKim: '#ec4899',
    tier3_vang: '#f59e0b',
    tier2_bac: '#94a3b8',
    tier1_dong: '#d97706',
  },

  // ─── 7. CHARTS ──────────────────────────────────────────────────────────
  charts: {
    check1_vocab: '#3b82f6',
    check2_grammar: '#a855f7',
    homework: '#10b981',
    ema_overall: '#f59e0b',
    gridLine: 'rgba(255, 255, 255, 0.06)',
    axisText: '#94a3b8',
  },
} as const;

export const LIGHT_THEME_COLORS = {
  // ─── 1. SURFACES & BACKGROUNDS (Pro Anti-Glare Slate) ────────────────────
  appBackground: '#edf2f7', // Slate 100/200 - High Contrast Canvas
  sidebarBackground: '#ffffff',
  cardBackground: '#ffffff',
  cardBackgroundRaised: '#e2e8f0', // Slate 200
  cardBackgroundHighlight: '#cbd5e1', // Slate 300
  navBackground: '#edf2f7',
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
    check2_grammar: '#7c3aed',
    homework: '#059669',
    ema_overall: '#d97706',
    gridLine: 'rgba(15, 23, 42, 0.08)',
    axisText: '#64748b',
  },
} as const;

export const THEME_COLORS = DARK_THEME_COLORS;
export type ThemeColorsType = typeof DARK_THEME_COLORS;

export function getStoredTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem('app_theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return 'dark';
}

export function setStoredTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem('app_theme', mode);
  } catch {}
}

/**
 * Applies active theme tokens to CSS custom properties and document elements.
 */
export const applyTheme = (mode?: ThemeMode, customTheme?: any) => {
  const currentMode = mode || getStoredTheme();
  const tokens = currentMode === 'light' ? LIGHT_THEME_COLORS : DARK_THEME_COLORS;
  const root = document.documentElement;

  // Toggle class and color-scheme on root element
  if (currentMode === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  }

  // 1. Core Surfaces & Backgrounds
  root.style.setProperty('--background', tokens.appBackground);
  root.style.setProperty('--surface', tokens.cardBackground);
  root.style.setProperty('--surface-nav', tokens.navBackground);
  root.style.setProperty('--surface-raised', tokens.cardBackgroundRaised);
  root.style.setProperty('--surface-highlight', tokens.cardBackgroundHighlight);

  // 2. Borders
  root.style.setProperty('--border-color', tokens.borderPrimary);
  root.style.setProperty('--border-subtle', tokens.borderSubtle);
  root.style.setProperty('--border-active', tokens.borderActive);

  // 3. Typography
  root.style.setProperty('--foreground', tokens.textPrimary);
  root.style.setProperty('--text-main', tokens.textPrimary);
  root.style.setProperty('--text-muted', tokens.textMuted);
  root.style.setProperty('--text-subtle', tokens.textSubtle);

  // 4. Accent & Brand
  root.style.setProperty('--primary', tokens.primary);
  root.style.setProperty('--primary-hover', tokens.primaryHover);
  root.style.setProperty('--primary-glow', tokens.primaryGlow);
  root.style.setProperty('--primary-light', tokens.primaryLight);

  root.style.setProperty('--indigo', tokens.indigo);
  root.style.setProperty('--indigo-glow', tokens.indigoGlow);

  // 5. Semantic Status
  root.style.setProperty('--success', tokens.success);
  root.style.setProperty('--success-bg', tokens.successBg);
  root.style.setProperty('--warning', tokens.warning);
  root.style.setProperty('--warning-bg', tokens.warningBg);
  root.style.setProperty('--danger', tokens.danger);
  root.style.setProperty('--danger-bg', tokens.dangerBg);
  root.style.setProperty('--info', tokens.info);
  root.style.setProperty('--purple', tokens.purple);

  // 6. Theme Mode flag for CSS
  root.style.setProperty('--theme-mode', currentMode);
};
