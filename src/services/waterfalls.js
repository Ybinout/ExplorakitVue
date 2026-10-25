// Water channels authored in the original artwork, excluding frames and emblem.
const PROFILES = {
  hall: { width:448,height:320,speed:14,regions:[
    [16,42,9,28],[70,22,14,34],[150,5,6,40],[164,0,13,44],[188,0,12,45],
    [245,0,14,45],[271,0,13,44],[292,5,6,40],[364,22,14,34],[423,42,8,28],
  ] },
  wide: { width:768,height:512,speed:27,regions:[
    [27,150,18,47],[139,162,13,33],[228,173,9,20],[530,173,9,20],[618,162,13,33],[724,150,18,47],
  ],pools:[[[0,199],[289,194],[210,205],[0,229]],[[479,194],[768,199],[768,229],[558,205]]] },
  mobile: { width:512,height:768,speed:26,regions:[
    [24,194,12,44],[94,208,10,28],[153,218,6,15],[352,218,7,15],[408,208,11,28],[476,194,13,44],
  ],pools:[[[0,240],[188,234],[151,242],[0,268]],[[324,234],[512,240],[512,268],[361,242]]] },
};
const TINT=[205,241,255],SHEET=[22,139,224],FRAME_MS=1000/20, mod=(n,d)=>((n%d)+d)%d;
export function waterfallProfile(kind) { return Object.hasOwn(PROFILES,kind)?PROFILES[kind]:null; }
function polygonContains(points,x,y){
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const[a,b]=points[i],[c,d]=points[j];
    if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)inside=!inside;
  }
  return inside;
}
function polygonBounds(points){
  const left=Math.min(...points.map(p=>p[0])),top=Math.min(...points.map(p=>p[1]));
  return[left,top,Math.max(...points.map(p=>p[0]))-left,Math.max(...points.map(p=>p[1]))-top];
}
export function waterfallMask(data,kind) {
  const p=waterfallProfile(kind);
  if(!p)return{owners:new Uint8Array(0),pixels:new Uint32Array(0)};
  const owners=new Uint8Array(p.width*p.height),pixels=[];
  for(const[region,[left,top,w,h]]of p.regions.entries()){
    for(let y=Math.max(0,top+1);y<Math.min(p.height,top+h-1);y++)for(let x=Math.max(0,left+1);x<Math.min(p.width,left+w-1);x++){
      const index=y*p.width+x,i=index*4,r=data[i],g=data[i+1],b=data[i+2];
      const water=kind==='hall'?b>125&&b-r>35&&b-g>12:b>120&&g>105&&b-r>25&&g-r>10;
      const foam=r>160&&g>185&&b>205;
      if(data[i+3]===255&&(water||foam)){owners[index]=region+1;pixels.push(index);}
    }
  }
  for(const[n,polygon]of (p.pools||[]).entries()){
    const[left,top,w,h]=polygonBounds(polygon);
    for(let y=top;y<top+h;y++)for(let x=left;x<left+w;x++){
      const index=y*p.width+x,i=index*4,r=data[i],g=data[i+1],b=data[i+2];
      if(!owners[index]&&polygonContains(polygon,x+.5,y+.5)&&data[i+3]===255&&b-r>35&&g-r>12&&g>75){owners[index]=p.regions.length+n+1;pixels.push(index);}
    }
  }
  return{owners,pixels:Uint32Array.from(pixels)};
}
export class WaterfallRenderer {
  constructor(createCanvas=()=>document.createElement('canvas')){
    this.createCanvas=createCanvas;this.frames=0;this.lastTime=-Infinity;this.canvas=null;this.destroyed=false;
  }
  prepare(image,kind){
    this.suspend();const p=waterfallProfile(kind);
    if(!p||!image?.complete||!image.naturalWidth)return;
    try{
      this.canvas=this.createCanvas();this.canvas.width=p.width;this.canvas.height=p.height;
      this.context=this.canvas.getContext('2d');if(!this.context)throw Error('Canvas unavailable');
      this.context.imageSmoothingEnabled=false;this.context.drawImage(image,0,0,p.width,p.height);
      this.original=this.context.getImageData(0,0,p.width,p.height).data;this.mask=waterfallMask(this.original,kind);
      this.poolBounds=(p.pools||[]).map(polygonBounds);
      this.frame=this.context.createImageData(p.width,p.height);this.context.clearRect(0,0,p.width,p.height);
      this.profile=p;this.kind=kind;this.source=image;this.sourceUrl=image.currentSrc||image.src;
    }catch(_){this.suspend();}
  }
  draw(target,image,timestamp,kind='hall',motion=true,width,height){
    if(this.destroyed)return;
    if(!motion||!waterfallProfile(kind)){this.suspend();return;}
    if(!this.canvas||this.source!==image||this.kind!==kind||this.sourceUrl!==(image.currentSrc||image.src))this.prepare(image,kind);
    if(!this.context)return;
    const time=Number.isFinite(timestamp)?Math.max(0,timestamp):0;
    if(time<this.lastTime||time-this.lastTime>=FRAME_MS){
      const{width:w,regions,speed}=this.profile,seconds=time/1000,output=this.frame.data;
      for(const index of this.mask.pixels){
        const owner=this.mask.owners[index],x=index%w,y=Math.floor(index/w);
        if(owner>regions.length){
          const candidate=index+Math.round(Math.sin(y*.6+seconds*1.5)*1.5),sample=this.mask.owners[candidate]===owner?candidate:index;
          const crest=Math.max(0,Math.sin(y*.85+x*.08-seconds*2.1)-.6)*.22,offset=index*4;
          for(let channel=0;channel<3;channel++){
            const value=this.original[offset+channel]*.55+this.original[sample*4+channel]*.45;
            output[offset+channel]=Math.round(value+(TINT[channel]-value)*crest);
          }
          output[offset+3]=255;continue;
        }
        const[left,top,,rh]=regions[owner-1];
        const shift=Math.floor(seconds*speed+(owner-1)*3+Math.sin(x*.8)*2);
        const candidate=(top+mod(y-top-shift,rh))*w+x,sample=this.mask.owners[candidate]===owner?candidate:index;
        const strand=Math.max(0,Math.sin((x-left)*1.7+Math.sin(seconds*.6+owner)*.3))**6;
        const shimmer=strand*Math.max(0,Math.sin((y-top)*.42-seconds*speed*.42+owner))*.28;
        const foam=y-top>rh*.86?Math.max(0,Math.sin(x*1.1+seconds*5+owner))*.22:0;
        const curtain=kind==='hall',light=Math.min(.6,shimmer*(curtain?1.3:1)+foam+(curtain?strand*.18:0)),offset=index*4;
        for(let channel=0;channel<3;channel++){
          const value=curtain
            ? this.original[offset+channel]*.18+this.original[sample*4+channel]*.22+SHEET[channel]*.6
            : this.original[offset+channel]*.32+this.original[sample*4+channel]*.68;
          output[offset+channel]=Math.round(value+(TINT[channel]-value)*light);
        }
        output[offset+3]=255;
      }
      for(const[x,y,rw,rh]of regions)this.context.putImageData(this.frame,0,0,x,y,rw,rh);
      for(const[x,y,rw,rh]of this.poolBounds)this.context.putImageData(this.frame,0,0,x,y,rw,rh);
      this.lastTime=time;this.frames++;
    }
    target.drawImage(this.canvas,0,0,width||this.profile.width,height||this.profile.height);
  }
  suspend(){
    if(this.canvas){this.canvas.width=0;this.canvas.height=0;}
    this.canvas=null;this.context=null;this.source=null;this.sourceUrl=null;this.profile=null;
    this.mask=null;this.original=null;this.frame=null;this.poolBounds=null;this.lastTime=-Infinity;
  }
  destroy(){this.suspend();this.destroyed=true;}
}
