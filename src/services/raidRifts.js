// One small cached aura, reused for every world rift. No independent RAF or image fetch.
let aura;
function texture() {
  if (aura) return aura;
  aura = document.createElement('canvas');
  aura.width = aura.height = 160;
  const c = aura.getContext('2d'),
    g = c.createRadialGradient(80, 80, 8, 80, 80, 77);
  g.addColorStop(0, '#0d0816');
  g.addColorStop(.23, '#211031');
  g.addColorStop(.43, '#a765debb');
  g.addColorStop(.7, '#7042a544');
  g.addColorStop(1, '#7545aa00');
  c.fillStyle = g;
  c.fillRect(0, 0, 160, 160);
  return aura;
}
export function drawRaidRifts(c, state, now, motion = true) {
  if (!state?.rifts?.length) return;
  const time = motion ? (now + (state.offset || 0)) / 1000 : 0;
  for (const r of state.rifts) {
    const t = Math.min(1, Math.max(0, (now + (state.offset || 0) - r.movedAt) / 4000));
    const x = r.from.x + (r.to.x - r.from.x) * t,
      y = r.from.y + (r.to.y - r.from.y) * t,
      s = r.scale || 1,
      pulse = 1 + Math.sin(time * 1.7) * .04;
    c.save();
    c.translate(x, y);
    c.scale(s * pulse, s * pulse);
    c.drawImage(texture(), -37, -47, 74, 74);
    c.fillStyle = '#130c20';
    c.beginPath();
    c.ellipse(0, -10, 7, 14, Math.sin(time) * .12, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#ce9cf3';
    c.lineWidth = .65;
    c.beginPath();
    c.ellipse(0, -10, 9 + Math.sin(time * 2) * .6, 17, time * .12, 0, Math.PI * 2);
    c.stroke();
    const count = Math.round(9 + s * 5);
    for (let i = 0; i < count; i++) {
      const a = i * 2.399 + time * (.17 + i % 3 * .04),
        radius = 15 + i * 7 % 18,
        drift = Math.sin(time + i) * 2;
      c.globalAlpha = .3 + .4 * (.5 + .5 * Math.sin(time * 2 + i));
      c.fillStyle = i % 4 ? '#c38cec' : '#efe0ff';
      c.fillRect(Math.cos(a) * radius, Math.sin(a) * radius * .7 - 10 + drift, i % 4 ? 1 : 2, i % 4 ? 2 : 1);
    }
    c.globalAlpha = .8;
    if (s >= 1.5) {
      c.strokeStyle = '#dbb6f3';
      c.beginPath();
      c.moveTo(-12, -16);
      c.lineTo(-18, -8);
      c.lineTo(-15, -4);
      c.lineTo(-22, 5);
      c.moveTo(12, -25);
      c.lineTo(17, -16);
      c.lineTo(14, -10);
      c.stroke();
    }
    c.restore();
  }
}
