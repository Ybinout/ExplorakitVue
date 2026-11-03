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
  ['toxic_orb','#9b78c1','#d6b6ec'],['flame_orb','#dc9273','#f6d48b'],
  ['macho_brace','#a5b4bd','#dbb779'],['muscle_band','#c88e80','#e8cc8c'],['wise_glasses','#8dbda8','#d6e4bb'],
  ['wide_lens','#87bdcd','#d2eced'],['scope_lens','#b69bcb','#e0cda2'],
  ['choice_band','#da8e8a','#f0cc92'],['choice_specs','#b5a1d9','#d4e3f2'],['choice_scarf','#88bada','#e4c8a1'],
  ['focus_sash','#e6d5a3','#b9877a'],['assault_vest','#9fb19a','#e4cca0'],['eviolite','#bb9bcc','#e6c6e1'],
  ['expert_belt','#8a9caa','#debb73'],['shell_bell','#dcc692','#eab9a1'],['rocky_helmet','#a4b4c5','#dfcfaf'],
  ['rift_talisman','#b6a1db','#8fcbd4'],['exp_share','#dbbd79','#9ac9d6']
]);
export const BAG_STRATEGY_SHAPES=Object.freeze({'silk_scarf': 'scarf', 'charcoal': 'coal', 'sea_incense': 'incense', 'magnet': 'magnet', 'miracle_seed': 'seed', 'never_melt_ice': 'ice', 'black_belt': 'belt', 'poison_barb': 'barb', 'soft_sand': 'sand', 'sharp_beak': 'beak', 'twisted_spoon': 'spoon', 'silver_powder': 'powder', 'hard_stone': 'rock', 'spell_tag': 'tag', 'dragon_fang': 'fang', 'black_glasses': 'glasses', 'metal_coat': 'coat', 'fairy_feather': 'feather', 'black_sludge': 'sludge', 'light_clay': 'clay', 'big_root': 'root', 'shed_shell': 'shell', 'white_herb': 'herb', 'mental_herb': 'herb', 'power_herb': 'herb', 'air_balloon': 'balloon', 'weakness_policy': 'policy', 'protective_pads': 'pads', 'damp_rock': 'weather-rock', 'heat_rock': 'weather-rock', 'smooth_rock': 'weather-rock', 'icy_rock': 'weather-rock'});
add('equipment',[
  ['silk_scarf','#bfb5cd','#ece1f1'],
  ['charcoal','#62606c','#e99464'],
  ['sea_incense','#7ca9d3','#e8cc83'],
  ['magnet','#da8d8d','#9cb8d0'],
  ['miracle_seed','#92bb82','#d8e7ab'],
  ['never_melt_ice','#9ed0e0','#e4f6fa'],
  ['black_belt','#737d88','#e5bd83'],
  ['poison_barb','#ba91d0','#e3c8ec'],
  ['soft_sand','#d7bb8d','#f0deaa'],
  ['sharp_beak','#dfc489','#f2e4b5'],
  ['twisted_spoon','#b3a0ca','#e8daed'],
  ['silver_powder','#a8bda0','#edf1cf'],
  ['hard_stone','#b8a38b','#e2d1ae'],
  ['spell_tag','#a199bd','#e3d9ed'],
  ['dragon_fang','#b9a6d6','#e9dfbd'],
  ['black_glasses','#6a7592','#a9bad4'],
  ['metal_coat','#9eaec1','#e1eaf2'],
  ['fairy_feather','#e2a9c4','#f7dbe9'],
  ['black_sludge','#8e7b9e','#c4afcd'],
  ['light_clay','#d6bc8c','#e9d9b6'],
  ['big_root','#b6a283','#94bd87'],
  ['shed_shell','#cfba98','#ece1c8'],
  ['white_herb','#d0d9c5','#f6f8ed'],
  ['mental_herb','#91b4d6','#d5e5f3'],
  ['power_herb','#db918d','#f1c2a0'],
  ['air_balloon','#df9997','#f7d1b1'],
  ['weakness_policy','#d3ac8d','#efd59a'],
  ['protective_pads','#94b4a7','#d9d4b1'],
  ['damp_rock','#8ab5cf','#d2ecf1'],
  ['heat_rock','#d99c79','#f4d49a'],
  ['smooth_rock','#c7b086','#edddaf'],
  ['icy_rock','#a8ccd7','#e6f3f4'],
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
