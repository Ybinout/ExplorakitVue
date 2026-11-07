// Small reusable bitmap layers, painted by the existing 20 FPS ambience clock.
// No timers, filters, pixel readbacks or full-size allocations during movement.
export const isDarkMistMap = map => /^jungle[1-9]$/.test(String(map || ''));
const WIDTH = 448, HEIGHT = 320, WORLD_W = WIDTH * 3, WORLD_H = HEIGHT * 3;
const wrap = (n, size) => ((n % size) + size) % size;
export class DarkContinentMist {
  constructor(createCanvas = () => document.createElement('canvas')) {this.createCanvas = createCanvas;}
  prepare() {
    if (this.cloud) return;
    this.cloud = this.createCanvas(); this.cloud.width = 192; this.cloud.height = 80;
    const c = this.cloud.getContext('2d'); if (!c) return;
    c.save(); c.scale(1, 80 / 192);
    const fog = c.createRadialGradient(96, 96, 8, 96, 96, 96);
    fog.addColorStop(0, 'rgba(162,106,194,.23)');
    fog.addColorStop(.45, 'rgba(111,65,151,.17)'); fog.addColorStop(1, 'rgba(83,41,119,0)');
    c.fillStyle = fog; c.fillRect(0, 0, 192, 192); c.restore();
  }
  paint(c, map, seconds, motion, night = 0) {
    if (!isDarkMistMap(map)) return;
    this.prepare(); if (!this.cloud) return;
    const index = Number(map.slice(6)) - 1, ox = index % 3 * WIDTH, oy = Math.floor(index / 3) * HEIGHT;
    const t = motion ? seconds : 0;
    c.save();
    // Uniform colour makes the haze continuous when crossing a map edge.
    c.fillStyle = `rgba(55,17,83,${.16 - Math.min(1, Math.max(0, night)) * .06})`;
    c.fillRect(0, 0, WIDTH, HEIGHT);
    for (let n = 0; n < 72; n++) {
      const w = 210 + n % 4 * 19, h = 65 + n % 3 * 11;
      const x = wrap(n * 193 + t * (2.1 + n % 3 * .22), WORLD_W + 360) - 180 - ox;
      const y = wrap(n * 137 + Math.sin(t * .09 + n) * 8, WORLD_H + 110) - 55 - oy;
      if (x + w < 0 || y + h < 0 || x > WIDTH || y > HEIGHT) continue;
      c.drawImage(this.cloud, x, y, w, h);
    }
    c.restore();
  }
  suspend() {if (this.cloud) {this.cloud.width = 0; this.cloud.height = 0;} this.cloud = null;}
}
