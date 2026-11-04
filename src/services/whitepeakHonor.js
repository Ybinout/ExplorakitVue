// One small, cached plaque; no text layout or sorting in the world frame loop.
let canvas=null,previousState;
const colors=['#e5c57b','#c0d2df','#c59474'];
function shorten(c,text,width){let s=String(text);if(c.measureText(s).width<=width)return s;while(s&&c.measureText(s+'…').width>width)s=s.slice(0,-1);return s+'…';}
export function drawHonorRoll(c,map,state){
 if(map!=='ville5_maison1')return;
 const rows=state?.rows||[];
 if(!canvas||state!==previousState){previousState=state;canvas=document.createElement('canvas');canvas.width=232;canvas.height=210;const p=canvas.getContext('2d');p.scale(2,2);
  p.fillStyle='#8f7855';p.fillRect(0,0,116,105);p.fillStyle='#d4bb82';p.fillRect(2,2,112,101);p.fillStyle='#172e3b';p.fillRect(4,4,108,97);
  p.textAlign='center';p.fillStyle='#d6c18c';p.font='600 7px Georgia,serif';p.fillText('TABLEAU D’HONNEUR',58,14);p.font='5px sans-serif';p.fillStyle='#9db4c1';p.fillText('DUELS · 1v1',58,22);
  for(let i=0;i<3;i++){const y=28+i*23,r=rows[i];p.fillStyle=i%2?'#203c49':'#1b3442';p.fillRect(6,y,104,22);p.fillStyle=colors[i];p.font='bold 9px Georgia,serif';p.textAlign='center';p.fillText(String(i+1),14,y+12);p.textAlign='left';p.font='600 8px sans-serif';p.fillText(shorten(p,r?.username||'Place libre',79),23,y+9);p.font='7px sans-serif';p.fillStyle='#b5c9d2';p.fillText(r?`${r.wins} W · ${r.losses} L`:'À toi de jouer',23,y+17);if(r){p.textAlign='right';p.font='600 8px sans-serif';p.fillStyle=colors[i];p.fillText(String(r.points),106,y+17);}}
 }
 c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(canvas,0,0,232,210,612,25,116,105);c.restore();
}
