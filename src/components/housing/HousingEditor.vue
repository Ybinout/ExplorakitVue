<template>
  <div class="housing-editor" data-housing-editor>
    <aside class="house-library">
      <div class="library-title">
        <h3>Mes meubles</h3>
        <b>{{ draft.placements.length }} / 10</b>
      </div>
      <label
        ><span class="sr-only">Chercher un meuble</span
        ><input
          v-model="query"
          type="search"
          placeholder="Trouver un meuble…"
          :disabled="locked"
      /></label>
      <div class="house-stock">
        <button
          v-for="item in stock"
          :key="item.key"
          :disabled="locked || item.available <= 0"
          :aria-pressed="tool?.key === item.key"
          @pointerdown="stockDown($event, item)"
          @click="stockClick(item)"
        >
          <housing-item-icon :item-key="item.key" /><span
            ><b>{{ item.name }}</b
            ><small
              >{{ item.available }} disponible{{
                item.available > 1 ? 's' : ''
              }}</small
            ></span
          >
        </button>
        <p v-if="!stock.length" class="house-empty">
          Les meubles s’achètent au Grand Comptoir.
        </p>
      </div>
    </aside>
    <div class="house-workspace">
      <div class="house-editor-tools">
        <button
          type="button"
          :aria-pressed="pan"
          @click="
            pan = !pan;
            tool = null;
          "
        >
          ✥ Déplacer la vue</button
        ><button
          type="button"
          @click="zoom = Math.max(0.75, zoom - 0.25)"
          aria-label="Dézoomer"
        >
          −</button
        ><span>{{ Math.round(zoom * 100) }} %</span
        ><button
          type="button"
          @click="zoom = Math.min(2, zoom + 0.25)"
          aria-label="Zoomer"
        >
          +</button
        ><button
          type="button"
          :disabled="!history.length || locked"
          @click="undo"
        >
          ↶ Annuler
        </button>
      </div>
      <p class="house-placement-help" :class="{ 'is-invalid': previewError }">
        {{
          previewError ||
          (pan
            ? 'Fais glisser la pièce pour déplacer la vue.'
            : tool?.kind === 'stair'
            ? 'Choisis une case pour cet escalier.'
            : tool
            ? 'Glisse ou touche une case pour poser ' + selectedName + '.'
            : 'Choisis un meuble, puis une case. Tu peux aussi glisser un meuble déjà posé.')
        }}
      </p>
      <div ref="viewport" class="house-grid-viewport">
        <canvas
          ref="scene"
          :class="{ pan }"
          :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
          :width="Math.ceil(bounds.w * 32 * 2)"
          :height="Math.ceil(bounds.h * 32 * 2)"
          tabindex="0"
          aria-label="Grille d’aménagement"
          @pointerdown="sceneDown"
          @pointermove="sceneHover"
          @keydown.r.prevent="rotateTool"
          @keydown.esc.prevent="
            tool = null;
            preview = null;
            draw();
          "
        />
      </div>
      <div class="house-selected">
        <span
          ><b>{{ selectedName || 'Aucun élément sélectionné' }}</b
          ><small v-if="tool">{{
            tool.kind === 'stair'
              ? 'L’escalier reste relié à l’autre étage.'
              : 'Un déplacement ne consomme aucun meuble.'
          }}</small></span
        ><button
          v-if="
            tool?.kind === 'furniture' &&
            draft.placements.some((p) => p.id === tool.id)
          "
          :disabled="locked"
          @click="remove"
        >
          Ranger</button
        ><button
          v-if="tool?.kind === 'furniture'"
          :disabled="locked"
          data-housing-rotate
          @click="rotateTool"
        >
          ↻ Tourner · {{ tool.rotation || 0 }}°</button
        ><button
          v-if="tool"
          @click="
            tool = null;
            preview = null;
            draw();
          "
        >
          Désélectionner
        </button>
      </div>
      <div class="house-stairs-tools">
        <span>Escaliers</span
        ><button v-if="draft.stairs.up" :disabled="locked" @click="stair('up')">
          ↗ Vers l’étage supérieur</button
        ><button
          v-if="draft.stairs.down"
          :disabled="locked"
          @click="stair('down')"
        >
          ↙ Vers l’étage inférieur</button
        ><small v-if="!draft.stairs.up && !draft.stairs.down"
          >Ils apparaissent lors de l’achat d’un étage.</small
        >
      </div>
    </div>
  </div>
</template>
<script>
import config from '@/data/housing.json';
import {
  housingModel,
  artItem,
  loadHousingArt,
  drawFurniture,
  drawStair,
  housingRenderPlan,
  furnitureBounds,
  furnitureSize,
} from '@/services/housingArt';
import { inside, layoutError, projected } from '@/services/housingPlacement';
import { resolveMapAsset } from '@/services/mapAssets';
import HousingItemIcon from './HousingItemIcon.vue';
const clone = (v) => JSON.parse(JSON.stringify(v));
export default {
  components: { HousingItemIcon },
  props: { home: Object, floor: Number, locked: Boolean },
  data() {
    return {
      draft: clone(this.home.floors[this.floor]),
      query: '',
      tool: null,
      preview: null,
      previewError: '',
      pan: false,
      zoom: 1,
      history: [],
      ready: false,
    };
  },
  computed: {
    model() {
      return housingModel(this.draft.model);
    },
    bounds() {
      const m = this.model;
      return { x: m.x - 1, y: m.y - 3, w: m.w + 2, h: m.h + 5 };
    },
    canvasWidth() {
      return Math.max(300, (this.model.w + 2) * 23) * this.zoom;
    },
    canvasHeight() {
      return (this.canvasWidth * this.bounds.h) / this.bounds.w;
    },
    stock() {
      const counts = {};
      for (const [floorIndex, f] of this.home.floors.entries())
        for (const p of floorIndex === this.floor
          ? this.draft.placements
          : f.placements)
          counts[p.key] = (counts[p.key] || 0) + 1;
      return config.furniture
        .filter(
          (i) =>
            (this.home.inventory[i.key] || 0) > 0 &&
            i.name.toLocaleLowerCase().includes(this.query.toLocaleLowerCase())
        )
        .map((i) => ({
          ...i,
          available: (this.home.inventory[i.key] || 0) - (counts[i.key] || 0),
        }));
    },
    selectedName() {
      return this.tool?.kind === 'stair'
        ? this.tool.key === 'up'
          ? 'Escalier montant'
          : 'Escalier descendant'
        : artItem(this.tool?.key)?.name || '';
    },
    dirty() {
      return (
        JSON.stringify(this.draft) !==
        JSON.stringify(this.home.floors[this.floor])
      );
    },
  },
  watch: {
    dirty(v) {
      this.$emit('dirty', v);
    },
    home() {
      this.reset();
    },
    floor() {
      this.reset();
    },
    zoom() {
      this.$nextTick(this.draw);
    },
    query() {
      this.$nextTick(this.draw);
    },
  },
  async mounted() {
    try {
      this._art = await loadHousingArt();
      await this.loadBackground();
      if (this._isBeingDestroyed || this._isDestroyed) return;
      this.ready = true;
      this.draw();
    } catch (_) {
      this.previewError =
        'Les images de la pièce n’ont pas pu être chargées. Rouvre l’éditeur pour réessayer.';
    }
  },
  beforeDestroy() {
    this.clearDrag();
    cancelAnimationFrame(this._frame);
  },
  methods: {
    async loadBackground() {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = resolveMapAsset(
          'housing_' + this.draft.model + (this.floor > 0 ? '_upper' : '')
        );
      });
      this._background = image;
    },
    reset() {
      this.clearDrag();
      this.draft = clone(this.home.floors[this.floor]);
      this.history = [];
      this.tool = null;
      this.preview = null;
      this.previewError = '';
      this.loadBackground()
        .then(() => this.draw())
        .catch(() => {
          this.previewError =
            'Impossible de charger la pièce. Rouvre l’éditeur pour réessayer.';
        });
      this.$emit('dirty', false);
    },
    change(next) {
      this.history.push(clone(this.draft));
      this.history = this.history.slice(-20);
      this.draft = next;
      this.preview = null;
      this.previewError = '';
      this.draw();
    },
    undo() {
      if (this.history.length) {
        this.draft = this.history.pop();
        this.preview = null;
        this.tool = null;
        this.draw();
      }
    },
    stair(key) {
      this.pan = false;
      this.tool = { kind: 'stair', key };
      this.preview = null;
      this.draw();
    },
    stockClick(item) {
      if (performance.now() < (this._ignoreClick || 0) || item.available <= 0)
        return;
      this.tool = {
        kind: 'furniture',
        key: item.key,
        id: crypto.randomUUID(),
        rotation: 0,
      };
      this.pan = false;
      this.preview = null;
      this.draw();
    },
    stockDown(e, item) {
      if (this.locked || item.available <= 0) return;
      this.armDrag(e, () => {
        this.tool = {
          kind: 'furniture',
          key: item.key,
          rotation: 0,
          id: crypto.randomUUID(),
        };
        this.pan = false;
      });
    },
    armDrag(e, activate, immediate = false) {
      this.clearDrag();
      const origin = { x: e.clientX, y: e.clientY, id: e.pointerId };
      let started = false;
      const start = () => {
        started = true;
        activate();
      };
      if (e.pointerType === 'touch' && !immediate)
        this._hold = setTimeout(start, 180);
      else start();
      const move = (ev) => {
        if (ev.pointerId !== origin.id) return;
        if (!started) {
          if (Math.hypot(ev.clientX - origin.x, ev.clientY - origin.y) > 8)
            this.clearDrag();
          return;
        }
        ev.preventDefault();
        this.setPreview(ev);
      };
      const end = (ev) => {
        if (ev.pointerId !== origin.id) return;
        const was = started;
        this.clearDrag();
        if (was) {
          this._ignoreClick = performance.now() + 250;
          this.commitAt(ev);
        }
      };
      const cancel = () => this.clearDrag();
      window.addEventListener('pointermove', move, { passive: false });
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', cancel);
      this._stop = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', cancel);
      };
    },
    clearDrag() {
      clearTimeout(this._hold);
      this._stop?.();
      this._stop = null;
    },
    location(e) {
      const r = this.$refs.scene?.getBoundingClientRect();
      if (
        !r ||
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        return null;
      return {
        x: Math.floor(
          this.bounds.x + ((e.clientX - r.left) / r.width) * this.bounds.w
        ),
        y: Math.floor(
          this.bounds.y + ((e.clientY - r.top) / r.height) * this.bounds.h
        ),
      };
    },
    sceneDown(e) {
      if (this.locked || !this.ready) return;
      e.preventDefault();
      if (this.pan) {
        const v = this.$refs.viewport,
          base = {
            x: e.clientX,
            y: e.clientY,
            left: v.scrollLeft,
            top: v.scrollTop,
          };
        const move = (ev) => {
          v.scrollLeft = base.left - (ev.clientX - base.x);
          v.scrollTop = base.top - (ev.clientY - base.y);
        };
        const end = () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', end);
          window.removeEventListener('pointercancel', end);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', end);
        window.addEventListener('pointercancel', end);
        this._stop = end;
        return;
      }
      const point = this.location(e);
      if (!point) return;
      const p = [...this.draft.placements].reverse().find((p) => {
        const i = furnitureSize(p);
        return (
          point.x >= p.x &&
          point.x < p.x + i.w &&
          point.y >= p.y &&
          point.y < p.y + i.h
        );
      });
      if (!this.tool && p)
        this.tool = {
          kind: 'furniture',
          key: p.key,
          id: p.id,
          rotation: p.rotation ?? 0,
        };
      if (!this.tool) return;
      this.armDrag(e, () => {}, true);
      this.setPreview(e);
    },
    sceneHover(e) {
      if (this.tool && !this.pan && !this._stop) this.setPreview(e);
    },
    setPreview(e) {
      const p = this.location(e);
      if (!p || !this.tool) return;
      if (this.preview?.x === p.x && this.preview?.y === p.y) return;
      this.preview = p;
      this.previewError = layoutError(
        projected(this.draft, this.tool, p.x, p.y)
      );
      this.scheduleDraw();
    },
    commitAt(e) {
      const p = this.location(e);
      if (!p || !this.tool) return;
      const next = projected(this.draft, this.tool, p.x, p.y),
        error = layoutError(next);
      if (error) {
        this.preview = p;
        this.previewError = error;
        this.draw();
        return;
      }
      this.change(next);
    },
    rotateTool() {
      if (this.locked || this.tool?.kind !== 'furniture') return;
      this.tool = {
        ...this.tool,
        rotation: ((this.tool.rotation || 0) + 90) % 360,
      };
      const placed = this.draft.placements.find((p) => p.id === this.tool.id);
      if (placed) {
        const next = projected(this.draft, this.tool, placed.x, placed.y),
          error = layoutError(next);
        if (error) this.previewError = error;
        else this.change(next);
      }
      if (this.preview)
        this.previewError = layoutError(
          projected(this.draft, this.tool, this.preview.x, this.preview.y)
        );
      this.draw();
    },
    remove() {
      if (!this.tool) return;
      const next = clone(this.draft);
      next.placements = next.placements.filter((p) => p.id !== this.tool.id);
      this.change(next);
      this.tool = null;
    },
    scheduleDraw() {
      if (this._frame) return;
      this._frame = requestAnimationFrame(() => {
        this._frame = null;
        this.draw();
      });
    },
    draw() {
      const canvas = this.$refs.scene;
      if (!canvas || !this._background || !this._art) return;
      const c = canvas.getContext('2d'),
        b = this.bounds,
        scale = canvas.width / (b.w * 32);
      c.setTransform(scale, 0, 0, scale, -b.x * 32 * scale, -b.y * 32 * scale);
      c.clearRect(b.x * 32, b.y * 32, b.w * 32, b.h * 32);
      c.imageSmoothingEnabled = false;
      c.drawImage(this._background, 0, 0, 896, 640);
      for (let y = this.model.y; y < this.model.y + this.model.h; y++)
        for (let x = this.model.x; x < this.model.x + this.model.w; x++)
          if (inside(this.model, x, y)) {
            c.strokeStyle = '#6d96a338';
            c.lineWidth = 0.7;
            c.strokeRect(x * 32, y * 32, 32, 32);
          }
      const f =
          this.preview && this.tool
            ? projected(this.draft, this.tool, this.preview.x, this.preview.y)
            : this.draft,
        plan = housingRenderPlan(f);
      for (const p of plan.ground) drawFurniture(c, this._art, p);
      drawStair(c, this._art, f.stairs.up, true);
      drawStair(c, this._art, f.stairs.down, false);
      for (const p of plan.objects)
        drawFurniture(c, this._art, p, this.tool?.id === p.id ? 0.85 : 1);
      if (this.preview && this.tool) {
        const p = this.preview,
          item =
            this.tool.kind === 'stair'
              ? { w: 2, h: 2 }
              : furnitureSize(this.tool);
        c.fillStyle = this.previewError ? '#d2535050' : '#69aa8250';
        c.strokeStyle = this.previewError ? '#e6867f' : '#70b594';
        c.lineWidth = 2;
        c.fillRect(p.x * 32, p.y * 32, item.w * 32, item.h * 32);
        c.strokeRect(p.x * 32, p.y * 32, item.w * 32, item.h * 32);
      } else if (this.tool?.kind === 'furniture') {
        const p = f.placements.find((p) => p.id === this.tool.id);
        if (p) {
          const a = furnitureBounds(p);
          c.strokeStyle = '#62acc7';
          c.lineWidth = 2;
          c.strokeRect(a.x - 2, a.y - 2, a.w + 4, a.h + 4);
        }
      }
      c.setTransform(1, 0, 0, 1, 0, 0);
    },
  },
};
</script>
<style scoped>
.housing-editor {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  gap: 18px;
  min-height: 0;
}
.house-library {
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.library-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.library-title h3 {
  font-size: 15px;
  margin: 0;
}
.library-title > b {
  font-size: 11px;
  color: var(--journal-muted);
}
input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--journal-border);
  background: var(--journal-paper);
  color: var(--journal-ink);
  font: inherit;
  border-radius: 7px;
  padding: 10px;
  font-size: 12px;
}
.house-stock {
  overflow: auto;
  max-height: 510px;
  overscroll-behavior: contain;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.house-stock button {
  flex: none;
  min-height: 65px;
  display: flex;
  gap: 7px;
  align-items: center;
  padding: 7px;
  text-align: left;
  touch-action: pan-y;
}
.house-stock b {
  display: block;
  font-size: 11px;
}
.house-stock small {
  display: block;
  font-size: 10px;
  color: var(--journal-muted);
  margin-top: 3px;
}
.house-stock button:disabled {
  opacity: 0.4;
}
.house-stock button[aria-pressed='true'] {
  background: var(--journal-selected);
  border-color: var(--journal-accent);
}
button {
  background: var(--journal-card);
  color: var(--journal-ink);
  border: 1px solid var(--journal-border);
  border-radius: 8px;
  cursor: pointer;
  min-height: 35px;
}
button:disabled {
  opacity: 0.45;
  cursor: default;
}
.house-workspace {
  min-width: 0;
}
.house-editor-tools {
  display: flex;
  gap: 5px;
  align-items: center;
  flex-wrap: wrap;
}
.house-editor-tools button {
  font: inherit;
  font-size: 10px;
  padding: 6px 9px;
}
.house-editor-tools span {
  font-size: 10px;
}
.house-editor-tools [aria-pressed='true'] {
  background: var(--journal-selected);
  border-color: var(--journal-accent);
}
.house-grid-viewport {
  overflow: auto;
  max-height: 460px;
  border: 1px solid var(--journal-border);
  border-radius: 10px;
  background: #0a111a;
  overscroll-behavior: contain;
}
.house-grid-viewport canvas {
  display: block;
  touch-action: none;
  image-rendering: pixelated;
  cursor: crosshair;
  max-width: none;
}
.house-grid-viewport canvas.pan {
  cursor: grab;
}
.house-placement-help {
  font-size: 11px;
  color: var(--journal-muted);
  line-height: 1.5;
  min-height: 32px;
  margin: 10px 0;
}
.house-placement-help.is-invalid {
  color: #c75553;
}
.house-selected {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 11px;
  flex-wrap: wrap;
}
.house-selected > span {
  flex: 1;
  min-width: 130px;
}
.house-selected b {
  font-size: 12px;
}
.house-selected small {
  display: block;
  font-size: 10px;
  color: var(--journal-muted);
  margin-top: 4px;
}
.house-selected button {
  font: inherit;
  font-size: 10px;
  padding: 8px;
}
.house-stairs-tools {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 12px;
}
.house-stairs-tools > span {
  font-size: 11px;
  font-weight: bold;
}
.house-stairs-tools button {
  font: inherit;
  font-size: 10px;
  padding: 8px;
}
.house-stairs-tools small,
.house-empty {
  font-size: 11px;
  color: var(--journal-muted);
  line-height: 1.6;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
@media (max-width: 700px) {
  .housing-editor {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
  .house-stock {
    flex-direction: row;
    max-height: 105px;
    padding-bottom: 5px;
    overflow-x: auto;
    margin-top: 6px;
  }
  .house-stock button {
    flex: 0 0 150px;
    gap: 4px;
    touch-action: pan-x;
  }
  .house-stock canvas {
    width: 44px;
    height: 44px;
  }
  .house-library input {
    padding: 8px;
  }
  .library-title {
    margin-bottom: 5px;
  }
  .house-grid-viewport {
    max-height: 340px;
  }
  .house-editor-tools button {
    min-height: 38px;
  }
  .house-placement-help {
    margin: 6px 0;
    min-height: 32px;
  }
}
</style>
