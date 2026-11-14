// Signature accents extend the established family/type animation; they never
// replace its timing, hit detection or authoritative target list.
export const MOVE_VARIANTS=Object.freeze({
 'Peck':'beak-lunge','Drill Peck':'corkscrew-dive','Brave Bird':'feather-dive',
 'Aqua Tail':'tidal-tail','Iron Tail':'metal-tail','Dragon Tail':'draconic-tail',
 'Megahorn':'horn-arc','X-Scissor':'crossed-blades','Leaf Blade':'leaf-blade',
 'Psycho Cut':'psychic-crescent','Air Slash':'wind-crescent','Air Cutter':'wind-crescent',
 'Body Slam':'heavy-slam','Head Smash':'rock-ram','Zen Headbutt':'mind-ram',
 'Sucker Punch':'shadow-feint','Shadow Sneak':'shade-strike',
 'Aura Sphere':'spiral-core','Focus Blast':'focusing-core','Energy Ball':'seed-core',
 'Pollen Puff':'pollen-core','Water Pulse':'water-rings','Dragon Pulse':'dragon-ripple',
 'Dark Pulse':'shadow-ripple','Tri Attack':'tricolor-stream','Signal Beam':'helix-stream',
 'Ice Beam':'crystal-stream','Solar Beam':'petal-stream','Flash Cannon':'metal-stream',
 'Hyper Voice':'sound-waves','Roost':'feather-roost','Aromatherapy':'sprout-spiral',
 'Heal Bell':'harmonic-bells','Rest':'sleeping-moon','Yawn':'sleep-bubbles'
});
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
const TRI=['#ed987d','#a8e5f4','#ffe39e'];
export function drawMoveVariant(r,targets,t,stage){
 const variant=r.fx.variant;if(!variant||!['travel','impact','aura'].includes(stage))return;
 const c=r.c,s=r.unit,k=r.palette,p=r.path;
 let particles=0;
 c.save();
 for(const target of targets){
  if(stage!=='travel'&&target.connected===false)continue;
  const dx=target.x-p.startX,dy=target.y-p.startY,angle=Math.atan2(dy,dx),u=clamp(t*t*(3-2*t));
  const x=stage==='travel'?mix(p.startX,target.x,u):target.x,y=stage==='travel'?mix(p.startY,target.y,u):target.y;
  c.globalAlpha=stage==='impact'?1-t:.9;
  if(/tail|crescent|blade|horn/.test(variant)){
   const radius=(variant.includes('tail')?55:38)*s,spin=angle+(variant==='crossed-blades'?-.7:Math.sin(t*Math.PI)*1.3-.6);
   c.save();c.translate(x,y);c.rotate(spin);
   for(let n=0;n<(variant==='crossed-blades'?2:1);n++){
    c.save();if(n)c.rotate(Math.PI/2);c.beginPath();c.moveTo(-radius,-radius*.65);c.quadraticCurveTo(radius*.4,-radius*.2,radius,radius*.6);c.quadraticCurveTo(0,radius*.08,-radius,-radius*.65);c.fillStyle=k.ink;c.fill();c.beginPath();c.moveTo(-radius,-radius*.65);c.quadraticCurveTo(radius*.4,-radius*.2,radius,radius*.6);c.strokeStyle=k.light;c.lineWidth=3*s;c.stroke();c.restore();
   }c.restore();
   if(variant==='leaf-blade'||variant==='tidal-tail')for(let n=0;n<3;n++){r.particle(variant==='leaf-blade'?'leaf':'drop',x+Math.sin(n*2.4+t*4)*30*s,y+Math.cos(n*2.4+t*4)*20*s,5*s,n+t);particles++;}
  }else if(/dive|lunge|ram|feint|strike/.test(variant)){
   const ghost=variant.includes('shadow')||variant.includes('shade'),kind=ghost?'shadow':variant==='rock-ram'?'stone':variant==='mind-ram'?'lens':'feather';
   for(let n=0;n<Math.max(2,Math.floor(5*r.quality/r.targetCount));n++){const q=clamp(u-n*.075),off=Math.sin(t*9+n)*12*s;c.globalAlpha=(1-n*.16)*(stage==='impact'?1-t:1);r.particle(kind,mix(p.startX,target.x,q)-Math.sin(angle)*off,mix(p.startY,target.y,q)+Math.cos(angle)*off,(15-n*1.5)*s,angle+t*(variant==='corkscrew-dive'?8:2));particles++;}
  }else if(variant==='heavy-slam'){
   if(stage==='impact'){const ground=target.groundY??y+30*s;c.beginPath();c.ellipse(x,ground,(25+t*70)*s,(8+t*16)*s,0,0,TAU);c.strokeStyle=k.light;c.lineWidth=(5-3*t)*s;c.stroke();for(let n=0;n<4;n++){r.particle('earth',x+Math.cos(n*TAU/4)*(20+t*50)*s,ground-Math.sin(t*Math.PI)*20*s,7*s,n+t);particles++;}}
  }else if(/core|rings|ripple|helix|stream|waves/.test(variant)){
   if(variant==='tricolor-stream'){
    for(let n=0;n<3;n++){const a=t*11+n*TAU/3,rr=22*s;c.beginPath();c.arc(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.7,8*s,0,TAU);c.fillStyle=TRI[n];c.fill();particles++;}
   }else if(variant==='crystal-stream'||variant==='petal-stream'||variant==='metal-stream'){
    for(let n=0;n<Math.max(2,Math.floor(6*r.quality/r.targetCount));n++){const q=clamp(u-n*.09),off=Math.sin(t*12-n*1.8)*12*s;r.particle(variant==='crystal-stream'?'crystal':variant==='petal-stream'?'leaf':'metal',mix(p.startX,target.x,q)-Math.sin(angle)*off,mix(p.startY,target.y,q)+Math.cos(angle)*off,6*s,angle+t*4+n);particles++;}
   }else if(variant==='seed-core'||variant==='pollen-core'){
    for(let n=0;n<4;n++){const a=t*6+n*TAU/4;r.particle(variant==='seed-core'?'leaf':'star',x+Math.cos(a)*16*s,y+Math.sin(a)*16*s,8*s,a);particles++;}
   }else{
    const count=variant==='sound-waves'?4:3;
    for(let n=0;n<count;n++){const phase=(t+n/count)%1,radius=(8+phase*30)*s;c.save();c.translate(x-Math.cos(angle)*n*14*s,y-Math.sin(angle)*n*14*s);c.rotate(angle);c.beginPath();if(variant==='sound-waves')c.arc(0,0,radius,-Math.PI*.45,Math.PI*.45);else c.ellipse(0,0,radius*.5,radius,0,0,TAU);c.strokeStyle=n%2?k.light:k.ink;c.lineWidth=(2.5-phase)*s;c.globalAlpha=(1-phase)*.9;c.stroke();c.restore();}
   }
  }else if(stage==='aura'){
   const kind=variant==='feather-roost'?'feather':variant==='sprout-spiral'?'leaf':variant==='sleep-bubbles'?'bubble':variant==='sleeping-moon'?'lens':'metal';
   for(let n=0;n<Math.max(3,Math.floor(8*r.quality/r.targetCount));n++){const a=n*2.4+t*4,rr=(20+t*25)*s;r.particle(kind,x+Math.cos(a)*rr,y+Math.sin(a)*rr*.55-25*t*s,(6+t*4)*s,a);particles++;}
  }
 }
 c.restore();r.stats.variantParticles=Math.min(24,particles);
}
