export function battleEnvironment(mapName, colosseum = false, weather = null, encounter = null) {
  if (colosseum) return 'colosseum';
  if (mapName === 'route4_maison' || mapName === 'route3_maison_nrv') return 'gwenn-house';
  if (mapName === 'route2_maison') return 'lucie-house';
  if (encounter === 'lake') return 'lake';
  if (mapName === 'ville1_arene') return 'lake-gym';
  if (mapName === 'gen_arene5') return 'raph-gym';
  if (mapName === 'ville_safe1_arene') return 'hoze-gym';
  if (mapName === 'ville3_arene') return 'ana-gym';
  if (mapName === 'ville4_arene') return 'wanda-gym';
  if (mapName === 'ville5_arene') return '7p-gym';
  if (/^cave(?:\d|_|$)/i.test(String(mapName || ''))) return 'cave';
  if (['route13', 'route14', 'ville5'].includes(mapName) || weather === 'hail') return 'snow';
  return 'grass';
}
