export const GAME_THEME_COLORS = Object.freeze(['blue', 'sage', 'lavender', 'sand']);
export const GAME_THEME_MODES = Object.freeze(['light', 'dark']);

export function applyGameTheme(preferences, root = typeof document === 'undefined' ? null : document.documentElement) {
  if (!root) return;
  root.dataset.gameThemeColor = GAME_THEME_COLORS.includes(preferences.themeColor) ? preferences.themeColor : 'blue';
  root.dataset.gameThemeMode = GAME_THEME_MODES.includes(preferences.themeMode) ? preferences.themeMode : 'light';
}
