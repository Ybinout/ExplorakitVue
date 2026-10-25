import { SIDE_PILLARS } from './arenaPillars.js';
import { sceneElapsed, drawCollapsedFloor } from './hozeCollapse.js';
// All geometry is authored in the 448 × 320 artwork, not inferred map-wide.
export const HOZE_MAP = 'ville_safe1_arene';
export const HOZE_PILLARS = SIDE_PILLARS;
// Eight long faults with connected side branches, reaching towards the crest.
// Keep the central carpet, stairs and enclosing walls clear.
const LEFT_FAULTS = [
  { phase:0, path:[[202,111],[187,123],[175,119],[159,132],[145,127],[127,137],[130,148],[113,158],[102,154],[88,151],[77,160],[65,157],[51,169],[40,180],[28,177]], branches:[[3,[155,149],[166,158],[160,173]],[7,[111,143],[97,136],[91,119]],[9,[85,137],[71,132],[59,114]],[12,[48,154],[35,147]]]},
  { phase:3, path:[[204,225],[190,235],[176,230],[159,242],[146,235],[126,246],[111,239],[99,252],[84,255],[74,263],[55,254],[43,265],[28,260]], branches:[[2,[173,212],[157,203],[147,187]],[5,[130,261],[142,269]],[8,[86,233],[70,224],[55,211]],[10,[49,238],[36,232]]]},
  { phase:6, path:[[202,174],[187,184],[175,178],[161,189],[147,182],[130,193],[116,188],[100,200],[86,194],[71,207],[57,201],[43,214],[28,208]], branches:[[2,[172,159],[181,145]],[4,[148,201],[137,211],[142,224]],[7,[100,179],[111,169]],[9,[72,225],[61,236]]]},
  { phase:9, path:[[118,106],[123,120],[112,132],[118,146],[108,162],[116,178],[107,194],[114,211],[104,226],[112,242],[102,256],[108,269]], branches:[[1,[139,114],[148,106]],[4,[94,164],[81,177]],[7,[129,212],[139,227]],[9,[94,243],[81,256]]]},
];
export const HOZE_FAULTS = LEFT_FAULTS.flatMap(f => [f, {
  phase: f.phase+1.5,
  path: f.path.map(([x,y]) => [448-x,y]),
  branches: f.branches.map(([start,...points]) => [start,...points.map(([x,y]) => [448-x,y])]),
}]);
export const HOZE_FAULT_DURATION_MS = 42000;
export const HOZE_FAULT_COMPLETE_MS = HOZE_FAULT_DURATION_MS+10500;
export const HOZE_FAULT_BANDS = [[27,104,182,167],[239,104,182,167]];
const BANNERS = [[24,104,39,137],[57,104,72,137],[375,104,390,137],[408,104,423,137],
  [24,197,39,230],[57,197,72,230],[375,197,390,230],[408,197,423,230]];
const mod = (n,d) => ((n%d)+d)%d, clamp = n => Math.max(0,Math.min(1,n));
const inside = (x,y,points) => {
  let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++) {
    const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;
  }return hit;
};
export function hozeFaultPose(timestamp,phase=0,motion=true) {
  if(!motion)return{growth:1,opacity:.85,shake:0,dust:0};
  const growth=clamp((timestamp-phase*1000)/HOZE_FAULT_DURATION_MS);
  return{growth,opacity:.85,shake:1,dust:growth>0&&growth<1?.65:0};
}
export function hozePillarOffset(timestamp,index,row,height) {
  const t=timestamp/1000, sway=Math.sin(t*2.25+index*.83)*1.35+Math.sin(t*6.4+index*1.31)*.4;
  return Math.round(sway*Math.pow(1-row/(height-1),1.45)*2);
}
const pathLength = points => points.slice(1).reduce((total,p,i) => total+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0);
// Reveal by travelled distance, so long segments do not suddenly jump ahead.
function visiblePath(points,amount) {
  let remaining=pathLength(points)*clamp(amount);const visible=[points[0]];
  for(let i=1;i<points.length&&remaining>0;i++) {
    const a=points[i-1],b=points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    if(remaining>=length){visible.push(b);remaining-=length;}
    else{const mix=remaining/length;visible.push([a[0]+(b[0]-a[0])*mix,a[1]+(b[1]-a[1])*mix]);break;}
  }
  return visible;
}
function trace(c,points,amount) {
  const visible=visiblePath(points,amount);if(visible.length<2)return;
  c.beginPath();c.moveTo(...visible[0]);for(const point of visible.slice(1))c.lineTo(...point);c.stroke();
}
// Uneven opening with tapered ends, rather than a uniform outlined wire.
function fracture(c,points,amount) {
  const visible=visiblePath(points,amount);
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
  constructor(createCanvas=()=>document.createElement('canvas')){this.createCanvas=createCanvas;this.frames=0;this.faultStartedAt=null;this.faultElapsed=0;this.suspend();}
  setCollapseState(state) {
    const next=state?.map===HOZE_MAP?state:null;
    if(this.collapseState?.epoch!==next?.epoch){if(this.faultFloor){this.faultFloor.width=this.faultFloor.height=0;this.faultFloor=null;}this.faultStartedAt=null;this.faultElapsed=0;this.collapseElapsed=0;this.lastTime=-Infinity;}
    this.collapseState=next;
  }
  surface(w,h){const c=this.createCanvas();c.width=w;c.height=h;return c;}
  prepare(source) {
    this.suspend();
    try {
      this.source=source;this.canvas=this.surface(896,640);this.context=this.canvas.getContext('2d');
      this.context.imageSmoothingEnabled=false;
      // Read pixels on a disposable CPU surface; keep the animated surface free
      // of readback so drawing it does not require a CPU-to-GPU transfer per frame.
      const sample=this.surface(896,640),reader=sample.getContext('2d',{willReadFrequently:true});
      reader.imageSmoothingEnabled=false;reader.drawImage(source,0,0,896,640);
      const original=reader.getImageData(0,0,896,640).data;sample.width=sample.height=0;
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
        texture.getContext('2d').putImageData(data,0,0);return{x:left,y,w,h,texture,flex:Float64Array.from({length:h},(_,row)=>Math.pow(1-row/(h-1),1.45))};
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
    // Retain this small clock across surface disposal (combat, hidden tab,
    // map change). Finished cracks never shrink or restart during this session.
    if(this.faultStartedAt===null)this.faultStartedAt=time;
    const collapseElapsed=this.collapseState?Math.max(this.collapseElapsed||0,sceneElapsed(this.collapseState,time)):null;
    this.collapseElapsed=collapseElapsed;
    const collapseStage=this.collapseState?.holes.filter(h=>collapseElapsed>=h.atMs).length||0;
    this.faultElapsed=Math.max(this.faultElapsed,collapseElapsed??time-this.faultStartedAt,motion?0:HOZE_FAULT_COMPLETE_MS);
    if(this.lastTime===-Infinity||this.motion!==motion||this.collapseStage!==collapseStage||motion&&(time<this.lastTime||time-this.lastTime>=50)) {
      this.paint(time,motion,this.faultElapsed,collapseElapsed);this.lastTime=time;this.motion=motion;this.collapseStage=collapseStage;this.frames++;
    }target.drawImage(this.canvas,0,0,896,640);
  }
  paintFaults(c,time,motion,elapsed) {
    c.save();c.scale(2,2);c.imageSmoothingEnabled=false;
    c.beginPath();for(const band of HOZE_FAULT_BANDS)c.rect(...band);c.clip();
    for(const[i,f]of HOZE_FAULTS.entries()) {
      const p=hozeFaultPose(elapsed,f.phase,motion);c.save();c.lineJoin='bevel';c.lineCap='butt';
      c.globalAlpha=p.opacity*.9;fracture(c,f.path,p.growth);
      c.strokeStyle='#5c4835';c.lineWidth=.85;c.globalAlpha=p.opacity*.8;
      for(const[start,...points]of f.branches) {
        const attachment=pathLength(f.path.slice(0,start+1))/pathLength(f.path);
        trace(c,[f.path[start],...points],clamp((p.growth-attachment)/(1-attachment)));
      }
      if(motion&&p.dust)for(let n=0;n<6;n++){
        const age=mod(time/2200+n/6+i*.13,1);
        const point=visiblePath(f.path,Math.max(0,p.growth-age*.035)).at(-1);
        c.globalAlpha=p.dust*(1-age)*.55;c.fillStyle=n%2?'#c5a06b':'#f2dbb6';
        c.fillRect(Math.round(point[0]+age*8+Math.sin(n*7+age*4)*2),Math.round(point[1]-age*7),n%3?1:1.5,1);
      }c.restore();
    }c.restore();
    // Fissures live on the floor; they disappear beneath the actual fixtures.
    c.save();c.globalCompositeOperation='destination-out';c.drawImage(this.structures,0,0);c.restore();
  }
  paint(time,motion,elapsed=time,collapseElapsed=null) {
    const c=this.context;c.clearRect(0,0,896,640);
    // Finished fractures are immutable. Only the columns and falling slabs need
    // to keep being repainted after the opening sequence has completed.
    if (!motion || elapsed>=HOZE_FAULT_COMPLETE_MS) {
      if(!this.faultFloor) {
        this.faultFloor=this.surface(896,640);
        this.paintFaults(this.faultFloor.getContext('2d'),time,motion,elapsed);
      }
      c.drawImage(this.faultFloor,0,0);
    } else this.paintFaults(c,time,motion,elapsed);
    if(this.collapseState){c.save();c.scale(2,2);drawCollapsedFloor(c,this.source,this.collapseState,collapseElapsed??sceneElapsed(this.collapseState,time),motion);c.restore();}
    if(!motion)return;
    c.drawImage(this.repair,0,0);
    for(const[i,p]of this.pillars.entries()) {
      const t=time/1000,sway=Math.sin(t*2.25+i*.83)*1.35+Math.sin(t*6.4+i*1.31)*.4;
      const offset=row=>Math.round(sway*p.flex[row]*2);
      let start=0,dx=offset(0);
      for(let row=1;row<=p.h;row++) {
        const next=offset(Math.min(row,p.h-1));if(row<p.h&&next===dx)continue;
        c.drawImage(p.texture,0,start,p.w,row-start,p.x+dx,p.y+start,p.w,row-start);start=row;dx=next;
      }
    }
  }
  suspend() {
    for(const p of this.pillars||[]){p.texture.width=0;p.texture.height=0;}
    for(const key of ['canvas','repair','structures','faultFloor']){if(this[key]){this[key].width=0;this[key].height=0;}this[key]=null;}
    this.context=this.source=null;this.pillars=[];this.lastTime=-Infinity;this.motion=null;
  }
}
