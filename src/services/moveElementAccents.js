// Additive elemental choreography: existing move silhouettes and timing remain
// authoritative. Bounded seeded geometry, cached halos, no filters or DOM reads.
export const ELEMENT_ACCENTS = Object.freeze({
 Normal:'kinetic', Fire:'embers', Water:'splash', Electric:'arcs', Grass:'foliage', Ice:'shards',
 Fighting:'shock', Poison:'venom', Ground:'dust', Flying:'gust', Psychic:'waves', Bug:'swarm',
 Rock:'debris', Ghost:'spectral', Dragon:'draconic', Dark:'shadows', Steel:'sparks', Fairy:'stardust'
});
const TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
function curve(r,x,y,reach,angle,bend,alpha){
 const c=r.c,p=r.palette;c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;
 c.beginPath();c.moveTo(-reach*.7,0);c.bezierCurveTo(-reach*.25,-bend,reach*.35,bend,reach,0);
 c.strokeStyle=p.ink;c.lineWidth=4*r.unit;c.stroke();c.strokeStyle=p.light;c.lineWidth=1.2*r.unit;c.stroke();c.restore();
}
function motif(r,kind,x,y,t,reach,strength){
 const c=r.c,p=r.palette,s=r.unit,fade=Math.sin(t*Math.PI)*strength;
 c.save();c.globalAlpha*=fade;
 if(kind==='arcs'){
  for(let n=0;n<3;n++){const a=n*2.399+.4+Math.sin(t*6)*.25,dx=Math.cos(a)*reach,dy=Math.sin(a)*reach*.65;r.bolt(x-dx*.6,y-dy*.6,x+dx,y+dy,t+n,2.2*s);}
 }else if(kind==='foliage'||kind==='gust'||kind==='swarm'){
  for(let n=0;n<2;n++)curve(r,x,y,reach,.35+Math.sin(t*3+n)*.4+n*.8,reach*.6,kind==='swarm'?.42:.65);
 }else if(kind==='splash'){
  const ground=y+reach*.22;
  for(let n=0;n<5;n++){const a=-2.8+n*.58,d=reach*(.6+t*.35),xx=x+Math.cos(a)*d,yy=ground+Math.sin(a)*d*.7;
   c.beginPath();c.moveTo(x,ground);c.quadraticCurveTo(mix(x,xx,.65),yy-reach*.25,xx,yy);c.strokeStyle=p.ink;c.lineWidth=(5-t*3)*s;c.stroke();
   r.particle('drop',xx,yy,(5+Math.sin(t*Math.PI)*4)*s,a+.8);
  }
 }else if(kind==='embers'){
  for(let n=0;n<3;n++){const u=n-1;r.particle('flame',x+u*reach*.34,y+reach*.1-Math.sin(t*Math.PI+n*.4)*reach*.35,(15+Math.sin(t*Math.PI)*11)*s,u*.3);}
 }else if(kind==='shards'){
  for(let n=0;n<4;n++){const a=n*1.9+.7,d=(.2+t*.8)*reach;r.particle('crystal',x+Math.cos(a)*d,y+Math.sin(a)*d*.55,(15-t*8)*s,a+t*.5);}
 }else if(kind==='waves'){
  for(let n=0;n<3;n++){const u=clamp(t*1.3-n*.12),radius=(.2+u)*reach;c.globalAlpha=fade*(1-u)*.85;c.beginPath();c.ellipse(x,y,radius,radius*.42,-.45+n*.35,.15+n,Math.PI*1.55+n);c.strokeStyle=n%2?p.light:p.ink;c.lineWidth=(3.6-n*.7)*s;c.stroke();}
 }else if(kind==='spectral'||kind==='shadows'){
  for(let n=0;n<3;n++){const a=n*2.1+t*.8,xx=x+Math.cos(a)*reach*.48,yy=y+Math.sin(a)*reach*.25;
   if(kind==='spectral')r.halo(xx,yy,reach*.7,.24);
   c.globalAlpha=fade*(kind==='spectral'?.62:.82);r.particle(kind==='spectral'?'wisp':'shadow',xx,yy,(21+Math.sin(t*4+n)*8)*s,a-.5);
   curve(r,xx,yy,reach*.65,a,reach*.3,.4);
  }
 }else if(kind==='draconic'){
  for(let n=0;n<2;n++){const a=-.5+n*1.2;curve(r,x,y,reach*1.1,a,reach*.65,.82);r.particle('dragon',x+Math.cos(a+t*2)*reach*.42,y+Math.sin(a+t*2)*reach*.3,20*s,a);}
 }else if(kind==='dust'||kind==='debris'){
  const ground=y+reach*.36;
  for(let n=0;n<4;n++){const xx=x+(n-1.5)*reach*.43,yy=ground-Math.sin(t*Math.PI)*(18+n*8)*s;
   c.globalAlpha=fade*.25;c.beginPath();c.ellipse(xx,ground,reach*.3,reach*.12,-.1,0,TAU);c.fillStyle=p.ink;c.fill();
   c.globalAlpha=fade;r.particle(kind==='debris'?'stone':'earth',xx,yy,(12+Math.sin(n+1)*3)*s,n+t*1.7);
  }
 }else if(kind==='venom'){
  for(let n=0;n<3;n++){const a=n*2.4+t,xx=x+Math.cos(a)*reach*.45,yy=y+Math.sin(a)*reach*.3;r.particle('bubble',xx,yy,(10+Math.sin(t*6+n)*4)*s,a);r.halo(xx,yy,24*s,.17);}
 }else if(kind==='stardust'){
  for(let n=0;n<3;n++){const a=n*2.4+t,xx=x+Math.cos(a)*reach*.6,yy=y+Math.sin(a)*reach*.4;r.particle('star',xx,yy,(11+Math.sin(t*Math.PI)*5)*s,a);r.streak(xx,yy,.2+n*.7,reach*.32,p.light,1.4*s);}
 }else {
  // Kinetic force, punches and metal use directional slashes, never a sun disc.
  const count=kind==='sparks'?7:5;
  for(let n=0;n<count;n++){const a=(n/count-.5)*2.2+.25,side=n%2?-1:1,d=reach*(.35+t*.5),xx=x+Math.cos(a)*d*side,yy=y+Math.sin(a)*d*.6;
   r.streak(xx,yy,a+(side<0?Math.PI:0),reach*(.25+.3*(1-t)),n%2?p.ink:p.light,(kind==='shock'?4:2.5)*s);
  }
 }
 c.restore();
}
export function drawElementAccents(r,stage,t){
 const kind=ELEMENT_ACCENTS[r.fx.moveType]||ELEMENT_ACCENTS.Normal;
 if(!['windup','travel','impact','aura','drain'].includes(stage))return;
 const status=r.fx.damageClass==='status',power=clamp(Number(r.fx.intensity)||.18,.18,1),s=r.unit;
 const envelope=Math.sin(t*Math.PI),budget=Math.min(42,Math.max(8,Math.floor((22+power*20)*r.quality*(status?.6:1))));
 const targets=stage==='windup'?[{x:r.path.startX,y:r.path.startY}]:r.targets;
 const count=Math.max(1,Math.floor(budget/Math.max(1,targets.length)));
 let painted=0;
 for(let index=0;index<targets.length;index++){
  const target=targets[index];if(['impact','aura','drain'].includes(stage)&&target.connected===false)continue;
  const travel=stage==='travel'&&!status&&r.fx.family!=='zone';
  const u=travel?(r.fx.family==='projectile'||r.fx.family==='drain'?t*t*(3-2*t):1-Math.pow(1-t,3)):0;
  const x=stage==='drain'?mix(target.x,r.path.startX,1-Math.pow(1-t,3)):travel?mix(r.path.startX,target.x,u):target.x;
  const y=stage==='drain'?mix(target.y,r.path.startY,1-Math.pow(1-t,3))-Math.sin(t*Math.PI)*32*s:travel?mix(r.path.startY,target.y,u)-Math.sin(t*Math.PI)*14*s:target.y;
  const reach=(status?70:travel?90:116)*(1+power*.35)*s*(stage==='windup'?.8:1),strength=status?.48:.84;
  const c=r.c;c.save();
  // One soft, local light per target. The cached96px texture avoids blur passes.
  if(stage!=='windup')r.halo(x,y,reach*.9,envelope*(status?.18:.42));
  if(stage==='impact'||stage==='aura'||stage==='travel')motif(r,kind,x,y,t,reach,strength*(travel?.65:1));
  for(let n=0;n<count;n++){
   const seed=(n*3+index*17)%180,a=r.seeds[seed]*TAU;
   let radius=(.2+r.seeds[seed+1]*.8)*reach,xx,yy,angle=a+t*2;
   if(stage==='windup'){radius*=1-t;xx=x+Math.cos(a+t*2)*radius;yy=y+Math.sin(a+t*2)*radius*.65;}
   else if(stage==='impact'){
    radius*=.2+Math.sin(t*Math.PI*.65);xx=x+Math.cos(a)*radius;yy=y+Math.sin(a)*radius*.65;
    if(['splash','debris','dust','shards'].includes(kind))yy+=t*t*38*s;
    if(['embers','spectral','venom'].includes(kind))yy-=t*60*s;
   }else {xx=x+Math.cos(a+t*2)*radius*.7;yy=y+Math.sin(a+t*2)*radius*.5;}
   const size=(4.2+r.seeds[seed+2]*6.8)*(1+power*.4)*s*(stage==='impact'?1.25:1);
   c.globalAlpha=envelope*(.45+r.seeds[seed+1]*.5)*(status?.58:.9);
   if(travel&&n%3===0)r.streak(xx,yy,Math.atan2(target.y-r.path.startY,target.x-r.path.startX),16*s,r.palette.ink,2*s);
   if(kind==='embers'&&n%2===0){r.streak(xx,yy,-1.2,10*s,r.palette.light,1.4*s);}
   else r.particle(r.palette.shape,xx,yy,size,angle);
   painted++;
  }
  c.restore();
 }
 r.stats.elementParticles=painted;
}
