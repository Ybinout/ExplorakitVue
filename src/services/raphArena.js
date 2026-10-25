import { SIDE_PILLARS, drawPillarTremor } from './arenaPillars.js';
export const RAPH_MAP = 'gen_arene5';
// Individual panes, excluding mullions, the central crest and mountain relief.
export const RAPH_SKY_PANES = [
  [[151,15],[156,10],[156,33],[151,29]],
  [[164,1],[176,1],[176,27],[164,38]],
  [[188,1],[197,1],[197,17],[188,8]],
  [[188,12],[197,21],[197,40],[188,40]],
  [[204,1],[217,1],[217,17],[204,17]],
  [[230,1],[240,1],[240,17],[230,17]],
  [[249,1],[259,1],[259,8],[249,17]],
  [[249,21],[259,12],[259,40],[249,40]],
  [[271,1],[282,1],[282,38],[271,27]],
  [[291,10],[296,15],[296,29],[291,33]],
];
// Cloth only: poles, wall fixtures, lamps and pillars stay in the original map.
export const RAPH_BANNERS = [
  [108,19,126,60], [326,19,344,60],
  [24,104,39,137], [57,104,72,137], [375,104,390,137], [408,104,423,137],
  [24,197,39,230], [57,197,72,230], [375,197,390,230], [408,197,423,230],
];
const SKY = { x: 148, y: 0, w: 152, h: 49 };
// The open floor only: stairs, column bases and walls remain in front of the
// celestial projections. World coordinates follow the existing 448 × 320 map.
export const RAPH_ASTRAL_FLOOR = [[102,104],[346,104],[346,259],[307,269],[141,269],[102,259]];
const ROOM_METEORS = [
  { start: [108,116], end: [331,211], phase: 0, period: 9200, duration: 2150, gold: false },
  { start: [335,119], end: [131,232], phase: 2700, period: 10300, duration: 2350, gold: true },
  { start: [122,164], end: [308,257], phase: 5300, period: 11100, duration: 2050, gold: false },
  { start: [312,111], end: [149,203], phase: 7100, period: 12400, duration: 1900, gold: false },
  { start: [111,202], end: [256,263], phase: 1800, period: 13700, duration: 1850, gold: true },
  { start: [337,176], end: [191,254], phase: 4600, period: 11800, duration: 1950, gold: false },
];
const mod = (n, d) => ((n % d) + d) % d;
const clamp = n => Math.max(0, Math.min(1, n));
const inside = (x, y, points) => {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i], b = points[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) hit = !hit;
  }
  return hit;
};
export function raphPillarStrength(timestamp, index = 0) {
  const t = mod(timestamp / 1000 - Math.floor(index / 2) * .45, 9);
  const pulse = (start, width) => t < start || t > start + width ? 0 : Math.sin((t - start) / width * Math.PI);
  return pulse(.4, 1.15) * .9 + pulse(2.2, .65) * .45;
}
function drawRoomMeteors(c, time) {
  c.save();
  c.beginPath();
  RAPH_ASTRAL_FLOOR.forEach(([x,y], i) => i ? c.lineTo(x,y) : c.moveTo(x,y));
  c.closePath();c.clip();
  for (const [index, track] of ROOM_METEORS.entries()) {
    const age = mod(time + track.phase, track.period);
    if (age >= track.duration) continue;
    const progress = age / track.duration;
    const fade = clamp(progress * 8) * clamp((1-progress) * 5);
    const vx = track.end[0]-track.start[0], vy = track.end[1]-track.start[1];
    const length = Math.hypot(vx,vy), dx = vx/length, dy = vy/length;
    const x = track.start[0]+vx*progress, y = track.start[1]+vy*progress;
    const color = track.gold ? '#ffd68d' : '#a5dcff';
    // Short, stepped trails rather than blur/shadow filters: crisp at mobile
    // zoom and cheap to paint. The dim under-trail reflects on the tiles.
    c.strokeStyle = color;c.lineCap = 'butt';c.globalAlpha = fade*.11;c.lineWidth = 4;
    c.beginPath();c.moveTo(Math.round(x-dx*39),Math.round(y-dy*39));c.lineTo(Math.round(x),Math.round(y));c.stroke();
    for (let n=17;n>=0;n--) {
      c.globalAlpha = fade * (1-n/19) * .78;c.fillStyle = n<2 ? '#fff7df' : color;
      const size = n<4 ? 2 : 1;
      c.fillRect(Math.round(x-dx*n*2),Math.round(y-dy*n*2),size,size);
    }
    // A compact four-point glint, with no ring or global screen flash.
    c.globalAlpha = fade*.95;c.fillStyle = '#fff9eb';
    c.fillRect(Math.round(x)-2,Math.round(y),6,1);
    c.fillRect(Math.round(x),Math.round(y)-2,1,6);
    for (let n=0;n<4;n++) {
      const lag = 10+n*7, side = (n%2 ? -1 : 1)*(2+Math.sin(time/180+index+n)*2);
      c.globalAlpha = fade*(.32-n*.05);c.fillStyle = color;
      c.fillRect(Math.round(x-dx*lag-dy*side),Math.round(y-dy*lag+dx*side),1,1);
    }
  }
  c.restore();
}
export class RaphArenaRenderer {
  constructor(createCanvas = () => document.createElement('canvas')) { this.createCanvas = createCanvas; this.frames = 0; this.suspend(); }
  surface(w, h) { const c = this.createCanvas(); c.width = w; c.height = h; return c; }
  prepare(source) {
    this.suspend();
    try {
      this.source = source; this.canvas = this.surface(896,640); this.context = this.canvas.getContext('2d');
      this.context.imageSmoothingEnabled = false; this.context.drawImage(source,0,0,896,640);
      const original = this.context.getImageData(0,0,896,640), pixels = original.data;
      this.repair = this.surface(896,640); const repair = this.repair.getContext('2d').createImageData(896,640);
      this.flags = RAPH_BANNERS.map(([left,top,right,bottom]) => {
        const x = left * 2, y = top * 2, w = (right-left)*2, h = (bottom-top)*2;
        const texture = this.surface(w,h), data = texture.getContext('2d').createImageData(w,h); let count = 0;
        for (let row=0;row<h;row++) for(let col=0;col<w;col++) {
          const i = ((y+row)*896+x+col)*4, r=pixels[i],g=pixels[i+1],b=pixels[i+2];
          if (!(r>g+8 && r>b+6)) continue;
          // Repair only the actual warm cloth pixels with neighbouring cool
          // wall pixels from the same row. No rectangular wall replacement.
          const candidate = col<w/2 ? x-4 : x+w+4;
          const neighbour = ((y+row)*896+candidate)*4;
          for(let k=0;k<3;k++) { data.data[(row*w+col)*4+k]=pixels[i+k]; repair.data[i+k]=pixels[neighbour+k]; }
          data.data[(row*w+col)*4+3]=255;repair.data[i+3]=255;count++;
        }
        texture.getContext('2d').putImageData(data,0,0);
        return {x,y,w,h,texture,pixels:count};
      });
      this.repair.getContext('2d').putImageData(repair,0,0);
      this.sky = this.surface(SKY.w*2,SKY.h*2); this.skyMask = this.surface(SKY.w*2,SKY.h*2);
      const mask = this.skyMask.getContext('2d').createImageData(SKY.w*2,SKY.h*2);
      this.skyPixels = 0;
      for(let y=0;y<SKY.h*2;y++)for(let x=0;x<SKY.w*2;x++) {
        const wx=SKY.x+(x+.5)/2,wy=(y+.5)/2,i=(y*896+SKY.x*2+x)*4;
        // Bright sunset sky only. Mountains, frames and the crest occlude stars.
        if(!RAPH_SKY_PANES.some(p=>inside(wx,wy,p)) || !(pixels[i]>220&&pixels[i+1]>130&&pixels[i+2]>75&&pixels[i+2]<200&&pixels[i]-pixels[i+1]>25&&pixels[i+1]-pixels[i+2]>12))continue;
        const j=(y*SKY.w*2+x)*4; mask.data[j]=mask.data[j+1]=mask.data[j+2]=mask.data[j+3]=255; this.skyPixels++;
      }
      this.skyMask.getContext('2d').putImageData(mask,0,0); this.context.clearRect(0,0,896,640);
    } catch (_) { this.suspend(); } // Fail closed to the original artwork.
  }
  draw(target, source, timestamp, motion = true) {
    if (!source?.complete || !source.naturalWidth) return;
    if (this.source!==source || !this.canvas) this.prepare(source);
    if (!this.context) return;
    const time=Number.isFinite(timestamp)?Math.max(0,timestamp):0;
    if(this.lastTime===-Infinity||this.motion!==motion||motion&&(time<this.lastTime||time-this.lastTime>=50)) {
      this.paint(time,motion);this.lastTime=time;this.motion=motion;this.frames++;
    }
    target.drawImage(this.canvas,0,0,896,640);
  }
  paint(time, motion) {
    const c=this.context;c.clearRect(0,0,896,640);
    if(!motion) return;
    // Many staggered meteors, clipped behind the real glass and architecture.
    const sky=this.sky.getContext('2d');sky.clearRect(0,0,this.sky.width,this.sky.height);sky.save();sky.scale(2,2);sky.translate(-SKY.x,0);
    for(let i=0;i<28;i++) {
      const age=mod(time/1000+i*.173,3.4);if(age>1.25)continue;
      const progress=age/1.25, x=132+(i*37%145)+progress*52,y=-10+(i*13%23)+progress*24;
      const fade=clamp(progress*7)*clamp((1-progress)*6);
      for(let n=15;n>=0;n--) {sky.globalAlpha=fade*(1-n/17)*.95;sky.fillStyle=n<2?'#fff6df':'#cbe9ff';sky.fillRect(Math.round(x-n*1.1),Math.round(y-n*.52),n<2?2:1.5,1);}
    }
    sky.restore();sky.save();sky.globalCompositeOperation='destination-in';sky.drawImage(this.skyMask,0,0);sky.restore();
    c.drawImage(this.sky,SKY.x*2,0);
    c.save();c.scale(2,2);
    drawRoomMeteors(c,time);
    for(const[i,pillar]of SIDE_PILLARS.entries())drawPillarTremor(c,this.source,pillar,time,raphPillarStrength(time,i),i);
    c.restore();c.drawImage(this.repair,0,0);
    for(const[i,f]of this.flags.entries()) {
      const offset = row => Math.round(Math.pow(row/(f.h-1),1.3)*(Math.sin(time/660+i*.8)*2+Math.sin(time/310+row*.1+i)*1.2));
      // Consecutive rows sharing the same offset are one blit, avoiding hundreds
      // of tiny draw calls per frame while keeping exactly the same pixels.
      let start=0,dx=offset(0);
      for(let row=1;row<=f.h;row++) {
        const next=offset(row);if(row<f.h&&next===dx)continue;
        c.drawImage(f.texture,0,start,f.w,row-start,f.x+dx,f.y+start,f.w,row-start);
        start=row;dx=next;
      }
    }
  }
  suspend() {
    for(const flag of this.flags||[]){flag.texture.width=0;flag.texture.height=0;}
    for(const key of ['canvas','repair','sky','skyMask']){if(this[key]){this[key].width=0;this[key].height=0;}this[key]=null;}
    this.context=this.source=null;this.flags=[];this.lastTime=-Infinity;this.motion=null;this.skyPixels=0;
  }
}
