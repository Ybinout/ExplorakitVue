import profiles from '../data/worldGrass.js';

const SOURCE_W=448,SOURCE_H=320,TILE=16,WORLD_TILE=32,FRAME_MS=1000/30,LIFETIME=440,MAX_EVENTS=32;
// These are blade colours, not a general "green" filter: earth, paving, tree
// crowns, alpha and the surrounding grass floor must retain their real pixels.
const DARK=['57,107,77','37,78,54','99,135,84','77,128,77','104,148,102','27,59,40'];
const LIGHT=['82,155,111','117,184,112','54,113,78','160,225,152','143,195,122','38,85,57','162,206,140'];
const palette=id=>new Set(id===3225?DARK:LIGHT);
export function hasRustlingGrass(map){return Object.prototype.hasOwnProperty.call(profiles,map);}
export function grassCells(map){return profiles[map]||[];}
export function grassPose(now,event,row){
  const fade=Math.max(0,1-(now-event.touchedAt)/LIFETIME);
  const bend=Math.sin((now-event.startedAt)/75)*fade*fade*2;
  return Math.round(bend*(.25+.75*(TILE-1-row)/(TILE-1))*(event.direction||1));
}

export class GrassRustleRenderer{
  constructor(createCanvas=()=>document.createElement('canvas')){
    this.createCanvas=createCanvas;this.actors=new Map();this.events=new Map();this.frames=0;this.triggers=0;this.destroyed=false;this.lastTime=-Infinity;
  }
  prepare(image,map){
    this.suspend();
    try{
      this.canvas=this.createCanvas();this.canvas.width=SOURCE_W;this.canvas.height=SOURCE_H;
      this.context=this.canvas.getContext('2d',{willReadFrequently:true});if(!this.context)throw Error('Canvas unavailable');
      this.context.imageSmoothingEnabled=false;this.context.drawImage(image,0,0,SOURCE_W,SOURCE_H);
      this.original=this.context.getImageData(0,0,SOURCE_W,SOURCE_H);this.frame=this.context.createImageData(SOURCE_W,SOURCE_H);this.frame.data.set(this.original.data);
      this.mask=new Uint8Array(SOURCE_W*SOURCE_H);this.cells=new Map();
      for(const [cell,id]of grassCells(map)){
        const colors=palette(id),x=cell%28*TILE,y=Math.floor(cell/28)*TILE,pixels=[];
        for(let dy=1;dy<TILE-1;dy++)for(let dx=1;dx<TILE-1;dx++){
          const index=(y+dy)*SOURCE_W+x+dx,i=index*4,d=this.original.data;
          if(d[i+3]===255&&colors.has(`${d[i]},${d[i+1]},${d[i+2]}`)){this.mask[index]=1;pixels.push(index);}
        }
        if(pixels.length)this.cells.set(cell,{x,y,pixels});
      }
      this.source=image;this.map=map;
    }catch(_){this.suspend();}
  }
  observe(actors,now){
    const seen=new Set();
    for(const actor of actors){
      const {id,x,y}=actor;if(!id||!Number.isFinite(x)||!Number.isFinite(y))continue;seen.add(id);
      const previous=this.actors.get(id),distance=previous?Math.hypot(x-previous.x,y-previous.y):0;
      const valid=previous&&now>=previous.time&&now-previous.time<700&&distance<=48;
      const travel=valid?previous.travel+distance:0;
      this.actors.set(id,{x,y,time:now,travel:travel>=8?0:travel});
      // First appearance, reconnect, teleport, held input and standing still do
      // not create footsteps. Only actual interpolated travel makes grass move.
      if(!valid||travel<8||!distance)continue;
      const direction=Math.sign(x-previous.x)||Math.sign(y-previous.y)||1;
      for(let ty=Math.floor((y-23)/WORLD_TILE);ty<=Math.floor((y+23)/WORLD_TILE);ty++)for(let tx=Math.floor((x-23)/WORLD_TILE);tx<=Math.floor((x+23)/WORLD_TILE);tx++){
        if(tx<0||tx>=28||ty<0||ty>=20||Math.hypot(tx*32+16-x,ty*32+16-y)>23)continue;
        const cell=ty*28+tx;if(!this.cells.has(cell))continue;
        const old=this.events.get(cell);this.events.set(cell,{startedAt:old?.startedAt??now,touchedAt:now,direction});this.triggers++;
        if(this.events.size>MAX_EVENTS)this.events.delete(this.events.keys().next().value);
      }
    }
    for(const id of this.actors.keys())if(!seen.has(id))this.actors.delete(id);
  }
  draw(target,image,map,actors,now,motion=true){
    if(this.destroyed||!Number.isFinite(now))return;
    if(!motion||!hasRustlingGrass(map)){this.suspend();return;}
    if(this.source!==image||this.map!==map||!this.canvas)this.prepare(image,map);
    if(!this.canvas)return;
    this.observe(actors,now);
    for(const [cell,event]of this.events)if(now-event.touchedAt>=LIFETIME||now<event.touchedAt){
      const tile=this.cells.get(cell);
      for(const index of tile.pixels)for(let channel=0;channel<4;channel++)this.frame.data[index*4+channel]=this.original.data[index*4+channel];
      this.context.putImageData(this.frame,0,0,tile.x,tile.y,TILE,TILE);this.events.delete(cell);
    }
    if(!this.events.size)return;
    if(now-this.lastTime>=FRAME_MS||now<this.lastTime){
      this.lastTime=now;this.changedPixels=0;
      for(const [cell,event]of this.events){
        const tile=this.cells.get(cell);
        for(const index of tile.pixels){
          const y=Math.floor(index/SOURCE_W),x=index%SOURCE_W,offset=grassPose(now,event,y-tile.y),sample=index-offset;
          const valid=x-offset>tile.x&&x-offset<tile.x+TILE-1&&this.mask[sample]&&Math.floor(sample/SOURCE_W)===y;
          const source=(valid?sample:index)*4,dest=index*4;
          for(let channel=0;channel<4;channel++)this.frame.data[dest+channel]=this.original.data[source+channel];
          if(source!==dest&&this.original.data[source]!==this.original.data[dest])this.changedPixels++;
        }
        this.context.putImageData(this.frame,0,0,tile.x,tile.y,TILE,TILE);
      }
      this.frames++;
    }
    // Copy only active grass cells over the already-rendered map/water. All
    // shadows, foreground and weather still use their existing draw order.
    for(const cell of this.events.keys()){
      const tile=this.cells.get(cell);target.drawImage(this.canvas,tile.x,tile.y,TILE,TILE,tile.x*2,tile.y*2,WORLD_TILE,WORLD_TILE);
    }
  }
  suspend(){
    this.actors.clear();this.events.clear();if(this.canvas){this.canvas.width=0;this.canvas.height=0;}
    this.canvas=null;this.context=null;this.source=null;this.map=null;this.original=null;this.frame=null;this.mask=null;this.cells=null;this.lastTime=-Infinity;
  }
  destroy(){this.suspend();this.destroyed=true;}
}
