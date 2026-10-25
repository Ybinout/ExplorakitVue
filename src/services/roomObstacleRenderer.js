// Native pixel clusters: no new textures, animation loop, global shake or random per-frame noise.
export const STRIKE_TIMES = [550, 1280, 2050, 2820, 3590];
function actionStrikeTimes(action) {
  const times=action?.strikeTimes,duration=Number(action?.duration);
  if(Array.isArray(times)&&times.length>0&&times.length<=10&&times.every((t,i)=>Number.isFinite(t)&&t>0&&(!i||t>times[i-1])&&(!duration||t<duration)))return times;
  // Older servers omit the timeline; fit all five impacts within their duration.
  const scale=duration>0?Math.min(1,duration/4140):1;
  return STRIKE_TIMES.map(t=>Math.round(t*scale));
}
export function strikeState(action, now) {
  const elapsed = action?.active ? Math.max(0, now - action.startedAt) : -1;
  const times=actionStrikeTimes(action);
  const hits = times.filter(t => elapsed >= t).length;
  const age = hits ? elapsed - times[hits - 1] : Infinity;
  const upcoming = times.find(t => t > elapsed);
  return {elapsed, hits, totalHits:times.length, impact:age < 220 ? 1 - age / 220 : 0,
    anticipation:elapsed>=0 && upcoming != null && upcoming-elapsed<160 ? 1-(upcoming-elapsed)/160 : 0};
}
export function roomStrikePose(action, now, animated = true) {
  if (!action?.active || !action.target || !action.origin) return {x:0,y:0};
  const dx=action.target.x*32+16-action.origin.x, dy=action.target.y*32+16-action.origin.y;
  const vertical=Math.abs(dy)>=Math.abs(dx), sx=vertical?0:Math.sign(dx), sy=vertical?(Math.sign(dy)||-1):0;
  const state=strikeState(action,now), push=animated?state.impact*8-state.anticipation*3:0;
  return {x:Math.round(sx*push),y:Math.round(sy*push),direction:vertical?(sy<0?'up':'down'):(sx<0?'left':'right')};
}
function polygon(ctx,color,points) {
  ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
}
function crystal(ctx,x,y,height,width,light) {
  // Stepped silhouette and three flat facets preserve the room's pixel language.
  polygon(ctx,'#171b30',[[x-width,y-4],[x-width,y-height+14],[x-6,y-height+14],[x-6,y-height+8],[x-2,y-height+8],[x-2,y-height],[x+2,y-height],[x+2,y-height+6],[x+6,y-height+6],[x+6,y-height+12],[x+width,y-height+12],[x+width,y-7],[x+width-5,y],[x-width+4,y]]);
  polygon(ctx,'#393148',[[x-width+2,y-5],[x-width+2,y-height+16],[x-1,y-height+8],[x-1,y-3]]);
  polygon(ctx,'#675376',[[x+1,y-3],[x+1,y-height+9],[x+5,y-height+13],[x+width-2,y-height+15],[x+width-2,y-8]]);
  ctx.fillStyle=light;ctx.fillRect(x-1,y-height+9,2,Math.max(2,height-17));
}
export function drawRoomBarricade(ctx,gate,now,opening,animated) {
  const action=gate.workAction,state=strikeState(action,now);
  ctx.save();
  try {
    ctx.globalAlpha=1-opening;
    for(const cell of gate.cells||[]) {
      const seed=(cell.x*13+cell.y*7)%23,x=cell.x*32,y=cell.y*32+24+seed%5;
      const height=cell.x%3===1?44+seed%12:23+seed%18,center=10+seed%10;
      const distance=Math.abs(cell.x-(action?.target?.x??cell.x));
      const impact=state.impact*Math.max(0,1-distance/4);
      const shake=animated?Math.round(Math.sin(state.elapsed/19)*impact*3):0;
      const spread=animated?Math.round(opening*opening*((seed%2?1:-1)*(12+seed))):0;
      ctx.fillStyle='#10162977';ctx.fillRect(x+1,y-1,30,7);
      ctx.save();ctx.translate(x+shake+spread,y+Math.round(opening*13));
      // Low interwoven roots join staggered clusters instead of a uniform fence.
      polygon(ctx,'#242236',[[0,0],[0,-5],[8,-5],[8,-9],[19,-9],[19,-5],[32,-5],[32,2],[21,2],[21,-2],[11,-2],[11,2],[0,2]]);
      crystal(ctx,center,0,height,9+seed%4,impact>0?'#eee1ed':'#a58aac');
      if(seed%3!==0)crystal(ctx,seed%2?3:29,-1,18+seed%8,7,'#80678e');
      if((state.hits&&distance<(state.hits>=state.totalHits?2.5:1.5))||opening) {
        ctx.strokeStyle=impact>0?'#f4dfdc':'#ac8cbb';ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(center-2,-height+12);ctx.lineTo(center+3,-height/2);ctx.lineTo(center-3,-11);ctx.lineTo(center+1,-4);ctx.stroke();
        if(state.hits>=2||opening){ctx.beginPath();ctx.moveTo(center+3,-height/2);ctx.lineTo(center+8,-height/2-4);ctx.stroke();}
      }
      if(animated&&opening)for(let i=0;i<3;i++){
        const dx=(i-1)*(12+seed)*opening,dy=-Math.sin(opening*Math.PI)*(10+i*6)+opening*16;
        ctx.fillStyle=i===1?'#b79bc6':'#675376';ctx.fillRect(Math.round(15+dx),Math.round(-10+dy),4,5);
      }
      ctx.restore();
    }
    if(!opening&&gate.pulseAt!=null&&now-gate.pulseAt<900) {
      const x=(gate.tiles.x+gate.tiles.width/2)*32,y=gate.tiles.y*32-12;
      ctx.fillStyle='#202c40';ctx.fillRect(x-10,y-10,20,20);
      ctx.fillStyle='#f3dfb8';ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillText('A',x,y+4);
    }
  } finally {ctx.restore();}
}
export function drawRoomStrike(ctx,action,now,animated) {
  if(!animated||!action?.active||!action.target)return;
  const state=strikeState(action,now);if(!state.impact)return;
  const x=action.target.x*32+16,y=action.target.y*32+10;
  ctx.save();ctx.globalAlpha=state.impact;
  // Short angular impact, never a circle/halo. Local to the crystal being hit.
  for(let i=0;i<6;i++){
    const angle=i*Math.PI/3,inner=5+(1-state.impact)*8,outer=inner+9;
    ctx.strokeStyle=i%2?'#c4a2d4':'#fff1d9';ctx.lineWidth=3;ctx.beginPath();
    ctx.moveTo(Math.round(x+Math.cos(angle)*inner),Math.round(y+Math.sin(angle)*inner));
    ctx.lineTo(Math.round(x+Math.cos(angle)*outer),Math.round(y+Math.sin(angle)*outer));ctx.stroke();
  }
  ctx.restore();
}
