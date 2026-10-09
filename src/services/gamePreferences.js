const STORAGE_KEY = 'explorakitGamePreferences';

export const DEFAULT_GAME_PREFERENCES = Object.freeze({
  masterVolume: 35,
  textSpeed: 120,
  animationsEnabled: true,
  language: 'fr'
});

export function normalizeGamePreferences(value = {}) {
  const volume = Math.max(0, Math.min(100, Number(value.masterVolume)));
  const textSpeed = [45, 120, 10000].includes(Number(value.textSpeed))
    ? Number(value.textSpeed)
    : DEFAULT_GAME_PREFERENCES.textSpeed;
  return {
    masterVolume: Number.isFinite(volume) ? volume : DEFAULT_GAME_PREFERENCES.masterVolume,
    textSpeed,
    animationsEnabled: value.animationsEnabled !== false,
    language: ['fr', 'en'].includes(value.language) ? value.language : DEFAULT_GAME_PREFERENCES.language
  };
}

export function loadGamePreferences() {
  try {
    return normalizeGamePreferences(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    return { ...DEFAULT_GAME_PREFERENCES };
  }
}

export function saveGamePreferences(value) {
  const normalized = normalizeGamePreferences(value);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}
