// Logical 448 × 320 coordinates shared by the two copper/stone halls.
export const SIDE_PILLARS = Object.freeze([
  [48, 81, 161], [81, 81, 161], [48, 174, 254], [81, 174, 254],
  [367, 81, 161], [400, 81, 161], [367, 174, 254], [400, 174, 254],
]);
// Warp only the interior material: keep the silhouette, base and adjacent
// architecture fixed, with no displaced rectangle or newly exposed background.
export function drawPillarTremor(c, source, [x, top, bottom], time, strength, phase = 0) {
  if (strength < .015) return;
  c.save(); c.beginPath();
  c.moveTo(x - 7, top + 3); c.lineTo(x + 7, top + 3); c.lineTo(x + 8, top + 12);
  c.lineTo(x + 5, top + 21); c.lineTo(x + 5, bottom - 16); c.lineTo(x - 5, bottom - 16);
  c.lineTo(x - 5, top + 21); c.lineTo(x - 8, top + 12); c.closePath(); c.clip();
  for (let y = top; y < bottom - 14; y += 2) {
    const weight = Math.sin((y - top) / (bottom - top) * Math.PI);
    const dx = Math.round(Math.sin(time / 43 + phase * 1.4 + y * .06) * strength * weight * 2) / 2;
    c.drawImage(source, (x - 12) / 448 * source.naturalWidth, y / 320 * source.naturalHeight,
      24 / 448 * source.naturalWidth, 2 / 320 * source.naturalHeight, x - 12 + dx, y, 24, 2);
  }
  c.restore();
}
