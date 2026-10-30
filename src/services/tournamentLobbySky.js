export const TOURNAMENT_LOBBY_MAP = 'super_tournament_lobby';

// Coordinates follow the 448 × 320 artwork. Stay inside the glass and above
// the distant island/arena silhouette: none of the room itself is repainted.
export const TOURNAMENT_SKY_PANES = [
  [[76,26],[80,21],[126,21],[130,26],[130,43],[125,43],[125,38],[120,38],[119,35],[111,35],[108,37],[105,37],[103,40],[98,43],[76,43]],
  [[168,27],[173,21],[277,21],[280,27],[280,43],[272,43],[269,39],[267,39],[267,34],[263,34],[263,29],[259,29],[259,36],[254,36],[254,32],[249,32],[249,27],[244,27],[244,23],[239,23],[239,32],[236,32],[236,30],[215,30],[215,32],[211,32],[211,24],[207,24],[207,28],[205,28],[205,33],[201,33],[201,31],[198,31],[198,35],[195,35],[195,32],[191,32],[191,37],[187,37],[187,33],[183,33],[183,39],[179,39],[178,43],[168,43]],
  [[317,27],[323,21],[341,21],[341,43],[317,43]],
];
const PATCH = { x: 75, y: 20, width: 267, height: 24 };
const mod = (value, period) => ((value % period) + period) % period;
const CLOUDS = [
  { x: 5, y: 22, size: .65, speed: .7 },
  { x: 69, y: 29, size: .85, speed: .95 },
  { x: 144, y: 20, size: .7, speed: .7 },
  { x: 213, y: 31, size: .65, speed: .95 },
  { x: 252, y: 23, size: 1, speed: 1.4 },
];
const FLOCKS = [
  { offset: .12, y: 29, count: 3, direction: 1, size: 1 },
  { offset: .48, y: 25, count: 2, direction: -1, size: .7 },
  { offset: .72, y: 36, count: 3, direction: 1, size: .8 },
  { offset: .9, y: 31, count: 2, direction: -1, size: .9 },
];

function bird(c, x, y, size, flap) {
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.scale(size, size);
  const wing = flap > .3 ? -2 : flap < -.3 ? 1 : -1;
  c.fillStyle = '#385c78';
  c.fillRect(-1, 0, 3, 1);
  c.fillRect(-3, wing, 2, 1); c.fillRect(2, wing, 2, 1);
  c.fillRect(-4, wing + (wing < 0 ? -1 : 1), 1, 1);
  c.fillRect(4, wing + (wing < 0 ? -1 : 1), 1, 1);
  c.fillStyle = '#f4fbff';
  c.fillRect(-2, wing - 1, 2, 1); c.fillRect(1, wing - 1, 2, 1);
  c.fillRect(0, 0, 1, 1);
  c.restore();
}

export class TournamentLobbySkyRenderer {
  constructor(createCanvas = () => document.createElement('canvas')) {
    this.createCanvas = createCanvas;
    this.frames = 0;
    this.suspend();
  }
  surface() {
    const canvas = this.createCanvas();
    canvas.width = PATCH.width * 2; canvas.height = PATCH.height * 2;
    return canvas;
  }
  prepare(source) {
    this.suspend();
    try {
      this.source = source;
      this.canvas = this.surface();
      this.context = this.canvas.getContext('2d');
      this.context.imageSmoothingEnabled = false;
      this.mask = this.surface();
      const c = this.mask.getContext('2d', { willReadFrequently: true });
      c.imageSmoothingEnabled = false;
      c.drawImage(source, PATCH.x * source.naturalWidth / 448, PATCH.y * source.naturalHeight / 320,
        PATCH.width * source.naturalWidth / 448, PATCH.height * source.naturalHeight / 320,
        0, 0, this.mask.width, this.mask.height);
      const sample = c.getImageData(0, 0, this.mask.width, this.mask.height);
      c.clearRect(0, 0, this.mask.width, this.mask.height);
      c.save();
      c.setTransform(2, 0, 0, 2, -PATCH.x * 2, -PATCH.y * 2);
      c.fillStyle = '#fff';
      for (const pane of TOURNAMENT_SKY_PANES) {
        c.beginPath(); pane.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
        c.closePath(); c.fill();
      }
      c.restore();
      const mask = c.getImageData(0, 0, this.mask.width, this.mask.height);
      this.skyPixels = 0;
      for (let i = 0; i < mask.data.length; i += 4) {
        const r = sample.data[i], g = sample.data[i + 1], b = sample.data[i + 2];
        const sky = (g > 135 && b > 180 && b > g + 8 && g > r + 13)
          || (r > 185 && g > 215 && b > 225 && g >= r && b >= g);
        mask.data[i + 3] = mask.data[i + 3] === 255 && sky ? 255 : 0;
        if (mask.data[i + 3]) this.skyPixels++;
      }
      c.putImageData(mask, 0, 0);
      // Reuse the actual artwork's cloud shapes and shading, sampled once.
      this.cloudTextures = [[100,21,29,13],[260,26,19,15],[168,31,19,10]].map(([left,top,width,height]) => {
        const texture = this.createCanvas(); texture.width = width * 2; texture.height = height * 2;
        const tc = texture.getContext('2d'), pixels = tc.createImageData(texture.width, texture.height);
        for (let y = 0; y < texture.height; y++) for (let x = 0; x < texture.width; x++) {
          const i = (((top - PATCH.y) * 2 + y) * this.mask.width + (left - PATCH.x) * 2 + x) * 4;
          const r = sample.data[i], g = sample.data[i + 1], b = sample.data[i + 2];
          if (mask.data[i + 3] && r > 140 && g > 175 && b > 185 && g - r < 65 && b - g < 45) {
            const j = (y * texture.width + x) * 4;
            pixels.data[j] = r; pixels.data[j + 1] = g; pixels.data[j + 2] = b; pixels.data[j + 3] = 255;
          }
        }
        tc.putImageData(pixels, 0, 0); return texture;
      });
      this.skyGradient = this.context.createLinearGradient(0, 0, 0, this.canvas.height);
      this.skyGradient.addColorStop(0, '#62bcf3');
      this.skyGradient.addColorStop(1, '#9bdcf8');
    } catch (_) { this.suspend(); } // Fail closed if an image cannot be sampled.
  }
  draw(target, source, timestamp, motion = true) {
    if (!motion || !source?.complete || !source.naturalWidth) return;
    if (this.source !== source || !this.canvas) this.prepare(source);
    if (!this.context || !this.skyPixels) return;
    const time = Number.isFinite(timestamp) ? Math.max(0, timestamp) : 0;
    if (this.lastTime === -Infinity || time < this.lastTime || time - this.lastTime >= 50) {
      this.paint(time); this.lastTime = time; this.frames++;
    }
    target.drawImage(this.canvas, PATCH.x * 2, PATCH.y * 2);
  }
  paint(time) {
    const c = this.context, t = time / 1000;
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.fillStyle = this.skyGradient; c.fillRect(0, 0, this.canvas.width, this.canvas.height);
    c.save();
    c.setTransform(2, 0, 0, 2, -PATCH.x * 2, -PATCH.y * 2);
    for (const [index, entry] of CLOUDS.entries()) {
      const x = PATCH.x - 40 + mod(entry.x + t * entry.speed, PATCH.width + 80);
      const texture = this.cloudTextures[index % this.cloudTextures.length];
      c.drawImage(texture, Math.round(x), entry.y, texture.width * entry.size / 2, texture.height * entry.size / 2);
    }
    for (const [index, flock] of FLOCKS.entries()) {
      const progress = mod(t / (34 + index * 4) + flock.offset, 1);
      const base = flock.direction > 0 ? 64 + progress * 294 : 358 - progress * 294;
      for (let n = 0; n < flock.count; n++) {
        bird(c, base - n * 8 * flock.direction,
          flock.y + n * 1.6 + Math.sin(t * .7 + n + index) * .8,
          flock.size, Math.sin(t * 7 + n * 1.1 + index));
      }
    }
    c.restore();
    c.save(); c.globalCompositeOperation = 'destination-in'; c.drawImage(this.mask, 0, 0); c.restore();
  }
  suspend() {
    for (const texture of this.cloudTextures || []) texture.width = texture.height = 0;
    this.cloudTextures = [];
    for (const key of ['canvas', 'mask']) {
      if (this[key]) this[key].width = this[key].height = 0;
      this[key] = null;
    }
    this.source = this.context = this.skyGradient = null;
    this.skyPixels = 0; this.lastTime = -Infinity;
  }
}
