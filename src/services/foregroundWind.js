// Starting-village artwork stays intact. Only its foliage moves, in world space.
const WIDTH = 896, HEIGHT = 640, FRAME_MS = 1000 / 30;
// Source artwork is 448×320. These boxes enclose the two foreground crowns
// and the fixed roof, including their transparent margins.
const TREES = [{ x: 86, y: 252, width: 138, height: 114 }, { x: 288, y: 252, width: 132, height: 114 }];
const ROOF = { x: 652, y: 320, width: 236, height: 110 };
const boundedWind = value => Math.max(0, Math.min(3, Math.round(Number(value) || 0)));
export function foliagePose(timestamp, wind, index = 0) {
  const strength = boundedWind(wind), time = (Number.isFinite(timestamp) ? Math.max(0, timestamp) : 0) / 1000;
  if (!strength) return { x: 0, y: 0, angle: 0 };
  const phase = index * .85, gust = .72 + .28 * Math.sin(time * .7);
  const sway = Math.sin(time * 1.65 + phase) * .75 + Math.sin(time * 2.9 + phase) * .25;
  return { x: strength * .85 * sway * gust, y: strength * .18 * Math.sin(time * 1.15 + phase), angle: strength * .0035 * sway * gust };
}
export class ForegroundWindRenderer {
  constructor(createCanvas = () => document.createElement('canvas')) {
    this.createCanvas = createCanvas; this.frames = 0; this.destroyed = false;
    this.canvas = null; this.layers = []; this.source = null; this.lastTime = -Infinity; this.wind = null;
  }
  surface(width, height) { const canvas = this.createCanvas(); canvas.width = width; canvas.height = height; const context = canvas.getContext('2d'); if (!context) throw Error('Canvas 2D unavailable'); context.imageSmoothingEnabled = false; return { canvas, context }; }
  prepare(image) {
    this.suspend(); this.source = image;
    try {
      const output = this.surface(WIDTH, HEIGHT); this.canvas = output.canvas; this.context = output.context;
      const leaves = this.surface(WIDTH, HEIGHT); this.layers.push(leaves); leaves.context.drawImage(image, 0, 0, WIDTH, HEIGHT);
      for (const rect of [ROOF, ...TREES]) {
        const layer = this.surface(rect.width, rect.height); this.layers.push({ ...layer, ...rect });
        layer.context.drawImage(image, rect.x * image.naturalWidth / WIDTH, rect.y * image.naturalHeight / HEIGHT, rect.width * image.naturalWidth / WIDTH, rect.height * image.naturalHeight / HEIGHT, 0, 0, rect.width, rect.height);
        leaves.context.clearRect(rect.x, rect.y, rect.width, rect.height);
      }
    } catch (_) { this.suspend(); }
  }
  draw(target, image, timestamp, wind, motion = true) {
    if (this.destroyed) return;
    const strength = boundedWind(wind), time = Number.isFinite(timestamp) ? Math.max(0, timestamp) : 0;
    if (!strength || !motion) { this.suspend(); target.drawImage(image, 0, 0, WIDTH, HEIGHT); return; }
    if (this.source !== image || !this.canvas) this.prepare(image);
    if (!this.canvas) { target.drawImage(image, 0, 0, WIDTH, HEIGHT); return; }
    if (this.wind !== strength || time - this.lastTime >= FRAME_MS || time < this.lastTime) {
      this.wind = strength; this.lastTime = time; const c = this.context; c.clearRect(0, 0, WIDTH, HEIGHT);
      const pose = foliagePose(time, strength); c.save(); c.translate(pose.x, pose.y); c.drawImage(this.layers[0].canvas, 0, 0); c.restore();
      for (let i = 0; i < TREES.length; i++) {
        const tree = this.layers[i + 2], pose = foliagePose(time, strength, i + 1);
        // The foot stays fixed: each crown pivots independently around its base.
        c.save(); c.translate(tree.x + tree.width / 2, tree.y + tree.height); c.rotate(pose.angle); c.drawImage(tree.canvas, -tree.width / 2, -tree.height); c.restore();
      }
      const roof = this.layers[1]; c.drawImage(roof.canvas, roof.x, roof.y);
      this.frames++;
    }
    target.drawImage(this.canvas, 0, 0, WIDTH, HEIGHT);
  }
  suspend() {
    for (const layer of this.layers) { layer.canvas.width = 0; layer.canvas.height = 0; }
    if (this.canvas) { this.canvas.width = 0; this.canvas.height = 0; }
    this.layers = []; this.canvas = null; this.context = null; this.source = null; this.lastTime = -Infinity; this.wind = null;
  }
  destroy() { this.suspend(); this.destroyed = true; }
}
