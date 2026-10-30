import trees from '../data/windTrees.js';
import { PixelUploadPatch } from './pixelUploadPatch.js';
// Warp leaf colours inside their original silhouettes: no moved shadows, trunks,
// roofs, alpha edges or rectangular cutouts, even across separate baked layers.
const WIDTH = 896, HEIGHT = 640, SOURCE_WIDTH = 448, SOURCE_HEIGHT = 320, FRAME_MS = 1000 / 30;
const CROWNS = [{ left: 43, right: 112, top: 130, bottom: 176 }, { left: 144, right: 210, top: 130, bottom: 176 }];
const boundedWind = value => Math.max(0, Math.min(3, Math.round(Number(value) || 0)));
export function foliagePose(timestamp, wind, index = 0) {
  const strength = boundedWind(wind), time = (Number.isFinite(timestamp) ? Math.max(0, timestamp) : 0) / 1000;
  if (!strength) return { x: 0, y: 0, angle: 0 };
  const phase = index * .85, gust = .7 + .3 * Math.sin(time * .75);
  const sway = Math.sin(time * 1.65 + phase) * .75 + Math.sin(time * 2.9 + phase) * .25;
  return { x: strength * 2 * sway * gust, y: strength * .38 * Math.sin(time * 1.15 + phase), angle: 0 };
}
export function hasWindTrees(map, layer = 'foreground') { return map === 'start' && layer === 'foreground' || Boolean(trees[map]?.[layer]); }
export function treeLeafMask(data, map = 'start', layer = 'foreground') {
  const owners = new Uint16Array(SOURCE_WIDTH * SOURCE_HEIGHT), pixels = [];
  const profile = trees[map]?.[layer], crowns = map === 'start' && layer === 'foreground' ? CROWNS : profile?.crowns || [];
  const snow = ['route13','route14','ville5'].includes(map);
  const leaf = index => {
    const i=index*4,r=data[i],g=data[i+1],b=data[i+2];
    return data[i+3]===255 && (g>r+5 && g>b+5 || snow && r>140 && g>150 && b>130 && Math.max(r,g,b)-Math.min(r,g,b)<65);
  };
  const mark = (x,y,owner) => { if(x<0||y<0||x>=SOURCE_WIDTH||y>=SOURCE_HEIGHT)return;const index=y*SOURCE_WIDTH+x;if(!owners[index]&&leaf(index)){owners[index]=owner+1;pixels.push(index);} };
  if(map==='start'&&layer==='foreground')crowns.forEach((rect,owner)=>{for(let y=rect.top;y<rect.bottom;y++)for(let x=rect.left;x<rect.right;x++)mark(x,y,owner);});
  else for(const[cell,owner]of profile?.cells||[]){const left=cell%28*16,top=Math.floor(cell/28)*16;for(let y=top;y<top+16;y++)for(let x=left;x<left+16;x++)mark(x,y,owner);}
  return { owners, pixels: Uint32Array.from(pixels), crowns };
}
export const villageLeafMask = data => treeLeafMask(data);
export class ForegroundWindRenderer {
  constructor(createCanvas = () => document.createElement('canvas')) {
    this.createCanvas = createCanvas; this.frames = 0; this.destroyed = false;
    this.canvas = null; this.source = null; this.lastTime = -Infinity; this.wind = null;
  }
  prepare(image, map, layer) {
    this.suspend();
    try {
      this.canvas = this.createCanvas(); this.canvas.width = SOURCE_WIDTH; this.canvas.height = SOURCE_HEIGHT;
      this.context = this.canvas.getContext('2d'); if (!this.context) throw Error('Canvas 2D unavailable');
      this.context.imageSmoothingEnabled = false; this.context.drawImage(image, 0, 0, SOURCE_WIDTH, SOURCE_HEIGHT);
      // Read pixels on a disposable CPU surface, never on the animated GPU
      // canvas. Only the small leaf patch crosses from CPU to GPU each tick.
      const reader = this.createCanvas(); reader.width = SOURCE_WIDTH; reader.height = SOURCE_HEIGHT;
      let original;
      try {
        const c = reader.getContext('2d', { willReadFrequently: true });
        if (!c) throw Error('Canvas 2D unavailable');
        c.imageSmoothingEnabled = false; c.drawImage(image, 0, 0, SOURCE_WIDTH, SOURCE_HEIGHT);
        original = c.getImageData(0, 0, SOURCE_WIDTH, SOURCE_HEIGHT);
      } finally { reader.width = reader.height = 0; }
      this.original = new Uint32Array(original.data.buffer);
      this.frame = this.context.createImageData(SOURCE_WIDTH, SOURCE_HEIGHT); this.output = new Uint32Array(this.frame.data.buffer);
      // Background is an opaque leaf-only overlay, preserving the lake renderer
      // and original map already painted below. Foreground keeps its full RGBA.
      if(layer!=='background')this.output.set(this.original);
      this.mask = treeLeafMask(original.data,map,layer); this.source = image; this.map=map;this.layer=layer;
      if (layer === 'background') this.context.clearRect(0, 0, SOURCE_WIDTH, SOURCE_HEIGHT);
      const rows = new Map();
      for (const index of this.mask.pixels) {
        const owner = this.mask.owners[index], y = Math.floor(index / SOURCE_WIDTH), key = owner * SOURCE_HEIGHT + y;
        if (!rows.has(key)) {
          const rect = this.mask.crowns[owner - 1];
          rows.set(key, { owner, y, flex: .35 + .65 * (rect.bottom - y) / (rect.bottom - rect.top), indices: [], xs: [] });
        }
        rows.get(key).indices.push(index); rows.get(key).xs.push(index % SOURCE_WIDTH);
      }
      this.rows = [...rows.values()].map(row => ({...row, indices: Uint32Array.from(row.indices), xs: Uint16Array.from(row.xs)}));
      this.patch = new PixelUploadPatch(this.createCanvas, SOURCE_WIDTH, this.mask.pixels, SOURCE_HEIGHT);
    } catch (_) { this.suspend(); }
  }
  draw(target, image, timestamp, wind, motion = true, map = 'start', layer = 'foreground') {
    if (this.destroyed) return;
    const strength = boundedWind(wind), time = Number.isFinite(timestamp) ? Math.max(0, timestamp) : 0;
    const fallback = () => { if(layer!=='background')target.drawImage(image,0,0,WIDTH,HEIGHT); };
    if (!strength || !motion || !hasWindTrees(map,layer)) { this.suspend(); fallback(); return; }
    if (this.source !== image || this.map!==map || this.layer!==layer || !this.canvas) this.prepare(image,map,layer);
    if (!this.canvas) { fallback(); return; }
    if (this.wind !== strength || time - this.lastTime >= FRAME_MS || time < this.lastTime) {
      this.wind = strength; this.lastTime = time;
      const poses = this.mask.crowns.map((_, index) => foliagePose(time, strength, index + 1));
      for (const row of this.rows) {
        const pose = poses[row.owner - 1], shift = pose.x * row.flex / 2;
        const sy = Math.round(row.y - pose.y / 2), sourceRow = sy * SOURCE_WIDTH;
        for (let i = 0; i < row.indices.length; i++) {
          const index = row.indices[i], sx = Math.round(row.xs[i] - shift), sample = sourceRow + sx;
          this.output[index] = sx>=0&&sx<SOURCE_WIDTH&&sy>=0&&sy<SOURCE_HEIGHT&&this.mask.owners[sample]===row.owner ? this.original[sample] : this.original[index];
        }
      }
      this.patch.upload(this.frame, this.context);
      this.patch.draw(this.context);
      this.frames++;
    }
    target.drawImage(this.canvas, 0, 0, WIDTH, HEIGHT);
  }
  suspend() {
    this.patch?.destroy(); this.patch = null; this.rows = null;
    if (this.canvas) { this.canvas.width = 0; this.canvas.height = 0; }
    this.canvas = null; this.context = null; this.source = null; this.frame = null; this.original = null; this.output = null; this.mask = null; this.map=null;this.layer=null;this.lastTime = -Infinity; this.wind = null;
  }
  destroy() { this.suspend(); this.destroyed = true; }
}
