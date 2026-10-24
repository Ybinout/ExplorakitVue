// Deliberately low-detail wooden boards on the map's 32 px world grid.
export function drawRoomBarricade(ctx, gate, now, opening, animated) {
  const working = gate.workingAt != null;
  const shake = animated && working ? Math.round(Math.sin((now - gate.workingAt) / 85)) : 0;
  ctx.save();
  try {
    ctx.globalAlpha = 1 - opening;
    for (const [index, cell] of (gate.cells || []).entries()) {
      const x = cell.x * 32 + shake + Math.round((index % 2 ? 1 : -1) * opening * 12);
      const y = cell.y * 32 + 10 + Math.round(opening * 10);
      ctx.fillStyle = '#12192688'; ctx.fillRect(x, y + 15, 32, 6);
      ctx.fillStyle = '#30222b'; ctx.fillRect(x + 3, y - 13, 5, 33); ctx.fillRect(x + 24, y - 10, 5, 30);
      ctx.fillStyle = '#44313a'; ctx.fillRect(x, y - 8, 32, 12); ctx.fillRect(x, y + 5, 32, 11);
      ctx.fillStyle = index % 2 ? '#795648' : '#6b4b43'; ctx.fillRect(x + 1, y - 7, 30, 8); ctx.fillRect(x + 1, y + 6, 30, 7);
      ctx.fillStyle = '#ad8261'; ctx.fillRect(x + 1, y - 7, 30, 2); ctx.fillRect(x + 1, y + 6, 30, 1);
      // Occasional diagonal lashings break up the rail rhythm without fine texture.
      if (index % 4 === 1) {
        ctx.fillStyle = '#bea079';
        for (let step = 0; step < 7; step++) ctx.fillRect(x + 10 + step, y - 8 + step * 3, 3, 4);
      }
      ctx.fillStyle = '#c2a58b'; ctx.fillRect(x + 5, y - 4, 2, 2); ctx.fillRect(x + 25, y + 9, 2, 2);
      if (opening && animated) {
        ctx.fillStyle = '#9c8170';
        ctx.fillRect(x + 9, y + Math.round(opening * 15), 2, 2);
        ctx.fillRect(x + 21, y + Math.round(opening * 20), 3, 2);
      }
    }
    if (!opening && gate.pulseAt != null && now - gate.pulseAt < 900) {
      const x = (gate.tiles.x + gate.tiles.width / 2) * 32;
      const y = gate.tiles.y * 32 - 15;
      ctx.fillStyle = '#192c3e'; ctx.fillRect(x - 9, y - 9, 18, 18);
      ctx.fillStyle = '#f3dfb8'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillText('A', x, y + 4);
    }
  } finally { ctx.restore(); }
}
