import layout from '@/data/whitepeakLayout.json';

export function occupiedPodiums(players){
 const occupied=[false,false];
 for(const p of Object.values(players||{})){
  if(p?.currentmap!=='ville5_maison1')continue;
  const i=layout.podiums.findIndex(s=>((p.x-s.x)/s.rx)**2+((p.y+layout.feetOffsetY-s.y)/s.ry)**2<=1);
  if(i>=0)occupied[i]=true;
 }
 return occupied;
}
const halos=[];
function halo(index){
 if(halos[index])return halos[index];
 const s=layout.podiums[index],pad=18,canvas=document.createElement('canvas');
 canvas.width=(s.rx+pad)*2;canvas.height=(s.ry+pad)*2;
 const c=canvas.getContext('2d');c.translate(s.rx+pad,s.ry+pad);
 c.strokeStyle=s.color;c.lineWidth=3;c.shadowColor=s.color;c.shadowBlur=12;
 c.beginPath();c.ellipse(0,0,s.rx,s.ry,0,0,Math.PI*2);c.stroke();c.stroke();
 c.shadowBlur=0;c.globalAlpha=.16;c.fillStyle=s.color;c.beginPath();c.ellipse(0,0,s.rx-3,s.ry-3,0,0,Math.PI*2);c.fill();
 return halos[index]=canvas;
}
export function drawWhitepeakPodiums(c,map,players,now,motion=true){
 if(map!=='ville5_maison1')return;
 const occupied=occupiedPodiums(players);
 for(const [i,s] of layout.podiums.entries())if(occupied[i]){
  c.save();c.globalAlpha=motion ? .83+Math.sin(now/550)*.12 : 1;
  c.drawImage(halo(i),s.x-s.rx-18,s.y-s.ry-18);c.restore();
 }
}
