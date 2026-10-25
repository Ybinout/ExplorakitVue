// Gym themes apply only to arena fights, never PvP or Colosseum waves.
const gymTracks = { ville1_arene: 'mounir', ville_safe1_arene: 'hoze', gen_arene5: 'raph', ville3_arene: 'ana', ville4_arene: 'wanda', ville5_arene: '7p' };
export function battleMusicTrack(kind, mapName) {
  if (kind === 'trainer' && mapName === 'route2_maison') return 'lucie';
  return kind === 'arena' && Object.hasOwn(gymTracks, mapName) ? gymTracks[mapName] : kind;
}

// Only Wanda's actual challenge dialogue starts battle music before the fight.
export function trainerPreludeMusicTrack(dialogueName, mapName) {
  return dialogueName === 'champion_wanda' && mapName === 'ville4_arene' ? 'wanda' : null;
}
