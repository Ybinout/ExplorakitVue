import atlas from '../data/townspeopleFrames.json';
import classic from '../data/classicNpcFrames.json';

export function usesClassicNpcAtlas(image) {
  return /(?:^|\/)6931(?:\.[a-z0-9]+)?\.png(?:[?#]|$)/i.test(String(image.src));
}
export function classicNpcIndex(frame, actor = {}) {
  const name = String(actor.name || '').toLowerCase();
  if (name.startsWith('aspha')) return classic.roles.aspha;
  if (name.startsWith('lucie')) return classic.roles.lucie;
  if (name === 'mathilde_pikapika') return classic.roles.mathilde;
  if (/infirm|nurse/.test(name)) return classic.roles.infirmiere;
  if (/vendeuse/.test(name)) return 0;
  if (/vendeur|shop/.test(name)) return classic.roles.vendeur;
  return frame?.columns === 8 && frame.rows === 4 && Number.isInteger(frame.index)
    && frame.index >= 0 && frame.index < 32 ? frame.index : 20;
}
export function npcWorldSize(image) { return usesClassicNpcAtlas(image) || String(image.src).includes('gwenn-pixel-v1') ? 64 : 48; }
// The generated atlas has unequal row gutters. Grid division included neighbours'
// feet. These source rectangles are for world pixel sprites only.
export function npcFrame(image, frame, actor) {
  if (usesClassicNpcAtlas(image)) {
    const { x, y, w, h } = classic.frames[classicNpcIndex(frame, actor)];
    return { x, y, w, h, extent:classic.extent };
  }
  if (String(image.src).includes('townspeople-pixel-v2') && frame.columns === 8 && frame.rows === 4) {
    const box = atlas.frames[frame.index];
    if (box) return { ...box, extent:32 };
  }
  const w = image.naturalWidth / frame.columns, h = image.naturalHeight / frame.rows;
  return { x:(frame.index % frame.columns)*w, y:Math.floor(frame.index/frame.columns)*h, w, h, extent:Math.max(w,h) };
}
export function drawNpcFrame(context, image, frame, x, y, size, actor) {
  const box = npcFrame(image, frame, actor), scale = size / box.extent;
  context.imageSmoothingEnabled = false;
  context.drawImage(image, box.x, box.y, box.w, box.h,
    x + (size - box.w*scale)/2, y + size - box.h*scale, box.w*scale, box.h*scale);
}

// Visual alignment with the dais inlay; server tile interaction/collision stays unchanged.
export function npcRenderOffset(map, actor) {
  if (map === 'route2' && actor.name === 'aspha_route2') return {x:16,y:0};
  if (map === 'route4_maison' && actor.name === 'gwenn_rochebrume') return {x:16,y:0};
  const champions = { ville1_arene: 'moonpunch', ville_safe1_arene: 'hoze', gen_arene5: 'raphael', ville3_arene: 'ana', ville4_arene: 'wanda', ville5_arene: 'sevenp' };
  return Object.hasOwn(champions, map) && champions[map] === actor.name
    ? { x: 16, y: -24 } : { x: 0, y: 0 };
}
