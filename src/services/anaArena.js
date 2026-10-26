import {drawAnaPetals} from './anaPetals.js';
export const ANA_MAP = 'ville3_arene';
// Living plants only: no floor emblems, banner motifs, pots or architecture.
const plant=(id,x,y,w,h,cx=x+w/2,cy=y+h/2)=>({id,bloom:[cx,cy],points:[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]});
const mirror=points=>points.map(([x,y])=>[448-x,y]);
const outerIvy=[[34,27],[37,22],[42,18],[46,21],[50,26],[49,31],[46,28],[44,25],[42,25],[40,28],[40,36],[41,42],[40,49],[39,55],[37,59],[34,57],[35,51],[35,46],[34,42],[35,36]];
const innerIvy=[[61,31],[63,22],[68,16],[76,14],[84,18],[89,27],[89,47],[84,45],[83,28],[79,23],[73,21],[68,27],[66,45],[62,47]];
export const ANA_FOLIAGE = [
  plant('upper-left',22,54,22,24,30,67),plant('upper-left-inner',62,46,25,26,74,58),
  plant('dais-left',134,35,23,20,147,47),plant('dais-right',291,35,24,20,301,47),
  plant('upper-right-inner',361,46,25,26,375,58),plant('upper-right',404,54,27,24,419,67),
  plant('middle-left',21,137,23,29,30,154),plant('middle-left-inner',54,134,26,33,66,156),
  plant('middle-right-inner',368,134,27,33,381,156),plant('middle-right',405,137,27,29,419,154),
  plant('lower-left',20,229,25,28,30,242),plant('lower-left-inner',53,234,27,27,66,248),
  plant('lower-right-inner',368,234,27,27,382,248),plant('lower-right',404,229,28,28,419,242),
  {id:'ivy-left',points:outerIvy},{id:'ivy-left-inner',points:innerIvy},
  {id:'ivy-right-inner',points:mirror(innerIvy)},{id:'ivy-right',points:mirror(outerIvy)}
];
// Follow the actual leaf silhouette where a plant overlaps stained glass or
// the point of a banner. A colour key alone would also catch their green paint.
for(const [left,right,points]of [
  ['upper-left','upper-right',[[24,62],[27,61],[28,57],[30,55],[32,58],[34,61],[37,58],[40,58],[40,63],[37,66],[42,67],[43,71],[39,73],[35,74],[32,72],[29,75],[26,72],[23,74],[22,70],[23,67],[22,65]]],
  ['upper-left-inner','upper-right-inner',[[63,55],[66,52],[69,54],[73,54],[77,53],[80,46],[83,49],[84,56],[87,51],[89,53],[88,59],[90,61],[88,66],[86,70],[81,68],[79,72],[76,69],[73,71],[70,69],[67,71],[64,67]]],
  ['dais-left','dais-right',[[139,35],[144,38],[146,42],[151,37],[154,38],[153,43],[156,44],[157,48],[154,50],[157,54],[152,54],[149,51],[146,56],[143,51],[136,55],[134,51],[139,47],[134,47],[133,41],[137,41],[141,43],[138,39]]],
  ['lower-left','lower-right',[[23,238],[26,235],[30,237],[33,230],[36,228],[38,232],[38,238],[40,235],[42,237],[41,243],[43,247],[41,252],[37,252],[35,255],[30,254],[26,252],[23,249],[22,244]]],
  ['lower-left-inner','lower-right-inner',[[55,234],[58,226],[61,227],[64,234],[67,229],[70,225],[73,228],[72,237],[75,235],[77,241],[76,247],[77,253],[74,258],[69,256],[66,260],[63,257],[59,259],[55,256],[54,252],[55,248],[54,242]]]
]) {
  ANA_FOLIAGE.find(p=>p.id===left).points=points;
  ANA_FOLIAGE.find(p=>p.id===right).points=mirror(points);
}
export const ANA_SKY_PANES = [
  [[148,0],[300,0],[300,48],[148,48]],
  [[69,30],[76,20],[84,30],[84,62],[69,62]],
  [[14,48],[21,38],[27,48],[27,73],[14,73]],
  [[364,30],[372,20],[379,30],[379,62],[364,62]],
  [[421,48],[427,38],[434,48],[434,73],[421,73]]
];
const SKY={x:12,y:0,w:424,h:80};
const BIRD_FLOCKS = [
  {count:5,y:20,size:.7}, {count:4,y:30,size:.85}, {count:4,y:42,size:.65},
  {count:3,y:54,size:.8}, {count:3,y:64,size:.7}
];
const inside=(x,y,points)=>{
  let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
    const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;
  }return hit;
};
const mod = (n,d) => ((n%d)+d)%d;
export class AnaArenaRenderer {
  constructor(createCanvas=()=>document.createElement('canvas')) {
    this.createCanvas=createCanvas;this.frames=0;this.suspend();
  }
  surface(w,h) {const c=this.createCanvas();c.width=w;c.height=h;return c;}
  prepare(source) {
    this.suspend();
    try {
      this.source=source;this.canvas=this.surface(896,640);this.context=this.canvas.getContext('2d');this.context.imageSmoothingEnabled=false;
      const sample=this.surface(896,640),reader=sample.getContext('2d',{willReadFrequently:true});reader.imageSmoothingEnabled=false;reader.drawImage(source,0,0,896,640);
      const pixels=reader.getImageData(0,0,896,640).data;sample.width=sample.height=0;
      const labels=new Uint8Array(896*640),groups=ANA_FOLIAGE.map(()=>[]);
      for(let n=0;n<ANA_FOLIAGE.length;n++) {
        const region=ANA_FOLIAGE[n],xs=region.points.map(p=>p[0]),ys=region.points.map(p=>p[1]);
        const left=Math.max(0,Math.floor(Math.min(...xs)*2)),right=Math.min(896,Math.ceil(Math.max(...xs)*2));
        const top=Math.max(0,Math.floor(Math.min(...ys)*2)),bottom=Math.min(640,Math.ceil(Math.max(...ys)*2));
        for(let y=top;y<bottom;y++)for(let x=left;x<right;x++) {
          const index=y*896+x,i=index*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];
          const green=region.bloom ? g>r*1.19&&g>b*1.32&&g>35&&r<205&&b<190
            : g>r*.94&&g>b*1.4&&g>35&&r<205;
          const flower=region.bloom&&((x/2-region.bloom[0])/8)**2+((y/2-region.bloom[1])/8)**2<1&&r>g+18&&r>b+18;
          if(!labels[index]&&pixels[i+3]===255&&(green||flower)&&inside((x+.5)/2,(y+.5)/2,region.points)) {
            labels[index]=n+1;groups[n].push(index);
          }
        }
        // Enclosed highlights/stamens belong to the plant, unlike the open
        // spaces between leaves. This keeps the original texture intact.
        if(region.bloom) {
          const seen=new Set();
          for(let y=top;y<bottom;y++)for(let x=left;x<right;x++) {
            const start=y*896+x;if(labels[start]||seen.has(start))continue;
            const hole=[start];seen.add(start);let open=false;
            for(let k=0;k<hole.length;k++) {
              const p=hole[k],px=p%896,py=Math.floor(p/896);
              if(px===left||px===right-1||py===top||py===bottom-1||!inside((px+.5)/2,(py+.5)/2,region.points))open=true;
              for(const d of [-896,-1,1,896]){const q=p+d,qx=q%896,qy=Math.floor(q/896);if(qx<left||qx>=right||qy<top||qy>=bottom||labels[q]||seen.has(q))continue;seen.add(q);hole.push(q);}
            }
            if(!open&&hole.length<=80)for(const p of hole){labels[p]=n+1;groups[n].push(p);}
          }
        }
      }
      // Preserve the dark one-pixel leaf outline; never extract a rectangular
      // wall patch. Single-pixel gaps in flowers move with their petals too.
      for(let n=0;n<groups.length;n++)for(const index of [...groups[n]])for(const d of [-896,-1,1,896]) {
        const p=index+d;if(p<0||p>=labels.length||labels[p])continue;
        if(inside((p%896+.5)/2,(Math.floor(p/896)+.5)/2,ANA_FOLIAGE[n].points)){labels[p]=n+1;groups[n].push(p);}
      }
      const nearest=new Int32Array(labels.length);nearest.fill(-1);const queue=[];
      for(const group of groups)for(const index of group)for(const d of [-896,-1,1,896]) {
        const p=index+d;if(p>=0&&p<labels.length&&!labels[p]){nearest[index]=p;queue.push(index);break;}
      }
      for(let n=0;n<queue.length;n++)for(const d of [-896,-1,1,896]) {
        const index=queue[n],p=index+d;
        if(p>=0&&p<labels.length&&labels[p]===labels[index]&&nearest[p]===-1){nearest[p]=nearest[index];queue.push(p);}
      }
      this.repair=this.surface(896,640);const repair=this.repair.getContext('2d').createImageData(896,640);
      this.foliage=groups.map((indices,n)=>{
        if(!indices.length)return null;
        let left=896,right=0,top=640,bottom=0;for(const i of indices){const x=i%896,y=Math.floor(i/896);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
        const w=right-left+1,h=bottom-top+1,texture=this.surface(w,h),c=texture.getContext('2d'),data=c.createImageData(w,h);
        for(const index of indices) {
          const i=index*4,j=((Math.floor(index/896)-top)*w+index%896-left)*4,k=nearest[index]*4;
          for(let channel=0;channel<4;channel++)data.data[j+channel]=pixels[i+channel];
          if(nearest[index]>=0){for(let channel=0;channel<3;channel++)repair.data[i+channel]=pixels[k+channel];repair.data[i+3]=255;}
        }
        c.putImageData(data,0,0);return{x:left,y:top,w,h,texture,pixels:indices.length,id:ANA_FOLIAGE[n].id};
      }).filter(Boolean);
      this.repair.getContext('2d').putImageData(repair,0,0);
      this.sky=this.surface(SKY.w*2,SKY.h*2);this.skyMask=this.surface(SKY.w*2,SKY.h*2);
      const sky=this.skyMask.getContext('2d'),mask=sky.createImageData(SKY.w*2,SKY.h*2);this.skyPixels=0;
      for(let y=0;y<SKY.h*2;y++)for(let x=0;x<SKY.w*2;x++) {
        const i=(y*896+SKY.x*2+x)*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];
        if(r<=120||g<=165||b<=170||b<=r+12||g<=r+4||b<g-9||!ANA_SKY_PANES.some(p=>inside(SKY.x+(x+.5)/2,(y+.5)/2,p)))continue;
        const j=(y*SKY.w*2+x)*4;mask.data[j]=mask.data[j+1]=mask.data[j+2]=mask.data[j+3]=255;this.skyPixels++;
      }
      sky.putImageData(mask,0,0);
    }catch(_){this.suspend();} // Fail closed to the original artwork.
  }
  draw(target,source,timestamp,motion=true) {
    if(!source?.complete||!source.naturalWidth)return;
    if(this.source!==source||!this.canvas)this.prepare(source);
    if(!this.context)return;
    const time=Number.isFinite(timestamp)?Math.max(0,timestamp):0;
    if(this.lastTime===-Infinity||this.motion!==motion||motion&&(time<this.lastTime||time-this.lastTime>=50)) {
      this.paint(time,motion);this.lastTime=time;this.motion=motion;this.frames++;
    }
    target.drawImage(this.canvas,0,0,896,640);
  }
  paint(time,motion) {
    const c=this.context;c.clearRect(0,0,896,640);
    if(motion) {
      this.paintBirds(time);c.drawImage(this.sky,SKY.x*2,0);c.drawImage(this.repair,0,0);
      for(const [index,f]of this.foliage.entries()) {
        const wind=Math.sin(time/(780+index*23)+index*1.4)*2.2+Math.sin(time/370+index*.73)*.7;
        const offset=row=>Math.round(Math.pow(1-row/Math.max(1,f.h-1),.8)*wind);
        let start=0,dx=offset(0);
        for(let row=1;row<=f.h;row++) {
          const next=offset(row);if(row<f.h&&next===dx)continue;
          c.drawImage(f.texture,0,start,f.w,row-start,f.x+dx,f.y+start,f.w,row-start);start=row;dx=next;
        }
      }
      drawAnaPetals(c,time);
    }
  }
  paintBirds(time) {
    const c=this.sky.getContext('2d');c.clearRect(0,0,this.sky.width,this.sky.height);c.save();c.scale(2,2);c.translate(-SKY.x,0);
    for(let flock=0;flock<BIRD_FLOCKS.length;flock++) {
      const formation=BIRD_FLOCKS[flock];
      const age=mod(time+flock*3800,19000);if(age>16000)continue;
      const progress=age/16000,direction=flock%2?-1:1,base=direction>0?-10+progress*468:458-progress*468;
      for(let bird=0;bird<formation.count;bird++) {
        const size=formation.size,x=base-bird*9*direction,y=formation.y+bird*3+Math.sin(progress*Math.PI*2+bird)*1.4;
        const flap=Math.sin(time/150+flock+bird*.7),wing=flap*2.8*size;
        c.globalAlpha=.72;c.strokeStyle='#284955';c.lineWidth=1.1*size;c.lineCap='round';
        c.beginPath();c.moveTo(x-4.5*size,y+wing);c.quadraticCurveTo(x-2*size,y-1.6*size,x,y);c.quadraticCurveTo(x+2*size,y-1.6*size,x+4.5*size,y+wing);c.stroke();
        c.fillStyle='#284955';c.fillRect(x-.5*size,y-.5*size,size,1.6*size);
      }
    }
    c.restore();c.save();c.globalCompositeOperation='destination-in';c.drawImage(this.skyMask,0,0);c.restore();
  }
  suspend() {
    for(const f of this.foliage||[]){f.texture.width=0;f.texture.height=0;}
    for(const key of ['canvas','repair','sky','skyMask']){if(this[key])this[key].width=this[key].height=0;this[key]=null;}
    this.foliage=[];this.source=this.context=null;this.skyPixels=0;this.lastTime=-Infinity;this.motion=null;
  }
}
