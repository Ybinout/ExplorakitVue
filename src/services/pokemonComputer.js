import {DecorationPatch} from './worldDecorationCache.js';
import {ExperienceLaboratoryRenderer} from './experienceLaboratoryScenery.js';
// Native canvas pixel art: no interpolation, transparent sheet or external loading.
// Bounded to the liquid inside the existing glassware, in 448 × 320 artwork coordinates.
export const LAB_VIALS = Object.freeze([[66,94,12,22],[369,94,11,21],[69,177,10,18],[369,179,11,21],[120,231,5,8],[130,232,5,8],[317,232,5,8],[327,232,5,8]]);
export function drawLaboratoryGlass(context,map,now=0,motion=true){
  if(map!=='professor_lab')return;
  const tick=motion?Math.floor(Math.max(0,now)/100):0;
  context.save();context.scale(2,2);
  for(let i=0;i<LAB_VIALS.length;i++)drawVial(context,LAB_VIALS[i],i,tick);
  context.restore();
}
function drawVial(context,vial,i,tick){
    const [x,y,w,h]=vial;context.save();context.beginPath();context.rect(x,y,w,h);context.clip();
    context.fillStyle=`rgba(172,94,235,${.07+(tick+i)%8/160})`;context.fillRect(x,y,w,h);
    for(let b=0;b<(w>5?4:2);b++){
      const rise=(tick+b*7+i*3)%h,bx=x+1+(b*3+i)%(w-2),by=y+h-rise;
      context.fillStyle=b%2?'#deb6f5':'#a78cda';context.globalAlpha=.45+(b%2)*.25;context.fillRect(bx,by,1,b%2+1);
    }
    context.restore();
}
export function drawPokemonComputers(context, state, map,now=0,motion=true) {
  drawLaboratoryGlass(context,map,now,motion);
  if(state?.map!==map)return;
  for(const device of state.devices || [])drawDevice(context,device,now,motion);
}

function drawDevice(context,device,now,motion){
    if(device.kind==='corruption'){context.save();const x=device.screen.x*32+8,y=device.screen.y*32+10,tick=motion?Math.floor(now/120):0;context.fillStyle='#352845';context.fillRect(x,y,24,17);context.fillStyle='#a980c4';context.globalAlpha=.25;context.fillRect(x,y+tick%17,24,1);context.globalAlpha=1;context.fillStyle='#e1cef1';context.font='bold 9px monospace';context.textAlign='center';context.fillText({move:'CS',ability:'T',type:'Ty',combat:'±'}[device.family],x+12,y+10);context.fillStyle='#a5e4c6';for(let n=0;n<5;n++)context.fillRect(x+3+n*4,y+15-((tick+n*3)%3),2,1+((tick+n*3)%3));context.restore();return;}
    if(device.kind!=='pc')return;
    // Seat the screen inside the counter opening without moving its interaction tile.
    drawPokemonTerminal(context,device.x*32+8,device.y*32-16);
}
export function drawPokemonTerminal(context,x,y){
    context.save();context.translate(x,y);
    const rect=(color,x,y,w,h)=>{context.fillStyle=color;context.fillRect(x,y,w,h);};
    rect('#343e58',2,2,28,44);rect('#687c96',4,4,24,40);rect('#b9d3df',4,4,24,3);
    rect('#26384f',6,8,20,20);rect('#83cee0',8,10,16,14);rect('#c8f0e5',10,12,12,2);
    rect('#336986',11,17,10,2);rect('#336986',15,14,2,8);rect('#e0ebed',6,30,20,8);
    rect('#52677e',8,32,3,2);rect('#52677e',13,32,3,2);rect('#52677e',18,32,3,2);
    rect('#334d68',7,39,18,3);rect('#7be3b0',23,40,2,2);rect('#26384f',4,44,5,3);rect('#26384f',23,44,5,3);
    context.restore();

}
// Vials change at 10 Hz and screens at 8⅓ Hz, independently of walking/rAF.
// Keep the existing drawing functions as the single source of their appearance.
export class PokemonComputerRenderer {
  constructor(createCanvas=()=>document.createElement('canvas')){this.createCanvas=createCanvas;this.experienceLab=new ExperienceLaboratoryRenderer(createCanvas);}
  prepare(state,map,ratio){
    this.suspend();this.state=state;this.map=map;this.ratio=ratio;
    const bounds=[];
    if(map==='professor_lab')for(const [x,y,w,h]of LAB_VIALS)bounds.push([x*2,y*2,w*2,h*2]);
    if(state?.map===map)for(const d of state.devices||[]){
      if(d.kind==='corruption')bounds.push([d.screen.x*32+8,d.screen.y*32+10,24,17]);
      else if(d.kind==='pc')bounds.push([d.x*32+8,d.y*32-16,32,48]);
    }
    this.animated=map==='professor_lab'||state?.map===map&&(state.devices||[]).some(d=>d.kind==='corruption');
    if(!bounds.length)return;
    const x=Math.min(...bounds.map(b=>b[0])),y=Math.min(...bounds.map(b=>b[1]));
    const width=Math.max(...bounds.map(b=>b[0]+b[2]))-x,height=Math.max(...bounds.map(b=>b[1]+b[3]))-y;
    this.patch=new DecorationPatch(this.createCanvas,{x,y,width,height},ratio,c=>drawPokemonComputers(c,this.state,this.map,this.time,this.motion));
  }
  draw(target,state,map,now=0,motion=true,scale=1,camera=null){
    const ratio=Math.max(.1,Number(scale)||1);
    if(this.state!==state||this.map!==map||this.ratio!==ratio)this.prepare(state,map,ratio);
    this.time=now;this.motion=motion;
    const key=motion&&this.animated?`${Math.floor(Math.max(0,now)/100)}:${Math.floor(now/120)}`:'still';
    this.patch?.draw(target,key);
    this.experienceLab.draw(target,map,now,motion,ratio,camera);
  }
  suspend(){this.experienceLab?.suspend();this.patch?.release();this.patch=null;this.state=this.map=this.ratio=null;}
}

// Adapt the private PC snapshot to the shared companion sheet without changing owned data.
export function computerPokemonDetails(pokemon) {
  if(!pokemon)return null;
  return {...pokemon, ...pokemon.stats, spriteId:pokemon.pokemonId,
    name:pokemon.nickname || pokemon.name,
    truename:pokemon.speciesName || pokemon.name, k:pokemon.potential,
    data:{id:pokemon.pokemonId,type:[...(pokemon.types || [])]},
    abilities:[...(pokemon.moves || [])],movePp:[...(pokemon.movePp || [])]};
}
