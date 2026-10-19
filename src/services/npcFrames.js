import atlas from '../data/townspeopleFrames.json';
// The generated atlas has unequal row gutters. Grid division included neighbours'
// feet. Explicit source rectangles are shared by world sprites and dialogue portraits.
export function npcFrame(image, frame) {
  if (String(image.src).includes('townspeople-pixel-v2') && frame.columns === 8 && frame.rows === 4) {
    const box = atlas.frames[frame.index];
    if (box) return { ...box, extent:32 };
  }
  const w = image.naturalWidth / frame.columns, h = image.naturalHeight / frame.rows;
  return { x:(frame.index % frame.columns)*w, y:Math.floor(frame.index/frame.columns)*h, w, h, extent:Math.max(w,h) };
}
export function drawNpcFrame(context, image, frame, x, y, size) {
  const box = npcFrame(image, frame), scale = size / box.extent;
  context.imageSmoothingEnabled = false;
  context.drawImage(image, box.x, box.y, box.w, box.h,
    x + (size - box.w*scale)/2, y + size - box.h*scale, box.w*scale, box.h*scale);
}
