const id = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/^(move|ability|item):\s*/,'').replace(/[^a-z]/g,'');
export const STATUS_VISUALS = Object.freeze({
  poison:{label:'Poison',color:'#c78ced',accent:'#804bb1'},
  burn:{label:'Brûlure',color:'#ffb768',accent:'#ed7055'},
  confusion:{label:'Confusion',color:'#ffe59c',accent:'#d59cf0'},
  disable:{label:'Entrave',color:'#ceadf7',accent:'#7b8dca'},
  paralysis:{label:'Paralysie',color:'#ffe396',accent:'#e2b34e'},
  sleep:{label:'Sommeil',color:'#c8d5ff',accent:'#9ca9d8'},
  freeze:{label:'Gel',color:'#c1f4ff',accent:'#75bcd9'},
  attraction:{label:'Attraction',color:'#ffb7d8',accent:'#d973ac'},
  curse:{label:'Malédiction',color:'#d1a4ee',accent:'#8e71d0'},
  seed:{label:'Vampigraine',color:'#c4e8a4',accent:'#70b78c'},
  trap:{label:'Piégé',color:'#ebc49e',accent:'#bb9782'},
  recoil:{label:'Recul',color:'#ffe5be',accent:'#dcad8f'},
  cure:{label:'Rétabli',color:'#c3f5de',accent:'#81bfbd'}
});
const aliases = {
  psn:'poison',tox:'poison',badlypoison:'poison',poison:'poison',poisoned:'poison',
  brn:'burn',burn:'burn',par:'paralysis',paralyze:'paralysis',paralysis:'paralysis',
  slp:'sleep',sleep:'sleep',frz:'freeze',freeze:'freeze',confusion:'confusion',
  disable:'disable',entrave:'disable',attract:'attraction',infatuation:'attraction',
  curse:'curse',leechseed:'seed',partiallytrapped:'trap',recoil:'recoil',lifeorb:'recoil',
  struggle:'recoil',jumpkick:'recoil',highjumpkick:'recoil',corruptedlifeorb:'recoil',corruptedchoiceband:'recoil',corruptedchoicescarf:'recoil',corruptedchoicespecs:'recoil',roughskin:'recoil',ironbarbs:'recoil',rockyhelmet:'recoil',cure:'cure'
};
export function statusVisualKey(value) { return aliases[id(value)] || null; }
export function nativeStatusVisual(event) {
  if (!event) return null;
  if (event.kind === '-curestatus') return {status:'cure',phase:'cure'};
  const source = event.kind === '-damage' ? event.source : event.effect;
  if (!['-damage','-status','-start','-end','-activate','cant'].includes(event.kind)) return null;
  const status = statusVisualKey(source);
  if (!status) return null;
  return {status:event.kind==='-end'?'cure':status,phase:event.kind==='-end'?'cure':event.kind==='-status'||event.kind==='-start'?'apply':'tick'};
}
export function conditionStatusVisual(change) {
  const status = change.kind==='cure' ? 'cure' : change.key==='ailment' ? statusVisualKey(change.status) : ({confusionTurns:'confusion',disableTurns:'disable',infatuationTurns:'attraction',curseSource:'curse',leechSeedSource:'seed',trappedTurns:'trap'})[change.key];
  return status ? {status,phase:status==='cure'?'cure':'apply'} : null;
}
// Legacy single battles have textual effect events. Match only a visible fighter's
// complete display name and a resolved effect phrase, never a move/item mention.
export function narratedStatusVisual(message, fighters) {
  const line = String(message || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/’/g,"'").toLowerCase();
  const matches = fighters.filter(f=>f.pokemon).map(f=>{
    const p=f.pokemon,name=p.__battle?.illusion?.name||p.truename||p.name;
    const prefix=String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/’/g,"'").toLowerCase();
    return prefix && line.startsWith(prefix+' ') ? {...f,tail:line.slice(prefix.length+1)} : null;
  }).filter(Boolean);
  // Identical names on both sides are deliberately ambiguous: state diffs still
  // show the application; don't invent which one a legacy line refers to.
  if(matches.length!==1)return null;
  const match=matches[0],s=match.tail;
  let status=null,phase='tick';
  if (/^(?:n'est plus (?:confus|charme)|se reveille|degel|est soigne de|se libere de ses entraves)/.test(s)) {status='cure';phase='cure';}
  else if (/^(?:souffre (?:gravement )?(?:du poison|de sa brulure)|est (?:gravement )?empoisonne|est brule)/.test(s)) status=/poison/.test(s)?'poison':'burn';
  else if (/^(?:est confus|se blesse dans sa confusion)/.test(s)) status='confusion';
  else if (/^est paralyse par l'amour/.test(s)) status='attraction';
  else if (/^est paralyse/.test(s)) status='paralysis';
  else if (/^(?:dort|s'endort)/.test(s)) status='sleep';
  else if (/^est gele/.test(s)) status='freeze';
  else if (/^ne peut pas utiliser .+\(entrave\)/.test(s)) status='disable';
  else if (/^(?:subit|souffre|perd).*(?:recul|contrecoup)/.test(s)) status='recoil';
  else if (/^(?:souffre|subit|perd).*(?:malediction)/.test(s)) status='curse';
  else if (/^(?:perd|est draine).*(?:vampigraine)/.test(s)) status='seed';
  return status ? {side:match.side,status,phase,uuid:match.pokemon.uuid} : null;
}

export function statusEffectDuration(effect){return ['poison','burn'].includes(effect?.status)?1100:860;}

export function effectSourceLabel(event){const cue=nativeStatusVisual(event);if(cue)return STATUS_VISUALS[cue.status].label;return ({sandstorm:'Tempête de sable',hail:'Grêle',grassyterrain:'Terrain Herbu',stealthrock:'Piège de Roc',spikes:'Picots'})[id(event?.source)]||'';}
