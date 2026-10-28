const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
const TAU=Math.PI*2;
// One small native-resolution texture, refreshed at 30 Hz in the existing world loop.
const SIZE=384,HALF=SIZE/2;
let surface=null,surfaceKey='';
const motes=Array.from({length:64},(_,i)=>({phase:(i*.61803398875)%1,angle:(i*i*.713+i*2.13)%TAU,radius:108+i%7*7,size:i%9===0?3:2}));
export function releaseMirrorEffects(){if(surface){surface.width=surface.height=0;surface=null;}surfaceKey='';}
export function riftCenter(state){return{x:(state?.rift?.x??13)*32+16,y:(state?.rift?.y??10)*32+16};}
const violetSheets=new WeakMap();
export function violetTrainerSheet(source){
  if(!source?.complete||!source.naturalWidth)return null;
  if(violetSheets.has(source))return violetSheets.get(source);
  const canvas=document.createElement('canvas');canvas.width=source.naturalWidth;canvas.height=source.naturalHeight;
  const c=canvas.getContext('2d');c.drawImage(source,0,0);const frame=c.getImageData(0,0,canvas.width,canvas.height);
  const colors=[[28,8,52],[61,20,100],[105,40,156],[157,74,210],[208,132,248]];
  for(let i=0;i<frame.data.length;i+=4){if(!frame.data[i+3])continue;const light=(frame.data[i]*.25+frame.data[i+1]*.6+frame.data[i+2]*.15)/256;const color=colors[Math.min(4,Math.floor(light*5))];for(let j=0;j<3;j++)frame.data[i+j]=color[j];}
  c.putImageData(frame,0,0);violetSheets.set(source,canvas);return canvas;
}
export function mirrorScenePose(scene,now,motion=true){
  const t=scene?clamp((now-scene.startedAt)/Math.max(1,scene.duration)):1;
  const opening=scene?.phase==='opening',closing=scene?.phase==='closing';
  // Creak, split and lift throughout the eight seconds, rather than snap open early.
  const spread=opening?smooth((t-.06)/.92):closing?1-smooth((t-.15)/.63):1;
  const impact=opening?smooth(t/.07)*(1-smooth((t-.9)/.1))*(.28+.64*smooth(t/.8))
    :closing?Math.sin(t*Math.PI)*.6:0;
  return {t,spread,shakeX:motion?Math.sin(t*381)*impact*4:0,shakeY:motion?Math.sin(t*297+.7)*impact*2.8:0,
    cloneAlpha:scene?.phase==='emerging'?smooth((t-.13)/.55):1,
    cloneProgress:scene?.phase==='emerging'?smooth((t-.16)/.8):1};
}
export function mirrorCameraTarget(scene,now,player,state,motion=true){
  if(scene?.map!=='route2_maison'||scene.phase!=='opening')return player;
  const {t}=mirrorScenePose(scene,now,motion),center=riftCenter(state);
  // Show the middle of the room on a phone, then return gently before control resumes.
  const blend=motion?smooth(t/.18)*(1-smooth((t-.83)/.17)):1;
  return {...player,x:player.x+(center.x-player.x)*blend,y:player.y+(center.y-player.y)*blend};
}
function jaggedHole(c){
  c.beginPath();c.moveTo(-78,-10);
  for(const[x,y]of[[-67,-29],[-49,-31],[-30,-43],[-13,-38],[8,-47],[30,-37],[48,-38],[57,-24],[72,-20],[77,-3],[69,12],[72,25],[51,29],[38,42],[19,39],[2,48],[-15,40],[-33,44],[-48,30],[-64,29],[-62,15],[-78,8]])c.lineTo(x,y);
  c.closePath();
}
function floorDamage(c,spread=1,motion=true){
  const open=Math.max(.02,spread);
  c.save();
  c.strokeStyle='#151421';c.lineWidth=2;
  for(let i=0;i<9;i++){
    const a=i*2.399,dx=Math.cos(a),dy=Math.sin(a)*.62,reach=(74+i%3*11)*(.16+.84*open);
    c.beginPath();c.moveTo(dx*12,dy*12);c.lineTo(dx*reach*.64+Math.sin(i)*5,dy*reach*.64);c.lineTo(dx*reach,dy*reach+Math.sin(i*7)*5);c.stroke();
    if(open>.4){c.beginPath();c.moveTo(dx*reach*.65,dy*reach*.65);c.lineTo(dx*reach*.9+9,dy*reach*.8-6);c.stroke();}
  }
  c.save();c.scale(open,Math.max(.035,open));jaggedHole(c);c.fillStyle='#080a14';c.fill();c.strokeStyle='#1c1d2c';c.lineWidth=5;c.stroke();c.strokeStyle='#676577';c.lineWidth=1.5;c.stroke();c.restore();
  for(let i=0;i<14;i++){
    const side=i%2?-1:1,row=Math.floor(i/2)-3,spreadRow=smooth((open-Math.abs(row)*.055)/.8);
    const y=row*13,edge=Math.sqrt(1-Math.pow(y/56,2))*66;
    const x=side*(edge*(.2+.8*spreadRow)+12+(i%3)*3);
    c.save();c.translate(x,y);c.rotate(side*(.03+(i%3)*.045)*spreadRow);c.scale(side,1);
    if(motion&&open<.98)c.translate(0,Math.sin(open*22+i)*spreadRow*1.8);
    c.fillStyle='#171a29';c.fillRect(-13,-2,36,10);
    c.beginPath();c.moveTo(-18,-5);c.lineTo(23,-5);c.lineTo(23,5);c.lineTo(-17,5);c.lineTo(-9,1);c.lineTo(-17,-1);c.closePath();
    c.fillStyle=i%3?'#3e4559':'#4b5063';c.fill();
    c.strokeStyle='#646c7d';c.lineWidth=1;c.beginPath();c.moveTo(-14,-4);c.lineTo(22,-4);c.stroke();
    c.strokeStyle='#293043';c.beginPath();c.moveTo(-6,1);c.lineTo(18,1);c.stroke();c.restore();
  }
  c.restore();
}
function orbitPoint(m,p,clock){
  const r=7+m.radius*Math.pow(1-p,1.18),a=m.angle+p*4.5+clock*.12;
  return{x:Math.cos(a)*r,y:Math.sin(a)*r*.6-5};
}
function drawVortex(c,clock,strength,motion){
  c.save();c.globalAlpha=strength;
  c.save();c.scale(1,.68);
  const aura=c.createRadialGradient(0,0,27,0,0,150);aura.addColorStop(0,'#bd7bff30');aura.addColorStop(.45,'#8e48da38');aura.addColorStop(1,'#9653d800');
  c.fillStyle=aura;c.fillRect(-150,-150,300,300);c.restore();
  c.save();c.scale(1,.6);
  c.beginPath();c.arc(0,0,75,0,TAU);c.clip();
  const deep=c.createRadialGradient(-7,-3,2,0,0,78);deep.addColorStop(0,'#02030a');deep.addColorStop(.35,'#060512');deep.addColorStop(.64,'#251044');deep.addColorStop(.85,'#6833ac');deep.addColorStop(1,'#d8a9fc');
  c.fillStyle=deep;c.fillRect(-80,-80,160,160);
  // Braided accretion currents with a bright edge, around an unmistakably dark core.
  for(let arm=0;arm<6;arm++){
    c.beginPath();
    for(let step=0;step<=30;step++){
      const p=step/30,r=21+p*61,a=arm*TAU/6+p*2.85-clock*.5,x=Math.cos(a)*r,y=Math.sin(a)*r;
      if(!step)c.moveTo(x,y);else c.lineTo(x,y);
    }
    c.strokeStyle=arm%2?'#9c5de766':'#7045b9a0';c.lineWidth=7;c.stroke();
    c.strokeStyle=arm%2?'#e9c9ffb0':'#ae80edc0';c.lineWidth=1.6;c.stroke();
  }
  const horizon=c.createRadialGradient(-6,-2,12,0,0,39);horizon.addColorStop(0,'#020309');horizon.addColorStop(.7,'#03040df8');horizon.addColorStop(1,'#16092100');
  c.fillStyle=horizon;c.beginPath();c.arc(0,0,40,0,TAU);c.fill();
  for(let i=0;i<7;i++){
    const angle=i*.97-clock*.22;
    c.beginPath();c.arc(0,0,69+i%3*2,angle,angle+.25+(i%2)*.18);c.strokeStyle=i%2?'#ecceffdd':'#ae6fec';c.lineWidth=i%3===0?3:1.5;c.stroke();
  }
  c.restore();
  if(motion){
    for(const m of motes){
      const p=(clock/4.8+m.phase)%1,point=orbitPoint(m,p,clock),tail=orbitPoint(m,Math.max(0,p-.035),clock);
      c.globalAlpha=strength*smooth(p/.17)*(1-smooth((p-.85)/.15));
      c.strokeStyle='#a46ae384';c.lineWidth=m.size===3?2:1;c.beginPath();c.moveTo(tail.x,tail.y);c.lineTo(point.x,point.y);c.stroke();
      c.fillStyle=m.size===3?'#f2d8ff':'#c390ee';c.fillRect(Math.round(point.x),Math.round(point.y),m.size,m.size);
    }
    for(let i=0;i<10;i++){
      const p=(clock/6.8+i*.273)%1,m={angle:i*2.399,radius:137,size:3},point=orbitPoint(m,p,clock);
      c.globalAlpha=strength*Math.sin(p*Math.PI)*.8;c.save();c.translate(Math.round(point.x),Math.round(point.y));c.rotate(i+p*5);c.fillStyle=i%2?'#6a627c':'#484456';c.fillRect(-3,-2,7,4);c.fillStyle='#a792be';c.fillRect(-3,-2,5,1);c.restore();
    }
  }
  c.restore();
}
function renderTexture(state,scene,now,motion){
  const frame=Math.floor(now/(1000/30)),tick=motion&&(state.stage!=='complete'||scene)?frame:0;
  const pose=mirrorScenePose(scene,frame*(1000/30),motion),phase=scene?.phase||'',key=[tick,phase,Math.round(pose.t*240),state.stage,motion].join(':');
  if(!surface){surface=document.createElement('canvas');surface.width=surface.height=SIZE;}
  if(surfaceKey===key)return surface;
  surfaceKey=key;const c=surface.getContext('2d');c.clearRect(0,0,SIZE,SIZE);c.save();c.translate(HALF,HALF);
  const opening=phase==='opening',spread=opening?pose.spread:1;
  c.globalAlpha=opening?smooth(pose.t/.11):1;
  floorDamage(c,motion?spread:1,motion);c.globalAlpha=1;
  if(state.stage!=='complete'){
    c.save();const growth=motion?pose.spread:phase==='closing'?1-smooth(pose.t):1;
    c.scale(Math.max(.002,growth),Math.max(.002,growth));
    drawVortex(c,motion?tick/30:0,opening?smooth((pose.t-.05)/.28):1,motion);c.restore();
  }
  if(motion&&['opening','closing'].includes(phase)){
    for(let i=0;i<42;i++){
      const p=(pose.t*1.8+i*.173)%1,x=Math.sin(i*2.39)*133+Math.sin(p*6+i)*8,y=-142+p*216;
      c.globalAlpha=Math.sin(pose.t*Math.PI)*(1-p)*(.15+(i%4)*.09);c.fillStyle=i%3?'#afa3bc':'#e2d4eb';c.fillRect(Math.round(x),Math.round(y),i%4===0?3:2,2+i%3);
    }
  }
  c.restore();return surface;
}
export function drawMirrorGround(c,map,state,scene,now,motion=true){
  if(!state?.ruined){releaseMirrorEffects();return;}
  if(map==='route2'){
    releaseMirrorEffects();
    // Only the actual Route 2 house: damaged roof tiles, a cracked facade and broken glass.
    c.save();c.fillStyle='#24202b';
    for(const[x,y,w,h]of[[515,115,12,9],[524,122,16,7],[581,96,10,8],[586,103,17,7],[547,145,11,7]])c.fillRect(x,y,w,h);
    c.fillStyle='#181622';c.beginPath();c.moveTo(571,122);c.lineTo(580,117);c.lineTo(587,123);c.lineTo(600,122);c.lineTo(605,139);c.lineTo(596,148);c.lineTo(578,144);c.closePath();c.fill();
    c.fillStyle='#8c7355';c.fillRect(577,122,4,21);c.fillRect(573,133,26,3);c.fillStyle='#b49a70';c.fillRect(577,122,2,16);c.fillRect(587,122,8,2);
    c.strokeStyle='#3c3038';c.lineWidth=2;c.beginPath();c.moveTo(596,184);c.lineTo(589,195);c.lineTo(597,205);c.lineTo(591,221);c.stroke();
    c.beginPath();c.moveTo(613,225);c.lineTo(607,234);c.lineTo(616,242);c.lineTo(610,250);c.stroke();
    c.fillStyle='#201d31';c.fillRect(523,230,9,12);c.fillRect(542,228,11,7);c.fillStyle='#9c8c93';c.fillRect(541,233,3,3);
    c.fillStyle='#746144';for(const[x,y]of[[612,254],[619,258],[625,251],[608,260]])c.fillRect(x,y,6,3);
    c.restore();return;
  }
  if(map!=='route2_maison'){releaseMirrorEffects();return;}
  const activeScene=scene?.map===map?scene:null,center=riftCenter(state);
  c.drawImage(renderTexture(state,activeScene,now,motion),Math.round(center.x-HALF),Math.round(center.y-HALF));
}
export function drawMirrorClone(c,map,state,scene,now,source,motion=true){
  if(map!=='route2_maison'||state?.stage!=='clone')return;
  const sheet=violetTrainerSheet(source);if(!sheet)return;
  const center=riftCenter(state);
  const p=mirrorScenePose(scene?.map===map?scene:null,now,motion),x=center.x+(state.clone.x*32+16-center.x)*p.cloneProgress,y=center.y+(state.clone.y*32+16-center.y)*p.cloneProgress;
  c.save();c.globalAlpha=p.cloneAlpha;
  c.fillStyle='#a365d84d';c.beginPath();c.ellipse(x,y+12,21,7,0,0,Math.PI*2);c.fill();
  c.drawImage(sheet,0,0,64,64,Math.round(x-32),Math.round(y-42-(1-p.cloneProgress)*13),64,64);c.restore();
}
