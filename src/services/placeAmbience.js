import { RaphArenaRenderer, RAPH_MAP } from './raphArena.js';
import { HozeArenaRenderer, HOZE_MAP } from './hozeArena.js';
import { AnaArenaRenderer, ANA_MAP } from './anaArena.js';
import { WandaArenaRenderer, WANDA_MAP } from './wandaArena.js';
import { TournamentLobbySkyRenderer, TOURNAMENT_LOBBY_MAP } from './tournamentLobbySky.js';
import { villageWaterMask } from './villageWater.js';

// Positions are authored in the 448 × 320 map artwork, never inferred from a colour
// across the whole foreground. Decorations have no collision or gameplay state.
export const ARENA_LIGHTS = Object.freeze({
  'lake-gym': { color: '#80cfe2', rgb: '128,207,226', shade: '#142f4b', label: 'Mounir' },
  'hoze-gym': { color: '#f2c783', rgb: '242,199,131', shade: '#45321d', label: 'Hoze' },
  'raph-gym': { color: '#e6b385', rgb: '230,179,133', shade: '#352333', label: 'Raph' },
  'ana-gym': { color: '#b4db9c', rgb: '180,219,156', shade: '#183d35', label: 'Ana' },
  'wanda-gym': { color: '#c6b6f3', rgb: '198,182,243', shade: '#282440', label: 'Wanda' },
  '7p-gym': { color: '#a3daed', rgb: '163,218,237', shade: '#20344d', label: '7p' },
});
const gymMaps = {
  ville1_arene: 'lake-gym',
  ville_safe1_arene: 'hoze-gym',
  gen_arene5: 'raph-gym',
  ville3_arene: 'ana-gym',
  ville4_arene: 'wanda-gym',
  ville5_arene: '7p-gym',
};
const caves = {
  cave1: {
    crystals: [
      [62, 204],
      [386, 238],
    ],
    drips: [
      [150, 137],
      [286, 87],
    ],
    color: '#80d9c9',
  },
  cave2: {
    crystals: [
      [81, 135],
      [291, 183],
    ],
    drips: [
      [218, 101],
      [356, 91],
    ],
    color: '#9cd7e8',
  },
  cave_rochebrume1: {
    crystals: [
      [121, 153],
      [344, 182],
    ],
    drips: [
      [197, 66],
      [300, 128],
    ],
    color: '#99cced',
  },
  cave_rochebrume2: {
    crystals: [
      [130, 181],
      [294, 171],
    ],
    drips: [
      [207, 128],
      [252, 252],
    ],
    color: '#b2dff1',
  },
  cave_rochebrume3: {
    crystals: [
      [83, 121],
      [343, 191],
    ],
    drips: [
      [180, 111],
      [268, 229],
    ],
    color: '#b3e8dc',
  },
};
// Flower beds and open grass: bounded paths stay clear of roofs and water.
const butterflyGardens = {
  gen_ville5: [[26,74],[128,58],[153,35],[230,30],[320,24],[424,74],
    [34,98],[139,113],[35,232],[115,279],[422,161],[423,235],
    [42,294],[91,279],[128,290],[425,286],
    [205,168],[265,155],[303,174],[175,241]],
  route4: [[57,109],[87,115],[123,111],[164,121],[204,111],[244,119],
    [54,247],[92,250],[130,267],[147,287],[248,266],[302,273],
    [353,255],[400,277],[348,104],[406,103]],
};
export function placeAmbienceProfile(map) {
  if (map === TOURNAMENT_LOBBY_MAP) return { kind: 'tournament-lobby', shade: '#000000', opacity: 0 };
  if (butterflyGardens[map]) return {
    kind: 'garden', shade: '#000000', opacity: 0,
    butterflies: butterflyGardens[map],
  };
  if (map === 'ville5')
    return {
      kind: 'snow',
      shade: '#203e78',
      opacity: 0,
      chimneys: [
        [90, 199],
        [388, 199],
      ],
      signs: [],
      color: '#ffd494',
    };
  if (map === 'ville1')
    return {
      kind: 'lake',
      shade: '#366482',
      opacity: 0.025,
      butterflies: [
        [92, 273],
        [346, 275],
      ],
      flags: [[137, 103]],
      color: '#73bad1',
    };
  if (caves[map]) return { kind: 'cave', shade: '#142238', opacity: 0.27, ...caves[map] };
  if (map === 'ville5_arene')
    return {
      kind: 'summit',
      ...ARENA_LIGHTS['7p-gym'],
      opacity: 0.035,
      lights: [[224, 56, 60], [62, 148, 22], [386, 148, 22], [62, 244, 22], [386, 244, 22]],
      lanterns: [[136, 24], [312, 24], [20, 130], [428, 130], [20, 215], [428, 215], [196, 265], [251, 265]],
    };
  if (gymMaps[map])
    return {
      kind: 'hall',
      ...ARENA_LIGHTS[gymMaps[map]],
      opacity: 0.035,
      lights: [[224, 56, 60]],
      lanternColor: map === 'ville4_arene' ? '#cbb4ff' : '#ffd69b',
      lanterns: [[136, 24], [312, 24], [20, 130], [428, 130], [20, 215], [428, 215], [196, 265], [251, 265]],
    };
  return null;
}
const WIDTH = 448,
  HEIGHT = 320,
  FRAME_MS = 1000 / 20;
const mod = (n, d) => ((n % d) + d) % d;
function glow(c, x, y, radius, color, alpha = 0.25, squash = 1, gradients = null) {
  c.save();
  c.translate(x, y);
  c.scale(1, squash);
  const key = gradients && `${x}:${y}:${radius}:${color}:${squash}`;
  let g = gradients?.get(key);
  if (!g) {
    g = c.createRadialGradient(0, 0, 0, 0, 0, radius);
    g.addColorStop(0, color);
    g.addColorStop(0.25, color);
    g.addColorStop(1, 'transparent');
    gradients?.set(key, g);
  }
  c.globalAlpha = alpha;
  c.fillStyle = g;
  c.fillRect(-radius, -radius, radius * 2, radius * 2);
  c.restore();
}
function crystal(c, x, y, color) {
  for (const [dx, dy, h] of [
    [-4, 1, 8],
    [1, 0, 14],
    [6, 2, 6],
  ]) {
    c.fillStyle = '#32495b';
    c.beginPath();
    c.moveTo(x + dx - 3, y + dy);
    c.lineTo(x + dx - 3, y + dy - h + 3);
    c.lineTo(x + dx, y + dy - h);
    c.lineTo(x + dx + 3, y + dy - 3);
    c.closePath();
    c.fill();
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(x + dx, y + dy - 1);
    c.lineTo(x + dx - 1, y + dy - h + 2);
    c.lineTo(x + dx + 2, y + dy - 3);
    c.closePath();
    c.fill();
    c.fillStyle = '#e6faff';
    c.fillRect(x + dx - 1, y + dy - h + 3, 1, 3);
  }
}
function cloth(c, x, y, t, color, wind, sign = false) {
  c.save();
  c.translate(x, y);
  c.fillStyle = '#48525c';
  c.fillRect(-1, -2, 2, sign ? 3 : 24);
  c.rotate(Math.sin(t * 1.8 + x) * (0.012 + wind * 0.015));
  if (sign) {
    c.fillStyle = '#4b4d55';
    c.fillRect(-7, 2, 14, 10);
    c.fillStyle = '#d7aa70';
    c.fillRect(-6, 3, 12, 8);
    c.fillStyle = '#7f6347';
    c.fillRect(-2, 5, 5, 4);
    c.fillRect(-1, 4, 3, 1);
  } else {
    for (let row = 0; row < 15; row++) {
      c.fillStyle = color;
      c.fillRect(2 + Math.round(Math.sin(row * 0.3 + t * 1.8) * wind * 0.4), row, 9, row > 12 ? 1 : 1);
    }
    c.fillStyle = '#e9dfb7';
    c.fillRect(6, 3, 1, 7);
    c.fillRect(4, 5, 5, 1);
  }
  c.restore();
}
export class PlaceAmbienceRenderer {
  constructor(createCanvas = () => document.createElement('canvas')) {
    this.createCanvas = createCanvas;
    this.frames = 0;
    this.destroyed = false;
    this.canvas = null;
    this.water = null;
    this.lastTime = -Infinity;
  }
  prepare(source, map) {
    this.suspend();
    this.source = source;
    this.map = map;
    this.profile = placeAmbienceProfile(map);
    if (!this.profile) return;
    this.canvas = this.createCanvas();
    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;
    this.context = this.canvas.getContext('2d');
    if (!this.context) {
      this.suspend();
      return;
    }
    if (this.profile.kind === 'hall' || this.profile.kind === 'summit') {
      // This lighting never changes with the camera, weather or daylight.
      this.lightingBase = this.createCanvas();
      this.lightingBase.width = WIDTH; this.lightingBase.height = HEIGHT;
      this.paintBase(this.lightingBase.getContext('2d'));
      this.lanternGradients = new Map();
    }
    if (this.profile.kind === 'lake') {
      try {
        const mask = this.createCanvas();
        mask.width = WIDTH;
        mask.height = HEIGHT;
        const c = mask.getContext('2d');
        c.drawImage(source, 0, 0, WIDTH, HEIGHT);
        const pixels = c.getImageData(0, 0, WIDTH, HEIGHT);
        const interior = villageWaterMask(pixels.data, map).interior;
        for (let i = 0; i < interior.length; i++) {
          pixels.data[i * 4] = 255;
          pixels.data[i * 4 + 1] = 255;
          pixels.data[i * 4 + 2] = 255;
          pixels.data[i * 4 + 3] = interior[i] ? 255 : 0;
        }
        c.putImageData(pixels, 0, 0);
        this.waterMask = mask;
        this.water = this.createCanvas();
        this.water.width = WIDTH;
        this.water.height = HEIGHT;
      } catch (_) {
        this.waterMask = null;
      } // Lake effects fail closed; never spill onto land.
    }
  }
  drawGround(target, source, map, timestamp, motion = true, arenaState = null, speaking = false) {
    const key = map === TOURNAMENT_LOBBY_MAP ? 'tournamentLobby' : map === HOZE_MAP ? 'hoze' : map === RAPH_MAP ? 'raph' : map === ANA_MAP ? 'ana' : map === WANDA_MAP ? 'wanda' : null;
    if (this.destroyed || !key) { this.hoze?.suspend(); this.raph?.suspend(); this.ana?.suspend(); this.wanda?.suspend(); this.tournamentLobby?.suspend(); return; }
    if (this.map !== map || this.source !== source || !this.canvas) this.prepare(source, map);
    if (!this.context) return;
    if (!this[key]) {
      const Renderer = key === 'tournamentLobby' ? TournamentLobbySkyRenderer : key === 'hoze' ? HozeArenaRenderer : key === 'raph' ? RaphArenaRenderer : key === 'ana' ? AnaArenaRenderer : WandaArenaRenderer;
      this[key] = new Renderer(this.createCanvas);
    }
    if(key==='hoze')this[key].setCollapseState(arenaState);
    this[key].draw(target, source, timestamp, motion, speaking);
  }
  draw(target, source, map, timestamp, motion = true, wind = 0, daylight = { night: 0 }) {
    if (this.destroyed) return;
    if (!placeAmbienceProfile(map)) {
      this.suspend();
      return;
    }
    if (this.map !== map || this.source !== source || !this.canvas) this.prepare(source, map);
    if (!this.context || this.profile.kind === 'tournament-lobby') return;
    const time = Number.isFinite(timestamp) ? Math.max(0, timestamp) : 0;
    const settings = `${motion}:${wind}:${Math.round(daylight.night * 1000)}`;
    if (
      this.lastTime === -Infinity ||
      this.settings !== settings ||
      (motion && (time < this.lastTime || time - this.lastTime >= FRAME_MS))
    ) {
      this.paint(motion ? time / 1000 : 0, motion, Math.max(0, Math.min(3, Number(wind) || 0)), daylight.night);
      this.lastTime = time;
      this.settings = settings;
      this.frames++;
    }
    target.drawImage(this.canvas, 0, 0, 896, 640);
  }
  paintBase(c) {
    const p = this.profile;
    // Outdoor windows and lanterns now belong to the shared day/night layer.
    if (p.kind === 'snow') return;
    c.save();
    c.globalAlpha = p.opacity;
    c.fillStyle = p.shade;
    c.fillRect(0, 0, WIDTH, HEIGHT);
    c.restore();
    const lights = p.kind === 'cave' ? p.crystals.map(([x, y]) => [x, y, 48]) : p.lights || [];
    // Remove part of the cool shadow around real lights, then add reflected colour.
    for (const [x, y, r] of lights) {
      c.save();
      c.globalCompositeOperation = 'destination-out';
      glow(c, x, y + 8, r, '#fff', 0.8);
      c.restore();
      glow(c, x, y + 8, r, p.color, 0.16);
    }
  }
  paint(t, motion, wind, night = 0) {
    const c = this.context,
      p = this.profile;
    c.clearRect(0, 0, WIDTH, HEIGHT);
    if (this.lightingBase) c.drawImage(this.lightingBase, 0, 0);
    else this.paintBase(c);
    if (p.kind === 'summit' || p.kind === 'hall') {
      for (const [x, y] of p.lanterns) {
        const strength = motion ? 0.21 + Math.sin(t * 1.7 + x) * 0.025 : 0.21;
        glow(c, x, y, 16, p.lanternColor || '#ffd69b', strength, 1, this.lanternGradients);
      }
      // A few suspended motes inside the window's light, never across the HUD.
      if (motion && this.map !== WANDA_MAP) for (let n = 0; n < 12; n++) {
        const age = mod(t * 0.035 + n * 0.083, 1);
        c.globalAlpha = Math.sin(age * Math.PI) * 0.36;
        c.fillStyle = '#d9f4ff';
        c.fillRect(Math.round(174 + (n * 31 % 100) + Math.sin(t * 0.25 + n) * 3), Math.round(90 + age * 100), 1, 1);
      }
      c.globalAlpha = 1;
    }
    if (p.kind === 'snow') {
      for (const [x, y] of p.chimneys) {
        if (motion)
          for (let i = 0; i < 5; i++) {
            const age = mod(t * 0.18 + i / 5, 1);
            const sx = x + Math.sin(age * 5 + i) * 3 + age * (7 + wind * 2),
              sy = y - 2 - age * 34;
            glow(c, sx, sy, 3 + age * 6, '#e0e2eb', 0.18 * (1 - age), 0.8);
          }
      }
      for (const [x, y] of p.signs) cloth(c, x, y, t, p.color, motion ? Math.max(0.5, wind) : 0, true);
    }
    if (p.kind === 'cave') {
      for (const [i, [x, y]] of p.crystals.entries()) {
        crystal(c, x, y, p.color);
        if (motion)
          for (let n = 0; n < 8; n++) {
            const a = mod(t * 0.06 + n * 0.137 + i * 0.3, 1);
            c.globalAlpha = Math.sin(a * Math.PI) * 0.32;
            c.fillStyle = '#d6ebd4';
            c.fillRect(
              Math.round(x - 20 + n * 6 + Math.sin(t * 0.3 + n) * 2),
              Math.round(y + 12 - a * 45),
              1,
              1
            );
            c.globalAlpha = 1;
          }
      }
      if (motion)
        for (const [i, [x, y]] of p.drips.entries()) {
          const phase = mod(t + i * 3.7, 8.7);
          if (phase < 0.65) {
            c.fillStyle = '#bde8f2';
            c.globalAlpha = 0.6;
            const dy = phase * phase * 65;
            c.fillRect(x, Math.round(y - 27 + dy), 1, 3);
            c.globalAlpha = 1;
          } else if (phase < 1.2) {
            const r = (phase - 0.65) * 8;
            c.strokeStyle = `rgba(173,216,228,${(1.2 - phase) * 0.7})`;
            c.beginPath();
            c.ellipse(x, y, r, r * 0.38, 0, 0, Math.PI * 2);
            c.stroke();
          }
        }
    }
    if (p.kind === 'lake') {
      if (this.water && this.waterMask) {
        const w = this.water.getContext('2d');
        w.clearRect(0, 0, WIDTH, HEIGHT);
        // Small horizontal crests near banks and the two rocks, clipped to verified water pixels.
        for (let n = 0; n < 21; n++) {
          const x = 250 + ((n * 41) % 155),
            y = 30 + ((n * 29) % 105);
          const a = 0.12 + 0.16 * (0.5 + 0.5 * Math.sin(t * 0.8 + n));
          w.fillStyle = `rgba(225,249,255,${a})`;
          w.fillRect(x + Math.round(Math.sin(t * 0.45 + n) * 3), y, 5 + (n % 7), 1);
        }
        for (const [x, y] of [
          [279, 46],
          [368, 63],
          [390, 127],
        ]) {
          for (let n = 0; n < 2; n++) {
            const age = mod(t * 0.23 + n * 0.5, 1);
            w.strokeStyle = `rgba(218,245,255,${(1 - age) * 0.35})`;
            w.beginPath();
            w.ellipse(x, y, 9 + age * 9, 3 + age * 4, 0, 0, Math.PI * 2);
            w.stroke();
          }
        }
        w.save();
        w.globalCompositeOperation = 'destination-in';
        w.drawImage(this.waterMask, 0, 0);
        w.restore();
        c.drawImage(this.water, 0, 0);
      }
      // Slow cloud shadows: no black cutout, opacity stays under 7%.
      if (motion)
        for (let n = 0; n < 2; n++) {
          const x = mod(t * 2.1 + n * 290, 750) - 150;
          glow(c, x, 106 + n * 117, 108, '#243c61', 0.065 * (1 - night), 0.42);
        }
    }
    if (motion && p.butterflies) {
      const garden = p.kind === 'garden';
      const duration = garden ? 22 : 8, cycle = garden ? 26 : 37;
      for (const [i, [x, y]] of p.butterflies.entries()) {
        // Staggered rests: gardens always have a dozen butterflies in flight.
        const age = mod(t + i * (garden ? cycle / p.butterflies.length : 13), cycle);
        if (age >= duration) continue;
        const phase = t * (0.65 + (i % 3) * 0.09) + i * 2.4;
        const bx = Math.round(x + Math.sin(phase) * (garden ? 6 : 12));
        const by = Math.round(y + Math.sin(phase * 1.7) * 3 - Math.cos(phase * .6) * 2);
        const wing = Math.sin(t * (9 + i % 4) + i) > 0 ? 3 : 1;
        c.globalAlpha = Math.min(1, age * 2, (duration - age) * 2) * .95 * (1 - night);
        c.fillStyle = ['#ffe4a0', '#e9c6fa', '#a7e2f5', '#ffb7c6'][i % 4];
        c.fillRect(bx - wing, by - 1, wing, 3);
        c.fillRect(bx + 1, by - 1, wing, 3);
        c.fillRect(bx - Math.max(1, wing - 1), by + 2, Math.max(1, wing - 1), 1);
        c.fillRect(bx + 1, by + 2, Math.max(1, wing - 1), 1);
        c.fillStyle = '#fff4d7';
        c.fillRect(bx - wing, by - 1, 1, 1);
        c.fillRect(bx + wing, by - 1, 1, 1);
        c.fillStyle = '#596078';
        c.fillRect(bx, by, 1, 3);
      }
      c.globalAlpha = 1;
    }
    for (const [x, y] of p.flags || []) cloth(c, x, y, t, p.color, motion ? Math.max(0.5, wind) : 0);
  }
  suspend() {
    this.hoze?.suspend(); this.raph?.suspend(); this.ana?.suspend(); this.wanda?.suspend(); this.tournamentLobby?.suspend();
    for (const key of ['canvas', 'water', 'waterMask', 'lightingBase']) {
      if (this[key]) {
        this[key].width = 0;
        this[key].height = 0;
      }
      this[key] = null;
    }
    this.lanternGradients?.clear(); this.lanternGradients = null;
    this.context = null;
    this.source = null;
    this.map = null;
    this.profile = null;
    this.lastTime = -Infinity;
    this.settings = null;
  }
  destroy() {
    this.suspend();
    this.destroyed = true;
  }
}
