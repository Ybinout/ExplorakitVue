// Native canvas artwork: anchors are the same world pixels as movement/water.
export function drawFishing(c, state, elapsed = 0, animated = true) {
  if (!state || ['idle','offer'].includes(state.phase)) return;
  const p=state.origin, w=state.water;
  if (!p || !w) return;
  const left=w.x<p.x, hand={x:p.x+(left?-11:11),y:p.y+3};
  const cast=animated?Math.min(1,elapsed/650):1;
  const progress=state.phase==='casting'?cast:1;
  const tip={x:hand.x+(w.x-hand.x)*.72*progress,y:hand.y+(w.y-hand.y)*.76*progress-8-(1-progress)*27};
  const t=animated?elapsed/1000:0;
  const bite=state.phase==='bite', hooked=state.phase==='hooked';
  const bob={x:w.x,y:w.y+(animated?Math.sin(t*(bite?22:4))*(bite?3:1):0)-(hooked?Math.min(20,elapsed*.08):0)};
  c.save();c.lineCap='round';c.lineJoin='round';
  c.beginPath();c.moveTo(hand.x,hand.y);c.quadraticCurveTo((hand.x+tip.x)/2,tip.y-7,tip.x,tip.y);
  c.strokeStyle='#252f31';c.lineWidth=5;c.stroke();c.strokeStyle='#c58f4f';c.lineWidth=3;c.stroke();
  c.beginPath();c.moveTo(hand.x,hand.y);c.lineTo(hand.x+(tip.x-hand.x)*.17,hand.y+(tip.y-hand.y)*.3);c.strokeStyle='#61432e';c.lineWidth=5;c.stroke();
  const bx=tip.x+(bob.x-tip.x)*progress, by=tip.y+(bob.y-tip.y)*progress;
  c.beginPath();c.moveTo(tip.x,tip.y);c.quadraticCurveTo((tip.x+bx)/2,tip.y+(by-tip.y)*.7,bx,by);
  c.strokeStyle='#243f4bcc';c.lineWidth=2;c.stroke();c.strokeStyle='#fff6dccc';c.lineWidth=1;c.stroke();
  if(progress>.9){
    c.strokeStyle='#d8f4f9bb';c.lineWidth=1;
    for(let i=0;i<2;i++){const r=4+((t*8+i*7)%14);c.globalAlpha=animated?1-(r-4)/15:.7;c.beginPath();c.ellipse(bob.x,bob.y+3,r,r*.35,0,0,Math.PI*2);c.stroke();}
    c.globalAlpha=1;c.fillStyle='#243f4b';c.fillRect(bob.x-3,bob.y-4,6,9);c.fillStyle='#fff7e7';c.fillRect(bob.x-2,bob.y-3,4,6);c.fillStyle='#d94d44';c.fillRect(bob.x-2,bob.y-3,4,3);
  }
  if(bite){
    const lift=animated?Math.abs(Math.sin(t*10))*2:0;
    c.fillStyle='#fff5c8';c.strokeStyle='#203947';c.lineWidth=2;c.beginPath();c.roundRect(p.x-11,p.y-78-lift,22,27,5);c.fill();c.stroke();
    c.beginPath();c.moveTo(p.x-4,p.y-51-lift);c.lineTo(p.x,p.y-46-lift);c.lineTo(p.x+4,p.y-51-lift);c.fill();
    c.fillStyle='#b13b2b';c.font='bold 23px monospace';c.textAlign='center';c.fillText('!',p.x,p.y-57-lift);
  }
  c.restore();
}
