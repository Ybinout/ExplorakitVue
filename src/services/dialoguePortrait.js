// Dialogue illustrations use their own HD atlas, independently of world sprite crops.
export function dialoguePortraitRect(image, frame) {
  const { columns, rows, index } = frame || {};
  if (![columns, rows, index].every(Number.isInteger) || columns < 1 || rows < 1 || index < 0 || index >= columns * rows) return null;
  if (!(image.naturalWidth > 0 && image.naturalHeight > 0)) return null;
  const column = index % columns, row = Math.floor(index / columns);
  // Integer boundaries and a one-pixel gutter exclude adjacent portraits at fractional cell sizes.
  const x = Math.floor(column * image.naturalWidth / columns) + 1;
  const y = Math.floor(row * image.naturalHeight / rows) + 1;
  const right = Math.floor((column + 1) * image.naturalWidth / columns) - 1;
  const bottom = Math.floor((row + 1) * image.naturalHeight / rows) - 1;
  return right > x && bottom > y ? { x, y, w: right - x, h: bottom - y } : null;
}
export function drawDialoguePortrait(context, image, frame, width, height) {
  const box = dialoguePortraitRect(image, frame);
  if (!box) return false;
  const scale = Math.min(width / box.w, height / box.h), w = box.w * scale, h = box.h * scale;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, box.x, box.y, box.w, box.h, (width - w) / 2, height - h, w, h);
  return true;
}
