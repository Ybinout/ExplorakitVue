// Short drops land on the battlefield and become tiny, perspective-scaled impacts.
const FRAME_MS = 1000 / 30, LIMIT = 128, IMPACT_SECONDS = .22;
const fract = value => value - Math.floor(value);
function seed(index) { return fract(Math.sin((index + 1) * 127.1) * 43758.5453); }
export function rainGroundTop(width, height, environment = 'grass') {
  return height * (environment === 'cave' ? .36 : environment === 'colosseum' ? .43 : width < height ? .36 : .44);
}
export function rainParticleCount(width, height) { return Math.min(LIMIT, Math.max(32, Math.round(width * height / 4300))); }
export class BattleRainRenderer {
  constructor() {
    this.particles = Array.from({ length: LIMIT }, (_, i) => ({ x: seed(i * 4), ground: seed(i * 4 + 1), phase: seed(i * 4 + 2), depth: seed(i * 4 + 3) }));
    this.lastTime = -Infinity; this.signature = ''; this.frames = 0; this.destroyed = false; this.stats = { drops: 0, impacts: 0 };
  }
  draw(context, timestamp, { width, height, pixelRatio = 1, environment = 'grass', motion = true }) {
    if (this.destroyed || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return false;
    const time = Number.isFinite(timestamp) ? Math.max(0, timestamp) : 0, signature = `${width}:${height}:${pixelRatio}:${environment}:${motion}`;
    if (signature === this.signature && (!motion || time >= this.lastTime && time - this.lastTime < FRAME_MS)) return false;
    this.signature = signature; this.lastTime = time; this.frames++;
    const c = context, seconds = motion ? time / 1000 : 0, groundTop = rainGroundTop(width, height, environment);
    const count = rainParticleCount(width, height); this.stats = { drops: 0, impacts: 0, groundTop, count };
    c.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0); c.clearRect(0, 0, width, height); c.lineCap = 'round';
    for (let i = 0; i < count; i++) {
      const p = this.particles[i], groundY = groundTop + p.ground * Math.max(0, height - groundTop - 3);
      const perspective = .5 + .5 * p.ground, length = 4 + p.depth * 5, speed = 205 + p.depth * 100;
      const fallTime = (groundY + length) / speed, period = fallTime + IMPACT_SECONDS;
      const clock = seconds + p.phase * period, cycle = Math.floor(clock / period), age = clock - cycle * period;
      const groundX = fract(p.x + cycle * .61803398875) * (width + 24) - 12, lean = .11 + .035 * p.depth;
      if (age < fallTime) {
        const y = -length + age * speed, x = groundX - (groundY - y) * lean;
        c.lineWidth = .55 + p.depth * .4; c.strokeStyle = `rgba(194,220,232,${.21 + p.depth * .24})`;
        c.beginPath(); c.moveTo(x - length * lean, y - length); c.lineTo(x, y); c.stroke(); this.stats.drops++;
      } else if (motion) {
        const progress = (age - fallTime) / IMPACT_SECONDS, spread = (.65 + progress * 2.6) * perspective;
        c.lineWidth = .65; c.strokeStyle = `rgba(202,225,231,${(1 - progress) * .5})`;
        c.beginPath(); c.ellipse(groundX, groundY, spread, spread * .32, 0, 0, Math.PI * 2); c.stroke();
        if (progress < .55) {
          const lift = Math.sin(progress / .55 * Math.PI) * 1.9 * perspective;
          c.beginPath(); c.moveTo(groundX - spread * .45, groundY - lift); c.lineTo(groundX - spread * .8, groundY - lift - .7);
          c.moveTo(groundX + spread * .45, groundY - lift); c.lineTo(groundX + spread * .8, groundY - lift - .7); c.stroke();
        }
        this.stats.impacts++;
      }
    }
    return true;
  }
  reset() { this.lastTime = -Infinity; this.signature = ''; }
  destroy() { this.destroyed = true; this.particles = []; this.reset(); }
}
