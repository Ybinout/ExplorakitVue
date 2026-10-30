// Artwork coordinates, excluding masonry, islands and the window frames.
export const TOURNAMENT_BATTLE_SCENERY = Object.freeze({
  wide: {width:1536,height:1024,sky:[[136,80,340,182],[577,80,380,205],[1061,80,338,180]],water:[[138,365,333,9],[578,365,377,9],[1063,365,333,9]]},
  mobile: {width:1024,height:1536,sky:[[98,60,227,140],[396,60,236,165],[704,60,221,140]],water:[[100,276,222,7],[398,276,231,7],[706,276,216,7]]}
});
const FLOCKS = Object.freeze([
  {offset:.15,y:.72,direction:1,count:3,size:1.1},
  {offset:.48,y:.43,direction:-1,count:2,size:.95},
  {offset:.78,y:.82,direction:1,count:3,size:1.15}
]);
const mod=(n,d)=>((n%d)+d)%d;
function clip(c,rects){c.beginPath();for(const [x,y,w,h] of rects)c.rect(x,y,w,h);c.clip();}
function bird(c,x,y,size,phase){
  c.save();c.translate(Math.round(x),Math.round(y));c.scale(size*2,size*2);
  const wing=Math.sin(phase)>.25?-2:Math.sin(phase)<-.25?1:-1;
  c.fillStyle='#294969';c.fillRect(-2,0,4,2);c.fillRect(-5,wing,3,2);c.fillRect(2,wing,3,2);
  c.fillRect(-7,wing+(wing<0?-1:1),2,1);c.fillRect(5,wing+(wing<0?-1:1),2,1);
  c.fillStyle='#f6fbff';c.fillRect(-5,wing-1,3,1);c.fillRect(2,wing-1,3,1);c.fillRect(-1,-1,2,1);
  c.restore();
}
export function drawTournamentBattleSky(c,time,kind='wide'){
  const p=TOURNAMENT_BATTLE_SCENERY[kind];if(!p||!c)return;
  const t=Math.max(0,time)/1000;
  c.save();c.scale(c.canvas.width/p.width,c.canvas.height/p.height);
  c.save();clip(c,p.sky);
  for(const [i,flock] of FLOCKS.entries()){
    const progress=mod(t/(24+i*5)+flock.offset,1);
    const x=flock.direction>0?-40+progress*(p.width+80):p.width+40-progress*(p.width+80);
    const y=p.sky[0][1]+p.sky[0][3]*flock.y;
    for(let n=0;n<flock.count;n++)bird(c,x-n*25*flock.direction,y+n*8+Math.sin(t*.7+i+n)*3,flock.size,t*6+n*.9+i);
  }
  c.restore();c.save();clip(c,p.water);
  for(let i=0;i<22;i++){
    c.globalAlpha=.12+.16*(1+Math.sin(t*1.2+i))/2;c.fillStyle='#d6f5ff';
    c.fillRect(Math.round(mod(i*113+t*(2+i%3),p.width)),p.water[0][1]+i%5,7+i%9,1);
  }
  c.restore();c.restore();
}
