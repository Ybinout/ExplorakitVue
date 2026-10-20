// Presentation only: the server remains authoritative for ownership and item use.
export const BAG_POCKETS = Object.freeze([
  {key:'medicine',name:'Soins',en:'Medicine',hint:'Pour remettre ton équipe sur pied.',enHint:'Keep your team ready for the road.'},
  {key:'balls',name:'Balls',en:'Balls',hint:'Pour tes prochaines rencontres.',enHint:'Ready for your next encounter.'},
  {key:'berries',name:'Baies',en:'Berries',hint:'À consommer ou à faire tenir.',enHint:'Use them or give them to a Pokémon.'},
  {key:'held',name:'Objets tenus',en:'Held items',hint:'À équiper depuis le menu Pokémon.',enHint:'Equip these from the Pokémon menu.'},
  {key:'evolution',name:'Évolution',en:'Evolution',hint:'Une nouvelle forme pour un compagnon compatible.',enHint:'A new form for a compatible companion.'},
  {key:'key',name:'Objets clés',en:'Key items',hint:'Les souvenirs et indices de ton aventure.',enHint:'Clues and keepsakes from your adventure.'},
  {key:'other',name:'Autres',en:'Other',hint:'Le reste de ton équipement.',enHint:'The rest of your equipment.'}
]);
export function bagPocket(item) {
  if(item.category==='ball')return 'balls';
  if(item.category==='held' && /_berry$/.test(item.key || ''))return 'berries';
  return ['medicine','held','evolution','key'].includes(item.category)?item.category:'other';
}
