const clamp=n=>Math.max(0,Math.min(1,n));
const shapes=new WeakMap();
export function sceneElapsed(state,time) {
  return Math.max(0,Number(state?.elapsedMs)||0)+Math.max(0,time-(Number.isFinite(state?.receivedAt)?state.receivedAt:time));
}
function geometry(h) {
  if(shapes.has(h))return shapes.get(h);
  const x=h.x*16,y=h.y*16,w=h.width*16,z=h.height*16;
  const cells=Array.isArray(h.cells)?h.cells:Array.from({length:h.width*h.height},(_,i)=>[i%h.width,Math.floor(i/h.width)]);
  // Older servers/checkpoints still have the original rectangular descriptors.
  const points=Array.isArray(h.outline)?h.outline.map(([dx,dy])=>[x+dx*16,y+dy*16]):
    [[x+2,y],[x+w*.4,y+2],[x+w*.61,y],[x+w-1,y+2],[x+w-3,y+z*.4],[x+w,y+z*.62],
      [x+w-2,y+z-1],[x+w*.6,y+z-3],[x+w*.4,y+z],[x+1,y+z-2],[x+3,y+z*.6],[x,y+z*.3]];
  const cx=x+cells.reduce((n,p)=>n+p[0]+.5,0)/cells.length*16;
  const cy=y+cells.reduce((n,p)=>n+p[1]+.5,0)/cells.length*16;
  const crack=Array.isArray(h.crack)?h.crack.map(([dx,dy])=>[x+dx*16,y+dy*16]):[[x+2,y+z*.5],[cx-4,cy-3],[cx+4,cy+3],[x+w-2,y+z*.4]];
  const shape={x,y,w,z,cells,points,cx,cy,crack};shapes.set(h,shape);return shape;
}
function outline(c,points) {
  c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.closePath();
}
function footprint(c,g) {
  c.beginPath();for(const [dx,dy]of g.cells)c.rect(g.x+dx*16,g.y+dy*16,16,16);c.clip();
}
export function drawCollapsedFloor(c,source,state,elapsed,motion) {
  if(!state?.holes)return;
  c.save();
  for(const[index,h]of state.holes.entries()) {
    const age=elapsed-h.atMs;if(age < -state.warningMs)continue;
    const g=geometry(h),{x,y,w,z,points,cx,cy}=g;
    c.save();footprint(c,g);
    if(age<0) {
      c.strokeStyle='#6f4d30';c.lineWidth=.8;c.globalAlpha=.65;
      c.beginPath();c.moveTo(...g.crack[0]);for(const p of g.crack.slice(1))c.lineTo(...p);c.stroke();
      c.restore();continue;
    }
    c.globalAlpha=1;outline(c,points);c.fillStyle='#392c22';c.fill();
    c.save();c.clip();
    const shade=c.createLinearGradient(0,y,0,y+z);shade.addColorStop(0,'#6b5038');shade.addColorStop(.35,'#392d25');shade.addColorStop(1,'#120f12');
    c.fillStyle=shade;c.fillRect(x,y,w,z);
    // The walls follow each broken edge; there is no rectangular inner frame.
    for(let edge=0;edge<points.length;edge++) {
      const a=points[edge],b=points[(edge+1)%points.length];
      if(b[0]-a[0]<1)continue;
      const depth=3+(edge%3),inset=p=>[p[0]+(cx-p[0])*.06,p[1]+depth];
      c.fillStyle=edge%2?'#98754b':'#ae8958';outline(c,[a,b,inset(b),inset(a)]);c.fill();
    }
    const inner=points.map(p=>[p[0]+(cx-p[0])*.12,p[1]+(cy-p[1])*.05+5]);
    outline(c,inner);c.fillStyle='#181416';c.fill();
    // Original floor tiles fall only from cells that actually become blocked.
    if(motion&&age<state.fallMs)for(const[part,[dx,dy]]of g.cells.entries()) {
      const lag=part*70,p=clamp((age-lag)/(state.fallMs-(g.cells.length-1)*70)),px=x+dx*16,py=y+dy*16;
      c.save();c.globalAlpha=1-p;c.translate(px+8+Math.sin(part*2+index)*p*3,py+8+p*p*26);c.rotate((part%2?1:-1)*p*.5);c.scale(1-p*.3,1-p*.3);
      c.beginPath();c.moveTo(-7,-8);c.lineTo(7,-7);c.lineTo(8,6);c.lineTo(-6,8);c.closePath();c.clip();
      c.drawImage(source,px/448*source.naturalWidth,py/320*source.naturalHeight,16/448*source.naturalWidth,16/320*source.naturalHeight,-8,-8,16,16);c.restore();
    }
    c.restore();outline(c,points);c.strokeStyle='#6b5139';c.lineWidth=.8;c.lineJoin='bevel';c.stroke();
    // Sparse chipped lips rather than an identical bright border on every hole.
    for(let edge=0;edge<points.length;edge+=3) {
      const a=points[edge],b=points[(edge+1)%points.length];
      c.strokeStyle=edge%2?'#c4a06b':'#a78658';c.lineWidth=.7;
      c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(a[0]+(b[0]-a[0])*.4,a[1]+(b[1]-a[1])*.4);c.stroke();
    }
    c.restore();
  }
  c.restore();
}
export function drawHozeCeiling(c,state,time,motion=true) {
  if(!state?.holes||!motion)return;
  const elapsed=sceneElapsed(state,time);c.save();c.scale(2,2);
  for(const[index,h]of state.holes.entries()) {
    const age=elapsed-h.atMs;if(age < -state.warningMs || age>1800)continue;
    const {cx:x,cy:y}=geometry(h);
    for(let n=0;n<8;n++) {
      const p=(age+state.warningMs-n*110)/850;if(p<0||p>1)continue;
      const dx=Math.sin(n*5.7+index)*11,fall=y-90+p*p*90;
      c.globalAlpha=.85;c.fillStyle=n%2?'#a78555':'#d8b979';
      c.beginPath();c.moveTo(x+dx-2,fall-2);c.lineTo(x+dx+2,fall-1);c.lineTo(x+dx+1,fall+2);c.lineTo(x+dx-2,fall+1);c.closePath();c.fill();
      c.fillStyle='#6f5337';c.fillRect(Math.round(x+dx-1),Math.round(fall+1),2,1);
    }
    if(age>=0)for(let n=0;n<18;n++) {
      const p=clamp(age/1800),angle=n*2.4+index,spread=5+p*22;
      c.globalAlpha=(1-p)*.36;c.fillStyle=n%2?'#e1c99d':'#b49a74';
      c.fillRect(Math.round(x+Math.cos(angle)*spread),Math.round(y+Math.sin(angle)*spread*.6-p*8),n%3?2:3,1);
    }
  }
  c.restore();
}
