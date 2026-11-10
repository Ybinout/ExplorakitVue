import data from '../data/worldTallGrass.json';

const TILE=16,SCALE=2,PAD=6,FRAME_W=28,FRAME_H=32,LIFETIME=560,MAX_EVENTS=32;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const bytes=value=>Uint8ClampedArray.from(atob(value),c=>c.charCodeAt(0));
export const hasTallGrass=map=>Object.prototype.hasOwnProperty.call(data.maps,map);
export const tallGrassCells=map=>data.maps[map]||[];
export function tallGrassPose(now,event,cell=0){
  if(!event)return{bend:0,spread:0};
  const fade=clamp(1-(now-event.touchedAt)/LIFETIME,0,1),entry=clamp((now-event.startedAt)/65,0,1);
  return{bend:clamp(Math.round((event.direction*.8+Math.sin((now-event.startedAt)/95+cell*.73))*fade*entry),-2,2),spread:Math.round(3*fade*entry)};
}
export function grassInFront(cell,x,y){
  const left=cell%28*32,top=Math.floor(cell/28)*32;
  return Math.abs(left+16-x)<42&&top+32>=y+8&&top-16<y+22&&top+32>y-4;
}
// Authored plants have 24 visible source pixels, split between background and
// foreground. Move the whole plant, but keep its root and its exact soil tile.
export class TallGrassRenderer{
  constructor(createCanvas=()=>document.createElement('canvas')){
    this.createCanvas=createCanvas;this.events=new Map();this.actors=new Map();this.triggers=0;this.frames=0;this.lastFrame=-Infinity;this.visible=[];this.destroyed=false;
  }
  cache(){
    if(this.atlas)return;
    this.atlas=this.createCanvas();this.atlas.width=FRAME_W*5;this.atlas.height=FRAME_H*4;
    const c=this.atlas.getContext('2d'),pixels=c.createImageData(this.atlas.width,this.atlas.height),shape=bytes(data.shape);
    for(let spread=0;spread<4;spread++)for(let bend=-2;bend<=2;bend++)for(let y=0;y<32;y++)for(let x=0;x<16;x++){
      const s=(y*16+x)*4;if(!shape[s+3])continue;
      const flex=clamp((30-y)/22,0,1),dx=Math.round(bend*flex*flex)+(x<8?-1:1)*Math.round(spread*flex);
      const d=((spread*32+y)*this.atlas.width+(bend+2)*FRAME_W+PAD+x+dx)*4;
      pixels.data.set(shape.subarray(s,s+4),d);
    }
    c.putImageData(pixels,0,0);
    this.ground=this.createCanvas();this.ground.width=TILE*data.grounds.length;this.ground.height=TILE;
    const g=this.ground.getContext('2d'),floor=g.createImageData(this.ground.width,TILE);
    for(const[index,value]of data.grounds.entries()){
      const raw=bytes(value);for(let y=0;y<16;y++)floor.data.set(raw.subarray(y*64,(y+1)*64),(y*this.ground.width+index*16)*4);
    }
    g.putImageData(floor,0,0);
  }
  prepare(background,foreground,map){
    this.suspend();if(!hasTallGrass(map)||!background||!foreground)return false;
    try{
      this.cache();this.foreground=this.createCanvas();this.foreground.width=448;this.foreground.height=320;
      const c=this.foreground.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(foreground,0,0,448,320);
      c.globalCompositeOperation='destination-out';
      this.plants=tallGrassCells(map).map(([cell,ground,top])=>({cell,ground,top,x:cell%28*16,y:Math.floor(cell/28)*16,bend:0,spread:0}));
      this.cells=new Map(this.plants.map(p=>[p.cell,p]));
      for(const p of this.plants)if(p.top)c.drawImage(this.atlas,2*FRAME_W,0,FRAME_W,16,p.x-PAD,p.y-16,FRAME_W,16);
      c.globalCompositeOperation='source-over';this.background=background;this.originalForeground=foreground;this.map=map;return true;
    }catch(_){this.suspend();for(const key of['atlas','ground'])if(this[key]){this[key].width=this[key].height=0;this[key]=null;}return false;}
  }
  observe(actors,now){
    for(const actor of actors){
      const{id,x,y}=actor;if(!id||!Number.isFinite(x)||!Number.isFinite(y))continue;
      const p=this.actors.get(id),distance=p?Math.hypot(x-p.x,y-p.y):0,valid=p&&now>=p.time&&now-p.time<700&&distance<=48;
      const travel=valid?p.travel+distance:0;this.actors.set(id,{x,y,time:now,travel:travel>=8?0:travel});
      if(!valid||travel<8||!distance)continue;
      for(let ty=Math.floor((y-23)/32);ty<=Math.floor((y+23)/32);ty++)for(let tx=Math.floor((x-23)/32);tx<=Math.floor((x+23)/32);tx++){
        if(tx<0||tx>=28||ty<0||ty>=20||Math.hypot(tx*32+16-x,ty*32+16-y)>24)continue;
        const cell=ty*28+tx;if(!this.cells.has(cell))continue;
        const old=this.events.get(cell);this.events.set(cell,{startedAt:old?.startedAt??now,touchedAt:now,direction:Math.sign(x-p.x)});this.triggers++;
        if(this.events.size>MAX_EVENTS)this.events.delete(this.events.keys().next().value);
      }
    }
    for(const[id,p]of this.actors)if(p.time!==now)this.actors.delete(id);
    for(const[cell,event]of this.events)if(now-event.touchedAt>=LIFETIME||now<event.touchedAt)this.events.delete(cell);
  }
  paintPlant(target,p){
    const sy=p.spread*FRAME_H+(p.top?0:16),height=p.top?32:16;
    target.drawImage(this.atlas,(p.bend+2)*FRAME_W,sy,FRAME_W,height,(p.x-PAD)*SCALE,(p.y-(p.top?16:0))*SCALE,FRAME_W*SCALE,height*SCALE);
  }
  draw(target,background,foreground,map,actors,now,motion=true,camera=null){
    if(this.destroyed||!Number.isFinite(now))return false;
    if(this.map!==map||this.background!==background||this.originalForeground!==foreground||!this.foreground)if(!this.prepare(background,foreground,map))return false;
    if(motion)this.observe(actors,now);else{this.events.clear();this.actors.clear();}
    if(!motion||now-this.lastFrame>=1000/30||now<this.lastFrame){
      this.lastFrame=now;for(const p of this.plants){const pose=tallGrassPose(now,this.events.get(p.cell),p.cell);p.bend=pose.bend;p.spread=pose.spread;}this.frames++;
    }
    this.visible.length=0;
    const left=camera?.x??0,top=camera?.y??0,right=left+(camera?.visibleWidth??896),bottom=top+(camera?.visibleHeight??640);
    for(const p of this.plants)if(p.x*2+44>=left&&p.x*2-12<=right&&p.y*2+32>=top&&p.y*2-32<=bottom){
      this.visible.push(p);target.drawImage(this.ground,p.ground*TILE,0,TILE,TILE,p.x*2,p.y*2,32,32);
    }
    // First restore every soil tile; only then draw the overlapping full plants.
    for(const p of this.visible)this.paintPlant(target,p);
    return true;
  }
  drawActor(target,actor){
    if(!this.foreground||!Number.isFinite(actor?.x)||!Number.isFinite(actor?.y))return;
    target.save();target.beginPath();target.rect(actor.x-24,actor.y-4,48,26);target.clip();
    for(const p of this.visible)if(grassInFront(p.cell,actor.x,actor.y))this.paintPlant(target,p);
    target.restore();
  }
  suspend(){
    if(this.foreground)this.foreground.width=this.foreground.height=0;
    this.foreground=null;this.background=null;this.originalForeground=null;this.map=null;this.cells=null;this.plants=null;this.visible.length=0;this.actors.clear();this.events.clear();this.lastFrame=-Infinity;
  }
  destroy(){this.suspend();for(const key of['atlas','ground'])if(this[key]){this[key].width=this[key].height=0;this[key]=null;}this.destroyed=true;}
}
