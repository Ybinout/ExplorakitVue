export function battleEnvironment(mapName, colosseum = false, weather = null) {
  if (colosseum) return 'colosseum';
  if (mapName === 'ville1_arene') return 'lake-gym';
  if (/^cave(?:\d|_|$)/i.test(String(mapName || ''))) return 'cave';
  if (['route13', 'route14', 'ville5'].includes(mapName) || weather === 'hail') return 'snow';
  return 'grass';
}
