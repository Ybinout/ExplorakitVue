import config from '@/data/housing.json';
import metrics from '@/data/housingArt.json';
import { drawPokemonTerminal } from './pokemonComputer';
const sources = {
  furniture: require('@/assets/housing/furniture-rotations-v2.png'),
  architecture: require('@/assets/housing/architecture-v1.png'),
};
let pending;
export function loadHousingArt() {
  if (!pending)
    pending = Promise.all(
      Object.entries(sources).map(
        ([key, src]) =>
          new Promise((resolve, reject) => {
            const im = new Image();
            im.onload = () => resolve([key, im]);
            im.onerror = reject;
            im.src = src;
          })
      )
    )
      .then((entries) => Object.fromEntries(entries))
      .catch((e) => {
        pending = null;
        throw e;
      });
  return pending;
}
export const housingModels = config.models;
export const housingItems = config.furniture;
export function isHousingMap(map) {
  return config.models.some((m) => 'housing_' + m.key === map);
}
export function housingModel(key) {
  return config.models.find((m) => m.key === key);
}
export function artItem(key) {
  return config.furniture.find((i) => i.key === key);
}
export function furnitureSize(p) {
  const i = artItem(p.key),
    r = p.rotation ?? 0;
  return r % 180 ? { w: i.h, h: i.w } : { w: i.w, h: i.h };
}
function sprite(p) {
  const item = artItem(p.key),
    face = (p.rotation ?? 0) / 90;
  return {
    ...metrics.orientations[item.sprite][face],
    face,
    index: item.sprite,
  };
}
export function furnitureBounds(p) {
  const d = furnitureSize(p),
    a = sprite(p);
  return {
    x: p.x * 32 + (d.w * 32 - a.w * 2) / 2,
    y: (p.y + d.h) * 32 - a.h * 2 - (p.backWallLift || 0),
    w: a.w * 2,
    h: a.h * 2,
    bottom: (p.y + d.h) * 32,
  };
}
export function drawFurniture(c, art, p, alpha = 1) {
  if (!artItem(p.key) || !art?.furniture) return;
  const a = sprite(p),
    b = furnitureBounds(p);
  c.save();
  c.imageSmoothingEnabled = false;
  c.globalAlpha = alpha;
  if (p.key === 'pokemon_pc' && a.face === 0) drawPokemonTerminal(c, b.x, b.y);
  else
    c.drawImage(
      art.furniture,
      a.face * 64 + Math.floor((64 - a.w) / 2),
      a.index * 64 + 64 - a.h,
      a.w,
      a.h,
      b.x,
      b.y,
      b.w,
      b.h
    );
  c.restore();
}
export function drawStair(c, art, p, up = true) {
  if (!art?.architecture || !p) return;
  const index = up ? 16 : 17,
    a = metrics.fixtures.find((f) => f.index === index);
  c.save();
  c.imageSmoothingEnabled = false;
  c.drawImage(
    art.architecture,
    (index % 6) * 64 + Math.floor((64 - a.w) / 2),
    Math.floor(index / 6) * 64 + 64 - a.h,
    a.w,
    a.h,
    p.x * 32,
    (p.y + 2) * 32 - 96,
    64,
    96
  );
  c.restore();
}
export function drawItemIcon(c, art, key) {
  const item = artItem(key);
  if (!item || !art?.furniture) return;
  const a = sprite({ key }),
    scale = Math.min(56 / a.w, 56 / a.h);
  c.clearRect(0, 0, 64, 64);
  c.imageSmoothingEnabled = false;
  if (key === 'pokemon_pc') {
    c.save();
    c.translate(16, 8);
    drawPokemonTerminal(c, 0, 0);
    c.restore();
  } else
    c.drawImage(
      art.furniture,
      Math.floor((64 - a.w) / 2),
      a.index * 64 + 64 - a.h,
      a.w,
      a.h,
      (64 - a.w * scale) / 2,
      (64 - a.h * scale) / 2,
      a.w * scale,
      a.h * scale
    );
}
export function housingRenderPlan(floor) {
  const ground = [],
    objects = [];
  for (const p of floor?.placements || [])
    (artItem(p.key)?.solid ? objects : ground).push({
      ...p,
      backWallLift:
        artItem(p.key)?.backWall && p.y === housingModel(floor.model).y + 1
          ? 16
          : 0,
    });
  objects.sort(
    (a, b) => furnitureBounds(a).bottom - furnitureBounds(b).bottom || a.x - b.x
  );
  return { ground, objects };
}
