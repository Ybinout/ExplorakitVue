import { drawRoomBarricade } from './roomObstacleRenderer.js';
// Small pixel-art rope barriers. No image fetches, timers or world collision prediction.
export class StoryGateRenderer {
  constructor() { this.gates = new Map(); }
  sync(gates = []) {
    const next = new Map();
    for (const gate of gates) {
      const previous = this.gates.get(gate.id);
      next.set(gate.id, {
        ...gate,
        workingAt: previous?.workingAt ?? null,
        workAction: previous?.workAction ?? null,
        opening: previous?.locked && !gate.locked ? true : (!gate.locked && previous?.opening) || false,
        openedAt: previous?.locked && !gate.locked ? null : previous?.openedAt ?? null,
        pulseAt: previous?.pulseAt ?? null,
        pulsePending: previous?.pulsePending || false
      });
    }
    this.gates = next;
  }
  work(action) {
    for (const gate of this.gates.values()) {
      gate.workingAt = action?.active && action.id === gate.id ? (action.startedAt ?? performance.now()) : null;
      if(gate.workingAt!==null)gate.workAction={...action,startedAt:gate.workingAt};
      else if(gate.locked)gate.workAction=null;
    }
  }
  pulse(id) { const gate = this.gates.get(id); if (gate?.locked) gate.pulsePending = true; }
  draw(ctx, map, now, animated = true) {
    for (const gate of this.gates.values()) {
      if (gate.map !== map || (!gate.locked && !gate.opening)) continue;
      if (gate.opening && gate.openedAt === null) gate.openedAt = now;
      if (gate.pulsePending) { gate.pulseAt = now; gate.pulsePending = false; }
      const opening = gate.opening ? Math.min(1, (now - gate.openedAt) / 1100) : 0;
      if (!animated && gate.opening || opening >= 1) { gate.opening = false; continue; }
      if (gate.kind === 'barricade') { drawRoomBarricade(ctx, gate, now, opening, animated); continue; }
      const age = gate.pulseAt === null ? Infinity : now - gate.pulseAt;
      const pulse = age < 900;
      const shake = animated && pulse ? Math.round(Math.sin(age / 38) * 3 * (1 - age / 900)) : 0;
      const t = gate.tiles, vertical = gate.direction === 'left' || gate.direction === 'right';
      const x1 = vertical ? (t.x + .5) * 32 : t.x * 32;
      const y1 = vertical ? t.y * 32 : (t.y + .5) * 32 + 8;
      const x2 = vertical ? x1 : (t.x + t.width) * 32;
      const y2 = vertical ? (t.y + t.height) * 32 : y1;
      ctx.save();
      try {
        ctx.globalAlpha = 1 - opening;
        ctx.fillStyle = 'rgba(33,29,20,.22)';
        ctx.fillRect(x1 - 7, y1 + 2, 14, 5); ctx.fillRect(x2 - 7, y2 + 2, 14, 5);
        // Two rope halves retract towards their posts when the victory unlocks the passage.
        const dx = x2 - x1, dy = y2 - y1;
        const end = .5 * (1 - opening);
        for (const start of [0, 1 - end]) {
          ctx.beginPath(); ctx.moveTo(x1 + dx * start + (vertical ? shake : 0), y1 + dy * start - 10 + (vertical ? 0 : shake));
          ctx.lineTo(x1 + dx * (start + end) + (vertical ? shake : 0), y1 + dy * (start + end) - 10 + (vertical ? 0 : shake));
          ctx.strokeStyle = '#624a32'; ctx.lineWidth = 5; ctx.stroke();
          ctx.strokeStyle = gate.opening ? '#f5db8b' : '#dfc58b'; ctx.lineWidth = 2; ctx.stroke();
        }
        for (const [x,y] of [[x1,y1],[x2,y2]]) {
          ctx.fillStyle = '#503f30'; ctx.fillRect(x - 5, y - 23, 10, 27);
          ctx.fillStyle = '#a47c4a'; ctx.fillRect(x - 3, y - 21, 6, 23);
          ctx.fillStyle = '#e3c18a'; ctx.fillRect(x - 3, y - 21, 6, 3);
          ctx.fillStyle = '#d6bd8b'; ctx.fillRect(x - 4, y - 12, 8, 3);
        }
        const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2 - 20;
        if (pulse && !gate.opening) {
          const rise = animated ? Math.round(Math.sin(Math.min(1, age / 250) * Math.PI) * 6) : 0;
          ctx.fillStyle = '#203e50'; ctx.fillRect(cx - 8, cy - 18 - rise, 16, 20);
          ctx.fillStyle = '#fff0bf'; ctx.fillRect(cx - 2, cy - 14 - rise, 4, 8); ctx.fillRect(cx - 2, cy - 4 - rise, 4, 3);
        }
        if (gate.opening) {
          ctx.fillStyle = '#ffe9a0';
          for (let i=0;i<6;i++) {
            const a = i * Math.PI / 3;
            ctx.fillRect(Math.round(cx + Math.cos(a) * opening * 25), Math.round(cy + Math.sin(a) * opening * 17), 3, 3);
          }
        }
      } finally { ctx.restore(); }
    }
  }
  destroy() { this.gates.clear(); }
}
