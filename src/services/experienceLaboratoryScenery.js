import {DecorationPatch} from './worldDecorationCache.js';

export const EXPERIENCE_LAB_MAP = 'ville4_maison2';
// Coordinates refer to the original 1484 × 1060 artwork. Only glass interiors,
// screen faces and the clock hand are painted; furniture, floor and actors stay intact.
const ART_SCALE = 32 / 53;
const TWIST = Object.freeze(Array.from({length:24},(_,i)=>Math.round(Math.sin(i*Math.PI/12)*12)));
const HANDS = Object.freeze(Array.from({length:60},(_,i)=>Object.freeze([
  Math.round(Math.sin(i*Math.PI/30)*17),-Math.round(Math.cos(i*Math.PI/30)*17)
])));
const pixel=n=>Math.round(n*ART_SCALE);
function bounds(x,y,w,h){return [pixel(x),pixel(y),pixel(x+w),pixel(y+h)];}
function rect(c,color,x,y,w,h,clip=null){
  let left=pixel(x),top=pixel(y),right=Math.max(left+1,pixel(x+w)),bottom=Math.max(top+1,pixel(y+h));
  if(clip){left=Math.max(left,clip[0]);top=Math.max(top,clip[1]);right=Math.min(right,clip[2]);bottom=Math.min(bottom,clip[3]);}
  if(right>left && bottom>top){c.fillStyle=color;c.fillRect(left,top,right-left,bottom-top);}
}
function tank(c,x,y,w,h,tick,violet){
  // Leave the cap, frame and reflective glass edges in the source image visible.
  const clip=bounds(x,y,w,h);
  rect(c,violet?'#7544b4':'#32a8cc',x,y,w,h,clip);
  rect(c,violet?'#9361ca':'#51c5dc',x+3,y,w-6,h,clip);
  rect(c,violet?'#b189df':'#8bdfeb',x+4,y+((tick+4)%h),w-8,2,clip);
  for(let row=0;row<7;row++){
    const offset=TWIST[(tick+row*3)%24],left=x+Math.round(w/2)+offset,right=x+Math.round(w/2)-offset,yy=y+row*5;
    rect(c,violet?'#ded0f8':'#c2f4fb',Math.min(left,right),yy+1,Math.abs(left-right)+2,2,clip);
    rect(c,'#f0f9ff',left,yy,3,3,clip);rect(c,'#c6dffa',right,yy+2,3,3,clip);
  }
  for(let i=0;i<3;i++){const yy=y+h-(tick*2+i*13)%h;rect(c,violet?'#ecd5ff':'#c8faff',x+4+(i*11)%Math.max(1,w-8),yy,2,2,clip);}
}
function bubbles(c,x,y,w,h,tick,color){
  const clip=bounds(x,y,w,h);
  for(let i=0;i<3;i++){
    const xx=x+2+(i*5)%Math.max(1,w-4),yy=y+h-(tick+i*7)%h;
    rect(c,color,xx,yy,2,2,clip);rect(c,color,xx+2,yy-1,1,1,clip);
  }
}
function screen(c,x,y,w,h,tick){
  const clip=bounds(x,y,w,h);
  // Translucent scan and small data blocks preserve the authored screen markings.
  rect(c,'rgba(186,255,251,.24)',x,y+(tick*2)%h,w,2,clip);
  for(let i=0;i<3;i++)rect(c,'#c8fffa',x+w*.58,y+5+i*8,6+(tick+i*4)%Math.max(1,Math.floor(w*.3)),2,clip);
  rect(c,tick%12<9?'#d7fff8':'#4f9ea9',x+3,y+h-3,4,2,clip);
}
function workstation(c,tick){
  screen(c,649,334,77,39,tick);
  tank(c,767,346,39,36,tick,false);tank(c,851,346,38,36,tick+7,true);
  for(let i=0;i<4;i++)rect(c,(tick+i)%8<4?'#b1f9ee':'#4e6878',596+(i%2)*15,371+Math.floor(i/2)*16,5,3);
  rect(c,'rgba(202,232,255,.65)',817+(tick%5)*4,337,3,3);
}
function shelf(c,tick){bubbles(c,403,362,19,16,tick,'#cbf4ff');bubbles(c,442,363,19,14,tick+8,'#e4c9fc');}
function consoleDesk(c,tick){
  screen(c,1044,385,60,29,tick+5);
  for(let i=0;i<4;i++)rect(c,(tick+i*3)%9<6?'#8dede8':'#586e84',1146+(i%2)*15,409+Math.floor(i/2)*18,6,3);
}
function glassware(c,tick){
  for(let i=0;i<3;i++)bubbles(c,328+i*20,656,8,19,tick+i*5,i===1?'#ecd5ff':'#c9f9ff');
  // Bubbles stay inside the narrow belly of the triangular flask; numeric
  // bounds avoid expensive, antialiased Canvas clip masks on mobile WebKit.
  bubbles(c,434,670,14,8,tick+4,'#cbfaff');rect(c,'rgba(199,251,255,.65)',432,673+tick%3,19,1);
}
function clock(c,tick){
  const [dx,dy]=HANDS[tick%60],x=pixel(743),y=pixel(223),tx=pixel(743+dx),ty=pixel(223+dy),steps=Math.max(Math.abs(tx-x),Math.abs(ty-y),1);
  // A pixel-art second hand, without an antialiased vector stroke: Safari blends
  // cached strokes differently over transparent and opaque surfaces.
  c.fillStyle='#a65a64';
  for(let i=0;i<=steps;i++)c.fillRect(Math.round(x+(tx-x)*i/steps),Math.round(y+(ty-y)*i/steps),1,1);
  rect(c,'#43515c',741,221,4,4);
}
export const EXPERIENCE_LAB_ZONES = Object.freeze([
  {id:'workstation',rect:[588,331,304,67],step:80,paint:workstation},
  {id:'shelf',rect:[402,361,61,19],step:160,paint:shelf},
  {id:'console',rect:[1044,385,125,45],step:120,paint:consoleDesk},
  {id:'glassware',rect:[328,654,128,27],step:160,paint:glassware},
  {id:'clock',rect:[724,204,38,38],step:1000,paint:clock,direct:true}
].map(zone=>Object.freeze({...zone,rect:Object.freeze(zone.rect),bounds:Object.freeze({x:Math.floor(zone.rect[0]*ART_SCALE)-1,y:Math.floor(zone.rect[1]*ART_SCALE)-1,width:Math.ceil(zone.rect[2]*ART_SCALE)+3,height:Math.ceil(zone.rect[3]*ART_SCALE)+3})})));
function visible(b,camera){return !camera || b.x+b.width>=camera.x && b.y+b.height>=camera.y && b.x<=camera.x+camera.visibleWidth && b.y<=camera.y+camera.visibleHeight;}
function rasterBounds(b,ratio){
  // Align the cache origin to backing pixels: fractional artwork coordinates
  // otherwise shift thin pixel-art highlights when the cached image is copied.
  const x=Math.floor(b.x*ratio),y=Math.floor(b.y*ratio);
  return {x:x/ratio,y:y/ratio,width:(Math.ceil((b.x+b.width)*ratio)-x)/ratio,height:(Math.ceil((b.y+b.height)*ratio)-y)/ratio};
}
function paintZone(c,zone,tick){c.save();zone.paint(c,tick);c.restore();}
// The direct painter is also the visual reference for cache/culling verification.
export function drawExperienceLaboratory(c,map,now=0,motion=true,camera=null){
  if(map!==EXPERIENCE_LAB_MAP)return;
  for(const zone of EXPERIENCE_LAB_ZONES)if(visible(zone.bounds,camera))paintZone(c,zone,motion?Math.floor(Math.max(0,now)/zone.step):0);
}
function commandsFor(zone,tick){
  const commands=[];let color='';
  paintZone({save(){},restore(){},set fillStyle(value){color=value;},fillRect(x,y,w,h){commands.push([color,x,y,w,h]);}},zone,tick);
  return commands;
}
function replay(target,commands){
  target.save();let last=null;
  for(const [color,x,y,w,h]of commands){if(color!==last){target.fillStyle=color;last=color;}target.fillRect(x,y,w,h);}
  target.restore();
}
export class ExperienceLaboratoryRenderer {
  constructor(createCanvas=()=>document.createElement('canvas')){this.createCanvas=createCanvas;this.layers=[];this.ratio=null;}
  draw(target,map,now=0,motion=true,scale=1,camera=null){
    if(map!==EXPERIENCE_LAB_MAP){if(this.layers.length)this.suspend();return;}
    const ratio=Math.max(.1,Number(scale)||1);
    if(this.ratio!==ratio){this.suspend();this.ratio=ratio;}
    for(const zone of EXPERIENCE_LAB_ZONES){
      // Off-camera decorations allocate and paint nothing. Returning to them uses
      // the current phase immediately rather than replaying missed frames.
      if(!visible(zone.bounds,camera))continue;
      // This tiny clock hand needs only a few pixel rectangles.
      if(zone.direct){paintZone(target,zone,motion?Math.floor(Math.max(0,now)/zone.step):0);continue;}
      let layer=this.layers.find(l=>l.zone===zone);
      const tick=motion?Math.floor(Math.max(0,now)/zone.step):0;
      if(!Number.isInteger(ratio) || ratio>=2){
        // Preserve coverage at fractional scales and avoid costly high-DPI
        // bitmap copies. Cache a rectangle display list at those scales.
        if(!layer){layer={zone,key:null,commands:null};this.layers.push(layer);}
        if(layer.key!==tick){layer.commands=commandsFor(zone,tick);layer.key=tick;}
        replay(target,layer.commands);continue;
      }
      if(!layer){layer={zone,patch:new DecorationPatch(this.createCanvas,rasterBounds(zone.bounds,ratio),ratio,(c,key)=>paintZone(c,zone,key))};this.layers.push(layer);}
      layer.patch.draw(target,tick);
    }
  }
  suspend(){for(const layer of this.layers){layer.patch?.release();layer.commands=null;layer.key=null;}this.layers=[];this.ratio=null;}
}
