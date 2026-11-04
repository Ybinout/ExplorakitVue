// Paint only the inset slate of the existing wall board (1536×1024 artwork).
// Its carved frame, corner fittings and wall shadow remain part of the room.
const face={x:1094*7/12,y:70*5/8,width:116*7/12,height:94*5/8};
const metals=[{ink:'#e7cb83',shade:'#92743e'},{ink:'#c8d5da',shade:'#758b95'},{ink:'#d3a27c',shade:'#895f46'}];
let canvas=null,previousState;
function shorten(c,text,width){let s=String(text);if(c.measureText(s).width<=width)return s;while(s&&c.measureText(s+'…').width>width)s=s.slice(0,-1);return s+'…';}
function number(c,value,width){const n=Math.max(0,Number(value)||0),full=String(n);return c.measureText(full).width<=width?full:new Intl.NumberFormat('fr',{notation:'compact',maximumFractionDigits:1}).format(n);}
function medal(c,x,y,index){
 const {ink,shade}=metals[index];c.fillStyle=shade;c.beginPath();c.moveTo(x,y-3);c.lineTo(x+3,y-1);c.lineTo(x+2.5,y+3);c.lineTo(x,y+4);c.lineTo(x-2.5,y+3);c.lineTo(x-3,y-1);c.closePath();c.fill();
 c.strokeStyle=ink;c.lineWidth=.45;c.stroke();c.fillStyle=ink;c.textAlign='center';c.font='bold 4.5px Georgia,serif';c.fillText(String(index+1),x,y+2);
}
export function drawHonorRoll(c,map,state){
 if(map!=='ville5_maison1')return;
 if(!canvas||state!==previousState){
  previousState=state;const rows=state?.rows||[],w=face.width,h=face.height;
  canvas=document.createElement('canvas');canvas.width=Math.ceil(w*4);canvas.height=Math.ceil(h*4);
  const p=canvas.getContext('2d');p.scale(canvas.width/w,canvas.height/h);
  const slate=p.createLinearGradient(0,0,w,h);slate.addColorStop(0,'#263744');slate.addColorStop(.6,'#263541');slate.addColorStop(1,'#1e303b');p.fillStyle=slate;p.fillRect(0,0,w,h);
  // Quiet, fixed slate grain and a shallow inset; no new floating UI frame.
  p.fillStyle='#d3c39b';p.globalAlpha=.025;for(let y=1;y<h;y+=3)p.fillRect(1,y,w-2,.25);p.globalAlpha=1;
  p.strokeStyle='#101e29';p.lineWidth=.5;p.strokeRect(.3,.3,w-.6,h-.6);
  p.textAlign='center';p.fillStyle='#d7c492';p.font='600 4.5px Georgia,serif';p.fillText('TABLEAU D’HONNEUR',w/2,6.8);
  p.font='3.3px Georgia,serif';p.fillStyle='#a6b5b9';p.fillText('DUELS  ·  1v1',w/2,11.1);
  p.strokeStyle='#b49a65';p.globalAlpha=.42;p.lineWidth=.35;p.beginPath();p.moveTo(4,14);p.lineTo(w-4,14);p.stroke();p.globalAlpha=1;
  for(let i=0;i<3;i++){
   const y=16+i*13.6,r=rows[i];medal(p,5.4,y+3.3,i);
   p.textAlign='left';p.font='600 5.5px Georgia,serif';p.fillStyle=r?'#e8e3d0':'#91a0a4';p.fillText(shorten(p,r?.username||'Place libre',w-15),11,y+4.5);
   p.font='4.2px Arial,sans-serif';p.fillStyle='#a7b8be';p.fillText(r?`${number(p,r.wins,11)} W · ${number(p,r.losses,11)} L`:'— W · — L',11,y+10.2);
   if(r){p.textAlign='right';p.font='600 5px Georgia,serif';p.fillStyle=metals[i].ink;p.fillText(number(p,r.points,21),w-3,y+10.2);}
   if(i<2){p.strokeStyle='#9a906f';p.globalAlpha=.18;p.lineWidth=.3;p.beginPath();p.moveTo(11,y+12.1);p.lineTo(w-3,y+12.1);p.stroke();p.globalAlpha=1;}
  }
 }
 c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(canvas,face.x,face.y,face.width,face.height);c.restore();
}
