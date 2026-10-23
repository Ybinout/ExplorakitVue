export function battleEnvironment(mapName, colosseum = false, weather = null, encounter = null) {
  if (colosseum) return 'colosseum';
  if (encounter === 'lake') return 'lake';
  if (mapName === 'ville1_arene') return 'lake-gym';
  if (mapName === 'gen_arene5') return 'raph-gym';
  if (/^cave(?:\d|_|$)/i.test(String(mapName || ''))) return 'cave';
  if (['route13', 'route14', 'ville5'].includes(mapName) || weather === 'hail') return 'snow';
  return 'grass';
}
