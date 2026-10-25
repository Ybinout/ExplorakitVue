import { WaterfallRenderer } from './waterfalls.js';
// Pixel currents stay inside each mapped lake, never across its shoreline.
const WIDTH = 448, HEIGHT = 320, FRAME_MS = 1000 / 15, CREST_COLOR = [190,235,255];
const LAKES = {
  ville1_arene: {
    bounds: { left: 29, right: 420, top: 68, bottom: 269 },
    regions: [{ left: 29, right: 100, top: 68, bottom: 269 }, { left: 348, right: 420, top: 68, bottom: 269 }],
    palette: 'mounir-basins', ripples: true,
  },
  ville_safe1: { bounds: { left: 36, right: 108, top: 183, bottom: 238 }, colors: ['48,176,240', '64,184,240', '48,144,232', '48,160,232', '72,200,240'], ripples: true },
  gen_ville5: { bounds: { left: 372, right: 412, top: 103, bottom: 142 }, colors: ['48,176,240', '64,184,240', '48,144,232', '48,160,232', '72,200,240'], ripples: true },
  start: { bounds: { left: 54, right: 149, top: 245, bottom: 320 }, colors: ['81,145,177', '56,109,139', '53,87,100', '95,164,201'] },
  route3: { bounds: { left: 248, right: 360, top: 244, bottom: 320 }, colors: ['81,145,177', '56,109,139', '53,87,100', '95,164,201'] },
  ville3: { bounds: { left: 176, right: 304, top: 98, bottom: 192 }, colors: ['48,176,240', '64,184,240', '48,144,232', '48,160,232', '72,200,240'] },
  ville1: { bounds: { left: 245, right: 412, top: 24, bottom: 144 }, colors: ['48,176,240', '64,184,240', '48,144,232', '48,160,232', '72,200,240'] },
};
export function hasVillageWater(map) { return Object.prototype.hasOwnProperty.call(LAKES, map); }
export function villageWaterMask(data, map = 'start') {
  const profile = hasVillageWater(map) ? LAKES[map] : null;
  if (!profile) return { interior: new Uint8Array(WIDTH * HEIGHT), pixels: new Uint32Array(0) };
  const POND = profile.bounds, WATER = new Set(profile.colors || []);
  const water = new Uint8Array(WIDTH * HEIGHT), interior = new Uint8Array(WIDTH * HEIGHT), pixels = [];
  for (let y = POND.top; y < POND.bottom; y++) for (let x = POND.left; x < POND.right; x++) {
    const index = y * WIDTH + x, i = index * 4;
    if (profile.regions && !profile.regions.some(r => x >= r.left && x < r.right && y >= r.top && y < r.bottom)) continue;
    // The painted arena has a broad cyan palette. Restrict it to its two
    // basins and reject blue stone, banners, lilies and bright crystal edges.
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const matches = profile.palette === 'mounir-basins'
      ? r < 100 && g > 75 && g < 195 && g - r > 55 && b >= g && b - g < 55
      : WATER.has(`${r},${g},${b}`);
    if (data[i + 3] === 255 && matches) water[index] = 1;
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
      this.rowCurrent = new Float64Array(HEIGHT); this.columnCurrent = new Float64Array(WIDTH);
      this.columnDrift = new Float64Array(WIDTH); this.columnWave = new Float64Array(WIDTH);
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
      const seconds = time / 1000, visibleRipples = map === 'ville1' || map === 'ville3' || LAKES[map].ripples;
      // These trigonometric terms depend on a row or column, not each water
      // pixel. Reuse them without approximating the wave or changing its phase.
      if (visibleRipples) {
        for(let y=0;y<HEIGHT;y++)this.rowCurrent[y]=Math.sin(y*.24+seconds*1.1)*1.6;
        for(let x=0;x<WIDTH;x++) {
          this.columnCurrent[x]=Math.sin(x*.13+seconds*.7)*.4;
          this.columnDrift[x]=Math.round(Math.sin(x*.09-seconds*.9)*.8)*WIDTH;
          this.columnWave[x]=Math.sin(x*.09+seconds*.5)*.4;
        }
      }
      for (const index of this.mask.pixels) {
        const x = index % WIDTH, y = Math.floor(index / WIDTH);
        const offset = visibleRipples
          ? Math.round(this.rowCurrent[y] + this.columnCurrent[x]) + this.columnDrift[x]
          : Math.round(Math.sin(y * .24 + seconds * .8) * .75 + Math.sin(x * .13 + seconds * .5) * .2);
        const sample = this.mask.interior[index + offset] ? index + offset : index;
        this.output[index] = this.original[sample];
        if (visibleRipples) {
          // Moving crests read even on flat blue water; troughs stay gentle.
          // Compose only masked RGB pixels, preserving rocks, shore and alpha.
          const wave = Math.sin(y * .56 + x * .12 - seconds * 1.8 + this.columnWave[x]);
          const crest = Math.max(0, (wave - .7) / .3) * .18;
          const trough = Math.max(0, (-wave - .85) / .15) * .035;
          for (let channel = 0; channel < 3; channel++) {
            const value = this.colors[sample * 4 + channel];
            this.frame.data[index * 4 + channel] = Math.round(value * (1 - trough) + (CREST_COLOR[channel] - value) * crest);
          }
          continue;
        }
        // Faint travelling glints on the other lakes keep their existing rhythm.
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
    if (map === 'ville1_arene') {
      this._waterfalls ||= new WaterfallRenderer(this.createCanvas);
      this._waterfalls.draw(target,image,time,'hall',motion,WIDTH*2,HEIGHT*2);
    }
  }
  suspend() {
    this._waterfalls?.destroy(); this._waterfalls=null;
    if (this.canvas) { this.canvas.width = 0; this.canvas.height = 0; }
    this.canvas = null; this.context = null; this.source = null; this.map = null; this.colors = null;
    this.rowCurrent = this.columnCurrent = this.columnDrift = this.columnWave = null;
    this.original = null; this.frame = null; this.output = null; this.mask = null; this.lastTime = -Infinity;
  }
  destroy() { this.suspend(); this.destroyed = true; }
}
