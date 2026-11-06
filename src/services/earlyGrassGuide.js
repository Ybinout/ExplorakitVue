export function drawEarlyGrassGuide(c,state,map,now,motion=true){
 if(map!=='start'||!state?.grassHint)return;
 const alpha=motion ? .12+.12*(.5+.5*Math.sin(now/700)) : .17;
 c.save();c.fillStyle=`rgba(220,241,149,${alpha})`;c.strokeStyle='rgba(239,242,184,.5)';c.lineWidth=1;
 for(const {x,y}of state.grassTiles||[])c.fillRect(x*32,y*32,32,32);
 c.restore();
}
