import grass from '../data/worldGrass.js';
import { outdoorMap, townLights } from '../data/nightLights.js';
import { smooth } from './worldDaylight.js';

const W = 448, H = 320, FRAME_MS = 1000 / 20;
const mod = (x, n) => ((x % n) + n) % n;
const seeds = new Map();
function sites(map) {
  if (seeds.has(map)) return seeds.get(map);
  const result = [], cells = (grass[map] || []).filter(([, id]) => id !== 2961);
  // Existing grass cells keep all paths in actual vegetation, never on a roof,
  // a pond or a snowy clearing. A stable permutation spreads the small groups.
  const hash = [...String(map)].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 17);
  const sorted = cells.map(([cell]) => ({ cell, order: ((cell + hash) * 2654435761) >>> 0 }))
    .sort((a, b) => a.order - b.order);
  for (const { cell } of sorted) {
    const x = cell % 28 * 16 + 8, y = Math.floor(cell / 28) * 16 + 8;
    if (result.every(p => Math.hypot(x - p.x, y - p.y) > 25)) result.push({ x, y, cell, seed: mod(cell * 7 + hash, 997) });
    if (result.length === 9) break;
  }
  seeds.set(map, result); return result;
}
export function firefliesAt(map, timestamp, daylight, weather = {}, motion = true) {
  if (!motion || !outdoorMap(map) || daylight.night < .25 || weather.snow || weather.sand
    || weather.rain >= 3 || weather.wind >= 3) return [];
  const t = timestamp / 1000, strength = smooth((daylight.night - .25) / .65) * (weather.rain ? .65 : 1);
  return sites(map).flatMap((p, i) => {
    // Each small group rests between appearances, with staggered arrivals.
    const age = mod(t + p.seed + i * 5.7, 53);
    if (age > 20) return [];
    const fade = smooth(age / 3) * smooth((20 - age) / 4);
    const pulse = .38 + .62 * (.5 + .5 * Math.sin(t * 1.5 + p.seed)) ** 2;
    return [{ cell: p.cell, x: p.x + Math.sin(t * .43 + p.seed) * 5,
      y: p.y + Math.sin(t * .71 + p.seed) * 3, alpha: fade * pulse * strength }];
  });
}
function glow(c, x, y, radius, color, alpha, squash = 1) {
  c.save(); c.translate(x, y); c.scale(1, squash); c.globalAlpha = alpha;
  const g = c.createRadialGradient(0, 0, 0, 0, 0, radius);
  g.addColorStop(0, color); g.addColorStop(.18, color); g.addColorStop(1, 'transparent');
  c.fillStyle = g; c.fillRect(-radius, -radius, radius * 2, radius * 2); c.restore();
}

export class WorldNightRenderer {
  constructor(createCanvas = () => document.createElement('canvas')) {
    this.createCanvas = createCanvas; this.paints = 0; this.frames = 0; this.destroyed = false;
  }
  surface(w = W, h = H) { const c = this.createCanvas(); c.width = w; c.height = h; return c; }
  draw(target, map, now, daylight, weather = {}, motion = true, source = null) {
    if (this.destroyed) return;
    if (!outdoorMap(map) || (daylight.night < .001 && daylight.warmth < .001)) { this.suspend(); return; }
    if (map !== this.map || source !== this.source) {
      this.suspend(); this.map = map; this.source = source; this.readWindows(source);
    }
    if (!this.canvas) {
      this.canvas = this.surface(); this.base = this.surface();
      this.context = this.canvas.getContext('2d');
      if (!this.context || !this.base.getContext('2d')) { this.suspend(); return; }
    }
    const key = [Math.round(daylight.night * 1000), Math.round(daylight.warmth * 1000), Math.round(daylight.lamps * 1000)].join(':');
    const animated = motion && sites(map).length && !weather.snow && !weather.sand && !(weather.rain >= 3 || weather.wind >= 3);
    const settings = `${key}:${animated}:${weather.rain || 0}:${weather.wind || 0}:${weather.snow || 0}:${weather.sand || 0}`;
    if (key !== this.lightKey) { this.paintLighting(daylight); this.lightKey = key; }
    if (settings !== this.settings || !Number.isFinite(this.lastTime) || (animated && (now < this.lastTime || now - this.lastTime >= FRAME_MS))) {
      const c = this.context; c.clearRect(0, 0, W, H); c.drawImage(this.base, 0, 0);
      const lights = firefliesAt(map, now, daylight, weather, motion);
      if (lights.length && !this.spark) {
        this.spark = this.surface(16, 16); glow(this.spark.getContext('2d'), 8, 8, 7, '#c7ef79', .24);
      }
      for (const p of lights) {
        c.globalAlpha = p.alpha; c.drawImage(this.spark, Math.round(p.x) - 8, Math.round(p.y) - 8);
        c.fillStyle = '#f4ffb0'; c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      }
      c.globalAlpha = 1; this.lastTime = now; this.settings = settings; this.frames++;
    }
    target.drawImage(this.canvas, 0, 0, 896, 640);
  }
  readWindows(source) {
    this.glass = [];
    if (!source || !townLights[this.map]?.windows?.length) return;
    // Select only cool glass pixels INSIDE each authored pane. Window frames,
    // flower boxes and roofs keep their original pixels and silhouettes.
    const sample = this.surface();
    try {
      const c = sample.getContext('2d', { willReadFrequently: true });
      c.drawImage(source, 0, 0, W, H); const d = c.getImageData(0, 0, W, H).data;
      for (const [x, y, w, h] of townLights[this.map].windows) for (let dy = 0; dy < h; dy++) {
        let start = -1;
        for (let dx = 0; dx <= w; dx++) {
          const i = ((y + dy) * W + x + dx) * 4;
          const glass = dx < w && d[i + 2] > 75 && d[i + 2] > d[i] * 1.08 && d[i + 2] > d[i + 1] * 1.02;
          if (glass && start < 0) start = dx;
          if (!glass && start >= 0) { this.glass.push([x + start, y + dy, dx - start, 1]); start = -1; }
        }
      }
    } catch (_) { this.glass = []; } finally { sample.width = sample.height = 0; }
  }
  paintLighting(light) {
    const c = this.base.getContext('2d'), p = townLights[this.map] || {};
    c.clearRect(0, 0, W, H);
    // A readable blue hour, never a black veil. The game UI is outside this canvas.
    const shade = c.createLinearGradient(0, 0, 0, H);
    const darkness = (p.snow || /route1[34]$/.test(this.map) ? .4 : .48) * light.night;
    shade.addColorStop(0, `rgba(10,19,50,${darkness})`);
    shade.addColorStop(1, `rgba(20,34,68,${darkness * .87})`);
    c.fillStyle = shade; c.fillRect(0, 0, W, H);
    if (light.warmth) {
      const sunset = c.createLinearGradient(0, 0, W, H);
      sunset.addColorStop(0, `rgba(255,173,112,${light.warmth * .12})`);
      sunset.addColorStop(1, 'transparent'); c.fillStyle = sunset; c.fillRect(0, 0, W, H);
    }
    for (const [x, y, r] of p.lamps || []) {
      c.save(); c.globalCompositeOperation = 'destination-out';
      glow(c, x, y + 14, r, '#fff', .75 * light.lamps); c.restore();
      glow(c, x, y + 28, r, '#ffc678', .15 * light.lamps, .45);
      glow(c, x, y, 10, '#ffcf85', .48 * light.lamps);
      c.globalAlpha = light.lamps * .88; c.fillStyle = '#ffe7ad'; c.fillRect(x - 2, y - 1, 4, 3); c.globalAlpha = 1;
    }
    for (const [x, y, w, h] of p.windows || []) {
      const cx = x + w / 2, cy = y + h / 2;
      c.save(); c.globalCompositeOperation = 'destination-out'; glow(c, cx, cy + h, 19, '#fff', .46 * light.lamps); c.restore();
      glow(c, cx, cy, Math.max(12, w), '#ffcf87', .24 * light.lamps);
    }
    c.globalAlpha = light.lamps * .8; c.fillStyle = '#ffdfa2';
    for (const [x, y, w, h] of this.glass || []) c.fillRect(x, y, w, h);
    c.globalAlpha = 1;
    this.paints++;
  }
  suspend() {
    for (const key of ['canvas', 'base', 'spark']) { if (this[key]) this[key].width = this[key].height = 0; this[key] = null; }
    this.context = null; this.map = null; this.source = null; this.glass = null; this.lightKey = null; this.settings = null; this.lastTime = null;
  }
  destroy() { this.suspend(); this.destroyed = true; }
}
