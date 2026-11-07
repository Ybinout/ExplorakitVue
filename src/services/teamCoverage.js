import coverage from '../../../shared/typeCoverage';
import {createPokemonReference} from './pokemonReference';
import data from '@/data/pokemonReference.fr.json';
import traits from '../../../data/game/move_ability_flags.gen7.json';
import catalog from '../../../data/game/items.json';
const itemMap=new Map(catalog.items.map(i=>[i.key,i]));
const reference=createPokemonReference(data);
export const types=coverage.TYPES;
const equippedMoves=p=>reference.moves(p).map(m=>{const item=itemMap.get(p.heldItem);return {...m,type:m.name==='Natural Gift'?item?.natural_gift_type||m.type:m.name==='Techno Blast'&&item?.battle_effect==='drive'?item.drive_type:m.type,sound:!!traits.moves[m.name]?.sound};});
export const analyzeTeam=team=>coverage.analyze(team,equippedMoves);
export const currentTypes=coverage.types;
export const defensiveMultiplier=coverage.defense;
export function individualOffense(p,type){return coverage.offense(p,type,equippedMoves(p));}
