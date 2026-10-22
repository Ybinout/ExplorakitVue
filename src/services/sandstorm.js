// Shared airborne dust: small depth-sorted grains and irregular cached billows.
// Never draw a wind line or translate a repeated texture over the whole scene.
import { rainGroundTop } from './battleRain.js';
const LIMIT = 220, FRAME_MS = 1000 / 30, COUNTS = [0, 80, 160, 220];
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
const mod = (n, size) => ((n % size) + size) % size;
const seed = i => {
  let value = Math.imul(i + 1, 2654435761);
  value ^= value >>> 16; value = Math.imul(value, 2246822519); value ^= value >>> 13;
  return (value >>> 0) / 4294967296;
};
const seeds = Array.from({ length: LIMIT + 24 }, (_, i) => ({
  x: seed(i * 7), y: seed(i * 7 + 1), depth: seed(i * 7 + 2),
  phase: seed(i * 7 + 3) * Math.PI * 2, speed: seed(i * 7 + 4), size: seed(i * 7 + 5)
}));
export function sandParticleCount(width, height, intensity = 2) {
  const level = clamp(Math.round(Number(intensity) || 0), 0, 3);
  if (!(width > 0 && height > 0) || !level) return 0;
  return Math.min(LIMIT, Math.max(40, Math.round(COUNTS[level] * clamp(width * height / 380000, .5, 1))));
}
export function sandstormFrame(timestamp, { width, height, intensity = 2, wind = 2, groundTop = 0, motion = true }) {
  const level = clamp(Math.round(Number(intensity) || 0), 0, 3), grains = [], clouds = [];
  const count = sandParticleCount(width, height, level);
  if (!count || !Number.isFinite(width) || !Number.isFinite(height)) return { grains, clouds };
  const seconds = motion && Number.isFinite(timestamp) ? Math.max(0, timestamp) / 1000 : 0;
  const speed = 23 + clamp(Number(wind) || 0, 0, 3) * 16;
  // Integrated gust speed stays positive; no abrupt accelerations or frame delta jumps.
  const travel = speed * (seconds + .12 * Math.sin(seconds * .6));
  const floor = clamp(Number.isFinite(groundTop) ? groundTop : 0, 0, height - 1), groundHeight = height - floor;
  const scale = clamp(Math.min(width, height) / 640, .6, 1.3);
  for (let i = 0; i < 6 + level * 6; i++) {
    const p = seeds[LIMIT + i], band = (i + .2 + p.y * .6) / (6 + level * 6);
    const w = (250 + p.size * 150) * scale, padding = 240 * scale;
    clouds.push({ x: mod(p.x * (width + padding * 2) + travel * (.24 + p.depth * .5), width + padding * 2) - padding,
      y: (i % 3 === 0 ? band * height : floor + band * groundHeight) + Math.sin(seconds * .35 + p.phase) * 10 * scale,
      width: w * (1 + .1 * Math.sin(seconds * .4 + p.phase)), height: w * (.32 + p.depth * .12),
      angle: -.07 + Math.sin(seconds * .25 + p.phase) * .045,
      alpha: (.26 + level * .05 + p.depth * .12) * (.8 + .2 * Math.sin(seconds * .55 + p.phase)), texture: i % 3 });
  }
  for (let i = 0; i < count; i++) {
    const p = seeds[i], depth = .15 + p.depth * .85, swirling = i % 5 === 0;
    let x = mod(p.x * (width + 24) + travel * (.35 + depth * 1.65), width + 24) - 12;
    let y = mod(p.y * height + Math.sin(seconds * (.7 + depth) + p.phase) * (3 + depth * 12) + seconds * depth * 3, height);
    if (swirling) {
      const angle = seconds * (.8 + p.speed) + p.phase;
      x += Math.cos(angle) * (8 + depth * 16);
      y = floor + 5 + p.y * Math.max(0, groundHeight - 12) + Math.sin(angle) * (2 + depth * 3);
    }
    x = mod(x + 12, width + 24) - 12;
    const radius = .4 + depth * depth * 1.5;
    const fade = clamp(Math.min((x + 12) / 14, (width + 12 - x) / 14), 0, 1);
    grains.push({ x, y, radius, stretch: 1 + p.size * .55, angle: -.2 + Math.sin(seconds + p.phase) * .35,
      alpha: (.35 + depth * .48) * fade * (.85 + .15 * Math.sin(seconds * 1.1 + p.phase)),
      color: i % 3, depth, swirling });
  }
  return { grains, clouds };
}
export class SandstormRenderer {
  constructor(createCanvas = () => document.createElement('canvas')) {
    this.createCanvas = createCanvas; this.textures = []; this.frames = 0; this.destroyed = false;
    this.lastTime = -Infinity; this.signature = ''; this.stats = {};
  }
  prepareTextures() {
    if (this.textures.length) return;
    const colors = ['174,130,75', '203,163,103', '188,145,85'];
    for (let variant = 0; variant < 3; variant++) {
      const canvas = this.createCanvas(); canvas.width = 192; canvas.height = 128;
      const c = canvas.getContext('2d');
      if (c) for (let i = 0; i < 15; i++) {
        const x = 46 + seed(variant * 40 + i * 3) * 100;
        const y = 44 + seed(variant * 40 + i * 3 + 1) * 40;
        const radius = 18 + seed(variant * 40 + i * 3 + 2) * 24;
        const gradient = c.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(${colors[variant]},.32)`);
        gradient.addColorStop(.45, `rgba(${colors[variant]},.18)`);
        gradient.addColorStop(1, `rgba(${colors[variant]},0)`);
        c.fillStyle = gradient; c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }
      this.textures.push(canvas);
    }
  }
  draw(c, timestamp, { width, height, pixelRatio = 1, intensity = 2, wind = 2, environment = 'grass', groundTop, motion = true, clear = true }) {
    if (this.destroyed || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return false;
    const time = Number.isFinite(timestamp) ? Math.max(0, timestamp) : 0;
    const ratio = clamp(Number(pixelRatio) || 1, .5, 1.5);
    const floor = Number.isFinite(groundTop) ? groundTop : rainGroundTop(width, height, environment);
    const signature = `${width}:${height}:${ratio}:${intensity}:${wind}:${floor}:${motion}`;
    if (signature === this.signature && (!motion || time >= this.lastTime && time - this.lastTime < FRAME_MS)) return false;
    this.signature = signature; this.lastTime = time;
    this.prepareTextures();
    const frame = sandstormFrame(time, { width, height, intensity, wind, groundTop: floor, motion });
    this.stats = { count: frame.grains.length, clouds: frame.clouds.length, eddies: frame.grains.filter(p => p.swirling).length, groundTop: floor };
    c.save(); c.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (clear) c.clearRect(0, 0, width, height);
    // A slight warm tint unifies the dust without washing out the terrain.
    c.fillStyle = `rgba(189,149,88,${.018 * clamp(Number(intensity) || 0, 0, 3)})`; c.fillRect(0, 0, width, height);
    for (const cloud of frame.clouds) {
      c.save(); c.translate(cloud.x, cloud.y); c.rotate(cloud.angle); c.globalAlpha = cloud.alpha;
      c.drawImage(this.textures[cloud.texture], -cloud.width / 2, -cloud.height / 2, cloud.width, cloud.height); c.restore();
    }
    const colors = ['120,85,48', '242,210,155', '198,149,79'];
    for (const grain of frame.grains) {
      c.fillStyle = `rgba(${colors[grain.color]},${grain.alpha})`;
      c.beginPath(); c.ellipse(grain.x, grain.y, grain.radius * grain.stretch, grain.radius, grain.angle, 0, Math.PI * 2); c.fill();
    }
    c.restore(); this.frames++; return true;
  }
  reset() { this.lastTime = -Infinity; this.signature = ''; }
  suspend() { for (const texture of this.textures) { texture.width = 0; texture.height = 0; } this.textures = []; this.reset(); }
  destroy() { this.suspend(); this.destroyed = true; }
}
