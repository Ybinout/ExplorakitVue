import { ELEMENTS } from './moveVisuals.js';
const TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=t=>1-Math.pow(1-clamp(t),3),lerp=(a,b,t)=>a+(b-a)*t;
const fract=n=>n-Math.floor(n);
const flight=t=>{const u=clamp(t);return u*u*(3-2*u);};
const SHAPES=[[0,-.5,.35,.8,0,1,-.35,.6],[.25,-1.6,-.9,.2,-.1,.15,-.45,1.5,1,-.4,.25,-.25],[0,-1.7,.8,-.4,.45,1.2,-.35,1.3,-.8,-.4],[-.8,-.65,-.3,-.95,.15,-.8,.6,-.65,.9,-.1,.55,.8,-.5,1,-.95,.25],[-1.3,.3,-.6,-.75,.6,-.55,1.3,.6,.2,1],[0,-1.3,1,.1,0,1.3,-1,-.1],[0,-.55,.45,0,0,.55,-.45,0],[0,0,-1.3,-1.1,-1.1,.6,0,1,1.1,.6,1.3,-1.1],[-1,-.7,.05,-1.2,1,-.4,.8,.8,-.5,1.1,-1.2,.2],[-1,-.7,.05,-1.2,.45,-.35,-.4,.1],[-.4,-.2,.4,-.2,0,.3],[-1.3,.5,-.8,-.8,-.25,-.1,0,-1.5,.45,-.4,1.3,-.7,.7,.8,-.2,1.2],[-.25,1.4,-.55,-.5,0,-1.5,.6,-.4,.3,1.3],[0,-1.5,.1,1.25,.6,-.4],[0,-1.5,.35,-.35,1.4,0,.35,.35,0,1.5,-.35,.35,-1.4,0,-.35,-.35],[-1.5,-.2,.65,-.4,1.5,.1,-.65,.35]];
const SPECIAL_PALETTES={
 'spirit-flames':{ink:'#9ab5ff',light:'#eee0ff',dark:'#665097',shape:'wisp'},
 recovery:{ink:'#7ce6af',light:'#ecffe6',dark:'#3e937c',shape:'star'},
 'hyper-beam':{ink:'#ffd380',light:'#ffffe0',dark:'#aa5a91',shape:'dash'}
};
const STATUS_STYLES=new Set(['sword-dance','calm-mind','dragon-dance','butterfly-dance','toxic-drops','spores','spirit-flames','recovery','barrier','hazard-rocks','hazard-spikes','hazard-web','decoy','warp','trick-room','wish','future-sight','purify','stat-weave','status-motes','status']);
const AREA_STYLES=new Set(['ground-wave','surf','mud-wave','earthquake','blizzard','rock-slide','rock-cage','draco-meteors','eruption','water-spout','heat-wave','toxic-wave','electric-field','detonation','fairy-field','hurricane','ice-spin','petal-dance','leaf-storm']);
// Seeded geometry: no random draws, DOM reads or filters in the draw loop.
export class MoveEffectRenderer {
 constructor(canvas,{quality=1,requestFrame=cb=>requestAnimationFrame(cb),cancelFrame=id=>cancelAnimationFrame(id),now=()=>performance.now()}={}){
  this.canvas=canvas;this.c=canvas.getContext('2d',{alpha:true});this.quality=quality;this.requestFrame=requestFrame;this.cancelFrame=cancelFrame;this.now=now;this.frame=0;this.closed=false;
  this.seeds=new Float32Array(216);for(let n=0;n<this.seeds.length;n++)this.seeds[n]=fract(Math.sin(n*78.233+13.7)*43758.5453);
  this.stats={frames:0,drawMs:0,maxDrawMs:0,particles:0,quality};this.lastFrame=0;this.exclusions=[];
 }
 resize(width,height,dpr=1){this.width=Math.max(1,width);this.height=Math.max(1,height);this.dpr=Math.min(1.5,Math.max(1,dpr));const w=Math.ceil(width*this.dpr),h=Math.ceil(height*this.dpr);if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}this.unit=clamp(Math.min(width/896,height/515),.58,1.35);}
 setEffect(fx,path,exclusions=[]){this.fx=fx;this.path=path;this.exclusions=exclusions;this.palette=SPECIAL_PALETTES[fx.style]||ELEMENTS[fx.moveType]||ELEMENTS.Normal;this.presence=fx.visibilityScale||1;this.prepareGlow();this.targets=(path.targets||[{x:path.targetX,y:path.targetY,groundY:path.groundY,connected:fx.result?!(fx.result.success===false||fx.result.missed||fx.result.immune||fx.result.blocked||fx.result.effectiveness===0):true}]).slice(0,4);this.areaTarget={x:this.targets.reduce((n,p)=>n+p.x,0)/Math.max(1,this.targets.length),y:this.targets.reduce((n,p)=>n+p.y,0)/Math.max(1,this.targets.length),groundY:this.targets.reduce((n,p)=>n+(p.groundY??p.y+40),0)/Math.max(1,this.targets.length),spreadX:(Math.max(...this.targets.map(p=>p.x))-Math.min(...this.targets.map(p=>p.x)))/2+120*this.unit};this.started=this.now();this.stop();this.closed=false;this.paintAt(0);this.schedule();}
 duration(){return this.fx.stage==='windup'?(this.fx.windupMs||180):this.fx.stage==='travel'?(this.fx.travelMs||360):this.fx.stage==='drain'?560:(this.fx.impactMs||500);}
 schedule(){if(this.closed||this.frame||!this.c||['await','idle'].includes(this.fx?.stage))return;this.frame=this.requestFrame(time=>{this.frame=0;if(this.closed)return;const elapsed=this.now()-this.started;if(time-this.lastFrame>=(this.quality<.6?32:15)){this.lastFrame=time;this.paintAt(elapsed);}if(elapsed<this.duration())this.schedule();});}
 stop(){if(this.frame)this.cancelFrame(this.frame);this.frame=0;}
 clear(){this.stop();this.c?.clearRect(0,0,this.canvas.width,this.canvas.height);}
 dispose(){if(this.glow)this.glow.width=this.glow.height=0;this.glow=null;this.closed=true;this.clear();this.canvas.width=0;this.canvas.height=0;this.c=null;}
 prepareGlow(){
  const key=this.palette.ink+this.palette.light;if(this.glowKey===key)return;this.glowKey=key;
  const doc=this.canvas.ownerDocument;if(!doc)return;
  if(!this.glow)this.glow=doc.createElement('canvas');this.glow.width=this.glow.height=96;
  const c=this.glow.getContext('2d'),g=c.createRadialGradient(48,48,2,48,48,47);
  g.addColorStop(0,this.palette.light+'e8');g.addColorStop(.22,this.palette.ink+'bb');g.addColorStop(.6,this.palette.ink+'48');g.addColorStop(1,this.palette.ink+'00');c.fillStyle=g;c.fillRect(0,0,96,96);
 }
 halo(x,y,radius,alpha=.8){if(!this.glow)return;const c=this.c;c.save();c.globalAlpha*=alpha;c.globalCompositeOperation='lighter';c.drawImage(this.glow,x-radius,y-radius,radius*2,radius*2);c.restore();}
 pathShape(points,fill,stroke,width=1){const c=this.c;c.beginPath();for(let i=0;i<points.length;i+=2){if(i===0)c.moveTo(points[i],points[i+1]);else c.lineTo(points[i],points[i+1]);}c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
 line(x1,y1,x2,y2,color,width=2){const c=this.c;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
 // Each element has its own silhouette. These are deliberately small, crisp
 // painted shapes, rather than realistic smoke textures or full-screen bloom.
 particle(kind,x,y,size,angle=0){const c=this.c,p=this.palette;c.save();c.translate(Math.round(x),Math.round(y));c.rotate(angle);c.scale(size,size);c.lineWidth=.15;c.strokeStyle=p.light;c.fillStyle=p.ink;
  switch(kind){
   case 'flame':c.beginPath();c.moveTo(0,-1.6);c.bezierCurveTo(.2,-.5,1.3,-.4,.7,.8);c.quadraticCurveTo(0,1.5,-.8,.6);c.quadraticCurveTo(-1,-.2,0,-1.6);c.fill();this.pathShape(SHAPES[0],p.light);break;
   case 'drop':c.beginPath();c.moveTo(0,-1.5);c.bezierCurveTo(.3,-.4,1.4,.3,.6,1);c.quadraticCurveTo(-.5,1.5,-.8,.5);c.quadraticCurveTo(-1,-.3,0,-1.5);c.fill();this.line(-.4,.15,-.3,.6,p.light,.18);break;
   case 'bolt':this.pathShape(SHAPES[1],p.ink,p.light,.09);break;
   case 'leaf':c.beginPath();c.moveTo(-1,1);c.quadraticCurveTo(-1.1,-1.2,1.2,-1);c.quadraticCurveTo(1.2,.5,-1,1);c.fill();this.line(-.9,.9,.8,-.7,p.light,.15);break;
   case 'crystal':this.pathShape(SHAPES[2],p.ink,p.light,.12);this.line(0,-1.3,0,1,p.light,.14);break;
   case 'fist':this.pathShape(SHAPES[3],p.ink,p.light,.12);this.line(-.5,-.5,.2,.25,p.light,.15);break;
   case 'bubble':c.beginPath();c.arc(0,0,1,0,TAU);c.fillStyle=p.dark;c.fill();c.strokeStyle=p.ink;c.lineWidth=.32;c.stroke();c.beginPath();c.arc(-.3,-.3,.25,0,TAU);c.fillStyle=p.light;c.fill();break;
   case 'earth':this.pathShape(SHAPES[4],p.ink);this.line(-.8,.1,.3,-.2,p.light,.15);break;
   case 'feather':c.beginPath();c.moveTo(-1,1);c.bezierCurveTo(-1.1,-.7,.2,-1.4,1,-1);c.quadraticCurveTo(1,.4,-1,1);c.fill();this.line(-1,1,.7,-.8,p.light,.17);this.line(-.2,.1,.7,.2,p.light,.12);break;
   case 'lens':this.pathShape(SHAPES[5],null,p.ink,.24);this.pathShape(SHAPES[6],p.light);break;
   case 'wing':this.pathShape(SHAPES[7],p.ink,p.light,.12);this.line(0,-.5,0,1.1,p.dark,.2);break;
   case 'stone':this.pathShape(SHAPES[8],p.ink,p.dark,.17);this.pathShape(SHAPES[9],p.light);break;
   case 'wisp':c.beginPath();c.moveTo(0,-1.5);c.bezierCurveTo(1.4,-1,.5,0,.9,.7);c.quadraticCurveTo(0,1.1,-.9,.4);c.quadraticCurveTo(-1.4,-.6,0,-1.5);c.fill();this.pathShape(SHAPES[10],p.light);break;
   case 'dragon':this.pathShape(SHAPES[11],p.ink,p.light,.12);break;
   case 'shadow':c.beginPath();c.moveTo(-1.4,1);c.quadraticCurveTo(1.2,.2,.5,-1.5);c.quadraticCurveTo(1.8,.7,-1.4,1);c.fillStyle=p.dark;c.fill();this.line(-.2,.6,.7,-.5,p.ink,.2);break;
   case 'metal':this.pathShape(SHAPES[12],p.ink,p.dark,.1);this.pathShape(SHAPES[13],p.light);break;
   case 'star':this.pathShape(SHAPES[14],p.ink);this.line(-.4,0,.4,0,p.light,.17);break;
   default:this.pathShape(SHAPES[15],p.light);break;
  }c.restore();
 }
 burst(x,y,t,kind=this.palette.shape,strength=1){const budget=Math.min(72,Math.ceil((12+this.fx.intensity*30)*this.quality*(this.presence>1?1.55:1))),count=Math.max(1,Math.floor(budget/this.targetCount));this.stats.particles=Math.max(this.stats.particles,count*this.targetCount);const c=this.c;for(let n=0;n<count;n++){
   const a=this.seeds[n*3]*TAU,r=(12+this.seeds[n*3+1]*70)*this.unit*ease(t)*strength*(this.presence>1?1.55:1);
   c.globalAlpha=clamp((1-t)*1.6);this.particle(kind,x+Math.cos(a)*r,y+Math.sin(a)*r*.7+t*t*25*this.unit,(2+this.seeds[n*3+2]*4)*this.unit*(this.presence>1?1.65:1)*(1-t*.55),a+t);
  }c.globalAlpha=1;
 }
 streak(x,y,angle,length,color,width){this.line(x-Math.cos(angle)*length,y-Math.sin(angle)*length,x,y,color,width);}
 bolt(x1,y1,x2,y2,t,width=4){const c=this.c,p=this.palette;c.beginPath();c.moveTo(x1,y1);for(let n=1;n<=10;n++){const u=n/10,k=Math.sin(n*11.2+Math.floor(t*8))*((n===10)?0:12*this.unit);c.lineTo(lerp(x1,x2,u)+k,lerp(y1,y2,u)-k*.4);}c.strokeStyle=p.dark;c.lineWidth=width*2.7;c.stroke();c.strokeStyle=p.ink;c.lineWidth=width*1.5;c.stroke();c.strokeStyle=p.light;c.lineWidth=width*.45;c.stroke();}
 beam(target,t){const p=this.path,c=this.c,k=this.palette,x=lerp(p.startX,target.x,ease(t)),y=lerp(p.startY,target.y,ease(t)),a=Math.atan2(y-p.startY,x-p.startX),s=this.unit,style=this.fx.style;
  if(['lightning-chain','charge-beam','volt-return'].includes(style)){this.bolt(p.startX,p.startY,x,y,t,4*s);return;}
  const stream=style==='flame-stream'||style==='dragon-breath'||style==='bubble-stream',width=(style==='hyper-beam'?19:style==='water-cannon'?14:8)*s*Math.min(this.presence,1.6)*(.65+this.fx.intensity*.6);
  if(stream){
   if(style!=='bubble-stream'){
    const length=Math.hypot(x-p.startX,y-p.startY),breadth=(style==='flame-stream'?19:13)*s*Math.min(this.presence,1.5);c.save();c.translate(p.startX,p.startY);c.rotate(a);
    for(let layer=0;layer<2;layer++){const w=breadth*(layer? .65:1);c.beginPath();c.moveTo(0,-2*s);for(let n=1;n<=16;n++){const u=n/16;c.lineTo(u*length,-w*(.2+u)*(.8+Math.sin(n*.9-t*13)*.2));}for(let n=16;n>=1;n--){const u=n/16;c.lineTo(u*length,w*(.2+u)*(.8+Math.sin(n*.9-t*13+1.3)*.2));}c.closePath();c.fillStyle=layer?k.ink:k.dark;c.fill();}
    this.line(0,0,length,0,k.light,4*s);c.restore();
   }
   for(let n=0;n<Math.floor(22*this.quality);n++){const u=fract(n/22+t*1.7),px=lerp(p.startX,x,u),py=lerp(p.startY,y,u)+Math.sin(n*2+t*12)*9*s*u;c.globalAlpha=.6+.4*u;this.particle(style==='bubble-stream'?'bubble':this.palette.shape,px,py,(4+u*7)*s,a+t*2);}c.globalAlpha=1;}
  else{this.line(p.startX,p.startY,x,y,k.dark,width*2.4);this.line(p.startX,p.startY,x,y,k.ink,width*1.5);this.line(p.startX,p.startY,x,y,k.light,width*.45);}
  if(style==='psy-beam'||style==='aurora-beam'||style==='dragon-beam'){
   for(let band=0;band<2;band++){c.beginPath();for(let n=0;n<=18;n++){const u=n/18,off=Math.sin(u*TAU*2-t*8+band*Math.PI)*13*s;const xx=lerp(p.startX,x,u)-Math.sin(a)*off,yy=lerp(p.startY,y,u)+Math.cos(a)*off;if(n===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);}c.strokeStyle=band?k.light:k.ink;c.lineWidth=(band?2:4)*s;c.stroke();}
  }
  for(let n=0;n<Math.floor(9*this.quality);n++){const u=fract(n/9+t*.65);this.particle(k.shape,lerp(p.startX,x,u)+Math.sin(n+t*7)*12*s,lerp(p.startY,y,u)+Math.cos(n+t*7)*12*s,3*s,a);}
 }
 projectile(target,t){const p=this.path,c=this.c,style=this.fx.style,s=this.unit,angle=Math.atan2(target.y-p.startY,target.x-p.startX),scale=this.presence;
  const actualHits=clamp(Number(this.fx.result?.hits)||1,1,10),multi=['seed-volley','pin-volley','rock-volley','ice-volley'].includes(style);
  const volley=multi?actualHits:style==='psy-shock'?3:/leaves|shards|star-volley/.test(style)?(this.quality<.6?2:3):1;
  const stagger=volley>1?.07:0;
  for(let n=0;n<volley;n++){
   const u=clamp((t-n*stagger)/Math.max(.35,1-(volley-1)*stagger)),progress=flight(u),arc=(style==='toxic-bomb'?65:volley>1?24+n*10:14)*s;
   const point=q=>({x:lerp(p.startX,target.x,flight(q)),y:lerp(p.startY,target.y,flight(q))-Math.sin(q*Math.PI)*arc});
   const{x,y}=point(u),size=(volley>1?8:12)*s*scale;
   for(let j=7;j>=1;j--){const q=clamp(u-j*.026),prev=point(q),next=point(clamp(u-(j-1)*.026));c.globalAlpha=(1-j/8)*.6;
    this.line(prev.x,prev.y,next.x,next.y,this.palette.ink,Math.max(1,size*(1-j/9)*.75));
    if(j%2===0)this.particle(this.palette.shape,prev.x,prev.y,Math.max(1,size*(1-j/8)*.4),angle+u*3);
   }c.globalAlpha=1;this.halo(x,y,size*2.3,.68);
   if(/orb|bomb/.test(style)||style==='psy-shock'){
    c.beginPath();c.ellipse(x,y,size*1.05,size*.95,angle+u,0,TAU);c.fillStyle=this.palette.dark;c.fill();
    this.particle(this.palette.shape,x,y,size*.9,angle+u*4);this.particle(this.palette.shape,x-size*.24,y-size*.22,size*.42,-u*2);
    if(scale>1)for(let spark=0;spark<3;spark++){const a=u*5+spark*TAU/3;this.particle(this.palette.shape,x+Math.cos(a)*size*1.25,y+Math.sin(a)*size*.9,size*.22,a);}
   }else this.particle(style==='razor-leaves'?'leaf':this.palette.shape,x,y,size,angle+progress*7+n);
  }
 }
 area(target,t,impact=false){const c=this.c,k=this.palette,s=this.unit,style=this.fx.style,x=target.x,y=target.groundY??target.y+45*s,w=Math.min(this.width*.75,Math.max(180*s,target.spreadX||250*s)),p=ease(t);
  if(style==='fairy-field'){
   const reach=Math.min(this.width*.45,155*s),count=Math.max(7,Math.floor(13*this.quality));
   this.halo(x,target.y,100*s*(.65+Math.sin(t*Math.PI)*.4),.75);
   for(let n=0;n<count;n++){const a=n*2.399+t*.55,r=(.3+this.seeds[n]*.7)*reach*(impact?.65+ease(t)*.35:1-ease(t)*.45),xx=x+Math.cos(a)*r,yy=target.y+Math.sin(a)*r*.65;
    c.globalAlpha=Math.sin(clamp(t)*Math.PI)*.95;this.particle('star',xx,yy,(8+this.seeds[n+20]*10)*s,a);this.line(xx-11*s,yy,xx+11*s,yy,k.light,1.5*s);
   }c.globalAlpha=1;
  }else if(['surf','mud-wave','toxic-wave'].includes(style)){
   const yy=y+75*s-p*150*s;c.globalAlpha=(impact?1-t*.7:.8)*.72;c.beginPath();c.moveTo(x-w,this.height+20);c.lineTo(x-w,yy);for(let n=0;n<=20;n++){const xx=x-w+n*w/10;c.lineTo(xx,yy+Math.sin(n*.65-t*5)*14*s);}c.lineTo(x+w,this.height+20);c.lineTo(x-w,this.height+20);c.closePath();const water=c.createLinearGradient(0,yy,0,yy+140*s);water.addColorStop(0,k.ink+'aa');water.addColorStop(.5,k.dark+'66');water.addColorStop(1,k.dark+'00');c.fillStyle=water;c.fill();
   c.beginPath();for(let n=0;n<=24;n++){const xx=x-w+n*w/12,crest=yy+Math.sin(n*.55-t*5)*14*s;if(n===0)c.moveTo(xx,crest);else c.lineTo(xx,crest);}c.strokeStyle=k.ink;c.lineWidth=7*s;c.stroke();c.strokeStyle=k.light;c.lineWidth=1.8*s;c.stroke();c.globalAlpha=.85;
   for(let n=0;n<14*this.quality;n++)this.particle(style==='surf'?'drop':k.shape,x-w+fract(n*.137+t*.2)*w*2,yy+Math.sin(n+t*5)*13*s,4*s,n);c.globalAlpha=1;
  }else if(style==='earthquake'){
   for(let n=0;n<7;n++){const direction=n%2?1:-1,base=x+(n-3)*28*s,reach=(impact?1:p)*90*s;c.beginPath();c.moveTo(base,y+12*s);for(let j=1;j<6;j++)c.lineTo(base+Math.sin(j*12+n)*reach*.45, y+12*s-j*reach/5);c.strokeStyle=k.dark;c.lineWidth=5*s;c.stroke();c.strokeStyle=k.light;c.lineWidth=1.2*s;c.stroke();if(p>.2)this.particle('earth',base+direction*22*s,y-9*s-Math.sin(p*Math.PI)*35*s,8*s,n+t);}
  }else if(/rock|meteors|eruption|spout/.test(style)){
   const count=Math.max(3,Math.floor(9*this.quality/this.targetCount));for(let n=0;n<count;n++){const u=clamp(t*1.8-n*.09),xx=x+(this.seeds[n*3]-.5)*w*1.7,yy=lerp(Math.max(10,y-280*s),y,u*u);if(u<=0||u>=1&&!impact)continue;
    if(style==='draco-meteors'){this.streak(xx,yy,1.2,55*s,k.ink,11*s);this.streak(xx,yy,1.2,65*s,k.light,3*s);}
    this.particle(style==='draco-meteors'?'stone':style==='eruption'?'flame':style==='water-spout'?'drop':'stone',xx,yy,(style==='rock-cage'?13:18)*s,n+u*3);}
  }else if(style==='blizzard'||style==='leaf-storm'||style==='petal-dance'||style==='hurricane'){
   const count=Math.floor(40*this.quality/this.targetCount);for(let n=0;n<count;n++){const u=fract(t*.9+this.seeds[n*3]),xx=x-w+u*w*2,yy=y-45*s+(this.seeds[n*3+1]-.5)*150*s+Math.sin(u*TAU+n)*30*s;
    if(style==='blizzard'){this.streak(xx,yy,-.25,25*s,k.light,1.5*s);this.particle('crystal',xx,yy,4*s,n+t*4);}else this.particle(style==='leaf-storm'?'leaf':style==='petal-dance'?'wing':'feather',xx,yy,(5+this.seeds[n*3+2]*4)*s,t*5+n);}
  }else if(style==='electric-field'){
   for(let n=0;n<4;n++)this.bolt(x+(n-1.5)*55*s,y-100*s,x+(n-1.5)*55*s+22*s,y,t+n,2*s);
  }else{for(let n=0;n<7;n++){const a=n*TAU/7;this.streak(x+Math.cos(a)*p*w*.6,y+Math.sin(a)*p*45*s,a,25*s,k.ink,6*s);}this.burst(x,y-20*s,t);}
 }
 status(target,t){const c=this.c,p=this.palette,s=this.unit,x=target.x,y=target.y,style=this.fx.style; c.globalAlpha=Math.sin(clamp(t)*Math.PI)*.9;
  if(style==='sword-dance'){
   for(let n=0;n<3;n++){const a=t*TAU+n*TAU/3;c.save();c.translate(x+Math.cos(a)*48*s,y+Math.sin(a)*15*s-25*s*t);c.rotate(Math.sin(a)*.4);c.scale(s,s);this.pathShape([0,-45,6,-30,4,12,-4,12,-6,-30],p.light,'#7494ae',2);this.line(-10,12,10,12,'#d8b569',4);this.line(0,12,0,28,'#856b6e',5);c.restore();}
  }else if(style==='barrier'||style==='decoy'){
   c.save();c.translate(x,y);c.scale(s*(.7+ease(t)*.4),s*(.7+ease(t)*.4));this.pathShape([0,-63,46,-40,40,23,0,58,-40,23,-46,-40],null,p.light,3);this.pathShape([0,-50,34,-32,28,18,0,44,-28,18,-34,-32],null,p.ink,5);c.restore();
  }else if(style.startsWith('hazard')){
   for(let n=0;n<5;n++){const xx=x+(n-2)*31*s,yy=(target.groundY??y+35*s)-Math.sin(t*Math.PI)*12*s;this.particle(style==='hazard-rocks'?'stone':style==='hazard-web'?'wing':'metal',xx,yy,10*s,n*.7);}
  }else if(style==='calm-mind'||style==='trick-room'||style==='warp'){
   for(let n=0;n<3;n++){c.save();c.translate(x,y);c.rotate(n*Math.PI/3+t*.7);c.strokeStyle=n%2?p.light:p.ink;c.lineWidth=2*s;c.strokeRect((-44-n*8)*s,(-44-n*8)*s,(88+n*16)*s,(88+n*16)*s);c.restore();}
  }else if(style==='toxic-drops'||style==='spores'||style==='status-motes'||style==='spirit-flames'){
   for(let n=0;n<10*this.quality;n++){const a=n*2.4,r=(16+this.seeds[n]*40)*s,xx=x+Math.cos(a)*r,yy=y-45*s+ease(t)*60*s+Math.sin(a)*r*.5;this.particle(style==='spirit-flames'?'wisp':this.palette.shape,xx,yy,(5+this.seeds[n+4]*5)*s,n+t);}
  }else{
   for(let n=0;n<15*this.quality;n++){const u=fract(t+n*.137),a=n*2.4+t*4,xx=x+Math.cos(a)*(20+u*22)*s,yy=y+35*s-u*100*s;
    this.particle(style==='recovery'||style==='wish'||style==='purify'?'star':style==='dragon-dance'?'dragon':style==='butterfly-dance'?'wing':this.palette.shape,xx,yy,(4+u*3)*s,a);}
  }c.globalAlpha=1;
 }
 impact(target,t){const c=this.c,k=this.palette,s=this.unit,x=target.x,y=target.y,style=this.fx.style;
  if(this.presence>1){this.halo(x,y,(45+this.fx.intensity*35)*s*(.65+ease(t)*.6),(1-t)*.95);const rays=Math.floor(7*this.quality);c.globalAlpha=(1-t)*.85;for(let n=0;n<rays;n++){const a=n*TAU/Math.max(1,rays)+this.seeds[n]*.5,r=(20+ease(t)*80)*s;this.streak(x+Math.cos(a)*r,y+Math.sin(a)*r*.8,a,(12+20*(1-t))*s,k.light,(2.2+this.fx.intensity*2)*s);}c.globalAlpha=1;}
  if(this.fx.family==='bite'||style==='drain-bite'){
   c.save();c.translate(x,y);c.scale(s,s);const gap=(1-ease(Math.min(1,t*3)))*24; c.globalAlpha=clamp((1-t)*2);
   for(const sign of[-1,1]){c.save();c.scale(1,sign);c.translate(0,-gap);this.pathShape([-39,-31,-25,-36,-18,-12,-5,-33,5,-8,19,-30,26,-12,39,-31,31,-43,-31,-43],k.light,k.ink,2);c.restore();}c.restore();
  }else if(this.fx.family==='claw'){
   c.globalAlpha=1-t;for(let n=0;n<3;n++){const xx=x+(n-1)*19*s;this.line(xx+25*s,y-45*s,xx-23*s,y+40*s,k.dark,10*s);this.line(xx+24*s,y-43*s,xx-22*s,y+38*s,k.light,4*s);}c.globalAlpha=1;
  }else if(this.fx.family==='punch'||this.fx.family==='charge'||style==='drain-punch'||style==='drain-charge'){
   c.globalAlpha=1-t;this.particle(this.fx.family==='punch'||style==='drain-punch'?'fist':k.shape,x,y,(28+this.fx.intensity*15)*s,Math.sin(t*12)*.1);c.globalAlpha=1;
  }
  if(style==='fire-blast'){
   c.save();c.translate(x,y);c.scale(s*(.4+ease(t)*1.1),s*(.4+ease(t)*1.1));c.globalAlpha=clamp((1-t)*1.6);
   c.beginPath();for(let n=0;n<24;n++){const a=n*TAU/24,r=(n%3===0?74:n%3===1?45:61)+Math.sin(n*3+t*5)*8;if(n===0)c.moveTo(Math.cos(a)*r,Math.sin(a)*r);else c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.globalAlpha*=.32;c.fillStyle=k.ink;c.fill();c.globalAlpha=clamp((1-t)*1.6);
   for(let n=0;n<12*this.quality;n++){const a=n*2.4+t*2;this.particle('flame',Math.cos(a)*49,Math.sin(a)*49,12+Math.sin(n+t*4)*3,a);}

   // Branching tongues evoke the recognisable fire character, not a sun disc.
   for(let n=0;n<5;n++){const a=-Math.PI/2+n*TAU/5;this.line(0,0,Math.cos(a)*68,Math.sin(a)*68,k.dark,12);this.line(0,0,Math.cos(a)*62,Math.sin(a)*62,k.ink,9);this.line(0,0,Math.cos(a)*52,Math.sin(a)*52,k.light,2);this.particle('flame',Math.cos(a)*65,Math.sin(a)*65,11,a);}c.restore();
  }else if(style==='fire-vortex'){
   c.globalAlpha=1-t;for(let n=0;n<24*this.quality;n++){const a=n*.6+t*5,r=(35+Math.sin(n)*8)*s;this.particle('flame',x+Math.cos(a)*r,y+22*s-n*3*s+Math.sin(a)*12*s,8*s,-a);}c.globalAlpha=1;
  }else if(AREA_STYLES.has(style)&&!(this.fx.fullTargets?.length>1))this.area(target,t,true);
  if(style==='volt-return'){const u=ease(t);for(let n=0;n<6*this.quality;n++)this.particle('bolt',lerp(x,this.path.startX,u),lerp(y,this.path.startY,u)+(n-3)*5*s,5*s,t*5);}
  if(this.fx.result?.critical){c.globalAlpha=1-t;for(let n=0;n<4;n++){const a=n*Math.PI/2+.4;this.streak(x+Math.cos(a)*60*s*ease(t),y+Math.sin(a)*60*s*ease(t),a,35*s,k.light,4*s);}c.globalAlpha=1;}
  this.burst(x,y,t,this.palette.shape,.6+this.fx.intensity*.65);
 }
 paintAt(ms){if(!this.c||!this.fx||!this.path)return;const began=this.now(),c=this.c,fx=this.fx,p=this.path,t=clamp(ms/this.duration()),stage=fx.stage;
  c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.width,this.height);if(t>=1)return;c.save();
  if(this.exclusions.length){c.beginPath();c.rect(0,0,this.width,this.height);for(const r of this.exclusions)c.rect(r.x-2,r.y-2,r.width+4,r.height+4);c.clip('evenodd');}
  c.lineJoin='round';c.lineCap='round';this.stats.particles=0;
  const targets=this.targets;this.targetCount=Math.max(1,targets.length);
  if(stage==='windup'){
   const count=Math.floor((8+fx.intensity*12)*this.quality);for(let n=0;n<count;n++){const a=n*2.4+t*3,r=(1-t)*60*this.unit;this.particle(this.palette.shape,p.startX+Math.cos(a)*r,p.startY+Math.sin(a)*r*.55,(2+t*3)*this.unit*(this.presence>1?1.7:1),a);}
  }else {
  if(stage==='travel'&&AREA_STYLES.has(fx.style))this.area(this.areaTarget,t);
  for(const target of targets){
   if(stage==='travel'){
    if(fx.style==='sky-thunder'){this.bolt(target.x-35*this.unit,0,target.x,target.y*ease(t),t,6*this.unit);if(t>.2){this.bolt(target.x-20*this.unit,target.y*.35,target.x-65*this.unit,target.y*.75*ease(t),t+.2,2*this.unit);this.bolt(target.x-15*this.unit,target.y*.48,target.x+55*this.unit,target.y*.85*ease(t),t+.6,2*this.unit);}}
    else if(AREA_STYLES.has(fx.style)){/* The field is painted once, with individual impacts below. */}
    else if(fx.family==='beam'||fx.style==='volt-return')this.beam(target,t);
    else if(fx.style==='fire-vortex')this.projectile(target,t);
    else if(fx.style==='drain-vines'){const a=Math.sin(t*12)*12*this.unit;c.beginPath();c.moveTo(p.startX,p.startY);c.quadraticCurveTo((p.startX+target.x)/2,(p.startY+target.y)/2+a,target.x,target.y);c.strokeStyle=this.palette.ink;c.lineWidth=3*this.unit;c.stroke();this.particle('leaf',lerp(p.startX,target.x,ease(t)),lerp(p.startY,target.y,ease(t)),9*this.unit,t*6);}
    else if(STATUS_STYLES.has(fx.style)||fx.damageClass==='status'){if(target.connected!==false)this.status(target,t);}
    else if(['projectile','drain'].includes(fx.family))this.projectile(target,t);
    else if(['charge','punch'].includes(fx.family)){
     const a=Math.atan2(target.y-p.startY,target.x-p.startX),x=lerp(p.startX,target.x,ease(t)),y=lerp(p.startY,target.y,ease(t));for(let n=0;n<5;n++)this.streak(x-n*10*this.unit,y+n*6*this.unit,a,50*this.unit,this.palette.ink,(4-n*.5)*this.unit);
    }
   }else if(stage==='impact'&&target.connected!==false){
    const hits=clamp(Number(fx.result?.hits)||1,1,10),pulse=hits>1?fract(t*hits):t;this.impact(target,pulse);
   }else if(stage==='aura'&&target.connected!==false)this.status(target,t);
   else if(stage==='drain'){
    for(let n=0;n<8*this.quality;n++){const u=clamp(t*1.4-n*.05),x=lerp(target.x,p.startX,ease(u)),y=lerp(target.y,p.startY,ease(u))-Math.sin(u*Math.PI)*32*this.unit;this.particle('star',x,y,(3+Math.sin(u*Math.PI)*3)*this.unit,u*TAU);}
   }else if(stage==='miss'){
    c.globalAlpha=(1-t)*.5;for(let n=0;n<5;n++)this.streak(target.x+(n-2)*17*this.unit,target.y-t*30*this.unit,-.6,12*this.unit,this.palette.ink,2*this.unit);c.globalAlpha=1;
   }
  }
  }
  c.restore();const cost=this.now()-began;this.stats.frames++;this.stats.drawMs+=(cost-this.stats.drawMs)*.12;this.stats.maxDrawMs=Math.max(this.stats.maxDrawMs,cost);
  if(this.stats.frames>8&&this.stats.drawMs>3&&this.quality>.5)this.quality=Math.max(.45,this.quality-.15);this.stats.quality=this.quality;
 }
}
