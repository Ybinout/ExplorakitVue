export const ANA_MAP = 'ville3_arene';
// Fixed world positions: only opacity changes, never position, scale or rotation.
// Keep stars inside the room, away from the opaque walls and stair outlines.
export const ANA_STARS = [
  [153,22],[181,36],[209,17],[235,36],[266,19],[291,39],
  [114,70],[169,65],[222,72],[276,63],[335,69],
  [28,87],[104,106],[146,114],[188,108],[231,120],[273,109],[319,119],[420,91],
  [31,157],[105,144],[142,157],[183,143],[221,156],[265,145],[307,158],[343,140],[419,161],
  [108,189],[148,204],[183,184],[226,194],[266,183],[308,207],[342,187],
  [28,250],[108,235],[144,250],[187,232],[224,246],[267,235],[307,252],[342,232],[420,249],
  [139,269],[178,260],[222,274],[268,263],[308,272],
];
const mod = (n,d) => ((n%d)+d)%d;
export function anaStarOpacity(timestamp,index,motion=true) {
  if(!motion)return .26;
  const cycle=5200+(index*647%3600);
  const age=mod(timestamp+index*1703,cycle)/cycle;
  // A pause between each slow appearance; no sudden blink or all-room flash.
  if(age>=.68)return 0;
  return Math.sin(age/.68*Math.PI)**2*.92;
}
export class AnaArenaRenderer {
  constructor(createCanvas=()=>document.createElement('canvas')) {
    this.createCanvas=createCanvas;this.frames=0;this.suspend();
  }
  draw(target,source,timestamp,motion=true) {
    if(!source?.complete||!source.naturalWidth)return;
    if(!this.canvas){this.canvas=this.createCanvas();this.canvas.width=896;this.canvas.height=640;this.context=this.canvas.getContext('2d');}
    if(!this.context)return;
    const time=Number.isFinite(timestamp)?Math.max(0,timestamp):0;
    if(this.lastTime===-Infinity||this.motion!==motion||motion&&(time<this.lastTime||time-this.lastTime>=50)) {
      this.paint(time,motion);this.lastTime=time;this.motion=motion;this.frames++;
    }
    target.drawImage(this.canvas,0,0,896,640);
  }
  paint(time,motion) {
    const c=this.context;c.clearRect(0,0,896,640);c.save();c.scale(2,2);
    for(const[index,[x,y]]of ANA_STARS.entries()) {
      const alpha=anaStarOpacity(time,index,motion);if(alpha<.01)continue;
      const arm=index%4===0?3:2;
      // Pixel-shaped light: a small blue edge makes white stars readable on
      // pale tiles. No blur filter or moving/sizing halo.
      c.fillStyle='#80bfff';c.globalAlpha=alpha*.18;
      c.fillRect(x-2,y-2,5,5);
      c.fillStyle=index%2?'#80caff':'#f4fcff';c.globalAlpha=alpha;
      c.fillRect(x-arm,y,arm*2+1,1);c.fillRect(x,y-arm,1,arm*2+1);
      c.fillRect(x-1,y-1,3,3);
      c.fillStyle=index%2?'#d7f3ff':'#ffffff';c.fillRect(x,y,1,1);
    }
    c.restore();
  }
  suspend() {
    if(this.canvas){this.canvas.width=0;this.canvas.height=0;}
    this.canvas=this.context=null;this.lastTime=-Infinity;this.motion=null;
  }
}
