// A one-pixel current inside each mapped lake, never across its shoreline.
const WIDTH = 448, HEIGHT = 320, FRAME_MS = 1000 / 15;
const LAKES = {
  start: { bounds: { left: 54, right: 149, top: 245, bottom: 320 }, colors: ['81,145,177', '56,109,139', '53,87,100', '95,164,201'] },
  route3: { bounds: { left: 248, right: 360, top: 244, bottom: 320 }, colors: ['81,145,177', '56,109,139', '53,87,100', '95,164,201'] },
  ville1: { bounds: { left: 245, right: 412, top: 24, bottom: 144 }, colors: ['48,176,240', '64,184,240', '48,144,232', '48,160,232', '72,200,240'] },
};
export function hasVillageWater(map) { return Object.prototype.hasOwnProperty.call(LAKES, map); }
export function villageWaterMask(data, map = 'start') {
  const profile = hasVillageWater(map) ? LAKES[map] : null;
  if (!profile) return { interior: new Uint8Array(WIDTH * HEIGHT), pixels: new Uint32Array(0) };
  const POND = profile.bounds, WATER = new Set(profile.colors);
  const water = new Uint8Array(WIDTH * HEIGHT), interior = new Uint8Array(WIDTH * HEIGHT), pixels = [];
  for (let y = POND.top; y < POND.bottom; y++) for (let x = POND.left; x < POND.right; x++) {
    const index = y * WIDTH + x, i = index * 4;
    if (data[i + 3] === 255 && WATER.has(`${data[i]},${data[i + 1]},${data[i + 2]}`)) water[index] = 1;
  }
  // Leave a fixed one-pixel margin around banks, rocks, highlights and plants.
  for (let y = POND.top + 1; y < POND.bottom - 1; y++) for (let x = POND.left + 1; x < POND.right - 1; x++) {
    const index = y * WIDTH + x;
    if ([-WIDTH - 1, -WIDTH, -WIDTH + 1, -1, 0, 1, WIDTH - 1, WIDTH, WIDTH + 1].every(offset => water[index + offset])) {
      interior[index] = 1; pixels.push(index);
    }
  }
  return { interior, pixels: Uint32Array.from(pixels) };
}
export class VillageWaterRenderer {
  constructor(createCanvas = () => document.createElement('canvas')) {
    this.createCanvas = createCanvas; this.frames = 0; this.destroyed = false;
    this.canvas = null; this.source = null; this.lastTime = -Infinity;
  }
  prepare(image, map) {
    this.suspend();
    try {
      this.canvas = this.createCanvas(); this.canvas.width = WIDTH; this.canvas.height = HEIGHT;
      this.context = this.canvas.getContext('2d'); if (!this.context) throw Error('Canvas 2D unavailable');
      this.context.imageSmoothingEnabled = false; this.context.drawImage(image, 0, 0, WIDTH, HEIGHT);
      const original = this.context.getImageData(0, 0, WIDTH, HEIGHT);
      this.original = new Uint32Array(original.data.buffer);
      this.colors = original.data;
      this.frame = this.context.createImageData(WIDTH, HEIGHT); this.output = new Uint32Array(this.frame.data.buffer); this.output.set(this.original);
      this.mask = villageWaterMask(original.data, map); this.source = image; this.map = map;
    } catch (_) { this.suspend(); }
  }
  draw(target, image, timestamp, motion = true, map = 'start') {
    if (this.destroyed) return;
    if (!motion || !hasVillageWater(map)) { this.suspend(); target.drawImage(image, 0, 0, WIDTH * 2, HEIGHT * 2); return; }
    if (this.source !== image || this.map !== map || !this.canvas) this.prepare(image, map);
    if (!this.canvas) { target.drawImage(image, 0, 0, WIDTH * 2, HEIGHT * 2); return; }
    const time = Number.isFinite(timestamp) ? Math.max(0, timestamp) : 0;
    if (time < this.lastTime || time - this.lastTime >= FRAME_MS) {
      this.lastTime = time;
      const seconds = time / 1000;
      for (const index of this.mask.pixels) {
        const x = index % WIDTH, y = Math.floor(index / WIDTH);
        const offset = Math.round(Math.sin(y * .24 + seconds * .8) * .75 + Math.sin(x * .13 + seconds * .5) * .2);
        const sample = this.mask.interior[index + offset] ? index + offset : index;
        this.output[index] = this.original[sample];
        // Faint travelling glints, retaining the original water palette and alpha.
        const glint = Math.max(0, Math.sin(x * .22 + y * .7 - seconds * .9) - .94) * .9;
        if (glint) for (let channel = 0; channel < 3; channel++) {
          const value = this.colors[sample * 4 + channel];
          this.frame.data[index * 4 + channel] = Math.round(value + (220 - value) * glint);
        }
      }
      const POND = LAKES[map].bounds;
      this.context.putImageData(this.frame, 0, 0, POND.left, POND.top, POND.right - POND.left, POND.bottom - POND.top);
      this.frames++;
    }
    target.drawImage(this.canvas, 0, 0, WIDTH * 2, HEIGHT * 2);
  }
  suspend() {
    if (this.canvas) { this.canvas.width = 0; this.canvas.height = 0; }
    this.canvas = null; this.context = null; this.source = null; this.map = null; this.colors = null;
    this.original = null; this.frame = null; this.output = null; this.mask = null; this.lastTime = -Infinity;
  }
  destroy() { this.suspend(); this.destroyed = true; }
}
