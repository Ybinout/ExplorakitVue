// Local ambient preview. Does not send commands or modify battle/world rules.
export const WORLD_WEATHER_KEY = 'riftmon.worldWeatherPreview';
export const DEFAULT_WORLD_WEATHER = Object.freeze({ wind: 1, rain: 1 });
const WIDTH = 896, HEIGHT = 640, FRAME_MS = 1000 / 30;
const RAIN_COUNTS = [0, 44, 94, 160], WIND_COUNTS = [0, 8, 17, 28];
const mod = (value, size) => ((value % size) + size) % size;
const level = value => Number.isInteger(Number(value)) ? Math.max(0, Math.min(3, Number(value))) : 0;
export function normalizeWorldWeather(value = {}) {
  return { wind: level(value?.wind), rain: level(value?.rain) };
}
export function loadWorldWeather(storage) {
  try { const saved = (storage || window.localStorage).getItem(WORLD_WEATHER_KEY); return saved ? normalizeWorldWeather(JSON.parse(saved)) : { ...DEFAULT_WORLD_WEATHER }; }
  catch (_) { return { ...DEFAULT_WORLD_WEATHER }; }
}
export function saveWorldWeather(value, storage) {
  const settings = normalizeWorldWeather(value);
  try { (storage || window.localStorage).setItem(WORLD_WEATHER_KEY, JSON.stringify(settings)); } catch (_) { /* Private browsing: keep the in-memory choice. */ }
  return settings;
}
export function worldWeatherEnabled(map, { hidden = false, battle = false, loading = false } = {}) {
  return map === 'start' && !hidden && !battle && !loading;
}
export function worldWeatherBudget(value) {
  const { wind, rain } = normalizeWorldWeather(value);
  return { rain: RAIN_COUNTS[rain], leaves: WIND_COUNTS[wind], gusts: wind ? wind + 1 : 0, splashes: rain * 6 };
}
function seed(index) {
  // Stable particles keep the same world positions while the camera pans.
  let x = (index + 1) * 2654435761 >>> 0;
  x ^= x >>> 16; x = Math.imul(x, 2246822519); x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
}
export class WorldWeatherRenderer {
  constructor(createCanvas = () => document.createElement('canvas')) {
    this.createCanvas = createCanvas;
    this.canvas = null; this.context = null; this.lastTime = -Infinity; this.signature = ''; this.destroyed = false;
    this.frames = 0; this.budget = worldWeatherBudget({});
    this.particles = Array.from({ length: 200 }, (_, i) => ({ x: seed(i * 4), y: seed(i * 4 + 1), depth: seed(i * 4 + 2), phase: seed(i * 4 + 3) * Math.PI * 2 }));
  }
  suspend() {
    if (this.canvas) { this.canvas.width = 0; this.canvas.height = 0; }
    this.canvas = null; this.context = null; this.signature = ''; this.lastTime = -Infinity;
  }
  destroy() { this.suspend(); this.destroyed = true; this.particles = []; }
  draw(target, timestamp, value, motion = true) {
    if (this.destroyed) return;
    const settings = normalizeWorldWeather(value);
    if (!settings.wind && !settings.rain) { this.suspend(); this.budget = worldWeatherBudget(settings); return; }
    const signature = `${settings.wind}:${settings.rain}:${Boolean(motion)}`;
    const time = Number.isFinite(timestamp) ? Math.max(0, timestamp) : 0;
    const changed = signature !== this.signature;
    if (!this.canvas) {
      this.canvas = this.createCanvas(); this.canvas.width = WIDTH; this.canvas.height = HEIGHT;
      this.context = this.canvas.getContext('2d');
    }
    if (!this.context) { this.suspend(); return; }
    if (changed || motion && (time - this.lastTime >= FRAME_MS || time < this.lastTime)) {
      this.signature = signature; this.lastTime = time; this.budget = worldWeatherBudget(settings);
      this.paint(motion ? time / 1000 : 0, settings); this.frames++;
    }
    target.drawImage(this.canvas, 0, 0, WIDTH, HEIGHT);
  }
  paint(time, { wind, rain }) {
    const c = this.context;
    c.clearRect(0, 0, WIDTH, HEIGHT);
    if (rain) {
      c.fillStyle = `rgba(29,47,70,${rain * .025})`; c.fillRect(0, 0, WIDTH, HEIGHT);
      c.lineCap = 'round'; c.strokeStyle = `rgba(191,221,241,${.24 + rain * .065})`; c.lineWidth = .65 + rain * .2;
      const gust = .82 + Math.sin(time * .8) * .18, lean = 8 + wind * 18 * gust;
      const drift = 3 * ((8 + wind * 18 * .82) * time - wind * 18 * .18 / .8 * Math.cos(time * .8));
      c.beginPath();
      for (let i = 0; i < this.budget.rain; i++) {
        const p = this.particles[i], speed = 210 + rain * 90 + p.depth * 120;
        const x = mod(p.x * (WIDTH + 120) + drift, WIDTH + 120) - 60;
        const y = mod(p.y * (HEIGHT + 40) + time * speed, HEIGHT + 40) - 20;
        const length = 4 + rain * 3 + p.depth * 4;
        c.moveTo(x, y); c.lineTo(x + lean * 3 * length / speed, y + length);
      }
      c.stroke();
      for (let i = 0; i < this.budget.splashes; i++) {
        const p = this.particles[170 + i], age = mod(time * 1.8 + p.phase, 1);
        if (age > .46) continue;
        c.strokeStyle = `rgba(199,224,234,${(.46 - age) * .42})`; c.lineWidth = .7;
        c.beginPath();c.ellipse(p.x * WIDTH, p.y * HEIGHT, 1 + age * 7, .5 + age * 2.6, 0, 0, Math.PI * 2);c.stroke();
      }
    }
    if (!wind) return;
    const speed = [0, 34, 76, 132][wind];
    const displacement = speed * (.85 * time - .15 / .75 * Math.cos(time * .75));
    // Sparse moving air streaks and small leaves show wind without hiding the map.
    for (let i = 0; i < this.budget.gusts; i++) {
      const p = this.particles[160 + i], phase = mod(time * .12 + p.depth, 1);
      const opacity = Math.sin(phase * Math.PI) ** 4 * (.05 + wind * .025);
      const x = mod(p.x * (WIDTH + 260) + time * speed * 1.8, WIDTH + 260) - 180;
      const y = p.y * HEIGHT + Math.sin(time + p.phase) * 10;
      c.strokeStyle = `rgba(242,250,235,${opacity})`; c.lineWidth = .8 + wind * .2;
      c.beginPath();c.moveTo(x, y);c.bezierCurveTo(x + 35, y - 7, x + 65, y + 6, x + 110 + wind * 12, y - 2);c.stroke();
    }
    for (let i = 0; i < this.budget.leaves; i++) {
      const p = this.particles[i + 80], x = mod(p.x * (WIDTH + 60) + displacement * (1 + p.depth * .4), WIDTH + 60) - 30;
      const y = mod(p.y * HEIGHT + time * (3 + wind * 3) + Math.sin(time * 2 + p.phase) * 12, HEIGHT);
      c.save();c.translate(x, y);c.rotate(p.phase + time * (1 + p.depth));c.globalAlpha = .34 + wind * .07;
      c.fillStyle = i % 3 ? '#b4c789' : '#c99e62';c.beginPath();c.ellipse(0, 0, 2 + p.depth, .9 + p.depth * .5, 0, 0, Math.PI * 2);c.fill();c.restore();
    }
  }
}
