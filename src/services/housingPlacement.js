import { housingModel, artItem, furnitureSize } from './housingArt';
export const tileKey = (x, y) => x + ',' + y;
export function inside(m, x, y) {
  const c = m.cutout;
  return (
    x >= m.x &&
    x < m.x + m.w &&
    y >= m.y &&
    y < m.y + m.h &&
    !(c && x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h)
  );
}
export function roomDoor(m) {
  return { x: m.x + Math.floor(m.w / 2), y: m.y + m.h };
}
export function cells(p, w, h) {
  return Array.from({ length: w * h }, (_, i) => [
    p.x + (i % w),
    p.y + Math.floor(i / w),
  ]);
}
export function layoutError(f) {
  const m = housingModel(f.model),
    d = roomDoor(m),
    taken = new Set(),
    solid = new Set(),
    targets = [];
  if (f.placements.length > 20) return 'Vingt meubles maximum par pièce.';
  const claim = (p, w, h, block) => {
    for (const [x, y] of cells(p, w, h)) {
      const k = tileKey(x, y);
      if (
        !inside(m, x, y) ||
        (y >= d.y - 2 && x >= d.x - 1 && x <= d.x) ||
        taken.has(k)
      )
        return 'Garde les murs, la porte et les autres éléments dégagés.';
      taken.add(k);
      if (block) solid.add(k);
    }
    return '';
  };
  for (const s of Object.values(f.stairs).filter(Boolean)) {
    if (s.x !== m.x - 2) return 'Les escaliers restent fixes à gauche.';
    for (const x of [s.x + 2, s.x + 3]) {
      if (!inside(m, x, s.y + 1)) return 'Laisse l’accès à l’escalier dégagé.';
      targets.push({ x, y: s.y + 1 });
    }
  }
  for (const p of f.placements) {
    const i = artItem(p.key);
    if (!i) return 'Meuble inconnu.';
    const e = claim(p, furnitureSize(p).w, furnitureSize(p).h, i.solid);
    if (e) return e;
  }
  for (const p of targets)
    if (taken.has(tileKey(p.x, p.y))) return 'Libère le pied de l’escalier.';
  const seen = new Set(),
    q = [{ x: d.x, y: d.y - 1 }];
  while (q.length) {
    const p = q.pop(),
      k = tileKey(p.x, p.y);
    if (seen.has(k) || !inside(m, p.x, p.y) || solid.has(k)) continue;
    seen.add(k);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ])
      q.push({ x: p.x + dx, y: p.y + dy });
  }
  for (const p of targets)
    if (!seen.has(tileKey(p.x, p.y))) return 'Un escalier n’est plus accessible depuis l’entrée.';
  for (let y = m.y; y < m.y + m.h; y++)
    for (let x = m.x; x < m.x + m.w; x++)
      if (
        inside(m, x, y) &&
        !solid.has(tileKey(x, y)) &&
        !seen.has(tileKey(x, y))
      )
        return 'Ce placement ferme un passage.';
  return '';
}
export function projected(f, tool, x, y) {
  const copy = JSON.parse(JSON.stringify(f));
  if (tool.kind === 'stair') copy.stairs[tool.key] = { x, y };
  else {
    copy.placements = copy.placements.filter((p) => p.id !== tool.id);
    copy.placements.push({
      id: tool.id,
      key: tool.key,
      x,
      y,
      rotation: tool.rotation ?? 0,
    });
  }
  return copy;
}
