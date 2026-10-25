const clamp=n=>Math.max(0,Math.min(1,n));
export function sceneElapsed(state,time) {
  return Math.max(0,Number(state?.elapsedMs)||0)+Math.max(0,time-(Number.isFinite(state?.receivedAt)?state.receivedAt:time));
}
function outline(c,h) {
  const x=h.x*16,y=h.y*16,w=h.width*16,z=h.height*16;
  c.beginPath();c.moveTo(x+2,y);c.lineTo(x+w*.4,y+2);c.lineTo(x+w*.61,y);c.lineTo(x+w-1,y+2);
  c.lineTo(x+w-3,y+z*.4);c.lineTo(x+w,y+z*.62);c.lineTo(x+w-2,y+z-1);
  c.lineTo(x+w*.6,y+z-3);c.lineTo(x+w*.4,y+z);c.lineTo(x+1,y+z-2);
  c.lineTo(x+3,y+z*.6);c.lineTo(x,y+z*.3);c.closePath();
}
export function drawCollapsedFloor(c,source,state,elapsed,motion) {
  if(!state?.holes)return;
  c.save();
  for(const[index,h]of state.holes.entries()) {
    const age=elapsed-h.atMs,x=h.x*16,y=h.y*16,w=h.width*16,z=h.height*16;
    if(age < -state.warningMs)continue;
    if(age<0) {
      c.strokeStyle='#6f4d30';c.lineWidth=.8;c.globalAlpha=.65;
      c.beginPath();c.moveTo(x+2,y+z*.5);c.lineTo(x+w*.35,y+z*.38);c.lineTo(x+w*.6,y+z*.6);c.lineTo(x+w-2,y+z*.4);c.stroke();
      continue;
    }
    c.globalAlpha=1;outline(c,h);c.fillStyle='#211b18';c.fill();
    c.save();c.clip();
    const shade=c.createLinearGradient(0,y,0,y+z);shade.addColorStop(0,'#73543a');shade.addColorStop(.3,'#3e3026');shade.addColorStop(1,'#120f12');
    c.fillStyle=shade;c.fillRect(x,y,w,z);
    c.fillStyle='#a78451';c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y);c.lineTo(x+w-5,y+8);c.lineTo(x+5,y+7);c.closePath();c.fill();
    c.fillStyle='#5f452f';c.beginPath();c.moveTo(x,y);c.lineTo(x+5,y+7);c.lineTo(x+5,y+z);c.lineTo(x,y+z);c.closePath();c.fill();
    // Four original floor fragments fall into the hole, then disappear.
    if(motion&&age<state.fallMs)for(let part=0;part<4;part++) {
      const p=clamp((age-part*70)/(state.fallMs-210)),px=x+(part%2)*16,py=y+Math.floor(part/2)*16;
      c.save();c.globalAlpha=1-p;c.translate(px+8+Math.sin(part*2+index)*p*3,py+8+p*p*26);c.rotate((part%2?1:-1)*p*.5);c.scale(1-p*.3,1-p*.3);
      c.beginPath();c.moveTo(-7,-8);c.lineTo(7,-7);c.lineTo(8,6);c.lineTo(-6,8);c.closePath();c.clip();
      c.drawImage(source,px/448*source.naturalWidth,py/320*source.naturalHeight,16/448*source.naturalWidth,16/320*source.naturalHeight,-8,-8,16,16);c.restore();
    }
    c.restore();outline(c,h);c.strokeStyle='#d7b579';c.lineWidth=1;c.stroke();
    // Chipped edge, confined to this blocked footprint.
    c.fillStyle='#e3c38c';c.fillRect(x+5,y+1,4,1);c.fillRect(x+w-6,y+z-3,3,1);
  }
  c.restore();
}
export function drawHozeCeiling(c,state,time,motion=true) {
  if(!state?.holes||!motion)return;
  const elapsed=sceneElapsed(state,time);c.save();c.scale(2,2);
  for(const[index,h]of state.holes.entries()) {
    const age=elapsed-h.atMs;if(age < -state.warningMs || age>1800)continue;
    const x=(h.x+h.width/2)*16,y=(h.y+h.height/2)*16;
    for(let n=0;n<8;n++) {
      const p=(age+state.warningMs-n*110)/850;if(p<0||p>1)continue;
      const dx=Math.sin(n*5.7+index)*11,fall=y-90+p*p*90;
      c.globalAlpha=.85;c.fillStyle=n%2?'#a78555':'#d8b979';
      c.beginPath();c.moveTo(x+dx-2,fall-2);c.lineTo(x+dx+2,fall-1);c.lineTo(x+dx+1,fall+2);c.lineTo(x+dx-2,fall+1);c.closePath();c.fill();
      c.fillStyle='#6f5337';c.fillRect(Math.round(x+dx-1),Math.round(fall+1),2,1);
    }
    if(age>=0)for(let n=0;n<18;n++) {
      const p=clamp(age/1800),angle=n*2.4+index,spread=5+p*22;
      c.globalAlpha=(1-p)*.36;c.fillStyle=n%2?'#e1c99d':'#b49a74';
      c.fillRect(Math.round(x+Math.cos(angle)*spread),Math.round(y+Math.sin(angle)*spread*.6-p*8),n%3?2:3,1);
    }
  }
  c.restore();
}
