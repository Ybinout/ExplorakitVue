import {normalizeBattleField} from './battleField.js';
const screens={reflect:'reflectTurns',lightscreen:'lightScreenTurns',auroraveil:'auroraVeilTurns',safeguard:'safeguardTurns',mist:'mistTurns',tailwind:'tailwindTurns',luckychant:'luckyChantTurns',wideguard:'wideGuardTurns',quickguard:'quickGuardTurns',matblock:'matBlockTurns',craftyshield:'craftyShieldTurns'};
const hazards={stealthrock:'stealthRock',spikes:'spikes',toxicspikes:'toxicSpikes',stickyweb:'stickyWeb'};
const fields={trickroom:'trickRoomTurns',wonderroom:'wonderRoomTurns',magicroom:'magicRoomTurns',gravity:'gravityTurns',mudsport:'mudSportTurns',watersport:'waterSportTurns',iondeluge:'ionDelugeTurns',fairylock:'fairyLockTurns'};
const terrains={electricterrain:'electric_terrain',grassyterrain:'grassy_terrain',mistyterrain:'misty_terrain',psychicterrain:'psychic_terrain'};
export function raidFieldModel(frame={}){
 const state=normalizeBattleField();
 (frame.sideEffects||[]).forEach((list,i)=>{const side=state.sides[i?'opponent':'player'];for(const effect of list){if(screens[effect.id])side.screens[screens[effect.id]]=effect.turns??1;if(hazards[effect.id])side.hazards[hazards[effect.id]]=effect.layers||1;}});
 for(const effect of frame.fieldEffects||[]){if(fields[effect.id])state.field[fields[effect.id]]=effect.turns??1;if(terrains[effect.id])state.terrain={kind:terrains[effect.id],turns:effect.turns??1};}
 return state;
}
