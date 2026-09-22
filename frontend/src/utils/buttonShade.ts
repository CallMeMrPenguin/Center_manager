/**
 * BUTTON SHADE & SEGMENTED EFFECT CONTROLLER
 * ────────────────────────────────────────────────────────────────────────────
 * Provides fine-grained, continuous control (0% - 100%) for both neutral
 * button shades and SegmentedControl highlight/container intensity.
 */

const STORAGE_KEY_BTN = 'app_button_shade_pct';
const STORAGE_KEY_SEG = 'app_segmented_highlight_pct';

export function getStoredButtonShadePct(): number {
  if (typeof window === 'undefined') return 30;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BTN);
    if (raw !== null) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) return parsed;
    }
    // Backward compatibility with legacy 1-5 integer level
    const legacy = localStorage.getItem('app_button_shade_level');
    if (legacy) {
      const lvl = parseInt(legacy, 10);
      if (lvl === 1) return 10;
      if (lvl === 2) return 30;
      if (lvl === 3) return 50;
      if (lvl === 4) return 75;
      if (lvl === 5) return 95;
    }
  } catch {}
  return 30; // Default: Soft Slate 30%
}

export function getStoredSegmentedHighlightPct(): number {
  if (typeof window === 'undefined') return 35;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SEG);
    if (raw !== null) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) return parsed;
    }
  } catch {}
  return 35; // Default: 35%
}

/**
 * Computes CSS variable values continuously based on percentage (0 - 100).
 */
export function applyContinuousShade(btnPct: number, segPct: number): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  const b = Math.max(0, Math.min(100, btnPct)) / 100;
  const s = Math.max(0, Math.min(100, segPct)) / 100;

  // ── 1. Neutral Button Light Mode Colors ──────────────────────────────────
  // 0% -> #fafbfd (250, 251, 253), 100% -> #cbd5e1 (203, 213, 225)
  const l_bg_r = Math.round(250 - b * 47);
  const l_bg_g = Math.round(251 - b * 38);
  const l_bg_b = Math.round(253 - b * 28);

  const l_hov_r = Math.round(243 - b * 95);
  const l_hov_g = Math.round(245 - b * 82);
  const l_hov_b = Math.round(249 - b * 65);

  // ── 2. Neutral Button Dark Mode Colors ───────────────────────────────────
  // 0% -> #101422 (16, 20, 34), 100% -> #28304a (40, 48, 74)
  const d_bg_r = Math.round(16 + b * 24);
  const d_bg_g = Math.round(20 + b * 28);
  const d_bg_b = Math.round(34 + b * 40);

  const d_hov_r = Math.round(24 + b * 30);
  const d_hov_g = Math.round(30 + b * 35);
  const d_hov_b = Math.round(48 + b * 52);

  root.style.setProperty('--btn-neutral-bg', `rgb(${l_bg_r}, ${l_bg_g}, ${l_bg_b})`);
  root.style.setProperty('--btn-neutral-hover', `rgb(${l_hov_r}, ${l_hov_g}, ${l_hov_b})`);
  root.style.setProperty('--btn-neutral-dark-bg', `rgb(${d_bg_r}, ${d_bg_g}, ${d_bg_b})`);
  root.style.setProperty('--btn-neutral-dark-hover', `rgb(${d_hov_r}, ${d_hov_g}, ${d_hov_b})`);

  // ── 3. Segmented Button Container & Hover Highlight ───────────────────────
  // Light mode container: soft translucent slate
  const seg_l_bg_alpha = (0.15 + s * 0.45).toFixed(3);
  const seg_l_hov_alpha = (0.10 + s * 0.55).toFixed(3);

  // Dark mode container: deep space backdrop
  const seg_d_bg_alpha = (0.40 + s * 0.50).toFixed(3);
  const seg_d_hov_alpha = (0.05 + s * 0.28).toFixed(3);

  root.style.setProperty('--segmented-bg', `rgba(203, 213, 225, ${seg_l_bg_alpha})`);
  root.style.setProperty('--segmented-highlight-bg', `rgba(148, 163, 184, ${seg_l_hov_alpha})`);
  root.style.setProperty('--segmented-dark-bg', `rgba(12, 15, 30, ${seg_d_bg_alpha})`);
  root.style.setProperty('--segmented-highlight-dark-bg', `rgba(255, 255, 255, ${seg_d_hov_alpha})`);
}

export function setButtonShadePct(pct: number): void {
  const safe = Math.max(0, Math.min(100, Math.round(pct)));
  try {
    localStorage.setItem(STORAGE_KEY_BTN, String(safe));
  } catch {}
  applyContinuousShade(safe, getStoredSegmentedHighlightPct());
}

export function setSegmentedHighlightPct(pct: number): void {
  const safe = Math.max(0, Math.min(100, Math.round(pct)));
  try {
    localStorage.setItem(STORAGE_KEY_SEG, String(safe));
  } catch {}
  applyContinuousShade(getStoredButtonShadePct(), safe);
}

// Backward-compatibility shims
export function getStoredButtonShade(): number {
  const pct = getStoredButtonShadePct();
  if (pct <= 20) return 1;
  if (pct <= 40) return 2;
  if (pct <= 65) return 3;
  if (pct <= 85) return 4;
  return 5;
}

export function applyButtonShade(): void {
  applyContinuousShade(getStoredButtonShadePct(), getStoredSegmentedHighlightPct());
}

// Auto-apply on script load in browser
if (typeof window !== 'undefined') {
  applyButtonShade();
}
