import config from '@/data/housing.json';
import metrics from '@/data/housingArt.json';
const sources = {
  furniture: require('@/assets/housing/furniture-v1.png'),
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
export function furnitureBounds(p) {
  const item = artItem(p.key),
    a = metrics.furniture[item.sprite];
  return {
    x: p.x * 32 + (item.w * 32 - a.w * 2) / 2,
    y: (p.y + item.h) * 32 - a.h * 2,
    w: a.w * 2,
    h: a.h * 2,
    bottom: (p.y + item.h) * 32,
  };
}
export function drawFurniture(c, art, p, alpha = 1) {
  const item = artItem(p.key);
  if (!item || !art?.furniture) return;
  const a = metrics.furniture[item.sprite],
    b = furnitureBounds(p);
  c.save();
  c.imageSmoothingEnabled = false;
  c.globalAlpha = alpha;
  c.drawImage(
    art.furniture,
    (item.sprite % 5) * 64 + Math.floor((64 - a.w) / 2),
    Math.floor(item.sprite / 5) * 64 + 64 - a.h,
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
  const a = metrics.furniture[item.sprite],
    scale = Math.min(56 / a.w, 56 / a.h);
  c.clearRect(0, 0, 64, 64);
  c.imageSmoothingEnabled = false;
  c.drawImage(
    art.furniture,
    (item.sprite % 5) * 64 + Math.floor((64 - a.w) / 2),
    Math.floor(item.sprite / 5) * 64 + 64 - a.h,
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
    (artItem(p.key)?.solid ? objects : ground).push(p);
  objects.sort(
    (a, b) => furnitureBounds(a).bottom - furnitureBounds(b).bottom || a.x - b.x
  );
  return { ground, objects };
}
