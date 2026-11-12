import {isAppliance,applianceSize,drawAppliance,drawFurnitureEffect} from './housingAppliances';
import config from '@/data/housing.json';
import berryRules from '@/data/berryMutation.json';
import metrics from '@/data/housingArt.json';
import { drawPokemonTerminal } from './pokemonComputer';
const sources = {
  furniture: require('@/assets/housing/furniture-rotations-v4.png'),
  cultivation: require('@/assets/berries/cultivation-furniture-v1.png'),
  growth: require('@/assets/berries/growth-v1.png'),
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
  if(isAppliance(p.key))return {...applianceSize(p.key),face:(p.rotation||0)/90,index:-1};
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
export function drawFurniture(c, art, p, alpha = 1, now = performance.now(), fx = null) {
  if (!artItem(p.key) || !art?.furniture) return;
  const a = sprite(p),
    b = furnitureBounds(p);
  c.save();
  c.imageSmoothingEnabled = false;
  c.globalAlpha = alpha;
  if(isAppliance(p.key))drawAppliance(c,p.key,b,p.rotation,fx?.until>Date.now()?now-fx.startedAt:null);
  else if (p.key === 'pokemon_pc' && a.face === 0) drawPokemonTerminal(c, b.x, b.y);
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
  drawFurnitureEffect(c,p,b,fx,now);
  c.restore();
}
function drawCrops(c,art,p,b){
  const item=artItem(p.key),count=item.slots,side=(p.rotation||0)%180!==0;
  for(let i=0;i<count;i++){
    const crop=p.crops?.find(x=>x.slot===i);if(!crop)continue;
    const elapsed=Math.max(0,(p.growthNow||Date.now())-crop.plantedAt),stage=elapsed>=berryRules.growthMs?2:elapsed>=berryRules.seedMs?1:0;
    const x=b.x+(count===1?b.w/2:side?b.w/2:b.w*(i+.5)/count), y=b.y+(count===1?b.h*.35:side?b.h*(i+.5)/count:b.h*.27);
    c.drawImage(art.growth,stage*32,0,32,32,x-20,y-29,40,40);
  }
}
// Pixel geometry shares the actual left-hand threshold (x + 2, y + 1).
// Two tiny cached canvases replace the old atlas cutout and its white matte.
const stairCanvases = new Map();
function stairCanvas(up) {
  if (stairCanvases.has(up)) return stairCanvases.get(up);
  const canvas = document.createElement('canvas');
  canvas.width = 96; canvas.height = 64;
  const c = canvas.getContext('2d');
  const box = (x, y, w, h, color) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
  // Recessed wooden stairwell: dark outer masonry, warm wood, no white outline.
  box(0, 4, 64, 60, '#0a111a');
  box(2, 8, 62, 54, '#211d1b');
  box(6, 12, 58, 48, '#151619');
  for (let i = 0; i < 7; i++) {
    const x = 8 + i * 8, top = up ? 12 + i * 3 : 30 - i;
    const colors = up ? ['#78604a', '#705840', '#67513c', '#614c37', '#5b4633', '#533f30', '#4b392b']
      : ['#242326', '#2d2927', '#38302b', '#44372e', '#514030', '#5e4a35', '#6a543e'];
    box(x, top, 8, 58 - top, '#2a2421');
    box(x, top, 6, 54 - top, colors[i]);
    box(x, top, 2, 54 - top, up ? '#927454' : '#796044');
    box(x, 54, 8, 4, '#312a24');
  }
  // Open doorway and short landing meet the room's left edge without a lip.
  box(64, 32, 32, 32, '#594532');
  box(66, 34, 30, 26, '#786047');
  box(66, 36, 30, 2, '#8a7051');
  box(66, 48, 30, 2, '#5e4936');
  box(66, 60, 30, 4, '#382d25');
  box(2, 4, 64, 4, '#2e2926');
  box(2, 8, 4, 52, '#4f4133');
  box(6, 8, 58, 4, '#66503a');
  box(6, 60, 60, 4, '#43372c');
  box(62, 12, 4, 20, '#70543a');
  box(62, 32, 4, 28, '#453729');
  box(8, 12, 4, 44, up ? '#29282a' : '#0d121b');
  stairCanvases.set(up, canvas);
  return canvas;
}
export function drawStair(c, art, p, up = true) {
  if (!p) return;
  c.save();
  c.imageSmoothingEnabled = false;
  c.drawImage(stairCanvas(up), p.x * 32, p.y * 32);
  c.restore();
}
export function drawItemIcon(c, art, key) {
  const item = artItem(key);
  if (!item || !art?.furniture) return;
  const a = sprite({ key }),
    scale = Math.min(56 / a.w, 56 / a.h);
  c.clearRect(0, 0, 64, 64);
  c.imageSmoothingEnabled = false;
  if(isAppliance(key)){drawAppliance(c,key,{x:12,y:8,w:40,h:48});}
  else if (key === 'pokemon_pc') {
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
