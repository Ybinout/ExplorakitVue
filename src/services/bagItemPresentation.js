// Presentation only. Item keys, effects, prices and ownership stay on the server.
const STAT_NAMES = {
  hp:['PV','HP'], attack:['Attaque','Attack'], defense:['Défense','Defense'],
  specialAttack:['Attaque spéciale','Sp. Attack'], specialDefense:['Défense spéciale','Sp. Defense'], speed:['Vitesse','Speed']
};
const STAT_COLORS = {hp:'#e79ba6',attack:'#e6a477',defense:'#e4c477',specialAttack:'#a7a0df',specialDefense:'#8dc6b3',speed:'#85bedc'};
export const BAG_STAT_GLYPHS = Object.freeze({
  hp:'M8 14 2 8C-2 3 5-1 8 4c3-5 10-1 6 4Z',
  attack:'m3 13 9-10 2-1-1 4-8 9M2 10l4 4m-3-1-2 2',
  defense:'M8 1 14 4v4c0 3-3 5-6 7-3-2-6-4-6-7V4Z',
  specialAttack:'m8 0 2 5 5-2-3 5 4 3-6 1-2 4-2-5-5 1 3-5-3-3 6-1Z',
  specialDefense:'M8 1 14 4v4c0 3-3 5-6 7-3-2-6-4-6-7V4Zm0 3 2 4-2 3-2-3Z',
  speed:'m2 4 11-2-4 5h5L3 15l3-6H1Z'
});
const designs = {};
function add(family, entries) {
  for(const [kind,main,accent] of entries)designs[kind]=Object.freeze({family,kind,main,accent:accent||'#f6f9f6'});
}
add('equipment',[
  ['clara_registry','#8fb7a8','#e6cb88'],['clara_reunion_letter','#e9dcc4','#ba8079'],
  ['route2_house_key','#dcc27f','#a6bdd7'],['gwenn_house_key','#cca18b','#9578ad'],['professor_lab_key','#8fc5c5','#d2c3e3'],
  ['fly_module','#91c7dc','#e9d293'],['void_teleporter','#b5a3d4','#80c8d0'],['super_tournament_pass','#e0c17d','#a49bce'],
  ['everstone','#b5b6b0','#e1e1d7'],['leftovers','#a9c487','#e4bd81'],['life_orb','#c18ebf','#edcee5'],
  ['choice_band','#da8e8a','#f0cc92'],['choice_specs','#b5a1d9','#d4e3f2'],['choice_scarf','#88bada','#e4c8a1'],
  ['focus_sash','#e6d5a3','#b9877a'],['assault_vest','#9fb19a','#e4cca0'],['eviolite','#bb9bcc','#e6c6e1'],
  ['expert_belt','#8a9caa','#debb73'],['shell_bell','#dcc692','#eab9a1'],['rocky_helmet','#a4b4c5','#dfcfaf'],
  ['rift_talisman','#b6a1db','#8fcbd4'],['exp_share','#dbbd79','#9ac9d6']
]);
add('stone',[
  ['fire_stone','#eea16c','#f5d389'],['water_stone','#76bade','#c1e4ee'],['thunder_stone','#e4cb6b','#f7ecad'],
  ['leaf_stone','#8ebc84','#d3df9a'],['moon_stone','#a1abc9','#e1ddf2'],['sun_stone','#e4ad68','#f5dc88'],
  ['shiny_stone','#e4d5a0','#f9f0ce'],['dusk_stone','#9c8bbf','#c6b2d7'],['dawn_stone','#87c5bb','#d7e8c1'],['ice_stone','#a6d9e6','#eaf7f6']
]);
const vitamins = {hp_up:'hp',protein:'attack',iron:'defense',calcium:'specialAttack',zinc:'specialDefense',carbos:'speed'};
for(const [key,stat] of Object.entries(vitamins))designs[key]=Object.freeze({family:'training',kind:'vitamin',stat,main:STAT_COLORS[stat]});
for(const stat of Object.keys(STAT_NAMES)) {
  designs['iv_randomizer_'+stat]=Object.freeze({family:'training',kind:'iv-roll',stat,main:STAT_COLORS[stat]});
  designs['ev_reset_'+stat]=Object.freeze({family:'training',kind:'ev-reset',stat,main:STAT_COLORS[stat]});
}
designs.ev_reset_all=Object.freeze({family:'training',kind:'ev-reset',stat:'all',main:'#99bfba'});
designs.ability_capsule=Object.freeze({family:'training',kind:'ability-capsule',main:'#ad9bd2'});
designs.nature_capsule=Object.freeze({family:'training',kind:'nature-capsule',main:'#8ec2aa'});
export const BAG_ITEM_DESIGNS=Object.freeze(designs);
export function bagItemDesign(key) { return BAG_ITEM_DESIGNS[key] || null; }
export function bagItemName(item, language='fr') {
  const stat=vitamins[item?.key];
  const name=item?.name||item?.key||'';
  return stat ? `${name} (${STAT_NAMES[stat][language==='en'?1:0]})` : name;
}
