import { LIGHT_THEME_COLORS, ThemeMode } from './tokens';
import { applyButtonShade } from '../utils/buttonShade';

export function getStoredTheme(): ThemeMode {
  return 'light';
}

export function setStoredTheme(_mode: ThemeMode): void {
  try {
    localStorage.setItem('app_theme', 'light');
  } catch {}
}

/**
 * Applies active theme tokens to CSS custom properties and document elements.
 */
export const applyTheme = (_mode?: ThemeMode, _customTheme?: any) => {
  const tokens = LIGHT_THEME_COLORS;
  const root = document.documentElement;

  // 1. Enforce light theme classes and color scheme
  root.classList.remove('dark');
  root.classList.add('light');
  root.style.colorScheme = 'light';
  try {
    localStorage.setItem('app_theme', 'light');
  } catch {}

  // 2. Update CSS variables
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

  // 3. Force synchronous reflow to ensure the browser commits all new colors in one paint without transitions
  if (typeof window !== 'undefined' && document.body) {
    void window.getComputedStyle(document.body).opacity;
  }

  // 4. Remove the transition disabler after the new theme has painted, restoring normal hover effects
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
