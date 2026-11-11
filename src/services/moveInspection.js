import reference from '../data/pokemonReference.fr.json';
import names from '../data/gameNames.fr.json';
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const index=new Map();for(const[name,definition]of Object.entries(reference.moves)){const value={...definition,name,label:names.moves[name]||name};for(const key of[name,value.label])index.set(fold(key),value);}
export function inspectMove(name,type){const m=index.get(fold(name));return m?{...m,type:type||m.type}:null;}
export const isAreaMove=m=>['allAdjacent','allAdjacentFoes','all','allies','foeSide','allySide','allyTeam'].includes(m?.targetKind||m?.target);
