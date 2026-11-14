const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x));
export const GROUND_DEBRIS=Object.freeze({Water:'drop',Fire:'flame',Electric:'bolt',Ice:'crystal',Grass:'leaf',Rock:'stone',Ground:'earth',Flying:'feather',Bug:'leaf',Steel:'metal',Poison:'bubble',Ghost:'wisp',Dark:'shadow',Psychic:'lens',Fairy:'star',Dragon:'dragon',Fighting:'earth',Normal:'earth'});
export function debrisPoint(target,t,n,seed,unit=1){
 const delay=seed*.13,landAt=.66+(n%3)*.065,p=clamp((t-delay)/(landAt-delay)),ground=target.groundY??target.y+40*unit;
 const spread=(18+seed*56)*unit*(n%2?1:-1),lift=(16+seed*32)*unit;
 return{x:target.x+spread*p,y:target.y+(ground-target.y)*p-4*lift*p*(1-p),ground,landed:p>=1,fade:t<delay?0:Math.max(0,Math.min(1,(1-t)*3.5)),progress:p};
}
export function drawGroundDebris(r,targets,t,stage){
 r.stats.groundParticles=0;if(stage!=='impact'||r.fx.damageClass==='status'||r.fx.prepare||r.fx.result?.success===false)return;
 const c=r.c,s=r.unit,kind=GROUND_DEBRIS[r.fx.moveType]||'earth',live=targets.filter(p=>p.connected!==false),budget=Math.max(4,Math.floor(18*r.quality)),count=Math.floor(budget/Math.max(1,live.length));
 if(!live.length)return;
 c.save();
 for(const target of live)for(let n=0;n<count;n++){
  const seed=r.seeds[n*3+7],p=debrisPoint(target,t,n,seed,s),size=(1.8+seed*2.8)*s*(1-p.progress*.3);c.globalAlpha=p.fade*.72;r.stats.groundParticles++;
  if(p.landed){
   c.beginPath();c.ellipse(p.x,p.ground,size*(kind==='drop'?3.6:2),size*.45,0,0,TAU);c.strokeStyle=r.palette.ink;c.lineWidth=s;c.stroke();
   if(kind==='drop'||kind==='bubble')continue;
  }else{c.globalAlpha=p.fade*.13;c.beginPath();c.ellipse(p.x,p.ground,size*1.7,size*.4,0,0,TAU);c.fillStyle=r.palette.dark;c.fill();c.globalAlpha=p.fade*.8;}
  r.particle(kind,p.x,p.y,size,n*.8+t*(n%2?2:-2));
 }
 c.restore();
}
