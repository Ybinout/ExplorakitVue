const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
export function departurePose(scene,now,motion=true) {
 const t=clamp((now-scene.startedAt)/scene.duration),pull=smooth((t-.28)/.48);
 return {t,alpha:1-smooth((t-.56)/.24),scale:motion?1-pull*.98:1,
  rotation:motion?Math.sin(pull*Math.PI)*.14:0,drop:motion?pull*8:0};
}
// World coordinates match the actual opaque feet of the player-based 32px cell.
export function drawDeparture(context,scene,now,motion=true) {
 const {t}=departurePose(scene,now,motion);if(t>=1)return;
 const open=smooth(t/.23)*(1-smooth((t-.77)/.23)),x=scene.x*32+16,y=scene.y*32+34;
 context.save();context.translate(x,y);context.globalAlpha=open;
 const glow=context.createRadialGradient(0,0,3,0,0,58);glow.addColorStop(0,'#05040b');glow.addColorStop(.48,'#1c102b');glow.addColorStop(.66,'#8861a880');glow.addColorStop(1,'#52306400');
 context.scale(1,.48);context.fillStyle=glow;context.beginPath();context.ellipse(0,0,58*open,58*open,0,0,Math.PI*2);context.fill();
 context.fillStyle='#03030a';context.beginPath();context.ellipse(0,0,34*open,34*open,0,0,Math.PI*2);context.fill();
 if(motion)for(let i=0;i<7;i++){
  const a=now*.0018+i*.897,r=(37+(i%3)*4)*open;
  context.strokeStyle=i%2?'#b49dce':'#694b92';context.globalAlpha=open*(.3+(i%3)*.13);context.lineWidth=i%2?1.5:2.5;
  context.beginPath();context.ellipse(0,0,r,r*.93,a,a+1.2,a+2.35);context.stroke();
 }
 context.restore();
 if(!motion)return;
 context.save();for(let i=0;i<22;i++){
  const cycle=(t*1.8+i/22)%1,radius=(1-cycle)*60*open,angle=i*2.39996+cycle*3;
  context.globalAlpha=open*Math.sin(cycle*Math.PI)*.65;context.fillStyle=i%3?'#9d80ba':'#ddd0ed';
  context.fillRect(Math.round(x+Math.cos(angle)*radius),Math.round(y+Math.sin(angle)*radius*.35-cycle*12),2,2);
 }context.restore();
}
