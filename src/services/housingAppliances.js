// Draw on the same 16px grid as the existing furniture. No image downloads per frame.
export function isAppliance(key){return /^rotom_(fan|fridge|washer|microwave|mower)$/.test(key||'');}
export function applianceSize(key){return {w:16,h:key==='rotom_microwave'?16:key==='rotom_mower'?20:24};}
export function drawAppliance(c,key,b,rotation=0,phase=null){
 const size=applianceSize(key),running=phase!==null,t=phase||0;
 c.save();c.translate(Math.round(b.x),Math.round(b.y));c.scale(b.w/size.w,b.h/size.h);c.imageSmoothingEnabled=false;
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 const circle=(x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
 const shell=(color)=>{rect(1,1,14,size.h-2,'#344a52');rect(2,2,12,size.h-5,color);rect(2,size.h-4,12,2,'#78929a');rect(3,size.h-2,3,2,'#344a52');rect(10,size.h-2,3,2,'#344a52');rect(3,3,10,5,'#e9f3e9');};
 if(key==='rotom_fan'){
  rect(3,21,10,2,'#344a52');rect(4,20,8,2,'#a5cdb7');rect(7,13,2,8,'#7da08b');circle(8,8,7,'#344a52');circle(8,8,6,'#b8d4be');
  c.save();c.translate(8,8);c.rotate(running?t/130:rotation*Math.PI/180);for(let i=0;i<3;i++){c.rotate(Math.PI*2/3);rect(-1,-5,3,5,'#568b76');rect(1,-4,2,3,'#77ab8e');}c.restore();circle(8,8,1.5,'#edf4d8');
  c.strokeStyle='#789c88';c.lineWidth=.5;for(let x=4;x<=12;x+=2){c.beginPath();c.moveTo(x,4);c.lineTo(x,12);c.stroke();}
 }else if(key==='rotom_fridge'){
  shell('#c0dbd1');rect(3,9,10,10,'#dcece0');rect(2,8,12,1,'#638b83');rect(4,10,1,5,'#617981');rect(4,5,1,2,'#617981');
  if(running){rect(4,10,8,8,'#536b79');rect(4,12,7,1,'#c4d8d2');rect(4,16,7,1,'#c4d8d2');rect(6,13,2,3,'#82b1e4');rect(9,14,2,2,'#dfc36c');rect(2,10,2,10,'#f0f3d9');}
 }else if(key==='rotom_washer'){
  shell('#9ccece');rect(3,7,10,2,'#638f9e');rect(4,4,4,1,'#7db0c6');circle(11,5,1,'#517187');circle(8,15,5,'#344a52');circle(8,15,4,'#7fc4d3');circle(8,15,3,'#315e78');
  c.save();c.translate(8,15);c.rotate(running?t/240:0);rect(-2,-2,3,2,'#cbe2df');rect(0,0,2,2,'#8cc4bc');c.restore();
 }else if(key==='rotom_microwave'){
  shell('#d6b296');rect(3,7,8,6,'#344a52');rect(4,8,6,4,running?'#edc478':'#7796a3');rect(12,7,1,4,'#f5ebc8');rect(11,4,2,1,'#a27165');
  if(running)rect(5+Math.floor(t/250)%3,10,2,1,'#f6eac8');
 }else{
  rect(2,10,12,7,'#354e50');rect(3,10,10,5,'#91af77');rect(4,11,8,3,'#c4ce8b');rect(5,8,6,4,'#5c7770');rect(6,9,4,2,'#8ca49c');for(const x of [1,12]){rect(x,11,3,7,'#34434b');rect(x+1,12,1,4,'#7f9396');}rect(3,1,1,9,'#61747a');rect(12,1,1,9,'#61747a');rect(3,1,10,2,'#34434b');
  if(running){rect(6+Math.floor(t/90)%2,15,3,1,'#e6d797');rect(0,18,2,1,'#91af77');}
 }
 c.restore();
}
export function drawFurnitureEffect(c,p,b,fx,now){
 if(!fx||fx.until<Date.now())return;
 const t=now-fx.startedAt,kind=fx.kind;
 c.save();c.imageSmoothingEnabled=false;
 if(kind==='light'){
  const glow=c.createRadialGradient(b.x+b.w/2,b.y+b.h/3,0,b.x+b.w/2,b.y+b.h/3,60);glow.addColorStop(0,'rgba(255,228,160,.35)');glow.addColorStop(1,'rgba(255,228,160,0)');c.fillStyle=glow;c.fillRect(b.x-40,b.y-40,b.w+80,b.h+80);
 }else if(kind==='open'){
  c.fillStyle='#405967';c.fillRect(b.x+b.w*.13,b.y+b.h*.28,b.w*.3,b.h*.53);c.fillStyle='#b89a73';c.fillRect(b.x+b.w*.09,b.y+b.h*.28,4,b.h*.53);
 }else if(kind==='read'){
  c.fillStyle='#f0e7c4';c.fillRect(b.x+b.w/2-10,b.y+8,20,12);c.fillStyle='#a68767';c.fillRect(b.x+b.w/2,b.y+8,2,12);
 }else if(kind==='bubbles'){
  c.strokeStyle='#c4eef0';c.lineWidth=1;for(let i=0;i<5;i++){const y=b.y+b.h*.8-((t/50+i*7)%(b.h*.65));c.strokeRect(b.x+8+i*(b.w-16)/5,y,3,3);}
 }else if(kind==='rustle'||kind==='shine'){
  c.fillStyle=kind==='rustle'?'#c2de9d':'#f5ebc8';for(let i=0;i<4;i++){const x=b.x+b.w*(i+.5)/4,y=b.y-3+Math.sin(t/280+i*2)*5;c.fillRect(Math.round(x),Math.round(y),2,4);}
 }
 c.restore();
}
