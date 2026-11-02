// The existing floor prop becomes a personal pickup cue only once collectible.
// Reuse the world clock and render loop; reduced motion keeps a fixed highlight.
export function drawVoidTeleporter(context, map, state, time = 0, motion = true) {
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
  const highlighted = state.available === true;
  const phase = motion ? (time % 2400) / 2400 : .5;
  const pulse = .5 - Math.cos(phase * Math.PI * 2) * .5;
  if (highlighted) {
    // Stepped light stays close to this tile, below the prop and all actors.
    rect(`rgba(255,218,133,${.035 + pulse * .04})`, -8, -8, 40, 36);
    rect(`rgba(255,218,133,${.065 + pulse * .055})`, -5, -5, 34, 30);
    rect(`rgba(255,232,170,${.13 + pulse * .09})`, -2, -2, 28, 23);
    const edge = `rgba(255,232,167,${.55 + pulse * .4})`;
    rect(edge, 2, -2, 20, 2); rect(edge, -2, 2, 2, 14);
    rect(edge, 24, 2, 2, 14); rect(edge, 2, 18, 20, 2);
  }
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
  if (highlighted) {
    context.save();
    context.beginPath(); context.rect(2, 2, 20, 12); context.clip();
    const sweep = motion ? (time % 2600) / 2600 * 54 - 18 : 12;
    context.fillStyle = 'rgba(255,250,219,.68)';
    context.beginPath(); context.moveTo(sweep, 2); context.lineTo(sweep + 4, 2);
    context.lineTo(sweep - 2, 14); context.lineTo(sweep - 6, 14); context.closePath(); context.fill();
    context.restore();
    // A few small pixel glints, with no beacon, label or screen-wide flash.
    for (const [sx, sy, offset] of [[-5, 1, 0], [27, -5, .34], [17, -10, .67]]) {
      const sparklePhase = motion ? (phase + offset) % 1 : .5;
      const strength = Math.sin(sparklePhase * Math.PI) ** 4;
      const lift = motion ? Math.floor(sparklePhase * 4) : 2;
      const color = `rgba(255,242,194,${.2 + strength * .8})`;
      rect(color, sx, sy - lift, 2, 6); rect(color, sx - 2, sy + 2 - lift, 6, 2);
    }
  }
  context.restore();
  return true;
}
