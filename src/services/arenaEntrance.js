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
export function arenaChampion(mapName, encounterKind, trainerKey = null) {
  if (mapName === 'ville1' && encounterKind === 'trainer' && ['town_lina', 'town_bastien'].includes(trainerKey)) {
    const maria = trainerKey === 'town_lina';
    return { name: maria ? 'Maria' : 'Clément', city: 'Ville du Lac', cityEn: 'Lake Town',
      portrait: maria ? 'maria-v2.png' : 'clement-v2.png', accent: '#aec5bd', story: true,
      eyebrow: maria ? 'LE DÉFI DE MARIA' : 'LE DÉFI DE CLÉMENT', eyebrowEn: maria ? 'MARIA’S CHALLENGE' : 'CLÉMENT’S CHALLENGE',
      minimumMs: 3600, portraitMs: 2200 };
  }
  if(mapName==='professor_lab'&&encounterKind==='trainer'&&trainerKey==='professor_story')return{
    name:'Le Professeur',city:'Laboratoire secret',cityEn:'Secret Laboratory',portrait:'prof.png',accent:'#ab9ad6',story:true,
    eyebrow:'LE DERNIER FACE-À-FACE',eyebrowEn:'THE FINAL CONFRONTATION',minimumMs:4400,portraitMs:2600
  };
  if (mapName === 'start' && encounterKind === 'trainer' && trainerKey === 'dia1') return {
    name: 'Wayne', city: 'Village du départ', cityEn: 'Starting Village', portrait: 'wayne-eyepatch-v1.png', accent: '#aec5bd', story: true,
    eyebrow: 'LE DÉFI DE WAYNE', eyebrowEn: 'WAYNE’S CHALLENGE', minimumMs: 3600, portraitMs: 2200
  };
  if (mapName === 'ville_safe1' && encounterKind === 'trainer' && trainerKey === 'mathilde_pikapika') return {
    name: 'Mathilde', city: 'Valpierre', cityEn: 'Valpierre', portrait: 'mathilde-v1.png', accent: '#e2cf8b', story: true,
    eyebrow: 'LE DÉFI DE MATHILDE', eyebrowEn: 'MATHILDE’S CHALLENGE', minimumMs: 3600, portraitMs: 2200
  };
  if (mapName === 'gen_route8' && encounterKind === 'trainer' && trainerKey === 'gwenn_route8') return {
    name: 'Matthieu', city: 'Route 8', cityEn: 'Route 8', portrait: 'matthieu-v2.png', accent: '#aec5bd', story: true,
    eyebrow: 'LE DÉFI DE MATTHIEU', eyebrowEn: 'MATTHIEU’S CHALLENGE', minimumMs: 3600, portraitMs: 2200
  };
  if (mapName === 'route2' && encounterKind === 'trainer' && trainerKey === 'aspha_route2') return {
    name: 'Aspha', city: 'Route 2', cityEn: 'Route 2', portrait: 'aspha-v1.png', accent: '#aec5bd', story: true,
    eyebrow: 'LE DÉFI D’ASPHA', eyebrowEn: 'ASPHA’S CHALLENGE', minimumMs: 3600, portraitMs: 2200
  };
  if (mapName === 'route4_maison' && encounterKind === 'trainer') return {name:'Gwenn',city:'Route 4',cityEn:'Route 4',portrait:'gwenn-v1.png',accent:'#baa6d8',story:true,eyebrow:'LE DÉFI DE GWENN',eyebrowEn:'GWENN’S CHALLENGE',minimumMs:3600,portraitMs:2200};
  if (mapName === 'route2_maison' && encounterKind === 'trainer') return {
    name: 'Lucie', city: 'Sous l’emprise de l’Aube', cityEn: 'Under the Dawn’s influence',
    portrait: 'lucie-v1.png', accent: '#baa6d8', story: true,
    eyebrow: 'RETROUVAILLES', eyebrowEn: 'REUNION', minimumMs: 4400, portraitMs: 2600
  };
  return encounterKind === 'arena'  && Object.hasOwn(champions, mapName) ? champions[mapName] : null;
}
