// Low drifting petals over the open floor, beneath characters. The central
// aisle stays readable; lamps, columns, stairs and the windows are excluded.
export const ANA_PETAL_FLOOR = [[104,102],[344,102],[344,248],[307,269],[141,269],[104,248]];
const FIXTURES = [[190,255,14,20],[244,255,14,20]];
const COLOURS = ['#e6a1a3','#f4c6b7','#fff0d0'];
const mod=(n,d)=>((n%d)+d)%d;
const clamp=n=>Math.max(0,Math.min(1,n));
export function clipAnaPetalFloor(c) {
  c.beginPath();ANA_PETAL_FLOOR.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
  c.clip();
  c.beginPath();c.rect(0,0,448,320);
  for(const[x,y,w,h]of FIXTURES)c.rect(x,y,w,h);
  c.clip('evenodd');
}
export function anaPetalPoses(timestamp) {
  const time=Number.isFinite(timestamp)?Math.max(0,timestamp):0,poses=[];
  for(let gust=0;gust<3;gust++)for(let i=0;i<9;i++) {
    const age=mod(time+gust*6000-i*280,18000);if(age>11000)continue;
    const t=age/11000,phase=i*.83+gust,swirl=Math.sin(t*Math.PI)**2,direction=gust===1?-1:1;
    const travel=t+.035*Math.sin(t*Math.PI*2+phase);
    const orbit=t*Math.PI*4.6+phase;
    const x=(direction>0?88:360)+direction*272*travel+Math.cos(orbit)*14*swirl;
    const y=[145,224,177][gust]+(i%4)*5-Math.sin(t*Math.PI)*(13+i%3*5)+Math.sin(orbit)*8*swirl;
    const alpha=clamp(t*7)*clamp((1-t)*7)*(.64+.18*Math.sin(time/1700+gust));
    poses.push({x,y,lift:3+swirl*(5+i%3*2),angle:phase+time/(2400+i*90)+Math.sin(time/700+phase)*.65,
      flip:.22+.78*Math.abs(Math.cos(time/410+phase)),size:1.35+(i%3)*.3,alpha,colour:COLOURS[(i+gust)%3]});
  }
  return poses;
}
export function drawAnaPetals(context,timestamp,motion=true) {
  if(!motion)return;
  context.save();context.scale(2,2);clipAnaPetalFloor(context);
  for(const p of anaPetalPoses(timestamp)) {
    if(p.alpha<.02)continue;
    context.globalAlpha=p.alpha*.12;context.fillStyle='#56694b';
    context.beginPath();context.ellipse(p.x,p.y+p.lift*.2,p.size*1.1,.55,0,0,Math.PI*2);context.fill();
    context.save();context.translate(p.x,p.y-p.lift);context.rotate(p.angle);context.scale(p.flip,1);
    context.globalAlpha=p.alpha;context.fillStyle=p.colour;context.strokeStyle='#ad6d72';context.lineWidth=.35;
    const s=p.size;context.beginPath();context.moveTo(-s,0);context.bezierCurveTo(-s*.85,-s*.95,s*.45,-s*.8,s,0);
    context.bezierCurveTo(s*.35,s*.9,-s*.6,s*.7,-s,0);context.fill();context.stroke();
    context.globalAlpha=p.alpha*.55;context.strokeStyle='#fff3df';context.lineWidth=.3;
    context.beginPath();context.moveTo(-s*.45,0);context.lineTo(s*.55,-s*.12);context.stroke();context.restore();
  }
  context.restore();
}
