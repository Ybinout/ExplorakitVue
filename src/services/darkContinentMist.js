// Small reusable bitmap layers, painted by the existing 20 FPS ambience clock.
// No timers, filters, pixel readbacks or full-size allocations during movement.
export const isDarkMistMap = map => /^(?:jungle[1-9]|DC2_(?:0[1-9]|[1-3][0-9]|4[0-8]))$/.test(String(map || ''));
const WIDTH = 448, HEIGHT = 320, WORLD_W = WIDTH * 3, WORLD_H = HEIGHT * 3;
const wrap = (n, size) => ((n % size) + size) % size;
// Difficulty of the nine raid territories. Bilinear world coordinates make
// density continuous across every edge, even during a camera transition.
const DENSITY = [[1,1.2,1.6],[1.2,1.4,1.6],[1.4,1.6,1.85]];
export function darkMistDensity(x, y) {
  const gx=Math.max(0,Math.min(2,x/WIDTH-.5)),gy=Math.max(0,Math.min(2,y/HEIGHT-.5));
  const ix=Math.floor(gx),iy=Math.floor(gy),nx=Math.min(2,ix+1),ny=Math.min(2,iy+1);
  const sx=gx-ix,sy=gy-iy;
  return (DENSITY[iy][ix]*(1-sx)+DENSITY[iy][nx]*sx)*(1-sy)+(DENSITY[ny][ix]*(1-sx)+DENSITY[ny][nx]*sx)*sy;
}
export class DarkContinentMist {
  constructor(createCanvas = () => document.createElement('canvas')) {this.createCanvas = createCanvas;}
  prepare() {
    if (this.cloud) return;
    this.cloud = this.createCanvas(); this.cloud.width = 192; this.cloud.height = 80;
    const c = this.cloud.getContext('2d'); if (!c) return;
    c.save(); c.scale(1, 80 / 192);
    const fog = c.createRadialGradient(96, 96, 8, 96, 96, 96);
    fog.addColorStop(0, 'rgba(162,106,194,.38)');
    fog.addColorStop(.45, 'rgba(111,65,151,.28)'); fog.addColorStop(1, 'rgba(83,41,119,0)');
    c.fillStyle = fog; c.fillRect(0, 0, 192, 192); c.restore();
    this.grade=this.createCanvas();this.grade.width=84;this.grade.height=60;
    const g=this.grade.getContext('2d');
    for(let y=0;y<60;y++)for(let x=0;x<84;x++){
      g.fillStyle=`rgba(55,17,83,${.20+.12*(darkMistDensity((x+.5)*16,(y+.5)*16)-1)})`;
      g.fillRect(x,y,1,1);
    }
  }
  paint(c, map, seconds, motion, night = 0) {
    if (!isDarkMistMap(map)) return;
    this.prepare(); if (!this.cloud) return;
    if(map.startsWith('DC2_')){this.paintNew(c,map,seconds,motion,night);return;}
    const index = Number(map.slice(6)) - 1, ox = index % 3 * WIDTH, oy = Math.floor(index / 3) * HEIGHT;
    const t = motion ? seconds : 0;
    c.save();
    const darkness=1-Math.min(1,Math.max(0,night))*.2;
    c.globalAlpha=darkness;
    c.drawImage(this.grade,ox/16,oy/16,WIDTH/16,HEIGHT/16,0,0,WIDTH,HEIGHT);
    for (let n = 0; n < 72; n++) {
      const w = 210 + n % 4 * 19, h = 65 + n % 3 * 11;
      const x = wrap(n * 193 + t * (2.1 + n % 3 * .22), WORLD_W + 360) - 180 - ox;
      const y = wrap(n * 137 + Math.sin(t * .09 + n) * 8, WORLD_H + 110) - 55 - oy;
      if (x + w < 0 || y + h < 0 || x > WIDTH || y > HEIGHT) continue;
      c.globalAlpha=darkness*Math.min(1,.7+.35*(darkMistDensity(ox+x+w/2,oy+y+h/2)-1));
      c.drawImage(this.cloud, x, y, w, h);
    }
    c.restore();
  }
  paintNew(c,map,seconds,motion,night){
    const i=Number(map.slice(4))-1,ox=i%6*WIDTH,oy=Math.floor(i/6)*HEIGHT,t=motion?seconds:0,darkness=1-Math.min(1,Math.max(0,night))*.2;
    c.save();c.globalAlpha=darkness;c.fillStyle=`rgba(55,17,83,${.29+.06*(1-Math.floor(i/6)/7)})`;c.fillRect(0,0,WIDTH,HEIGHT);
    // Four times as many, broader wisps on the new continent only. The bitmap
    // and 20 Hz clock are shared with the island; only visible wisps are drawn.
    for(let n=0;n<1536;n++){
      const w=260+n%4*24,h=92+n%4*12,x=wrap(n*193+t*(2.1+n%3*.22),WIDTH*6+400)-200-ox,y=wrap(n*137+Math.sin(t*.09+n)*8,HEIGHT*8+160)-80-oy;
      if(x+w<0||y+h<0||x>WIDTH||y>HEIGHT)continue;c.globalAlpha=darkness*.98;c.drawImage(this.cloud,x,y,w,h);
    }c.restore();
  }
  suspend() {if (this.cloud) {this.cloud.width = 0; this.cloud.height = 0;} this.cloud = null;if(this.grade){this.grade.width=0;this.grade.height=0;this.grade=null;}}
}
