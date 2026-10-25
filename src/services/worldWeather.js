import { SandstormRenderer, sandParticleCount } from './sandstorm.js';
import rainGround from '../data/worldRainGround.js';
// Climate and intensity come from the server, identically for every player.
const WIDTH = 896, HEIGHT = 640, FRAME_MS = 1000 / 30;
const RAIN_COUNTS = [0, 36, 76, 128], WIND_COUNTS = [0, 8, 20, 42];
const SNOW_COUNTS = [0, 100, 240, 480];
const mod = (value, size) => ((value % size) + size) % size;
const level = value => Number.isInteger(Number(value)) ? Math.max(0, Math.min(3, Number(value))) : 0;
export function normalizeWorldWeather(value = {}) {
  const sand = level(value?.sand), snow = level(value?.snow);
  return { wind: level(value?.wind), rain: level(value?.rain), ...(sand ? { sand } : {}), ...(snow ? { snow } : {}) };
}
export function worldWeatherEnabled(map, { hidden = false, battle = false, loading = false } = {}) {
  return (['ville_safe1_arene','gen_route8','ville4', 'ville5', 'route5', 'route6', 'route12', 'route13', 'route14'].includes(map) || Object.prototype.hasOwnProperty.call(rainGround, map)) && !hidden && !battle && !loading;
}
export function mapWorldWeather(map, climate) {
  return worldWeatherEnabled(map) && climate?.map === map && ['rain', 'sandstorm', 'snow', 'wind'].includes(climate.kind)
    ? normalizeWorldWeather(climate.ambience) : { wind: 0, rain: 0 };
}
export function worldWeatherBudget(value) {
  const { wind, rain, sand = 0, snow = 0 } = normalizeWorldWeather(value);
  return { rain: RAIN_COUNTS[rain], leaves: sand || snow ? 0 : WIND_COUNTS[wind], gusts: wind && !sand ? [0,2,3,6][wind] : 0, splashes: rain * 16, ...(sand ? { sand: sandParticleCount(WIDTH, HEIGHT, sand) } : {}), ...(snow ? { snow: SNOW_COUNTS[snow] } : {}) };
}
function seed(index) {
  // Stable particles keep the same world positions while the camera pans.
  let x = (index + 1) * 2654435761 >>> 0;
  x ^= x >>> 16; x = Math.imul(x, 2246822519); x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
}
const groundCells = Object.fromEntries(Object.entries(rainGround).map(([map, rows]) => [map, rows.flatMap((row, y) => [...row].flatMap((cell, x) => cell === '1' ? [{ x, y }] : []))]));
export function worldRainImpacts(timestamp, rain, map = 'start') {
  const cells = groundCells[map], impacts = [], count = level(rain) * 16;
  if (!Array.isArray(cells) || !cells.length || !Number.isFinite(timestamp)) return impacts;
  const time = Math.max(0, timestamp) / 1000;
  for (let i = 0; i < count; i++) {
    const clock = time * .85 + seed(i * 5 + 1), age = mod(clock, 1);
    if (age >= .28) continue;
    const cycle = Math.floor(clock), cell = cells[Math.floor(seed(i * 7 + cycle * 719) * cells.length)];
    const progress = age / .28;
    impacts.push({ x: cell.x * 32 + 8 + seed(i * 5 + 2) * 16, y: cell.y * 32 + 8 + seed(i * 5 + 3) * 16,
      radius: 1.2 + progress * 3.2, alpha: (1 - progress) * .68 });
  }
  return impacts;
}
export class WorldWeatherRenderer {
  constructor(createCanvas = () => document.createElement('canvas')) {
    this.createCanvas = createCanvas;
    this.canvas = null; this.context = null; this.lastTime = -Infinity; this.signature = ''; this.destroyed = false;
    this.frames = 0; this.budget = worldWeatherBudget({}); this.impacts = [];
    this.particles = Array.from({ length: 480 }, (_, i) => ({ x: seed(i * 4), y: seed(i * 4 + 1), depth: seed(i * 4 + 2), phase: seed(i * 4 + 3) * Math.PI * 2 }));
  }
  suspend() {
    this._sandRenderer?.destroy(); this._sandRenderer = null;
    if (this.canvas) { this.canvas.width = 0; this.canvas.height = 0; }
    this.canvas = null; this.context = null; this.signature = ''; this.lastTime = -Infinity; this.impacts = [];
  }
  destroy() { this.suspend(); this.destroyed = true; this.particles = []; }
  prepare(timestamp, value, motion = true, map = 'start') {
    if (this.destroyed) return;
    const settings = normalizeWorldWeather(value);
    if (!settings.wind && !settings.rain && !settings.sand && !settings.snow) { this.suspend(); this.budget = worldWeatherBudget(settings); return; }
    const signature = `${map}:${settings.wind}:${settings.rain}:${settings.sand || 0}:${settings.snow || 0}:${Boolean(motion)}`;
    const time = Number.isFinite(timestamp) ? Math.max(0, timestamp) : 0;
    const changed = signature !== this.signature;
    if (!this.canvas) {
      this.canvas = this.createCanvas(); this.canvas.width = WIDTH; this.canvas.height = HEIGHT;
      this.context = this.canvas.getContext('2d');
    }
    if (!this.context) { this.suspend(); return; }
    if (changed || motion && (time - this.lastTime >= FRAME_MS || time < this.lastTime)) {
      this.signature = signature; this.lastTime = time; this.budget = worldWeatherBudget(settings);
      this.paint(motion ? time / 1000 : 0, settings, motion, map); this.frames++;
    }
  }
  drawGround(target, timestamp, value, motion = true, map = 'start') {
    this.prepare(timestamp, value, motion, map);
    if (!this.impacts.length) return;
    target.save(); target.lineWidth = .9;
    for (const impact of this.impacts) {
      target.strokeStyle = `rgba(213,235,242,${impact.alpha})`;
      target.beginPath(); target.ellipse(impact.x, impact.y, impact.radius, impact.radius * .34, 0, 0, Math.PI * 2); target.stroke();
      if (impact.alpha > .35) {
        target.beginPath(); target.moveTo(impact.x - .7, impact.y - .8); target.lineTo(impact.x - 1.2, impact.y - 1.8);
        target.moveTo(impact.x + .7, impact.y - .8); target.lineTo(impact.x + 1.2, impact.y - 1.8); target.stroke();
      }
    }
    target.restore();
  }
  draw(target, timestamp, value, motion = true, map = 'start') {
    this.prepare(timestamp, value, motion, map);
    if (this.canvas) target.drawImage(this.canvas, 0, 0, WIDTH, HEIGHT);
  }
  paint(time, { wind, rain, sand = 0, snow = 0 }, motion, map) {
    const c = this.context;
    this.impacts = motion ? worldRainImpacts(time * 1000, rain, map) : [];
    c.clearRect(0, 0, WIDTH, HEIGHT);
    if (rain) {
      c.fillStyle = `rgba(29,47,70,${rain * .045})`; c.fillRect(0, 0, WIDTH, HEIGHT);
      c.lineCap = 'round'; c.strokeStyle = `rgba(191,221,241,${.24 + rain * .065})`; c.lineWidth = .65 + rain * .2;
      const gust = .82 + Math.sin(time * .8) * .18, lean = 8 + wind * 18 * gust;
      const drift = .8 * 3 * ((8 + wind * 18 * .82) * time - wind * 18 * .18 / .8 * Math.cos(time * .8));
      c.beginPath();
      for (let i = 0; i < this.budget.rain; i++) {
        const p = this.particles[i], speed = .8 * (210 + rain * 90 + p.depth * 120);
        const x = mod(p.x * (WIDTH + 120) + drift, WIDTH + 120) - 60;
        const y = mod(p.y * (HEIGHT + 40) + time * speed, HEIGHT + 40) - 20;
        const length = 4 + rain * 3 + p.depth * 4;
        c.moveTo(x, y); c.lineTo(x + .8 * lean * 3 * length / speed, y + length);
      }
      c.stroke();
    }
    if (sand) {
      this._sandRenderer ||= new SandstormRenderer(this.createCanvas);
      this._sandRenderer.reset(); // The world surface already owns the 30 Hz/static cache.
      this._sandRenderer.draw(c, time * 1000, { width: WIDTH, height: HEIGHT, intensity: sand, wind, groundTop: 0, motion, clear: false });
    } else if (this._sandRenderer) {
      this._sandRenderer.destroy(); this._sandRenderer = null;
    }
    if (snow) {
      // Different depths and a blue rim keep white flakes visible on snowy ground.
      // A single bounded surface follows the map camera, never the interface.
      c.fillStyle = `rgba(113,150,184,${snow * .012})`; c.fillRect(0, 0, WIDTH, HEIGHT);
      // Six depth batches replace hundreds of fill/stroke submissions. Keep every
      // particle, its trajectory, size and rotation; only opacity is quantized.
      for (let band = 0; band < 6; band++) {
        const alphaDepth = (band + .5) / 6;
        c.fillStyle = `rgba(248,253,255,${.55 + alphaDepth * .4})`;
        c.strokeStyle = `rgba(72,109,145,${.15 + alphaDepth * .12})`; c.lineWidth = .65;
        c.beginPath();
        for (let i = 0; i < this.budget.snow; i++) {
          const p = this.particles[i];
          if (Math.min(5, Math.floor(p.depth * 6)) !== band) continue;
          const depth = .35 + p.depth * .65;
          const x = mod(p.x * (WIDTH + 32) + time * (8 + wind * 14) * depth + Math.sin(time * .75 + p.phase) * (8 + wind * 3), WIDTH + 32) - 16;
          const y = mod(p.y * (HEIGHT + 32) + time * (22 + depth * 40), HEIGHT + 32) - 16;
          const size = 1.1 + p.depth * 3.2, angle = p.phase + time * .12;
          c.moveTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
          c.ellipse(x, y, size, size * .88, angle, 0, Math.PI * 2);
        }
        c.fill(); c.stroke();
      }
    }
    if (!wind || sand) return;
    const stoneDust = map === 'ville_safe1_arene';
    c.save();
    if(stoneDust){c.beginPath();c.moveTo(48,150);c.lineTo(848,150);c.lineTo(848,520);c.lineTo(520,568);c.lineTo(376,568);c.lineTo(48,520);c.closePath();c.clip();}
    const speed = [0, 38, 100, 205][wind];
    const displacement = speed * (.85 * time - .15 / .75 * Math.cos(time * .75));
    // Sparse moving air streaks and small leaves show wind without hiding the map.
    for (let i = 0; i < this.budget.gusts; i++) {
      const p = this.particles[160 + i], phase = mod(time * .12 + p.depth, 1);
      const opacity = Math.sin(phase * Math.PI) ** 2 * (.07 + wind * .07) * (stoneDust ? 1.6 : 1);
      const x = mod(p.x * (WIDTH + 260) + time * speed * 1.8, WIDTH + 260) - 180;
      const y = p.y * HEIGHT + Math.sin(time + p.phase) * 10;
      c.strokeStyle = stoneDust ? `rgba(122,91,51,${opacity*.55})` : `rgba(56,87,85,${opacity*.6})`; c.lineWidth = 2 + wind * .35;
      c.beginPath();c.moveTo(x, y);c.bezierCurveTo(x + 35, y - 7, x + 65, y + 6, x + 110 + wind * 12, y - 2);c.stroke();c.strokeStyle=stoneDust ? `rgba(255,242,204,${opacity})` : `rgba(244,251,235,${opacity})`;c.lineWidth=.8+wind*.25;c.stroke();
    }
    for (let i = 0; i < this.budget.leaves; i++) {
      const p = this.particles[i + 80], x = mod(p.x * (WIDTH + 60) + displacement * (1 + p.depth * .4), WIDTH + 60) - 30;
      const y = mod(p.y * HEIGHT + time * (3 + wind * 3) + Math.sin(time * 2 + p.phase) * 12, HEIGHT);
      c.save();c.translate(x, y);c.rotate(p.phase + time * (1 + p.depth));c.globalAlpha = stoneDust ? .85 + wind * .08 : .38 + wind * .1;
      const spray = map === 'ville1_arene';
      c.fillStyle = stoneDust ? (i%3?'#b18858':'#f8edc9') : spray ? '#b7e7f3' : wind>=2 ? (i%3?'#6d8b4e':'#b08446') : (i%3?'#b4c789':'#c99e62');c.beginPath();c.ellipse(0, 0, stoneDust ? 1.8+p.depth*.6 : spray ? 1.4 : 2 + p.depth + wind*.2, stoneDust ? .8 : spray ? .65 : 1 + p.depth * .5, 0, 0, Math.PI * 2);c.fill();c.restore();
    }
    c.restore();
  }
}
