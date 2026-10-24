// The arena and encounter kind must both match: PvP and Colosseum waves keep
// their own entrance even when the player is standing inside a Gym.
const champions = {
  ville1_arene: { name: 'Mounir', city: 'Ville du Lac', cityEn: 'Lake Town', portrait: 'moonpunch.png', accent: '#85cce0' },
  ville_safe1_arene: { name: 'Hoze', city: 'Valpierre', cityEn: 'Valpierre', portrait: 'hoze.png', accent: '#e5bf7f' },
  gen_arene5: { name: 'Raph', city: 'Ocreville', cityEn: 'Ochre Town', portrait: 'raph.png', accent: '#91d1ba' },
  ville3_arene: { name: 'Ana', city: 'Clairfontaine', cityEn: 'Clearfountain', portrait: 'ana.png', accent: '#c8b6eb' },
  ville4_arene: { name: 'Wanda', city: 'Rochebrume', cityEn: 'Miststone', portrait: 'wanda.png', accent: '#eaa5ac' },
  ville5_arene: { name: '7p', city: 'Blanchecime', cityEn: 'Whitepeak', portrait: '7ps.png', accent: '#b6dbef' }
};
export function arenaChampion(mapName, encounterKind) {
  if (mapName === 'route2_maison' && encounterKind === 'trainer') return {
    name: 'Lucie', city: 'Sous l’emprise de l’Aube', cityEn: 'Under the Dawn’s influence',
    portrait: 'lucie-v1.png', accent: '#baa6d8', story: true,
    eyebrow: 'RETROUVAILLES', eyebrowEn: 'REUNION', minimumMs: 4400, portraitMs: 2600
  };
  return encounterKind === 'arena'  && Object.hasOwn(champions, mapName) ? champions[mapName] : null;
}
