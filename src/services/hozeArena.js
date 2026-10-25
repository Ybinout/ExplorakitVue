// Authored in the arena's 448 × 320 logical artwork. Never warp the whole map.
export const HOZE_MAP = 'ville_safe1_arene';
export const HOZE_PILLARS = Object.freeze([
  [48, 81, 161], [81, 81, 161], [48, 174, 254], [81, 174, 254],
  [367, 81, 161], [400, 81, 161], [367, 174, 254], [400, 174, 254],
]);
const FAULTS = [
  { x: 99, y: 131, sign: -1, phase: 0, path: [[0,0],[-5,5],[-3,10],[-10,15],[-8,21],[-15,27],[-13,34]], branches: [[2,[-12,8],[-17,13]],[4,[-1,22],[2,29]]] },
  { x: 100, y: 231, sign: -1, phase: 1.1, path: [[0,0],[-5,-4],[-4,-10],[-10,-15],[-8,-22],[-15,-27]], branches: [[2,[3,-12],[5,-19]],[4,[-17,-21],[-21,-25]]] },
  { x: 349, y: 130, sign: 1, phase: .65, path: [[0,0],[5,5],[3,12],[10,17],[8,23],[15,29],[13,35]], branches: [[2,[12,10],[17,15]],[4,[0,25],[-2,31]]] },
  { x: 348, y: 232, sign: 1, phase: 1.65, path: [[0,0],[5,-5],[3,-11],[10,-16],[8,-22],[15,-29]], branches: [[2,[-3,-13],[-5,-19]],[4,[17,-23],[21,-26]]] },
];
const mod = (n, d) => ((n % d) + d) % d;
const clamp = n => Math.max(0, Math.min(1, n));
// Growth, a short aftershock, then a quiet interval. The cycle is deterministic.
export function hozeFaultPose(timestamp, phase = 0, motion = true) {
  if (!motion) return { growth: .55, opacity: .35, shake: 0, dust: 0 };
  const t = mod(Math.max(0, Number(timestamp) || 0) / 1000 - phase, 12);
  const pulse = (start, duration) => t < start || t > start + duration ? 0 : Math.sin((t - start) / duration * Math.PI);
  return { growth: clamp(t / 1.45), opacity: clamp((8.5 - t) / 2), shake: pulse(.25, 1.05) + pulse(3.3, .55) * .5, dust: pulse(.7, 2.4) + pulse(3.4, 1.6) * .55 };
}
function trace(c, points, amount) {
  const segments = (points.length - 1) * clamp(amount), end = Math.floor(segments);
  c.beginPath(); c.moveTo(...points[0]);
  for (let i = 1; i <= end; i++) c.lineTo(...points[i]);
  if (end < points.length - 1) {
    const a = points[end], b = points[end + 1], mix = segments - end;
    c.lineTo(a[0] + (b[0] - a[0]) * mix, a[1] + (b[1] - a[1]) * mix);
  }
  c.stroke();
}
export class HozeArenaRenderer {
  constructor(createCanvas = () => document.createElement('canvas')) { this.createCanvas = createCanvas; this.frames = 0; this.suspend(); }
  prepare(source) {
    this.suspend(); this.source = source;
    this.canvas = this.createCanvas(); this.canvas.width = 896; this.canvas.height = 640;
    this.context = this.canvas.getContext('2d');
    if (!this.context) this.suspend();
  }
  draw(target, source, timestamp, motion = true) {
    if (!source?.complete || !source.naturalWidth) return;
    if (this.source !== source || !this.canvas) this.prepare(source);
    if (!this.context) return;
    const time = Math.max(0, Number(timestamp) || 0);
    if (this.lastTime === -Infinity || this.motion !== motion || motion && (time < this.lastTime || time - this.lastTime >= 50)) {
      this.paint(time, motion); this.lastTime = time; this.motion = motion; this.frames++;
    }
    target.drawImage(this.canvas, 0, 0, 896, 640);
  }
  paint(time, motion) {
    const c = this.context, source = this.source;
    c.clearRect(0, 0, 896, 640); c.save(); c.scale(2, 2); c.imageSmoothingEnabled = false;
    // Only the interior stone of each pillar flexes. Its silhouette, base,
    // banners and surrounding floor never move or reveal a rectangular cutout.
    if (motion) for (const [i, [x, top, bottom]] of HOZE_PILLARS.entries()) {
      const pose = hozeFaultPose(time, FAULTS[Math.floor(i / 2)].phase);
      if (pose.shake < .015) continue;
      c.save(); c.beginPath();
      c.moveTo(x - 7, top + 3); c.lineTo(x + 7, top + 3); c.lineTo(x + 8, top + 12);
      c.lineTo(x + 5, top + 21); c.lineTo(x + 5, bottom - 16); c.lineTo(x - 5, bottom - 16);
      c.lineTo(x - 5, top + 21); c.lineTo(x - 8, top + 12); c.closePath(); c.clip();
      for (let y = top; y < bottom - 14; y += 2) {
        const weight = Math.sin((y - top) / (bottom - top) * Math.PI);
        const dx = Math.round(Math.sin(time / 43 + i * 1.4 + y * .06) * pose.shake * weight * 2) / 2;
        c.drawImage(source, (x - 12) / 448 * source.naturalWidth, y / 320 * source.naturalHeight,
          24 / 448 * source.naturalWidth, 2 / 320 * source.naturalHeight, x - 12 + dx, y, 24, 2);
      }
      c.restore();
    }
    for (const [i, f] of FAULTS.entries()) {
      const pose = hozeFaultPose(time, f.phase, motion); if (!pose.opacity) continue;
      c.save(); c.translate(f.x, f.y); c.lineJoin = 'bevel'; c.lineCap = 'butt';
      // A pale fractured lip beside a narrow shaded seam, never lava/glow.
      c.globalAlpha = pose.opacity * .82; c.strokeStyle = '#ead1a3'; c.lineWidth = 1.8;
      c.save(); c.translate(.6, .6); trace(c, f.path, pose.growth); c.restore();
      c.strokeStyle = '#624b37'; c.lineWidth = .9; trace(c, f.path, pose.growth);
      for (const [start, a, b] of f.branches) trace(c, [f.path[start], a, b], clamp(pose.growth * (f.path.length - 1) - start) * .9);
      if (motion && pose.dust > 0) for (let n = 0; n < 7; n++) {
        const age = mod(time / 1600 + n / 7 + i * .13, 1), p = f.path[1 + n % (f.path.length - 1)];
        c.globalAlpha = pose.dust * (1 - age) * .6; c.fillStyle = n % 2 ? '#d8b37a' : '#f6dfb6';
        c.fillRect(Math.round(p[0] + Math.sin(n * 8 + age * 3) * (2 + age * 4)), Math.round(p[1] - age * 10), n % 3 ? 1 : 1.5, 1);
      }
      c.restore();
    }
    c.restore();
  }
  suspend() {
    if (this.canvas) { this.canvas.width = 0; this.canvas.height = 0; }
    this.canvas = this.context = this.source = null; this.lastTime = -Infinity; this.motion = null;
  }
}
