// Fixed window masks in the 896×640 room; particles never cover the masonry.
const nativePanes = [
  [[153,80],[158,64],[170,53],[183,49],[198,55],[211,69],[216,83],[216,157],[153,157]],
  [[329,82],[334,64],[345,54],[358,50],[372,55],[385,70],[389,83],[389,157],[329,157]],
  [[477,81],[482,64],[494,54],[507,50],[521,56],[534,71],[538,84],[538,157],[477,157]],
  [[1003,82],[1007,66],[1017,55],[1029,51],[1042,56],[1052,71],[1056,85],[1056,157],[1003,157]],
  [[1324,82],[1329,65],[1340,55],[1352,51],[1366,57],[1376,72],[1380,84],[1380,157],[1324,157]],
];
export const WHITEPEAK_PANES = nativePanes.map(points=>points.map(([x,y])=>[x*7/12,y*5/8]));
const flakes = WHITEPEAK_PANES.flatMap((pane,index)=>{
  const left=pane[0][0],right=pane[6][0];
  return Array.from({length:12},(_,n)=>({x:left+(n*.61803398875%1)*(right-left),y:32+(n*17+index*11)%68,
    phase:n*1.7+index,speed:8+(n%4)*3,size:n%3===0?1.4:.9}));
});
let panePath=null;
export function drawWhitepeakSnow(c,map,now,motion=true,visible=null){
  if(map!=='ville5_maison1')return;
  const t=motion?now/1000:0;
  if(!panePath){panePath=new Path2D();for(const pane of WHITEPEAK_PANES){pane.forEach(([x,y],i)=>i?panePath.lineTo(x,y):panePath.moveTo(x,y));panePath.closePath();}}
  c.save();c.clip(panePath);c.fillStyle='#effaff';c.globalAlpha=.85;
  for(const f of flakes){const y=30+((f.y+t*f.speed)%70),x=f.x+Math.sin(t*.55+f.phase)*2;
    if(visible&&(x+f.size<visible.x-2||x>visible.x+visible.visibleWidth+2||y+f.size<visible.y-2||y>visible.y+visible.visibleHeight+2))continue;
    c.fillRect(Math.round(x),Math.round(y),f.size,f.size);}
  c.restore();
}
export function clipWhitepeakHost(c,map,name){
  if(map==='ville5_maison1'&&name==='club_host'){
    c.beginPath();c.rect(0,0,896,113);c.clip();
  }
}
