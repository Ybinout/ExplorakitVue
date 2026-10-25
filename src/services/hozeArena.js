import { SIDE_PILLARS } from './arenaPillars.js';
// All geometry is authored in the 448 × 320 artwork, not inferred map-wide.
export const HOZE_MAP = 'ville_safe1_arene';
export const HOZE_PILLARS = SIDE_PILLARS;
export const HOZE_FAULTS = [
  { phase:0, path:[[139,125],[127,137],[130,148],[113,158],[102,154],[88,151],[77,160],[65,157],[51,169],[40,180],[24,177]], branches:[[3,[111,143],[97,136],[91,121]],[5,[85,137],[71,132],[59,117]],[8,[48,154],[35,147]]]},
  { phase:1.4, path:[[137,218],[126,230],[111,227],[99,241],[84,244],[74,251],[55,246],[43,258],[24,253]], branches:[[2,[113,246],[123,255],[117,263]],[4,[86,226],[70,217],[55,211]],[6,[49,231],[36,226]]]},
  { phase:.7, path:[[309,126],[321,137],[318,149],[335,160],[347,155],[362,151],[373,160],[386,157],[399,170],[410,182],[424,178]], branches:[[3,[337,143],[351,136],[358,120]],[5,[366,136],[380,131],[391,116]],[8,[400,154],[413,147]]]},
  { phase:2.1, path:[[311,219],[322,231],[337,228],[349,242],[364,245],[375,252],[393,247],[406,259],[424,254]], branches:[[2,[336,246],[325,256],[331,263]],[4,[362,227],[377,217],[392,211]],[6,[399,232],[413,226]]]},
];
const BANNERS = [[24,104,39,137],[57,104,72,137],[375,104,390,137],[408,104,423,137],
  [24,197,39,230],[57,197,72,230],[375,197,390,230],[408,197,423,230]];
const mod = (n,d) => ((n%d)+d)%d, clamp = n => Math.max(0,Math.min(1,n));
const inside = (x,y,points) => {
  let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++) {
    const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;
  }return hit;
};
export function hozeFaultPose(timestamp,phase=0,motion=true) {
  if(!motion)return{growth:.86,opacity:.6,shake:0,dust:0};
  const t=mod(timestamp/1000-phase,14), opening=.5+.5*Math.sin(t/14*Math.PI*2);
  return{growth:.72+opening*.28,opacity:.65+opening*.35,shake:1,dust:.22+opening*.55};
}
export function hozePillarOffset(timestamp,index,row,height) {
  const t=timestamp/1000, sway=Math.sin(t*2.25+index*.83)*1.35+Math.sin(t*6.4+index*1.31)*.4;
  return Math.round(sway*Math.pow(1-row/(height-1),1.45)*2);
}
function trace(c,points,amount) {
  const segments=(points.length-1)*clamp(amount),end=Math.floor(segments);c.beginPath();c.moveTo(...points[0]);
  for(let i=1;i<=end;i++)c.lineTo(...points[i]);
  if(end<points.length-1){const a=points[end],b=points[end+1],mix=segments-end;c.lineTo(a[0]+(b[0]-a[0])*mix,a[1]+(b[1]-a[1])*mix);}c.stroke();
}
// Uneven opening with tapered ends, rather than a uniform outlined wire.
function fracture(c,points,amount) {
  const length=(points.length-1)*clamp(amount),last=Math.floor(length),visible=points.slice(0,last+1);
  if(last<points.length-1){const a=points[last],b=points[last+1],f=length-last;visible.push([a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f]);}
  if(visible.length<2)return;
  const sides=[[],[]];
  for(let i=0;i<visible.length;i++) {
    const a=visible[Math.max(0,i-1)],b=visible[Math.min(visible.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],norm=Math.hypot(dx,dy)||1;
    const width=i===0||i===visible.length-1?.2:.8+Math.sin(i*2.2)*.3+Math.sin(i/visible.length*Math.PI)*.5;
    for(const sign of [-1,1])sides[sign===-1?0:1].push([visible[i][0]-dy/norm*width*sign,visible[i][1]+dx/norm*width*sign]);
  }
  const outline=[...sides[0],...sides[1].reverse()];
  const shape=()=>{c.beginPath();c.moveTo(...outline[0]);for(const p of outline.slice(1))c.lineTo(...p);c.closePath();c.fill();};
  c.save();c.translate(.6,.7);c.fillStyle='#d7bc8c';shape();c.restore();
  c.fillStyle='#594332';shape();c.strokeStyle='#30271f';c.lineWidth=.55;trace(c,visible,1);
}
export class HozeArenaRenderer {
  constructor(createCanvas=()=>document.createElement('canvas')){this.createCanvas=createCanvas;this.frames=0;this.suspend();}
  surface(w,h){const c=this.createCanvas();c.width=w;c.height=h;return c;}
  prepare(source) {
    this.suspend();
    try {
      this.source=source;this.canvas=this.surface(896,640);this.context=this.canvas.getContext('2d');
      this.context.imageSmoothingEnabled=false;this.context.drawImage(source,0,0,896,640);
      const original=this.context.getImageData(0,0,896,640).data;
      this.repair=this.surface(896,640);this.structures=this.surface(896,640);
      const patch=this.repair.getContext('2d').createImageData(896,640),mask=this.structures.getContext('2d').createImageData(896,640);
      const mark=(x,y)=>{const j=(y*896+x)*4;mask.data[j+3]=255;};
      this.pillars=HOZE_PILLARS.map(([x,top,bottom])=>{
        const polygon=[[x-6,top-1],[x+6,top-1],[x+12,top+2],[x+12,top+15],[x+8.5,top+20],[x+7.5,top+24],
          [x+7.5,bottom-21],[x+9,bottom-18],[x+9,bottom-15],[x-9,bottom-15],[x-9,bottom-18],[x-7.5,bottom-21],
          [x-7.5,top+24],[x-8.5,top+20],[x-12,top+15],[x-12,top+2]];
        const left=(x-14)*2,y=(top-1)*2,w=56,h=(bottom-top-14)*2,texture=this.surface(w,h),data=texture.getContext('2d').createImageData(w,h);
        for(let row=0;row<h;row++) {
          const cols=[];for(let col=0;col<w;col++)if(inside((left+col+.5)/2,(y+row+.5)/2,polygon))cols.push(col);
          if(!cols.length)continue;
          const lo=cols[0],hi=cols.at(-1);
          for(const col of cols) {
            const px=left+col,py=y+row,j=(py*896+px)*4,k=(row*w+col)*4;
            const l=(py*896+left+lo-3)*4,rr=(py*896+left+hi+3)*4;
            let sample=col<(lo+hi)/2?l:rr;
            // Avoid borrowing a neighbouring burgundy flag/copper highlight.
            if(original[sample]-original[sample+1]>50||original[sample]>original[sample+1]*1.45)sample=sample===l?rr:l;
            for(let n=0;n<3;n++){data.data[k+n]=original[j+n];patch.data[j+n]=original[sample+n];}
            data.data[k+3]=patch.data[j+3]=255;mark(px,py);
          }
        }
        // Fixed plinths also occlude the larger fractures below them.
        for(let py=(bottom-18)*2;py<(bottom+1)*2;py++)for(let px=(x-11)*2;px<(x+11)*2;px++)mark(px,py);
        texture.getContext('2d').putImageData(data,0,0);return{x:left,y,w,h,texture};
      });
      for(const[l,t,r,b]of BANNERS)for(let y=t*2;y<b*2;y++)for(let x=l*2;x<r*2;x++) {
        const j=(y*896+x)*4;if(original[j]>original[j+1]+8&&original[j]>original[j+2]+6)mark(x,y);
      }
      this.repair.getContext('2d').putImageData(patch,0,0);this.structures.getContext('2d').putImageData(mask,0,0);this.context.clearRect(0,0,896,640);
    }catch(_){this.suspend();}
  }
  draw(target,source,timestamp,motion=true) {
    if(!source?.complete||!source.naturalWidth)return;
    if(this.source!==source||!this.canvas)this.prepare(source);if(!this.context)return;
    const time=Number.isFinite(timestamp)?Math.max(0,timestamp):0;
    if(this.lastTime===-Infinity||this.motion!==motion||motion&&(time<this.lastTime||time-this.lastTime>=50)) {
      this.paint(time,motion);this.lastTime=time;this.motion=motion;this.frames++;
    }target.drawImage(this.canvas,0,0,896,640);
  }
  paint(time,motion) {
    const c=this.context;c.clearRect(0,0,896,640);c.save();c.scale(2,2);c.imageSmoothingEnabled=false;
    c.beginPath();c.rect(27,112,116,153);c.rect(305,112,116,153);c.clip();
    for(const[i,f]of HOZE_FAULTS.entries()) {
      const p=hozeFaultPose(time,f.phase,motion);c.save();c.lineJoin='bevel';c.lineCap='butt';
      c.globalAlpha=p.opacity*.9;fracture(c,f.path,p.growth);
      c.strokeStyle='#5c4835';c.lineWidth=.85;c.globalAlpha=p.opacity*.8;
      for(const[start,...points]of f.branches)trace(c,[f.path[start],...points],clamp(p.growth*(f.path.length-1)-start));
      if(motion)for(let n=0;n<10;n++){
        const age=mod(time/2200+n/10+i*.13,1),point=f.path[1+n%(f.path.length-1)];
        c.globalAlpha=p.dust*(1-age)*.55;c.fillStyle=n%2?'#c5a06b':'#f2dbb6';
        c.fillRect(Math.round(point[0]+age*8+Math.sin(n*7+age*4)*2),Math.round(point[1]-age*7),n%3?1:1.5,1);
      }c.restore();
    }c.restore();
    // Fissures live on the floor; they disappear beneath the actual fixtures.
    c.save();c.globalCompositeOperation='destination-out';c.drawImage(this.structures,0,0);c.restore();
    if(!motion)return;
    c.drawImage(this.repair,0,0);
    for(const[i,p]of this.pillars.entries()) {
      let start=0,dx=hozePillarOffset(time,i,0,p.h);
      for(let row=1;row<=p.h;row++) {
        const next=hozePillarOffset(time,i,row,p.h);if(row<p.h&&next===dx)continue;
        c.drawImage(p.texture,0,start,p.w,row-start,p.x+dx,p.y+start,p.w,row-start);start=row;dx=next;
      }
    }
  }
  suspend() {
    for(const p of this.pillars||[]){p.texture.width=0;p.texture.height=0;}
    for(const key of ['canvas','repair','structures']){if(this[key]){this[key].width=0;this[key].height=0;}this[key]=null;}
    this.context=this.source=null;this.pillars=[];this.lastTime=-Infinity;this.motion=null;
  }
}
