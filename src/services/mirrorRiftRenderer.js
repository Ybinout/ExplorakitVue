const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
const center={x:336,y:218};
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
  const spread=opening?smooth((t-.23)/.5):closing?1-smooth((t-.15)/.63):1;
  const impact=opening?(Math.sin(Math.PI*smooth(t/.95))*.8+Math.exp(-Math.pow((t-.44)*15,2))*.7):closing?Math.sin(t*Math.PI)*.6:0;
  return {t,spread,shakeX:motion?Math.sin(t*381)*impact*4:0,shakeY:motion?Math.sin(t*297+.7)*impact*2.8:0,
    cloneAlpha:scene?.phase==='emerging'?smooth((t-.13)/.55):1,
    cloneProgress:scene?.phase==='emerging'?smooth((t-.16)/.8):1};
}
function jaggedHole(c){c.beginPath();c.moveTo(-52,-19);for(const[x,y]of[[-32,-35],[-13,-29],[4,-36],[26,-26],[48,-29],[58,-9],[48,5],[53,20],[25,30],[9,26],[-10,35],[-27,24],[-48,25],[-59,8],[-47,-5]])c.lineTo(x,y);c.closePath();}
function floorDamage(c,spread=1){
  c.save();c.translate(center.x,center.y);c.fillStyle='#15101f';jaggedHole(c);c.fill();
  c.strokeStyle='#756b80';c.lineWidth=3;c.stroke();
  // Splintered floor boards retain the room's blue-grey palette and horizontal grain.
  for(let i=0;i<10;i++){
    const side=i%2?-1:1,y=Math.floor(i/2)*12-30,x=side*(37+spread*18);
    c.save();c.translate(x,y);c.rotate(side*(.07+(i%3)*.09)*spread);
    c.fillStyle=i%3?'#3d4356':'#515365';c.beginPath();c.moveTo(side*-27,-5);c.lineTo(side*19,-5);c.lineTo(side*9,0);c.lineTo(side*17,5);c.lineTo(side*-27,5);c.closePath();c.fill();
    c.strokeStyle='#747284';c.lineWidth=1;c.beginPath();c.moveTo(side*-24,-3);c.lineTo(side*8,-3);c.stroke();c.restore();
  }
  c.strokeStyle='#0d101b';c.lineWidth=2;
  for(let i=0;i<7;i++){const a=i*2.399,x=Math.cos(a)*53,y=Math.sin(a)*29;c.beginPath();c.moveTo(x,y);c.lineTo(x*1.3+Math.sin(i)*8,y*1.5);c.lineTo(x*1.7,y*1.9+6);c.stroke();}
  c.restore();
}
export function drawMirrorGround(c,map,state,scene,now,motion=true){
  if(!state?.ruined)return;
  if(map==='route2'){
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
  if(map!=='route2_maison')return;
  const activeScene=scene?.map===map?scene:null,pose=mirrorScenePose(activeScene,now,motion);
  const opening=activeScene?.phase==='opening';
  c.save();
  if(opening){c.globalAlpha=smooth(pose.t/.25);floorDamage(c,pose.spread);}else floorDamage(c,1);
  const alive=state.stage!=='complete';
  if(alive){
    c.save();c.translate(center.x,center.y);c.scale(Math.max(.01,pose.spread),Math.max(.01,pose.spread));
    const glow=c.createRadialGradient(0,0,3,0,0,88);glow.addColorStop(0,'#241039');glow.addColorStop(.47,'#b260ecb0');glow.addColorStop(1,'#9156ca00');c.fillStyle=glow;c.fillRect(-88,-70,176,140);
    jaggedHole(c);c.save();c.clip();c.fillStyle='#10051f';c.fillRect(-65,-40,130,80);
    const clock=motion?now*.001:0;
    for(let i=0;i<9;i++){c.strokeStyle=i%2?'#d8a0ff':'#7435bc';c.globalAlpha=.3+(i%3)*.2;c.lineWidth=i%3===0?3:1.5;c.beginPath();
      for(let j=0;j<=20;j++){const x=-62+j*6.2,y=Math.sin(j*.38+clock*(i%2?1:-1)+i)*8+(i-4)*7;(j?c.lineTo:c.moveTo).call(c,x,y);}c.stroke();}
    c.globalAlpha=1;c.strokeStyle='#b163ec';c.lineWidth=7;c.beginPath();c.moveTo(-6,-28);c.lineTo(4,-12);c.lineTo(-3,2);c.lineTo(6,16);c.lineTo(0,30);c.stroke();
    c.strokeStyle='#e3bcff';c.lineWidth=2;c.stroke();c.restore();
    c.strokeStyle='#b27adf';c.lineWidth=2;c.stroke();c.restore();
  }
  if(activeScene&&motion&&['opening','closing'].includes(activeScene.phase)){
    const t=pose.t,amount=Math.sin(t*Math.PI);
    for(let i=0;i<56;i++){
      const p=(t*2.2+i*.173)%1,x=center.x+Math.sin(i*2.39)*112,y=78+p*210;
      c.globalAlpha=amount*(1-p)*(.2+(i%4)*.12);c.fillStyle=i%3?'#b3a7bd':'#e3d7e7';c.fillRect(Math.round(x+Math.sin(p*6+i)*8),Math.round(y),i%4===0?4:2,2+i%3);
    }
  }
  c.restore();
}
export function drawMirrorClone(c,map,state,scene,now,source,motion=true){
  if(map!=='route2_maison'||state?.stage!=='clone')return;
  const sheet=violetTrainerSheet(source);if(!sheet)return;
  const p=mirrorScenePose(scene?.map===map?scene:null,now,motion),x=center.x+(state.clone.x*32+16-center.x)*p.cloneProgress,y=center.y+(state.clone.y*32+16-center.y)*p.cloneProgress;
  c.save();c.globalAlpha=p.cloneAlpha;
  c.fillStyle='#a365d84d';c.beginPath();c.ellipse(x,y+12,21,7,0,0,Math.PI*2);c.fill();
  c.drawImage(sheet,0,0,64,64,Math.round(x-32),Math.round(y-42-(1-p.cloneProgress)*13),64,64);c.restore();
}
