const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const MOVEMENT_INPUT_MS=150;
export function movementInputWait(lastSent,now){return Number.isFinite(lastSent)?Math.max(0,MOVEMENT_INPUT_MS-(now-lastSent)):0;}
// Canvas-only poses live outside Vue's observed player snapshots. The server is
// always the destination: no prediction through collisions or unconfirmed tiles.
export class WorldMovement {
  constructor(){this.poses=new Map();}
  seed(id,player,now){
    const pose={map:player.currentmap,x:player.x,y:player.y,fromX:player.x,fromY:player.y,toX:player.x,toY:player.y,
      start:now,duration:0,receivedAt:now,cadence:MOVEMENT_INPUT_MS,frame:0,baseFrame:0,direction:player.direction||'down',moving:false};
    this.poses.set(id,pose);return pose;
  }
  sample(id,player,now,held=false){
    let p=this.poses.get(id);if(!p||p.map!==player.currentmap)p=this.seed(id,player,now);
    const t=p.duration?clamp((now-p.start)/p.duration,0,1):1;
    p.x=p.fromX+(p.toX-p.fromX)*t;p.y=p.fromY+(p.toY-p.fromY)*t;p.moving=t<1;
    p.travelFrame=p.baseFrame+clamp(now-p.start,0,p.duration)/90;
    p.frame=p.moving||held&&now-p.start-p.duration<100?p.travelFrame:0;
    if(!p.moving)p.direction=player.direction||p.direction;
    return p;
  }
  receive(id,current,next,now,instant=false){
    const p=this.sample(id,current,now);
    const distance=Math.hypot(next.x-p.x,next.y-p.y),map=next.currentmap||current.currentmap;
    if(map!==p.map||!Number.isFinite(distance)||distance>64||instant){this.seed(id,{...current,...next,currentmap:map},now);return;}
    if(next.x===p.toX&&next.y===p.toY)return;
    const cadence=now-p.receivedAt;
    if(cadence>=100&&cadence<=300)p.cadence=p.cadence*.8+cadence*.2;
    const continuous=now-p.start<=p.duration+100;
    p.receivedAt=now;p.fromX=p.x;p.fromY=p.y;p.toX=next.x;p.toY=next.y;p.start=now;
    p.baseFrame=continuous?p.travelFrame:0;p.duration=clamp(p.cadence,130,180);
    const dx=next.x-current.x,dy=next.y-current.y;
    p.direction=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):dy?(dy>0?'down':'up'):next.direction||p.direction;
  }
  remove(id){this.poses.delete(id);}
  clear(){this.poses.clear();}
}
