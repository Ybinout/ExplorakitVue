const KEYS = new Set(['pokedex','progress','badges','bag','options','drifts','contracts','friends','calculator','minimap','learning','tournament-powers','quit']);
const storageKey = userId => `riftmon:navbar:${userId}`;
export function normalizeNavbarShortcuts(value) {
  return Array.isArray(value) ? [...new Set(value.filter(key => KEYS.has(key)))].slice(0, 13) : [];
}
export function loadNavbarShortcuts(userId) {
  if (!userId) return [];
  try { return normalizeNavbarShortcuts(JSON.parse(localStorage.getItem(storageKey(userId)) || '[]')); }
  catch (_) { return []; }
}
export function saveNavbarShortcuts(userId, value) {
  const next=normalizeNavbarShortcuts(value);
  if(userId)try { localStorage.setItem(storageKey(userId),JSON.stringify(next)); } catch (_) { /* private browsing */ }
  return next;
}
