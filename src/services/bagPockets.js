// Presentation only: the server remains authoritative for ownership and item use.
export const BAG_POCKETS = Object.freeze([
  {key:'medicine',name:'Soins',en:'Medicine',hint:'Pour remettre ton équipe sur pied.',enHint:'Keep your team ready for the road.'},
  {key:'training',name:'Entraînement',en:'Training',hint:'Vitamines, natures, talents, relances d’IV et remise à zéro des EV.',enHint:'Vitamins, natures, abilities, IV rolls and EV resets.'},
  {key:'machines',name:'CS',en:'CS',hint:'Apprends une attaque à un Pokémon compatible.',enHint:'Teach a move to a compatible Pokémon.'},
  {key:'balls',name:'Balls',en:'Balls',hint:'Pour tes prochaines rencontres.',enHint:'Ready for your next encounter.'},
  {key:'field',name:'Objets',en:'Field items',hint:'Pour explorer plus tranquillement.',enHint:'For a quieter journey.'},
  {key:'berries',name:'Baies',en:'Berries',hint:'À consommer ou à faire tenir.',enHint:'Use them or give them to a Pokémon.'},
  {key:'held',name:'Objets tenus',en:'Held items',hint:'À faire tenir depuis le sac ou le menu Pokémon.',enHint:'Give these from the bag or Pokémon menu.'},
  {key:'evolution',name:'Évolution',en:'Evolution',hint:'Une nouvelle forme pour un compagnon compatible.',enHint:'A new form for a compatible companion.'},
  {key:'treasures',name:'Trésors',en:'Treasures',hint:'Des trouvailles à revendre dans les boutiques.',enHint:'Finds to sell at any shop.'},
  {key:'key',name:'Objets clés',en:'Key items',hint:'Les souvenirs et indices de ton aventure.',enHint:'Clues and keepsakes from your adventure.'},
  {key:'other',name:'Autres',en:'Other',hint:'Le reste de ton équipement.',enHint:'The rest of your equipment.'}
]);
export const TRAINING_GROUPS = Object.freeze([
  {key:'vitamins',name:'Vitamines',en:'Vitamins'}, {key:'iv',name:'Relances IV',en:'IV rolls'},
  {key:'ev',name:'Reset EV',en:'EV resets'}, {key:'abilities',name:'Talents',en:'Abilities'},
  {key:'natures',name:'Natures',en:'Natures'}
]);
export function trainingGroup(item) {
  return item.fieldUse?.ivReroll?'iv':item.fieldUse?.effortReset?'ev':item.fieldUse?.abilityReroll?'abilities':item.fieldUse?.natureReroll?'natures':'vitamins';
}
export function bagPocket(item) {
  if(item.category==='treasure')return 'treasures';
  if(item.category==='machine')return 'machines';
  if(item.category==='ball')return 'balls';
  if(item.category==='heal')return 'medicine';
  if(item.fieldUse?.effort?.amount>0||item.fieldUse?.ivReroll||item.fieldUse?.effortReset||item.fieldUse?.abilityReroll||item.fieldUse?.natureReroll)return 'training';
  if(item.category==='held' && /_berry$/.test(item.key || ''))return 'berries';
  return ['medicine','field','held','evolution','key'].includes(item.category)?item.category:'other';
}
