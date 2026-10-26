// Gym themes apply only to arena fights, never PvP or Colosseum waves.
const gymTracks = { ville1_arene: 'mounir', ville_safe1_arene: 'hoze', gen_arene5: 'raph', ville3_arene: 'ana', ville4_arene: 'wanda', ville5_arene: '7p' };
export function battleMusicTrack(kind, mapName) {
  if (kind === 'trainer' && mapName === 'route4_maison') return 'gwenn';
  if (kind === 'trainer' && ['route2_maison', 'professor_lab'].includes(mapName)) return 'lucie';
  return kind === 'arena' && Object.hasOwn(gymTracks, mapName) ? gymTracks[mapName] : kind;
}

// Only actual authorized challenge dialogues start their music early.
export function trainerPreludeMusicTrack(dialogueName, mapName) {
  if (dialogueName === 'gwenn_rochebrume' && mapName === 'route4_maison') return 'gwenn';
  return dialogueName === 'champion_wanda' && mapName === 'ville4_arene' ? 'wanda' : null;
}
