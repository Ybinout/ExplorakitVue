export const natures = {
  Hardy: ['Hardi'], Docile: ['Docile'], Serious: ['Sérieux'], Bashful: ['Pudique'], Quirky: ['Bizarre'],
  Adamant: ['Rigide', 'attack', 'specialAttack'], Bold: ['Assuré', 'defense', 'attack'], Brave: ['Brave', 'attack', 'speed'],
  Calm: ['Calme', 'specialDefense', 'attack'], Careful: ['Prudent', 'specialDefense', 'specialAttack'], Gentle: ['Gentil', 'specialDefense', 'defense'],
  Hasty: ['Pressé', 'speed', 'defense'], Impish: ['Malin', 'defense', 'specialAttack'], Jolly: ['Jovial', 'speed', 'specialAttack'],
  Lax: ['Lâche', 'defense', 'specialDefense'], Lonely: ['Solo', 'attack', 'defense'], Mild: ['Doux', 'specialAttack', 'defense'],
  Modest: ['Modeste', 'specialAttack', 'attack'], Naive: ['Naïf', 'speed', 'specialDefense'], Naughty: ['Mauvais', 'attack', 'specialDefense'],
  Quiet: ['Discret', 'specialAttack', 'speed'], Rash: ['Foufou', 'specialAttack', 'specialDefense'], Relaxed: ['Relax', 'defense', 'speed'],
  Sassy: ['Malpoli', 'specialDefense', 'speed'], Timid: ['Timide', 'speed', 'attack']
};
const stats={attack:'Attaque',defense:'Défense',specialAttack:'Attaque Spéciale',specialDefense:'Défense Spéciale',speed:'Vitesse'};
export function natureLabel(name){return natures[name]?.[0]||name||'—';}
export function natureDescription(name){const n=natures[name];return n?.[1]?`+10 % ${stats[n[1]]} · −10 % ${stats[n[2]]}`:'Nature neutre : aucune statistique favorisée ou diminuée.';}
