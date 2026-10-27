export const WANDA_MAP = 'ville4_arene';
const WIDTH = 448, HEIGHT = 320, FRAME_MS = 50;
export const WANDA_PAUSE_MS = 1100;
// Authored in the room's logical pixels. The carpet, stairs and dais stay clear.
export const WANDA_STONES = Object.freeze([
  {id:'west-cap',kind:'pillar',x:139,y:126,w:18,h:13,lift:11,phase:.3},
  {id:'west-stone',kind:'stone',x:105,y:190,w:13,h:10,lift:9,phase:2.1},
  {id:'west-low',kind:'stone',x:140,y:239,w:12,h:9,lift:13,phase:4.4},
  {id:'east-cap',kind:'pillar',x:303,y:137,w:17,h:13,lift:13,phase:1.4},
  {id:'east-stone',kind:'stone',x:344,y:197,w:14,h:11,lift:10,phase:3.7},
  {id:'east-low',kind:'stone',x:301,y:239,w:12,h:9,lift:12,phase:5.5}
]);
export const WANDA_CRYSTALS = Object.freeze([
  {id:'west-high',kind:'crystal',x:29,y:104,w:7,h:15,lift:13,phase:1.7},
  {id:'west-inner',kind:'crystal',x:159,y:128,w:6,h:13,lift:11,phase:4.8},
  {id:'west-middle',kind:'crystal',x:35,y:198,w:8,h:17,lift:15,phase:.7},
  {id:'west-bottom',kind:'crystal',x:157,y:242,w:6,h:12,lift:10,phase:3.4},
  {id:'east-high',kind:'crystal',x:416,y:108,w:7,h:16,lift:14,phase:3},
  {id:'east-inner',kind:'crystal',x:291,y:126,w:6,h:12,lift:10,phase:1.1},
  {id:'east-middle',kind:'crystal',x:410,y:209,w:7,h:15,lift:14,phase:5.2},
  {id:'east-bottom',kind:'crystal',x:288,y:247,w:6,h:13,lift:12,phase:2.5}
]);
const PROPS = [...WANDA_STONES, ...WANDA_CRYSTALS];
const mod = (n,d) => ((n%d)+d)%d;
export function wandaFloatPose(prop, time = 0) {
  const phase = time / 1000 * .72 + prop.phase;
  return {id:prop.id,kind:prop.kind,x:Math.round(prop.x+Math.sin(phase*.63)*1.5),
    y:Math.round(prop.y-prop.lift+Math.sin(phase)*4),shadowX:prop.x,shadowY:prop.y+3,
    glow:.12+Math.sin(phase*.7)*.025};
}
function polygon(c, color, points) {
  c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();
}
function paintProp(c, p) {
  const w=p.w,h=p.h;
  if(p.kind==='crystal') {
    polygon(c,'#3d2b63',[[w/2,0],[w,4],[w,h-4],[w/2,h],[0,h-4],[0,4]]);
    polygon(c,'#a37bdf',[[w/2,1],[w-1,4],[w-1,h-4],[w/2,h-1],[1,h-4],[1,4]]);
    polygon(c,'#e2d2ff',[[w/2,1],[w/2,h-2],[1,h-4],[1,4]]);
    polygon(c,'#7655b6',[[w/2,h-2],[w-1,h-4],[w-1,5],[w/2,7]]);
    c.fillStyle='#f0e6ff';c.fillRect(Math.floor(w/2)-1,3,1,4);
  } else {
    polygon(c,'#30334a',[[3,0],[w-4,0],[w,3],[w-1,h-2],[w-5,h],[2,h-1],[0,h-5],[0,3]]);
    polygon(c,'#75778f',[[3,1],[w-4,1],[w-1,4],[w-2,h-3],[w-5,h-1],[2,h-2],[1,h-5],[1,4]]);
    polygon(c,'#a6a5b9',[[3,1],[w-4,1],[w-2,3],[w-5,5],[3,5],[1,4]]);
    polygon(c,'#51576e',[[w-5,5],[w-2,3],[w-2,h-3],[w-5,h-1]]);
    c.fillStyle='#62677f';c.fillRect(3,6,Math.max(2,w-9),2);
    if(p.kind==='pillar') {c.fillStyle='#baa075';c.fillRect(2,h-5,w-5,1);c.fillStyle='#7c684f';c.fillRect(2,h-4,w-5,1);}
  }
}
export class WandaArenaRenderer {
  constructor(createCanvas=()=>document.createElement('canvas')) {
    this.createCanvas=createCanvas;this.frames=0;this.destroyed=false;this.suspend();
  }
  surface(w,h) {const c=this.createCanvas();c.width=w;c.height=h;return c;}
  prepare(source) {
    this.suspend();
    try {
      this.source=source;this.canvas=this.surface(WIDTH,HEIGHT);this.context=this.canvas.getContext('2d');
      this.context.imageSmoothingEnabled=false;
      const sample=this.surface(WIDTH,HEIGHT),reader=sample.getContext('2d',{willReadFrequently:true});
      reader.imageSmoothingEnabled=false;reader.drawImage(source,0,0,WIDTH,HEIGHT);
      const pixels=reader.getImageData(0,0,WIDTH,HEIGHT).data;sample.width=sample.height=0;
      this.inlays=this.surface(WIDTH,HEIGHT);const ink=this.inlays.getContext('2d'),mask=ink.createImageData(WIDTH,HEIGHT);this.inlayPixels=0;
      // Actual pale engraved pixels only. Never wash a rectangle of floor,
      // stairs, carpet, fixtures, columns or the stained-glass architecture.
      for(let y=103;y<266;y++)for(let x=98;x<351;x++) {
        if(x>=201&&x<=249 || y>=248&&x>=186&&x<=262)continue;
        const i=(y*WIDTH+x)*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];
        if(pixels[i+3]!==255||r<148||g<140||b<160||b-r>45||Math.abs(r-g)>25)continue;
        const light=(r*.2126+g*.7152+b*.0722)/178;
        mask.data[i]=Math.min(255,198*light);mask.data[i+1]=Math.min(255,180*light);mask.data[i+2]=Math.min(255,249*light);mask.data[i+3]=255;this.inlayPixels++;
      }
      if(this.inlayPixels<400||this.inlayPixels>10000)throw Error('Unrecognized Wanda floor inlays');
      ink.putImageData(mask,0,0);this.flow=this.surface(WIDTH,HEIGHT);
      this.beam=this.surface(1,48);const bc=this.beam.getContext('2d'),gradient=bc.createLinearGradient(0,0,0,48);
      gradient.addColorStop(0,'rgba(214,199,255,0)');gradient.addColorStop(.5,'rgba(225,211,255,.68)');gradient.addColorStop(1,'rgba(214,199,255,0)');bc.fillStyle=gradient;bc.fillRect(0,0,1,48);
      this.glow=this.surface(64,32);const gc=this.glow.getContext('2d');gc.scale(1,.5);const halo=gc.createRadialGradient(32,32,0,32,32,30);halo.addColorStop(0,'#c4a3fa');halo.addColorStop(1,'rgba(172,134,244,0)');gc.fillStyle=halo;gc.fillRect(0,0,64,64);
      this.props=PROPS.map(p=>{const texture=this.surface(p.w,p.h);paintProp(texture.getContext('2d'),p);return {...p,texture};});
    }catch(_){this.suspend();this.failedSource=source;}
  }
  advance(time,motion,speaking) {
    const previous=this.clockAt??time,delta=Math.min(200,Math.max(0,time-previous));
    if(speaking&&!this.speaking){this.pauseStart=time-delta;this.pauseUntil=time+WANDA_PAUSE_MS;}
    this.clockAt=time;this.speaking=speaking;
    if(!motion)return;
    const overlap=Math.max(0,Math.min(time,this.pauseUntil)-Math.max(time-delta,this.pauseStart));
    this.floatTime+=Math.max(0,delta-overlap);this.flowTime+=delta;
  }
  draw(target,source,timestamp,motion=true,speaking=false) {
    if(this.destroyed||!source?.complete||!source.naturalWidth||this.failedSource===source)return;
    if(this.source!==source||!this.canvas)this.prepare(source);if(!this.context)return;
    const time=Number.isFinite(timestamp)?Math.max(0,timestamp):0;
    this.advance(time,motion,speaking);
    if(this.lastTime===-Infinity||this.motion!==motion||motion&&(time<this.lastTime||time-this.lastTime>=FRAME_MS)) {
      this.paint(motion?this.floatTime:0,motion?this.flowTime:0,motion);this.lastTime=time;this.motion=motion;this.frames++;
    }
    target.drawImage(this.canvas,0,0,896,640);
  }
  paint(floatTime,flowTime,motion) {
    const c=this.context;c.clearRect(0,0,WIDTH,HEIGHT);c.save();c.imageSmoothingEnabled=false;
    c.globalAlpha=.2;c.drawImage(this.inlays,0,0);c.globalAlpha=1;
    if(motion){const f=this.flow.getContext('2d');f.clearRect(0,0,WIDTH,HEIGHT);
      for(let i=0;i<2;i++){const age=mod(flowTime/8000+i*.5,1);f.drawImage(this.beam,0,280-age*210,WIDTH,48);}
      f.save();f.globalCompositeOperation='destination-in';f.drawImage(this.inlays,0,0);f.restore();c.drawImage(this.flow,0,0);
    }
    this.poses=this.props.map(p=>wandaFloatPose(p,floatTime));
    for(let i=0;i<this.props.length;i++) {
      const p=this.props[i],pose=this.poses[i];
      if(p.kind==='crystal'){c.globalAlpha=motion?pose.glow:.12;c.drawImage(this.glow,p.x-25,p.y-9,50,25);}
      c.globalAlpha=.2;c.fillStyle='#13182d';const sw=Math.round(p.w*.86);c.fillRect(p.x-Math.floor(sw/2),p.y+2,sw,3);c.fillRect(p.x-Math.floor(sw/2)+2,p.y+5,Math.max(2,sw-4),1);
      c.globalAlpha=1;c.drawImage(p.texture,pose.x-Math.floor(p.w/2),pose.y-p.h);
    }
    c.restore();
  }
  suspend() {
    for(const key of ['canvas','inlays','flow','beam','glow']){if(this[key])this[key].width=this[key].height=0;this[key]=null;}
    for(const p of this.props||[])p.texture.width=p.texture.height=0;
    this.props=[];this.poses=[];this.context=null;this.source=null;this.failedSource=null;this.lastTime=-Infinity;this.motion=null;
    this.clockAt=null;this.floatTime=0;this.flowTime=0;this.speaking=false;this.pauseStart=-Infinity;this.pauseUntil=-Infinity;this.inlayPixels=0;
  }
  destroy(){this.suspend();this.destroyed=true;}
}
