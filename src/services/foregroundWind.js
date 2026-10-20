// Only opaque green leaf pixels of the two village crowns may animate.
// Shadows, branches, roof, alpha and silhouettes always stay exactly in place.
const WIDTH = 896, HEIGHT = 640, SOURCE_WIDTH = 448, SOURCE_HEIGHT = 320, FRAME_MS = 1000 / 30;
const CROWNS = [{ left: 43, right: 112, top: 130, bottom: 176 }, { left: 144, right: 210, top: 130, bottom: 176 }];
const boundedWind = value => Math.max(0, Math.min(3, Math.round(Number(value) || 0)));
export function foliagePose(timestamp, wind, index = 0) {
  const strength = boundedWind(wind), time = (Number.isFinite(timestamp) ? Math.max(0, timestamp) : 0) / 1000;
  if (!strength) return { x: 0, y: 0, angle: 0 };
  const phase = index * .85, gust = .72 + .28 * Math.sin(time * .7);
  const sway = Math.sin(time * 1.65 + phase) * .75 + Math.sin(time * 2.9 + phase) * .25;
  return { x: strength * .85 * sway * gust, y: strength * .18 * Math.sin(time * 1.15 + phase), angle: 0 };
}
export function villageLeafMask(data) {
  const owners = new Uint8Array(SOURCE_WIDTH * SOURCE_HEIGHT), pixels = [];
  CROWNS.forEach((rect, tree) => {
    for (let y = rect.top; y < rect.bottom; y++) for (let x = rect.left; x < rect.right; x++) {
      const index = y * SOURCE_WIDTH + x, i = index * 4;
      // Gray foreground shadows and brown trunks are deliberately excluded.
      if (data[i + 3] === 255 && data[i + 1] > data[i] + 5 && data[i + 1] > data[i + 2] + 5) { owners[index] = tree + 1; pixels.push(index); }
    }
  });
  return { owners, pixels: Uint32Array.from(pixels) };
}
export class ForegroundWindRenderer {
  constructor(createCanvas = () => document.createElement('canvas')) {
    this.createCanvas = createCanvas; this.frames = 0; this.destroyed = false;
    this.canvas = null; this.source = null; this.lastTime = -Infinity; this.wind = null;
  }
  prepare(image) {
    this.suspend();
    try {
      this.canvas = this.createCanvas(); this.canvas.width = SOURCE_WIDTH; this.canvas.height = SOURCE_HEIGHT;
      this.context = this.canvas.getContext('2d'); if (!this.context) throw Error('Canvas 2D unavailable');
      this.context.imageSmoothingEnabled = false; this.context.drawImage(image, 0, 0, SOURCE_WIDTH, SOURCE_HEIGHT);
      const original = this.context.getImageData(0, 0, SOURCE_WIDTH, SOURCE_HEIGHT);
      this.original = new Uint32Array(original.data.buffer);
      this.frame = this.context.createImageData(SOURCE_WIDTH, SOURCE_HEIGHT); this.output = new Uint32Array(this.frame.data.buffer); this.output.set(this.original);
      this.mask = villageLeafMask(original.data); this.source = image;
    } catch (_) { this.suspend(); }
  }
  draw(target, image, timestamp, wind, motion = true) {
    if (this.destroyed) return;
    const strength = boundedWind(wind), time = Number.isFinite(timestamp) ? Math.max(0, timestamp) : 0;
    if (!strength || !motion) { this.suspend(); target.drawImage(image, 0, 0, WIDTH, HEIGHT); return; }
    if (this.source !== image || !this.canvas) this.prepare(image);
    if (!this.canvas) { target.drawImage(image, 0, 0, WIDTH, HEIGHT); return; }
    if (this.wind !== strength || time - this.lastTime >= FRAME_MS || time < this.lastTime) {
      this.wind = strength; this.lastTime = time;
      const poses = CROWNS.map((_, index) => foliagePose(time, strength, index + 1));
      for (const index of this.mask.pixels) {
        const owner = this.mask.owners[index], rect = CROWNS[owner - 1], pose = poses[owner - 1];
        const y = Math.floor(index / SOURCE_WIDTH), x = index % SOURCE_WIDTH;
        const flex = .45 + .55 * (rect.bottom - y) / (rect.bottom - rect.top);
        const sample = Math.round(y - pose.y / 2) * SOURCE_WIDTH + Math.round(x - pose.x * flex / 2);
        // Sample only other leaves from this crown: no holes, moved shadows,
        // rectangular cutouts, doubled edges or neighboring scenery.
        this.output[index] = this.mask.owners[sample] === owner ? this.original[sample] : this.original[index];
      }
      this.context.putImageData(this.frame, 0, 0, 43, 130, 167, 46);
      this.frames++;
    }
    target.drawImage(this.canvas, 0, 0, WIDTH, HEIGHT);
  }
  suspend() {
    if (this.canvas) { this.canvas.width = 0; this.canvas.height = 0; }
    this.canvas = null; this.context = null; this.source = null; this.frame = null; this.original = null; this.output = null; this.mask = null; this.lastTime = -Infinity; this.wind = null;
  }
  destroy() { this.suspend(); this.destroyed = true; }
}
