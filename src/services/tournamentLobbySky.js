export const TOURNAMENT_LOBBY_MAP = 'super_tournament_lobby';
const rect = (x,y,w,h) => [[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
// Coordinates follow the 448 × 320 artwork, keeping islands and masonry out.
export const TOURNAMENT_SKY_PANES = [
  [[76,26],[80,21],[126,21],[130,26],[130,43],[125,43],[125,38],[120,38],[119,35],[111,35],[108,37],[105,37],[103,40],[98,43],[76,43]],
  [[168,27],[173,21],[277,21],[280,27],[280,43],[272,43],[269,39],[267,39],[267,34],[263,34],[263,29],[259,29],[259,36],[254,36],[254,32],[249,32],[249,27],[244,27],[244,23],[239,23],[239,32],[236,32],[236,30],[215,30],[215,32],[211,32],[211,24],[207,24],[207,28],[205,28],[205,33],[201,33],[201,31],[198,31],[198,35],[195,35],[195,32],[191,32],[191,37],[187,37],[187,33],[183,33],[183,39],[179,39],[178,43],[168,43]],
  [[317,27],[323,21],[341,21],[341,43],[317,43]],
];
export const TOURNAMENT_SCENERY = {
  [TOURNAMENT_LOBBY_MAP]: {
    patch:{x:75,y:20,width:267,height:46},skyY:20,sky:TOURNAMENT_SKY_PANES,
    water:[[[76,46],[95,46],[95,53],[108,53],[108,58],[130,58],[130,64],[94,64],[94,60],[88,58],[84,60],[84,64],[76,64]],
      rect(168,60,112,4),rect(168,44,10,6),rect(276,44,4,15),
      [[317,44],[341,44],[341,64],[339,64],[339,53],[322,53],[322,64],[317,64]]],
    clouds:[[100,21,29,13],[260,26,19,15],[168,31,19,10]],
  },
  super_tournament_sas:{
    patch:{x:44,y:9,width:359,height:55},skyY:30,
    sky:[rect(82,30,35,12),rect(120,30,19,10),rect(308,30,21,10),rect(332,30,36,12),rect(373,30,11,7)],
    water:[rect(88,44,29,14),rect(120,48,19,10),rect(308,48,21,10),rect(332,44,36,14),rect(373,51,10,7),rect(52,54,19,4)],
    clouds:[[83,33,32,9],[122,34,15,7],[334,34,29,8]],
    passage:rect(202,10,43,36),
    sides:[{patch:{x:1,y:139,width:15,height:56},water:[rect(3,178,9,15)]},{patch:{x:432,y:139,width:15,height:56},water:[rect(436,178,9,15)]}],
  },
  super_tournament_room:{
    patch:{x:64,y:18,width:320,height:47},skyY:19,
    sky:[[[65,26],[71,19],[107,19],[111,25],[111,29],[65,29]],[[125,26],[129,19],[176,19],[181,26],[181,31],[125,31]],
      [[267,26],[272,19],[319,19],[323,26],[323,30],[267,30]],[[336,26],[341,19],[376,19],[383,26],[383,29],[336,29]]],
    water:[rect(65,47,46,7),rect(125,45,56,9),rect(125,35,31,10),rect(267,46,56,8),rect(310,35,13,11),rect(336,47,47,7)],
    clouds:[[69,19,29,10],[134,21,31,9],[348,19,27,10]],
    passage:[[208,36],[210,32],[214,29],[219,27],[224,26],[229,27],[234,30],[238,35],[239,39],[239,61],[208,61]],
  },
};
const mod = (n,d) => ((n%d)+d)%d;
const CLOUDS = [
  {x:5,y:22,size:.65,speed:.7},{x:69,y:29,size:.85,speed:.95},
  {x:144,y:20,size:.7,speed:.7},{x:213,y:31,size:.65,speed:.95},
  {x:252,y:23,size:1,speed:1.4},{x:310,y:26,size:.7,speed:1.1},
];
const FLOCKS = [
  {offset:.12,y:29,count:3,direction:1,size:1},{offset:.48,y:25,count:2,direction:-1,size:.7},
  {offset:.72,y:36,count:3,direction:1,size:.8},{offset:.9,y:31,count:2,direction:-1,size:.9},
];
function polygons(c,regions){for(const points of regions){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}}
function transform(c,p){c.setTransform(2,0,0,2,-p.x*2,-p.y*2);}
function bird(c,x,y,size,flap){
  c.save();c.translate(Math.round(x),Math.round(y));c.scale(size,size);
  const wing=flap>.3?-2:flap<-.3?1:-1;
  c.fillStyle='#385c78';c.fillRect(-1,0,3,1);c.fillRect(-3,wing,2,1);c.fillRect(2,wing,2,1);
  c.fillRect(-4,wing+(wing<0?-1:1),1,1);c.fillRect(4,wing+(wing<0?-1:1),1,1);
  c.fillStyle='#f4fbff';c.fillRect(-2,wing-1,2,1);c.fillRect(1,wing-1,2,1);c.fillRect(0,0,1,1);c.restore();
}
function isSky(r,g,b){return(g>135&&b>180&&b>g+8&&g>r+13)||(r>185&&g>215&&b>225&&g>=r&&b>=g);}
function isWater(r,g,b){return b>110&&g>65&&b>g*1.05&&g>r*1.15&&r<190;}

export class TournamentLobbySkyRenderer {
  constructor(createCanvas=()=>document.createElement('canvas')){this.createCanvas=createCanvas;this.frames=0;this.suspend();}
  surface(p){const canvas=this.createCanvas();canvas.width=p.width*2;canvas.height=p.height*2;return canvas;}
  makeMask(layer,regions,predicate,inset=false){
    const canvas=this.surface(layer.patch),c=canvas.getContext('2d');
    c.save();transform(c,layer.patch);c.fillStyle='#fff';polygons(c,regions);c.restore();
    const mask=c.getImageData(0,0,canvas.width,canvas.height),pixels=layer.pixels.data;
    for(let i=0;i<mask.data.length;i+=4)mask.data[i+3]=mask.data[i+3]===255&&predicate(pixels[i],pixels[i+1],pixels[i+2])?255:0;
    if(inset){const alpha=mask.data.slice(),w=canvas.width;
      for(let y=1;y<canvas.height-1;y++)for(let x=1;x<w-1;x++){
        const i=(y*w+x)*4+3;if(alpha[i]&&[-w,-1,1,w].some(d=>!alpha[i+d*4]))mask.data[i]=0;
      }
    }
    c.putImageData(mask,0,0);return canvas;
  }
  makeLayer(source,definition){
    const patch=definition.patch,canvas=this.surface(patch),context=canvas.getContext('2d');context.imageSmoothingEnabled=false;
    const texture=this.surface(patch),reader=texture.getContext('2d',{willReadFrequently:true});reader.imageSmoothingEnabled=false;
    reader.drawImage(source,patch.x*source.naturalWidth/448,patch.y*source.naturalHeight/320,
      patch.width*source.naturalWidth/448,patch.height*source.naturalHeight/320,0,0,texture.width,texture.height);
    const layer={patch,canvas,context,texture,pixels:reader.getImageData(0,0,texture.width,texture.height)};
    layer.skyMask=this.makeMask(layer,definition.sky||[],isSky);
    layer.waterMask=this.makeMask(layer,definition.water||[],isWater,true);
    layer.water=this.surface(patch);
    return layer;
  }
  prepare(source,map){
    this.suspend();this.profile=TOURNAMENT_SCENERY[map];if(!this.profile)return;
    this.source=source;this.map=map;
    try{
      this.layers=[this.makeLayer(source,this.profile),...(this.profile.sides||[]).map(p=>this.makeLayer(source,p))];
      const main=this.layers[0];this.canvas=main.canvas;this.context=main.context;this.mask=main.skyMask;
      this.cloudTextures=this.profile.clouds.map(([left,top,width,height])=>{
        const texture=this.surface({width,height}),c=texture.getContext('2d'),data=c.createImageData(texture.width,texture.height);
        const mask=main.skyMask.getContext('2d').getImageData(0,0,main.skyMask.width,main.skyMask.height).data;
        for(let y=0;y<texture.height;y++)for(let x=0;x<texture.width;x++){
          const i=(((top-main.patch.y)*2+y)*main.texture.width+(left-main.patch.x)*2+x)*4;
          const r=main.pixels.data[i],g=main.pixels.data[i+1],b=main.pixels.data[i+2];
          if(mask[i+3]&&r>140&&g>175&&b>185&&g-r<65&&b-g<45){const j=(y*texture.width+x)*4;data.data[j]=r;data.data[j+1]=g;data.data[j+2]=b;data.data[j+3]=255;}
        }
        c.putImageData(data,0,0);return texture;
      });
      this.skyPixels=0;const mask=main.skyMask.getContext('2d').getImageData(0,0,main.skyMask.width,main.skyMask.height).data;
      for(let i=3;i<mask.length;i+=4)if(mask[i])this.skyPixels++;
      this.skyGradient=this.context.createLinearGradient(0,(this.profile.skyY-main.patch.y)*2,0,(this.profile.skyY+24-main.patch.y)*2);
      this.skyGradient.addColorStop(0,'#62bcf3');this.skyGradient.addColorStop(1,'#9bdcf8');
      for(const layer of this.layers)delete layer.pixels;
    }catch(_){this.suspend();}
  }
  paintWater(layer,time){
    const c=layer.water.getContext('2d'),{width,height}=layer.texture;c.imageSmoothingEnabled=false;c.clearRect(0,0,width,height);
    // Refraction stays in eroded water pixels, leaving shores and masonry fixed.
    let start=0,offset=Math.round(Math.sin(time*.8)*1.1);
    for(let row=1;row<=height;row++){
      const next=Math.round(Math.sin(time*.8+row*.19)*1.1);
      if(row<height&&next===offset)continue;
      c.drawImage(layer.texture,0,start,width,row-start,offset,start,width,row-start);start=row;offset=next;
    }
    for(let i=0;i<30;i++){
      const x=mod(i*47+time*(2+i%3),width+30)-15,y=mod(i*19+Math.sin(time*.6+i)*2,height);
      c.globalAlpha=(.14+.12*Math.sin(time*1.2+i))*.8;c.fillStyle='#e0f7ff';
      c.fillRect(Math.round(x),Math.round(y),3+i%7,1);
    }
    c.globalAlpha=1;c.save();c.globalCompositeOperation='destination-in';c.drawImage(layer.waterMask,0,0);c.restore();
    layer.context.drawImage(layer.water,0,0);
  }
  paintPassage(c,points){
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys),middle=(left+right)/2;
    c.save();c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
    const dark=c.createLinearGradient(0,top,0,bottom);dark.addColorStop(0,'#030a15');dark.addColorStop(.62,'#091526');dark.addColorStop(1,'#203652');
    c.fillStyle=dark;c.fillRect(left,top,right-left,bottom-top);
    c.strokeStyle='#2d4560';c.globalAlpha=.28;c.lineWidth=.5;
    for(const distance of [1,4,8]){c.beginPath();c.moveTo(left,bottom-distance);c.lineTo(right,bottom-distance);c.stroke();}
    for(const x of [left+6,right-6]){c.beginPath();c.moveTo(middle+(x<middle?-3:3),bottom-11);c.lineTo(x,bottom);c.stroke();}
    c.fillStyle='#01040b';c.globalAlpha=.55;c.fillRect(left,top,2,bottom-top);c.fillRect(right-2,top,2,bottom-top);c.restore();
  }
  paint(time,motion=true){
    const main=this.layers[0],c=main.context,t=time/1000,p=main.patch;
    for(const layer of this.layers)layer.context.clearRect(0,0,layer.canvas.width,layer.canvas.height);
    if(motion){
      c.fillStyle=this.skyGradient;c.fillRect(0,0,main.canvas.width,main.canvas.height);c.save();transform(c,p);
      for(const[index,entry]of CLOUDS.entries()){
        const x=p.x-40+mod(entry.x*(p.width+80)/347+t*entry.speed,p.width+80),texture=this.cloudTextures[index%this.cloudTextures.length];
        c.drawImage(texture,Math.round(x),Math.round(this.profile.skyY+(entry.y-20)*.65),texture.width*entry.size/2,texture.height*entry.size/2);
      }
      for(const[index,flock]of FLOCKS.entries()){
        const progress=mod(t/(34+index*4)+flock.offset,1),base=flock.direction>0?p.x-12+progress*(p.width+24):p.x+p.width+12-progress*(p.width+24);
        for(let n=0;n<flock.count;n++)bird(c,base-n*8*flock.direction,this.profile.skyY+3+(flock.y-24)*.6+n*1.6+Math.sin(t*.7+n+index)*.8,flock.size,Math.sin(t*7+n*1.1+index));
      }
      c.restore();c.save();c.globalCompositeOperation='destination-in';c.drawImage(main.skyMask,0,0);c.restore();
      for(const layer of this.layers)this.paintWater(layer,t);
    }
    if(this.profile.passage){c.save();transform(c,p);this.paintPassage(c,this.profile.passage);c.restore();}
  }
  draw(target,source,timestamp,motion=true,map=TOURNAMENT_LOBBY_MAP){
    if(!TOURNAMENT_SCENERY[map]||!source?.complete||!source.naturalWidth)return;
    if(this.source!==source||this.map!==map||!this.canvas)this.prepare(source,map);
    if(!this.context)return;
    const time=Number.isFinite(timestamp)?Math.max(0,timestamp):0;
    if(this.lastTime===-Infinity||this.motion!==motion||motion&&(time<this.lastTime||time-this.lastTime>=50)){
      this.paint(time,motion);this.lastTime=time;this.motion=motion;this.frames++;
    }
    for(const layer of this.layers)target.drawImage(layer.canvas,layer.patch.x*2,layer.patch.y*2);
  }
  suspend(){
    for(const layer of this.layers||[])for(const key of ['canvas','texture','skyMask','waterMask','water']){layer[key].width=layer[key].height=0;}
    for(const texture of this.cloudTextures||[])texture.width=texture.height=0;
    this.layers=[];this.cloudTextures=[];this.canvas=this.context=this.mask=this.source=this.map=this.profile=this.skyGradient=null;
    this.skyPixels=0;this.lastTime=-Infinity;this.motion=null;
  }
}
