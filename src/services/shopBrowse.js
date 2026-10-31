export const STORE_DEPARTMENTS = Object.freeze([
  {number:1,name:'Fournitures',en:'Supplies',hint:'Balls, soins et évolution',enHint:'Balls, medicine and evolution',pocket:'balls'},
  {number:2,name:'Entraînement',en:'Training',hint:'Stats, niveaux et capacités',enHint:'Stats, levels and moves',pocket:'training'},
  {number:3,name:'Équipement',en:'Equipment',hint:'Objets à faire tenir',enHint:'Items for your Pokémon to hold',pocket:'held'},
  {number:4,name:'Baies',en:'Berries',hint:'Soins et effets en combat',enHint:'Recovery and battle effects',pocket:'berries'}
]);
export const TRAINING_TASKS = Object.freeze([
  {key:'levels',name:'Monter de niveau',en:'Gain a level',hint:'Super et Méga Bonbons',enHint:'Rare and Mega Candies',itemKey:'rare_candy',pocket:'training'},
  {key:'machines',name:'Apprendre une attaque',en:'Learn a move',hint:'CS : vérifie la compatibilité dans ton sac.',enHint:'CS: check compatibility in your bag.',itemKey:'',pocket:'machines'},
  {key:'vitamins',name:'Renforcer les stats',en:'Train stats',hint:'Vitamines : +10 EV dans une stat.',enHint:'Vitamins: +10 EVs in one stat.',itemKey:'protein',pocket:'training'},
  {key:'iv',name:'Relancer un IV',en:'Reroll an IV',hint:'Nouveau tirage de 0 à 31, même si ça baisse.',enHint:'A new roll from 0 to 31; it may be lower.',itemKey:'iv_randomizer_attack',pocket:'training'},
  {key:'ev',name:'Réinitialiser les EV',en:'Reset EVs',hint:'Effacer les EV d’une stat ou de toutes.',enHint:'Clear training in one stat or every stat.',itemKey:'ev_reset_all',pocket:'training'},
  {key:'abilities',name:'Changer de talent',en:'Change ability',hint:'Un autre talent possible pour cette espèce.',enHint:'A different ability available to the species.',itemKey:'ability_capsule',pocket:'training'},
  {key:'natures',name:'Changer de nature',en:'Change nature',hint:'Une nouvelle nature au hasard.',enHint:'A new nature chosen at random.',itemKey:'nature_capsule',pocket:'training'}
]);
export function shopSearch(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim();
}
