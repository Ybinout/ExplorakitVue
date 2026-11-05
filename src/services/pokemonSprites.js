import manifest from '@/data/pokemonSpriteManifest.json';

const shinyValue=value=>value===true||value===1||value==='1';
const revision='bw5-safari-v1',shinyRevision='bw5-shiny-gif-v2';
let motionEnabled=true;
export function setPokemonSpriteMotion(preferences){motionEnabled=preferences?.animationsEnabled!==false;}
export function pokemonSpriteKey(pokemon, side='front') {
  const source=typeof pokemon==='object'&&pokemon?pokemon:{id:pokemon};
  const battle=source.__battle||{},illusion=battle.illusion;
  const id=Number(illusion?.id||battle.transformSpriteId||battle.formSpriteId||source.data?.id||source.pokemonId||source.spriteId||source.id);
  if(!Number.isInteger(id)||id<1)return null;
  const shiny=shinyValue(illusion?illusion.shiny:battle.transformed&&Object.hasOwn(battle,'transformSpriteShiny')?battle.transformSpriteShiny:source.shiny);
  const folder=(shiny?'shiny/':'')+(side==='back'?'back':'front');
  const visualGender=illusion?illusion.gender:battle.transformed?battle.transformSpriteGender:source.gender;
  const gender=visualGender==='female'?'f':visualGender==='male'?'m':null;
  const candidate=folder+'/'+id+(gender?'-'+gender:'');
  return manifest[candidate]?candidate:folder+'/'+id;
}
export function pokemonSprite(pokemon,{side='front',animated=false}={}) {
  const key=pokemonSpriteKey(pokemon,side);
  if(!key)return '';
  const available=!!manifest[key],motion=animated&&available&&motionEnabled&&!(typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  return `${process.env.BASE_URL}img/pokemon/${motion?'animated/':''}${key}.${motion?'webp':'png'}?v=${key.startsWith('shiny/')?shinyRevision:revision}`;
}
export function pokemonSpriteMetrics(src) {
  const key=String(src||'').split('/img/pokemon/')[1]?.replace(/^animated\//,'').replace(/\.(?:webp|png)(?:[?#].*)?$/,'');
  return manifest[key]||null;
}
const missing='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="22" fill="#dce9ef" stroke="#41697a" stroke-width="3"/><path d="M10 32h44" stroke="#41697a" stroke-width="3"/><circle cx="32" cy="32" r="7" fill="#f6fafc" stroke="#41697a" stroke-width="3"/></svg>');
export function pokemonSpriteFallback(event) {
  const image=event?.target;
  if(image?.tagName!=='IMG'||!image.src.includes('/img/pokemon/'))return;
  const current=image.src;
  if(current.includes('/animated/'))image.src=current.replace('/animated/','/').replace(/\.webp(?=[?#]|$)/,'.png');
  else if(current.includes('/shiny/'))image.src=current.replace('/shiny/','/');
  else if(/-([mf])\.png(?:[?#]|$)/.test(current))image.src=current.replace(/-[mf]\.png(?=[?#]|$)/,'.png');
  else image.src=missing;
}
