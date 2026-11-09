export function battleEnvironment(mapName, colosseum = false, weather = null, encounter = null) {
  if(encounter==='draft-house'||mapName==='draft_house')return 'draft-house';
  if (encounter === 'whitepeak-club') return 'whitepeak-club';
  if (/^(?:jungle[1-9]|DC2_(?:0[1-9]|[1-3][0-9]|4[0-8]))$/.test(mapName)) return encounter === 'lake' ? 'lake' : 'dark-jungle';
  if (mapName === 'ville5_maison1') return 'whitepeak-club';
  if (mapName === 'super_tournament_room') return 'super-tournament';
  if (colosseum) return 'colosseum';
  if (mapName === 'void_arena') return 'void-arena';
  if (mapName === 'professor_lab') return 'professor-lab';
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
