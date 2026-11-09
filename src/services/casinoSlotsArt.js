import config from '@/data/casinoSlots.json';
const source = require('@/assets/casino/slot-cabinet-v1.png');
let art;
function image() {
  if (!art) {
    art = new Image();
    art.src = source;
  }
  return art;
}
export const slotMachines = config.machines;
export const isCasino = (map) => map === config.map;
export const machineBottom = (m) => (m.y + m.h) * 32;
export function drawSlotMachine(c, m, now, motion = true) {
  const im = image();
  if (!im.complete || !im.naturalWidth) return;
  const x = m.x * 32,
    y = machineBottom(m) - 96;
  c.save();
  c.imageSmoothingEnabled = false;
  c.drawImage(im, x, y, 64, 96);
  if (motion) {
    c.globalAlpha = 0.18 + 0.08 * Math.sin(now / 900 + m.id);
    c.fillStyle = '#ffcd69';
    c.fillRect(x + 28, y + 5, 5, 5);
  }
  c.restore();
}
