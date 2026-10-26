// Display-only, bounded public counters. Older servers may omit these fields.
const FIELDS = {
  trickRoomTurns:['Distorsion','Trick Room','room','#c4a2ef','Les Pokémon lents agissent avant les rapides, à priorité égale.'],
  magicRoomTurns:['Zone Magique','Magic Room','room','#e9b5ec','Les objets tenus sont temporairement désactivés.'],
  wonderRoomTurns:['Zone Étrange','Wonder Room','room','#a7baf5','Les Défenses et Défenses spéciales de base sont échangées.'],
  gravityTurns:['Gravité','Gravity','gravity','#d8bc8f','La précision augmente et les Pokémon sont ramenés au sol.'],
  ionDelugeTurns:['Déluge Plasmique','Ion Deluge','electric','#f5df8b','Les capacités Normal deviennent Électrik pendant ce tour.'],
  mudSportTurns:['Lance-Boue','Mud Sport','mud','#c6a584','La puissance des capacités Électrik est divisée par trois.'],
  waterSportTurns:['Tourniquet','Water Sport','water','#9ad8ee','La puissance des capacités Feu est divisée par trois.'],
  fairyLockTurns:['Verrou Enchanté','Fairy Lock','lock','#edbce0','Empêche les changements de Pokémon et la fuite, sauf les Spectres.']
};
const SCREENS = {
  wideGuardTurns:['Garde Large','Wide Guard','screen','#b1d4ef','Protège ce camp des attaques qui touchent plusieurs cibles, pendant ce tour.'],
  quickGuardTurns:['Prévention','Quick Guard','screen','#b1d4ef','Protège ce camp des capacités prioritaires, pendant ce tour.'],
  matBlockTurns:['Tatamigaeshi','Mat Block','screen','#b1d4ef','Protège ce camp des attaques offensives, pendant ce tour.'],
  craftyShieldTurns:['Vigilance','Crafty Shield','screen','#b1d4ef','Protège ce camp des capacités de statut adverses, pendant ce tour.'],
  reflectTurns:['Protection','Reflect','screen','#a9c5f8','Réduit les dégâts physiques, sauf les critiques et Infiltration.'],
  lightScreenTurns:['Mur Lumière','Light Screen','screen','#f4e3a3','Réduit les dégâts spéciaux, sauf les critiques et Infiltration.'],
  safeguardTurns:['Rune Protect','Safeguard','screen','#a7e0cc','Protège des altérations de statut et de la confusion.'],
  mistTurns:['Brume','Mist','mist','#d4eaf4','Protège des baisses de statistiques causées par l’adversaire.'],
  tailwindTurns:['Vent Arrière','Tailwind','wind','#b5e9e4','Double la Vitesse des Pokémon de ce camp.'],
  luckyChantTurns:['Air Veinard','Lucky Chant','chant','#f0c3e3','Empêche les coups critiques contre ce camp.']
};
const HAZARDS = {
  stealthRock:['Piège de Roc','Stealth Rock','rock','#d4ba8d','Inflige des dégâts à l’entrée, selon la sensibilité au type Roche.'],
  spikes:['Picots','Spikes','spikes','#d0dce9','Blesse les Pokémon au sol à leur entrée ; jusqu’à trois couches.'],
  toxicSpikes:['Pics Toxik','Toxic Spikes','toxic','#d2a0e9','Empoisonne à l’entrée ; deux couches causent un poison grave. Un Pokémon Poison au sol les absorbe.'],
  stickyWeb:['Toile Gluante','Sticky Web','web','#e4ddc7','Baisse d’un cran la Vitesse des Pokémon au sol à leur entrée.']
};
const TERRAINS = {
  electric_terrain:['Champ Électrifié','Electric Terrain','electric','#e8d477','Renforce les attaques Électrik des Pokémon au sol et les empêche de s’endormir.'],
  grassy_terrain:['Champ Herbu','Grassy Terrain','grass','#a8dca1','Renforce les attaques Plante au sol, soigne chaque tour et atténue Séisme, Piétisol et Ampleur.'],
  misty_terrain:['Champ Brumeux','Misty Terrain','mist','#e2b9d5','Protège les Pokémon au sol des statuts et de la confusion ; atténue les attaques Dragon reçues.'],
  psychic_terrain:['Champ Psychique','Psychic Terrain','room','#c9a3e1','Renforce les attaques Psy au sol et protège des attaques prioritaires.']
};
const count=n=>Math.max(0,Math.min(99,Math.trunc(Number(n)||0)));
const VISUAL_MOVES=new Set([...Object.values(FIELDS),...Object.values(SCREENS),...Object.values(HAZARDS),...Object.values(TERRAINS)].map(spec=>spec[1].toLowerCase()).concat(['rain dance','sunny day','sandstorm','hail']));
export function hasBattleFieldVisual(name) { return VISUAL_MOVES.has(String(name||'').toLowerCase()); }
function side(value={}) {
  return {screens:Object.fromEntries(Object.keys(SCREENS).map(k=>[k,count(value.screens?.[k])])),hazards:Object.fromEntries(Object.keys(HAZARDS).map(k=>[k,Math.min(k==='spikes'?3:k==='toxicSpikes'?2:1,count(value.hazards?.[k]))]))};
}
export function normalizeBattleField(value={}) {
  return {field:Object.fromEntries(Object.keys(FIELDS).map(k=>[k,count(value.field?.[k])])),
    terrain:{kind:TERRAINS[value.terrain?.kind]?value.terrain.kind:null,turns:count(value.terrain?.turns)},
    sides:{player:side(value.sides?.player),opponent:side(value.sides?.opponent)}};
}
export function battleFieldEntries(state,language='fr') {
  const entries=[],english=language==='en';
  const add=(values,table,scope,layers=false)=>Object.entries(table).forEach(([key,spec])=>{
    const value=values[key];if(!value)return;
    entries.push({id:`${scope}:${key}`,key,scope,value,layers,name:spec[english?1:0],kind:spec[2],color:spec[3],description:spec[4],
      scopeLabel:scope==='player'?(english?'Your side':'Votre camp'):scope==='opponent'?(english?'Opponent':'Camp adverse'):(english?'Battlefield':'Terrain'),
      duration:layers?(['spikes','toxicSpikes'].includes(key)?`×${value}`:''):String(value)});
  });
  add(state.field,FIELDS,'field');
  if(state.terrain.kind)add({[state.terrain.kind]:state.terrain.turns},TERRAINS,'terrain');
  for(const scope of ['player','opponent']){add(state.sides[scope].hazards,HAZARDS,scope,true);add(state.sides[scope].screens,SCREENS,scope);}
  return entries;
}
export function battleFieldChanges(previous,next,language='fr') {
  const old=new Map(battleFieldEntries(previous,language).map(e=>[e.id,e])),fresh=new Map(battleFieldEntries(next,language).map(e=>[e.id,e])),changes=[];
  for(const [id,e]of fresh)if(!old.has(id)||(e.layers&&e.value>old.get(id).value))changes.push({...e,change:'start'});
  for(const [id,e]of old)if(!fresh.has(id))changes.push({...e,change:'end'});
  return changes.slice(0,12);
}
export function hazardEntryVisible(field,sideName,pokemon) {
  const h=field.sides[sideName].hazards,b=pokemon?.__battle||{};
  const types=b.tempTypes || [pokemon?.type1,pokemon?.type2];
  const grounded=field.field.gravityTurns>0 || b.grounded || b.ingrain || (!types.includes('Flying') && (pokemon?.passiveAbility!=='Levitate'||b.abilitySuppressed) && !(b.magnetRiseTurns>0) && !(b.telekinesisTurns>0));
  return Boolean(h.stealthRock || (grounded&&(h.spikes||h.toxicSpikes||h.stickyWeb)));
}
