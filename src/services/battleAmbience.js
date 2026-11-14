import {ambienceProfile} from './battleAmbienceProfiles.js';
const TAU=Math.PI*2,fract=n=>n-Math.floor(n),clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export function artworkTransform(w,h,iw,ih,fit='cover',position=[.5,.5]){
 const scale=Math.max(w/iw,h/ih),sx=fit==='fill'?w/iw:scale,sy=fit==='fill'?h/ih:scale;
 return{sx,sy,x:(w-iw*sx)*position[0],y:(h-ih*sy)*position[1]};
}
export class BattleAmbienceRenderer{
 constructor(canvas,image,environment,{fit='cover',position=[.5,.5]}={}){
  this.canvas=canvas;this.c=canvas.getContext('2d');this.image=image;this.environment=environment;this.fit=fit;this.position=position;this.zones=new Map();this.glows=new Map();this.seeds=Array.from({length:32},(_,i)=>fract(Math.sin(i*78.233+13.7)*43758.5453));this.stats={particles:0,cacheBytes:0,textureDraws:0};
 }
 resize(w,h){
  for(const cached of this.zones.values()){this.stats.cacheBytes-=cached.canvas.width*cached.canvas.height*4;cached.canvas.width=cached.canvas.height=0;}this.zones.clear();
  this.width=w;this.height=h;const ratio=Math.min(1,896/Math.max(1,w),960/Math.max(1,h));this.resolution=ratio;this.canvas.width=Math.ceil(w*ratio);this.canvas.height=Math.ceil(h*ratio);
  this.iw=this.image.naturalWidth||this.image.width;this.ih=this.image.naturalHeight||this.image.height;this.mapping=artworkTransform(w,h,this.iw,this.ih,this.fit,this.position);this.profile=ambienceProfile(this.environment,this.iw<this.ih?'mobile':'wide');this.poses=w<700?12:16;
 }
 makeCanvas(w,h){try{const c=this.canvas.ownerDocument?.createElement('canvas');if(c){c.width=w;c.height=h;if(!c.getContext('2d'))return null;}return c;}catch{return null;}}
 halo(x,y,r,color,alpha){
  let texture=this.glows.get(color);
  if(!texture){texture=this.makeCanvas(64,64);if(texture){const c=texture.getContext('2d'),g=c.createRadialGradient(32,32,1,32,32,31);g.addColorStop(0,color+'b0');g.addColorStop(.3,color+'40');g.addColorStop(1,color+'00');c.fillStyle=g;c.fillRect(0,0,64,64);this.glows.set(color,texture);this.stats.cacheBytes+=64*64*4;}}
  if(texture){this.c.save();this.c.globalAlpha=alpha;this.c.drawImage(texture,x-r,y-r,r*2,r*2);this.c.restore();}
 }
 wavePose(zone,index){
  let cached=this.zones.get(zone);
  if(!cached){const w=Math.max(1,Math.min(96,Math.ceil(zone.w*this.iw*this.mapping.sx))),h=Math.max(1,Math.min(120,Math.ceil(zone.h*this.ih*this.mapping.sy))),canvas=this.makeCanvas(w*this.poses,h);if(!canvas)return null;cached={canvas,w,h,ready:new Set()};this.zones.set(zone,cached);this.stats.cacheBytes+=canvas.width*canvas.height*4;}
  if(cached.ready.has(index))return cached;
  const c=cached.canvas.getContext('2d'),phase=index/this.poses*TAU,cols=6,rows=10,zw=zone.w*this.iw,zh=zone.h*this.ih;c.save();c.beginPath();c.rect(index*cached.w,0,cached.w,cached.h);c.clip();
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
   const u=(x+.5)/cols,v=(y+.5)/rows,edge=Math.sin(u*Math.PI)*Math.sin(v*Math.PI),wave=Math.sin(phase+v*3.5+(zone.kind==='foliage'?u*2:0));
   const shift=wave*zone.amp/this.mapping.sx*edge*(zone.kind==='cloth'?v:1),sx=clamp(zone.x*this.iw+x/cols*zw-shift,0,this.iw-zw/cols),sy=clamp(zone.y*this.ih+y/rows*zh,0,this.ih-zh/rows);
   c.drawImage(this.image,sx,sy,zw/cols,zh/rows,index*cached.w+x/cols*cached.w,y/rows*cached.h,cached.w/cols+.2,cached.h/rows+.2);
  }
  c.restore();cached.ready.add(index);return cached;
 }
 drawZones(t){
  const c=this.c;
  this.profile.zones.forEach((zone,n)=>{const phase=fract(t/(zone.kind==='cloth'?4.2:5.1)+n*.27)*this.poses,a=Math.floor(phase),blend=phase-a,A=this.wavePose(zone,a),B=this.wavePose(zone,(a+1)%this.poses);if(!A||!B)return;
   const dest=[zone.x*this.iw,zone.y*this.ih,zone.w*this.iw,zone.h*this.ih];c.globalAlpha=1;c.drawImage(A.canvas,a*A.w,0,A.w,A.h,...dest);c.globalAlpha=blend;c.drawImage(B.canvas,((a+1)%this.poses)*B.w,0,B.w,B.h,...dest);this.stats.textureDraws+=2;c.globalAlpha=1;
  });
 }
 drawWindows(t){
  const c=this.c,p=this.profile,windows=p.windows||[],count=this.width<700?14:20;
  for(let z=0;z<windows.length;z++){
   const [x,y,w,h]=windows[z];c.save();c.beginPath();c.rect(x*this.iw,y*this.ih,w*this.iw,h*this.ih);c.clip();
   if(['snow-window','window-glint'].includes(p.particles))for(let n=z;n<count;n+=windows.length){const seed=this.seeds[n],xx=(x+fract(seed+t*.013)*w)*this.iw,yy=(y+fract(seed*.71+t*.11)*h)*this.ih;c.globalAlpha=.20+seed*.35;c.fillStyle=p.particles==='snow-window'?'#e9f7ff':'#e6edd8';c.beginPath();c.ellipse(xx,yy,1.1+seed*2.3,1+seed,0,0,TAU);c.fill();this.stats.particles++;}
   if(p.birds){const phase=fract(t*.035+z*.31),xx=(x+phase*w)*this.iw,yy=(y+h*(.36+Math.sin(phase*TAU)*.1))*this.ih,flap=Math.sin(t*8+z)*4;c.globalAlpha=.43;c.strokeStyle='#536e72';c.lineWidth=1.3;c.beginPath();c.moveTo(xx-7,yy-flap);c.quadraticCurveTo(xx-3,yy-3,xx,yy);c.quadraticCurveTo(xx+3,yy-3,xx+7,yy-flap);c.stroke();}
   c.restore();
  }
 }
 drawParticles(t){
  const c=this.c,p=this.profile,kind=p.particles;if(!kind||kind==='none'||kind==='snow-window'||kind==='window-glint')return;
  const [x,y,w,h]=p.area||[0,0,1,1],count=this.width<700?12:18,petal=kind==='petal',snow=kind==='snow',leaf=kind==='leaf';
  for(let n=0;n<count;n++){
   const seed=this.seeds[n],phase=fract(seed+t*(petal||snow?.035:leaf?.018:.009)),xx=(x+fract(seed*.83+t*(leaf?.018:.004)+Math.sin(t*.4+n)*.018)*w)*this.iw,yy=(y+(kind==='dust-shaft'?1-phase:phase)*h)*this.ih;
   const size=(petal?4.5:leaf?3.5:snow?2.4:1.3)*(0.5+seed*.7);c.save();c.translate(xx,yy);c.rotate(Math.sin(t*.7+n)*.9);c.globalAlpha=(.15+Math.sin(phase*Math.PI)*.25)*(petal?1.2:1);c.fillStyle=petal?'#e9a6c6':snow?'#eefaff':leaf?'#b2c98c':kind==='crystal-dust'?'#b6d8ee':kind==='violet-dust'?'#b9a0c8':'#d4c3a7';c.beginPath();c.ellipse(0,0,size,petal||leaf?size*.42:size*.75,n,0,TAU);c.fill();c.restore();this.stats.particles++;
  }
 }
 paintAt(ms){
  if(!this.c||!this.profile)return;const c=this.c,t=ms/1000,p=this.profile,m=this.mapping;this.stats.particles=0;this.stats.textureDraws=0;
  c.setTransform(this.resolution,0,0,this.resolution,0,0);c.clearRect(0,0,this.width,this.height);c.save();c.translate(m.x,m.y);c.scale(m.sx,m.sy);
  this.drawZones(t);
  p.lights.forEach((l,n)=>this.halo(l.x*this.iw,l.y*this.ih,l.r*this.iw,l.color,.24+.14*Math.sin(t*.85+n*2)));
  if(p.windows.length)this.drawWindows(t);this.drawParticles(t);
  for(const [x,y,w,h]of p.ripples||[])for(let n=0;n<8;n++){
   const phase=fract(n*.137+t*.045),xx=(x+fract(n*.39+t*.018)*w)*this.iw,yy=(y+phase*h)*this.ih,reach=(.008+.025*phase)*this.iw;c.globalAlpha=Math.sin(phase*Math.PI)*.14;c.strokeStyle='#c4e7ef';c.lineWidth=1.3;c.beginPath();c.ellipse(xx,yy,reach,2.3,0,0,Math.PI);c.stroke();
  }
  for(const [n,x]of (p.drips||[]).entries()){
   const phase=fract(t*.19+n*.27),ground=.50+(n%2)*.10,yy=(.12+phase*phase*(ground-.12))*this.ih;c.globalAlpha=Math.sin(phase*Math.PI)*.45;c.strokeStyle='#b3cfe6';c.lineWidth=1.4;c.beginPath();c.moveTo(x*this.iw,yy);c.lineTo(x*this.iw,yy+7);c.stroke();if(phase>.86){c.globalAlpha=(1-phase)*2;c.beginPath();c.ellipse(x*this.iw,ground*this.ih,(phase-.86)*55,1.5,0,0,TAU);c.stroke();}
  }
  for(const [n,screen]of p.screens.entries()){const[x,y,w,h]=screen;c.globalAlpha=.16;c.fillStyle='#8aeed4';for(let i=0;i<4;i++)c.fillRect((x+w*(.12+i*.2))*this.iw,(y+h*fract(t*.13+i*.22+n*.1))*this.ih,w*.08*this.iw,1.3);}
  c.restore();c.globalAlpha=1;
 }
 dispose(){for(const z of this.zones.values())z.canvas.width=z.canvas.height=0;for(const c of this.glows.values())c.width=c.height=0;this.zones.clear();this.glows.clear();this.stats.cacheBytes=0;this.c=null;this.canvas.width=this.canvas.height=0;}
}
