// Upload only the bounds of animated pixels, then replace that native region
// on a GPU-only surface. The final world still draws one coherent RGBA image.
export class PixelUploadPatch {
  constructor(createCanvas, sourceWidth, pixels, sourceHeight = sourceWidth) {
    let left = Infinity, top = Infinity, right = 0, bottom = 0;
    for (const index of pixels) {
      const x = index % sourceWidth, y = Math.floor(index / sourceWidth);
      left = Math.min(left, x); top = Math.min(top, y);
      right = Math.max(right, x + 1); bottom = Math.max(bottom, y + 1);
    }
    this.left = pixels.length ? left : 0; this.top = pixels.length ? top : 0;
    this.width = pixels.length ? right - left : 1; this.height = pixels.length ? bottom - top : 1;
    this.empty = !pixels.length;
    // A large patch saves little bandwidth and adds a GPU copy. Upload it
    // directly; keep the cropped path for genuinely local animated regions.
    this.direct = this.width * this.height > sourceWidth * sourceHeight / 2;
    if (this.empty || this.direct) return;
    this.canvas = createCanvas(); this.canvas.width = this.width; this.canvas.height = this.height;
    try {
      this.context = this.canvas.getContext('2d');
      if (!this.context) throw Error('Canvas 2D unavailable');
    } catch (error) { this.destroy(); throw error; }
  }
  upload(frame, target) {
    if (this.direct) { target.putImageData(frame, 0, 0); return; }
    if (!this.empty) this.context.putImageData(frame, -this.left, -this.top, this.left, this.top, this.width, this.height);
  }
  draw(target) {
    if (this.empty || this.direct) return;
    // Clear before replacement: source-over would otherwise accumulate alpha
    // on unchanged translucent pixels inside the rectangular patch bounds.
    target.clearRect(this.left, this.top, this.width, this.height);
    target.drawImage(this.canvas, this.left, this.top);
  }
  destroy() {
    if (this.canvas) this.canvas.width = this.canvas.height = 0;
    this.canvas = this.context = null;
  }
}
