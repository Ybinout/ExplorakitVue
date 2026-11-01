export const WHEEL=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const RED=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
export const numberColor=n=>n===0?'#398b79':RED.has(n)?'#b94748':'#233448';
export function roulettePose(state,now,motion=true){
 const index=WHEEL.indexOf(state?.result??0),stop=Math.PI*12-index*Math.PI*2/37;
 const t=state?.phase==='betting'?0:Math.min(1,Math.max(0,(now-state.closesAt)/Math.max(1,state.resultAt-state.closesAt)));
 const ease=1-Math.pow(1-t,3);
 return {angle:state?.phase==='betting'?0:motion?stop*ease:stop,ball:state?.phase==='spinning'&&motion?-Math.PI/2+(1-ease)*Math.PI*24:-Math.PI/2};
}
export function drawWhitepeakRoom(c,map,state,now,motion){
 if(map!=='ville5_maison2'||!state)return;
 const pose=roulettePose(state,now,motion),x=372,y=264,r=37,step=Math.PI*2/37;
 c.save();c.translate(x,y);c.fillStyle='#bd9356';c.beginPath();c.ellipse(0,0,r+6,r+6,0,0,Math.PI*2);c.fill();c.rotate(pose.angle);
 for(let i=0;i<37;i++){c.fillStyle=numberColor(WHEEL[i]);c.beginPath();c.moveTo(0,0);c.arc(0,0,r,-Math.PI/2+(i-.5)*step,-Math.PI/2+(i+.5)*step);c.closePath();c.fill();c.strokeStyle='#f2cf8320';c.lineWidth=.3;c.stroke();}
 c.fillStyle='#ceb17c';c.beginPath();c.arc(0,0,22,0,Math.PI*2);c.fill();c.fillStyle='#674929';c.beginPath();c.arc(0,0,17,0,Math.PI*2);c.fill();c.rotate(-pose.angle);c.fillStyle='#fff5da';c.shadowColor='#fff5da';c.shadowBlur=2;c.beginPath();c.arc(Math.cos(pose.ball)*32,Math.sin(pose.ball)*32,1.7,0,Math.PI*2);c.fill();c.restore();
}
