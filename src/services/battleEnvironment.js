export function battleEnvironment(mapName, colosseum = false) {
  if (colosseum) return 'colosseum';
  if (mapName === 'ville1_arene') return 'lake-gym';
  return /^cave(?:\d|_|$)/i.test(String(mapName || '')) ? 'cave' : 'grass';
}
