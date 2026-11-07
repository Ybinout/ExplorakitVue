// Read only public simulator events. Never infer damage from a move's name.
const key=p=>p?`${p.side}:${p.slot}`:'';
export function doubleMoveVisual(events,index,active=[]) {
 const move=events[index],next=[];
 for(let n=index+1;n<events.length;n++){const e=events[n];if(['move','cant','turn','upkeep'].includes(e.kind))break;next.push(e);}
 const prepared=next.some(e=>e.kind==='-prepare');
 const failed=next.some(e=>e.kind==='-fail'&&key(e.actor)===key(move.actor));
 const results=new Map();
 const add=p=>{if(p&&!results.has(key(p)))results.set(key(p),{...p,connected:!failed&&!prepared,hits:0,critical:false});};
 if(['allAdjacent','allAdjacentFoes'].includes(move.moveTarget)){
  for(let side=0;side<2;side++)for(let slot=0;slot<2;slot++)if(active[side]?.[slot]&&!active[side][slot].fainted&&(side!==move.actor.side||move.moveTarget==='allAdjacent'&&slot!==move.actor.slot))add({side,slot});
 }else add(move.target||(['self','allySide'].includes(move.moveTarget)?move.actor:{side:1-move.actor.side,slot:0}));
 for(const e of next){
  const direct=e.kind==='-damage'&&e.direct!==false;
  if(direct||e.kind==='-immune'||move.category==='Status'&&['-status','-boost','-unboost','-heal'].includes(e.kind))add(e.actor);
  const p=results.get(key(e.kind==='-miss'?e.target:e.actor));if(!p)continue;
  if(['-miss','-immune'].includes(e.kind)||e.kind==='-activate'&&/Protect|Wide Guard|Mat Block|Quick Guard/.test(e.effect))p.connected=false;
  if(e.kind==='-crit')p.critical=true;
  if(direct)p.hits++;
 }
 return {prepared,failed,targets:[...results.values()],events:next};
}
