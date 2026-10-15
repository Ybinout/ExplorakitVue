// A small dead zone prevents accidental steps. Hysteresis avoids alternating
// directions when a held finger sits close to a diagonal.
export function touchDirection(dx, dy, previous = null, deadZone = 12) {
  const x = Math.abs(dx), y = Math.abs(dy);
  if (Math.max(x, y) < deadZone) return null;
  const horizontal = dx < 0 ? 'q' : 'd', vertical = dy < 0 ? 'z' : 's';
  if (previous === horizontal && x * 1.2 >= y) return horizontal;
  if (previous === vertical && y * 1.2 >= x) return vertical;
  return x > y ? horizontal : vertical;
}
