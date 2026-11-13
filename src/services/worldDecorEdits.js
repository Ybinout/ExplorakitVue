import config from '@/data/worldDecorEdits.json';
const cache=new Map();
export function drawWorldDecorEdits(context,map) {
  for(const patch of config.patches){
    if(patch.map!==map)continue;
    let canvas=cache.get(patch);
    if(!canvas){
      canvas=document.createElement('canvas');canvas.width=patch.w*16;canvas.height=patch.h*16;
      const c=canvas.getContext('2d');if(!c)return;
      patch.rows.forEach((runs,y)=>{for(const[x,width,color]of runs){c.fillStyle=color;c.fillRect(x,y,width,1);}});
      cache.set(patch,canvas);
    }
    context.drawImage(canvas,patch.x*32,patch.y*32,patch.w*32,patch.h*32);
  }
}
