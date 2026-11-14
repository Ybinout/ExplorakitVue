// Use calibrated visible bounds, not the transparent canvas around a GIF.
// Opponents, self effects, ground effects and delayed arrivals keep their origin.
const projected=new Set(['beam','projectile','drain','charge','punch','kick','bite','claw']);
export function moveOrigin(source,target,{own=false,family,self=false,delayed=false}={}) {
 const origin={x:source.x,y:source.y};
 if(!own||self||delayed||!projected.has(family))return origin;
 const dx=target.x-source.x,dy=target.y-source.y,distance=Math.hypot(dx,dy);
 if(!(distance>1))return origin;
 const ux=dx/distance,uy=dy/distance,w=Math.max(1,Number(source.width)||60),h=Math.max(1,Number(source.height)||60);
 const edge=1/Math.hypot(ux/(w*.45),uy/(h*.32)),advance=Math.min(120,edge,distance*.35);
 return{x:source.x+ux*advance,y:source.y+uy*advance};
}
