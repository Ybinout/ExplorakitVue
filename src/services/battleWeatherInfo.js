// Match RiftMon's current engine: snow uses Hail damage, and sand does not
// currently grant the later-generation Rock Sp. Def bonus. Never promise it here.
const descriptions={
 rain:{fr:{name:'Pluie',effects:['Attaques Eau : puissance ×1,5. Attaques Feu : puissance ×0,5.','Fatal-Foudre et Vent Violent ignorent le test de précision.','Aurore, Synthèse et Rayon Lune rendent ¼ des PV max.']},en:{name:'Rain',effects:['Water moves: power ×1.5. Fire moves: power ×0.5.','Thunder and Hurricane bypass the accuracy check.','Morning Sun, Synthesis and Moonlight restore ¼ of maximum HP.']}},
 sun:{fr:{name:'Soleil',effects:['Attaques Feu : puissance ×1,5. Attaques Eau : puissance ×0,5.','Lance-Soleil et Lame Solaire se lancent sans tour de charge.','Aurore, Synthèse et Rayon Lune rendent environ ⅔ des PV max.']},en:{name:'Sun',effects:['Fire moves: power ×1.5. Water moves: power ×0.5.','Solar Beam and Solar Blade need no charging turn.','Morning Sun, Synthesis and Moonlight restore about ⅔ of maximum HP.']}},
 sandstorm:{fr:{name:'Tempête de sable',effects:['Retire ¹⁄₁₆ des PV max en fin de tour aux Pokémon qui ne sont ni Roche, ni Sol, ni Acier, sauf protection.','Aurore, Synthèse et Rayon Lune rendent ¼ des PV max.','Des talents comme Baigne Sable ou Force Sable profitent de cette météo.']},en:{name:'Sandstorm',effects:['Removes ¹⁄₁₆ of maximum HP each turn from Pokémon other than Rock, Ground or Steel types, unless protected.','Morning Sun, Synthesis and Moonlight restore ¼ of maximum HP.','Abilities such as Sand Rush and Sand Force benefit from this weather.']}},
 hail:{fr:{name:'Neige / Grêle',effects:['RiftMon applique les règles de la grêle : les Pokémon non Glace perdent ¹⁄₁₆ de leurs PV max en fin de tour, sauf protection.','Blizzard ignore le test de précision. Voile Aurore peut être utilisé.','Aurore, Synthèse et Rayon Lune rendent ¼ des PV max.']},en:{name:'Snow / Hail',effects:['RiftMon uses hail rules: non-Ice Pokémon lose ¹⁄₁₆ of maximum HP each turn, unless protected.','Blizzard bypasses the accuracy check. Aurora Veil can be used.','Morning Sun, Synthesis and Moonlight restore ¼ of maximum HP.']}}
};
export function battleWeatherInfo(kind,language='fr'){
 const item=descriptions[kind]?.[language==='en'?'en':'fr'];
 return item?{...item,effects:[...item.effects],note:language==='en'?'Abilities and protections can change these effects.':'Les talents et protections peuvent modifier ces effets.'}:null;
}
export function battleWeatherDuration(metadata,language='fr'){
 if(metadata?.persistent)return language==='en'?'Map weather · no turn limit':'Météo du lieu · sans limite de tours';
 const turns=Number(metadata?.turns);
 if(!Number.isFinite(turns)||turns<=0)return '';
 const n=Math.min(99,Math.floor(turns));return language==='en'?`${n} turn${n>1?'s':''} remaining`:`${n} tour${n>1?'s':''} restant${n>1?'s':''}`;
}
