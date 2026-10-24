// Same anchor as the world sprite; only presentation changes, never coordinates.
export function flightPose(flight,now,reduced=false){
  if(!flight)return{alpha:1,scale:1,lift:0};
  if(flight.phase==='loading')return{alpha:0,scale:1,lift:0};
  const t=Math.min(1,Math.max(0,(now-flight.startedAt)/650));
  const visible=flight.phase==='arrival'?t:1-t;
  return{alpha:reduced?1:visible,scale:reduced?1:.45+.55*visible,lift:reduced?0:30*(1-visible)};
}
