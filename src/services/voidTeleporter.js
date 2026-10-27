// A small, static floor prop: no marker, glow, labels or extra animation loop.
export function drawVoidTeleporter(context, map, state) {
  if (!state || state.found || map !== 'professor_lab') return false;
  const pickup = state.pickup || {map:'professor_lab',x:16,y:9};
  if (pickup.map !== map) return false;
  const x = pickup.x * 32 + 16, y = pickup.y * 32 + 16;
  context.save();
  context.translate(x - 12, y - 8);
  const rect = (color, x, y, width, height) => {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
  };
  rect('#151421', 0, 14, 26, 6); // Short contact shadow on the floor.
  rect('#171b27', 2, 0, 20, 2);
  rect('#171b27', 0, 2, 24, 14);
  rect('#171b27', 2, 16, 20, 2);
  rect('#aaaeb5', 2, 2, 20, 12); // Worn metal casing and bevel.
  rect('#d3d1ca', 4, 2, 16, 2);
  rect('#69727e', 2, 12, 20, 4);
  rect('#273543', 6, 6, 10, 6); // An unlit dark screen.
  rect('#526676', 8, 6, 6, 2);
  rect('#b49b6d', 18, 6, 2, 6);
  rect('#d2b783', 16, 8, 6, 2);
  rect('#303644', 4, 8, 2, 4);
  context.restore();
  return true;
}
