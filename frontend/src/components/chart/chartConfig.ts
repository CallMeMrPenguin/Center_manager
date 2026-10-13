import { LIGHT_THEME_COLORS } from '../../theme';

/**
 * Chart Visual Standards matching AGENTS.md Rule 5 & 7:
 * - Liquid Circular Glow: SVG data point glow filters use expansive filter bounds
 * - SVG Circle Scale Center Origin: { transformBox: 'fill-box', transformOrigin: 'center' }
 * - Generous Vertical Spacing (min 560px for large charts)
 */

export const SVG_CENTER_ORIGIN_STYLE: React.CSSProperties = {
  transformBox: 'fill-box',
  transformOrigin: 'center',
};

export const EXPANSIVE_GLOW_BOUNDS = {
  x: '-100%',
  y: '-100%',
  width: '300%',
  height: '300%',
};

export const CHART_PALETTE = {
  check1_vocab: LIGHT_THEME_COLORS.charts.check1_vocab,
  check2_grammar: LIGHT_THEME_COLORS.charts.check2_grammar,
  homework: LIGHT_THEME_COLORS.charts.homework,
  ema_overall: LIGHT_THEME_COLORS.charts.ema_overall,
  gridLine: LIGHT_THEME_COLORS.charts.gridLine,
  axisText: LIGHT_THEME_COLORS.charts.axisText,
  success: LIGHT_THEME_COLORS.success,
  danger: LIGHT_THEME_COLORS.danger,
  warning: LIGHT_THEME_COLORS.warning,
  info: LIGHT_THEME_COLORS.info,
};
