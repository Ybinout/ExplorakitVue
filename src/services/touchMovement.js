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

// Follow a long swipe with a small floating origin. Turning back should not
// require dragging all the way across the screen to the initial touch point.
export function moveTouchGesture(gesture, x, y) {
  const dx = x - gesture.x, dy = y - gesture.y;
  const direction = touchDirection(dx, dy, gesture.direction, gesture.surface === 'map' ? 8 : 12);
  if (gesture.surface === 'map') {
    const distance = Math.hypot(dx, dy), radius = 16;
    if (distance > radius) {
      gesture.x = x - dx * radius / distance;
      gesture.y = y - dy * radius / distance;
    }
  }
  return direction;
}
