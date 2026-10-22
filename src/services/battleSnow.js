// Individual flakes: no tiled texture, whole-layer translation or large blur.
import { rainGroundTop } from './battleRain.js';
const FRAME_MS = 1000 / 30, LIMIT = 220, LANDING_SECONDS = .55;
const fract = value => value - Math.floor(value);
const seed = i => fract(Math.sin((i + 1) * 127.1) * 43758.5453);
export function snowParticleCount(width, height) { return Math.min(LIMIT, Math.max(80, Math.round(width * height / 1800))); }
export class BattleSnowRenderer {
  constructor() {
    this.particles = Array.from({ length: LIMIT }, (_, i) => ({ x: seed(i * 5), ground: seed(i * 5 + 1), phase: seed(i * 5 + 2), depth: seed(i * 5 + 3), sway: seed(i * 5 + 4) }));
    this.lastTime = -Infinity; this.signature = ''; this.frames = 0; this.destroyed = false; this.stats = { flakes: 0, landings: 0 };
  }
  draw(context, timestamp, { width, height, pixelRatio = 1, environment = 'grass', motion = true }) {
    if (this.destroyed || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return false;
    const time = Number.isFinite(timestamp) ? Math.max(0, timestamp) : 0;
    const signature = `${width}:${height}:${pixelRatio}:${environment}:${motion}`;
    if (signature === this.signature && (!motion || time >= this.lastTime && time - this.lastTime < FRAME_MS)) return false;
    this.signature = signature; this.lastTime = time; this.frames++;
    // Bound the clock even during a long session; each particle has its own cycle.
    const seconds = motion ? time / 1000 : 0, c = context;
    const groundTop = rainGroundTop(width, height, environment), count = snowParticleCount(width, height);
    this.stats = { count, flakes: 0, landings: 0, groundTop };
    c.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0); c.clearRect(0, 0, width, height);
    c.lineCap = 'round';
    for (let i = 0; i < count; i++) {
      const p = this.particles[i], depth = p.depth;
      const radius = .65 + depth * depth * 2.15, speed = 20 + depth * 35;
      const groundY = groundTop + p.ground * Math.max(0, height - groundTop - 4);
      const fallTime = (groundY + 8) / speed, period = fallTime + LANDING_SECONDS;
      const clock = seconds + p.phase * period, cycle = Math.floor(clock / period), age = clock - cycle * period;
      const groundX = fract(p.x + cycle * .61803398875) * width;
      const opacity = .42 + depth * .48;
      if (age < fallTime) {
        const y = -8 + age * speed, remaining = groundY - y;
        const wave = (Math.sin(age * (.7 + p.sway) + p.phase * 6.28) - Math.sin(fallTime * (.7 + p.sway) + p.phase * 6.28)) * (2 + depth * 6);
        const x = fract((groundX - remaining * (.08 + p.sway * .08) + wave + 6) / (width + 12)) * (width + 12) - 6;
        const fade = Math.min(1, Math.max(0, (y + 8) / 18), Math.max(0, remaining / 12));
        // A cool, narrow edge keeps the small white centre legible on pale scenery.
        c.fillStyle = `rgba(125,167,194,${opacity * fade * .48})`;
        c.beginPath(); c.arc(x, y, radius + .45, 0, Math.PI * 2); c.fill();
        c.fillStyle = `rgba(246,252,255,${opacity * fade})`;
        c.beginPath(); c.arc(x, y, radius, 0, Math.PI * 2); c.fill();
        if (depth > .82) {
          c.lineWidth = .65; c.strokeStyle = `rgba(255,255,255,${opacity * fade * .8})`;
          const angle = age * .3 + p.phase * 6.28, arm = radius + 1.2;
          c.beginPath();
          for (let armIndex = 0; armIndex < 3; armIndex++) {
            const theta = angle + armIndex * Math.PI / 3, dx = Math.cos(theta) * arm, dy = Math.sin(theta) * arm;
            c.moveTo(x - dx, y - dy); c.lineTo(x + dx, y + dy);
          }
          c.stroke();
        }
        this.stats.flakes++;
      } else if (motion) {
        const progress = (age - fallTime) / LANDING_SECONDS, perspective = .4 + p.ground * .6;
        c.fillStyle = `rgba(230,245,253,${(1 - progress) * .32 * opacity})`;
        c.beginPath(); c.ellipse(groundX, groundY, (radius + progress * 1.4) * perspective, .45 * perspective, 0, 0, Math.PI * 2); c.fill();
        this.stats.landings++;
      }
    }
    return true;
  }
  reset() { this.lastTime = -Infinity; this.signature = ''; }
  destroy() { this.destroyed = true; this.particles = []; this.reset(); }
}
