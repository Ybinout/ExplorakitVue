import config from '@/data/housing.json';
import metrics from '@/data/housingArt.json';
import { drawPokemonTerminal } from './pokemonComputer';
const sources = {
  furniture: require('@/assets/housing/furniture-rotations-v4.png'),
  cultivation: require('@/assets/berries/cultivation-furniture-v1.png'),
  growth: require('@/assets/berries/growth-v1.png'),
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
      a.index>=22?art.cultivation:art.furniture,
      a.face * 64 + Math.floor((64 - a.w) / 2),
      (a.index>=22?a.index-22:a.index) * 64 + 64 - a.h,
      a.w,
      a.h,
      b.x,
      b.y,
      b.w,
      b.h
    );
  if (a.index>=22 && a.index<24 && art.growth) drawCrops(c,art,p,b);
  c.restore();
}
function drawCrops(c,art,p,b){
  const item=artItem(p.key),count=item.slots,side=(p.rotation||0)%180!==0;
  for(let i=0;i<count;i++){
    const crop=p.crops?.find(x=>x.slot===i);if(!crop)continue;
    const elapsed=Math.max(0,(p.growthNow||Date.now())-crop.plantedAt),stage=elapsed>=1200000?2:elapsed>=300000?1:0;
    const x=b.x+(count===1?b.w/2:side?b.w/2:b.w*(i+.5)/count), y=b.y+(count===1?b.h*.35:side?b.h*(i+.5)/count:b.h*.27);
    c.drawImage(art.growth,stage*32,0,32,32,x-20,y-29,40,40);
  }
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
      a.index>=22?art.cultivation:art.furniture,
      Math.floor((64 - a.w) / 2),
      (a.index>=22?a.index-22:a.index) * 64 + 64 - a.h,
      a.w,
      a.h,
      (64 - a.w * scale) / 2,
      (64 - a.h * scale) / 2,
      a.w * scale,
      a.h * scale
    );
}
export function housingRenderPlan(floor,crops=[],growthNow=Date.now()) {
  const ground = [],
    objects = [];
  for (const p of floor?.placements || [])
    (artItem(p.key)?.solid ? objects : ground).push({
      ...p,
      crops: crops.filter(c=>c.furnitureId===p.id),growthNow,
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
