// Gym themes apply only to arena fights, never PvP or Colosseum waves.
const gymTracks = { gen_arene5: 'raph', ville3_arene: 'ana', ville4_arene: 'wanda', ville5_arene: '7p' };
export function battleMusicTrack(kind, mapName) {
  return kind === 'arena' && Object.hasOwn(gymTracks, mapName) ? gymTracks[mapName] : kind;
}
