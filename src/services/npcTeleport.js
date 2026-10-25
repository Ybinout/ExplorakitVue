const clamp=n=>Math.max(0,Math.min(1,n));
// Only opacity/short vertical lift: the character never slides across the hall.
export function npcTeleportPose(transition,now,motion=true) {
  if(!transition || !motion)return null;
  const progress=clamp((now-transition.receivedAt)/transition.duration);
  if(progress>=1)return null;
  const leaving=progress<.4,point=leaving?transition.from:transition.to;
  const alpha=leaving?1-clamp(progress/.32):clamp((progress-.5)/.5);
  return {...point,alpha,lift:(1-alpha)*9,progress};
}
export function drawNpcTeleport(context,transition,now,motion=true) {
  const pose=npcTeleportPose(transition,now,motion);if(!pose)return;
  context.save();
  for(const [index,point]of [transition.from,transition.to].entries()) {
    const t=index===0?pose.progress/.48:(pose.progress-.34)/.66;
    if(t<0||t>1)continue;
    const strength=Math.sin(t*Math.PI),x=point.x*32+32,y=point.y*32+14;
    for(let i=0;i<14;i++) {
      const angle=i*2.39996,radius=7+t*24,dx=Math.cos(angle)*radius,dy=Math.sin(angle)*radius*.55;
      context.globalAlpha=strength*(.55+(i%3)*.2);context.fillStyle=i%3===0?'#fff7df':'#a2d8fa';
      const px=Math.round(x+dx),py=Math.round(y-23+dy-t*18);
      context.fillRect(px,py,2,5);context.fillRect(px-1,py+2,4,1);
    }
  }
  context.restore();
}
