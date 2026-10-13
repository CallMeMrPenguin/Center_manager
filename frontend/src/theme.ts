/**
 * CENTER MANAGER APP — CENTRALIZED THEME BRIDGE
 * ────────────────────────────────────────────────────────────────────────────
 * Re-exports everything from the dedicated theme/ folder for backward compatibility.
 * All core tokens and logic are centrally maintained inside src/theme/.
 */

export * from './theme/index';
export { applyTheme as default } from './theme/index';
