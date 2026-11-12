<template>
  <div class="housing-editor" data-housing-editor>
    <div class="editor-heading">
      <nav aria-label="Aménagement" class="editor-tabs">
        <button :aria-pressed="view==='room'" @click="view='room'">⌂ Pièce</button>
        <button :aria-pressed="view==='furniture'" @click="view='furniture'">▤ Meubles <small>{{draft.placements.length}} / 20</small></button>
      </nav>
      <button class="editor-undo" :disabled="!history.length||locked" @click="undo">↶ Annuler</button>
    </div>
    <aside v-show="view==='furniture'" class="house-library">
      <label><span class="sr-only">Chercher un meuble</span><input v-model="query" type="search" placeholder="Trouver un meuble…" :disabled="locked"/></label>
      <p class="house-library-help">Choisis un meuble, puis touche une case de la pièce pour le poser.</p>
      <div class="house-stock">
        <button v-for="item in stock" :key="item.key" :disabled="locked||item.available<=0" :aria-pressed="tool?.key===item.key" @pointerdown="stockDown($event,item)" @click="stockClick(item)">
          <housing-item-icon :item-key="item.key"/><span><b>{{item.name}}</b><small>{{item.available}} disponible{{item.available>1?'s':''}}</small></span><span aria-hidden="true">＋</span>
        </button>
        <p v-if="!stock.length" class="house-empty">Les meubles s’achètent au Grand Comptoir.</p>
      </div>
    </aside>
    <div v-show="view==='room'" class="house-workspace">
      <p class="house-placement-help" :class="{'is-invalid':previewError}" role="status">{{previewError || (tool?.kind==='stair'?'Touche une case pour déplacer l’escalier.':tool ? installed?'Glisse ce meuble pour le déplacer. Touche une zone vide pour le désélectionner.':'Touche une case libre pour poser '+selectedName+'.':'Touche un meuble pour le sélectionner, ou ouvre la liste Meubles.')}}</p>
      <div class="house-scene-area">
        <div ref="viewport" class="house-grid-viewport">
          <div class="house-scene-content" :style="{width:Math.max(viewportWidth,canvasWidth)+'px',height:Math.max(viewportHeight,canvasHeight)+'px'}">
            <canvas ref="scene" :style="{width:canvasWidth+'px',height:canvasHeight+'px'}" :width="Math.ceil(bounds.w*32*2)" :height="Math.ceil(bounds.h*32*2)" tabindex="0" aria-label="Grille d’aménagement" @pointerdown="sceneDown" @pointermove="sceneHover" @keydown.r.prevent="rotateTool" @keydown.esc.prevent="deselect"/>
          </div>
        </div>
        <label class="house-zoom"><span aria-hidden="true">＋</span><span class="zoom-track"><input v-model.number="zoom" type="range" min="0.6" max="3" step="0.02" aria-label="Zoom de la pièce" @keydown.up.prevent="adjustZoom(.1)" @keydown.down.prevent="adjustZoom(-.1)"/></span><span aria-hidden="true">−</span></label>
      </div>
      <div class="house-selection-slot"><div v-if="tool" class="house-selected">
        <span><b>{{selectedName}}</b><small>{{tool.kind==='stair'?'L’escalier reste relié à l’autre étage.':installed?'Position retenue · enregistre pour la conserver.':'Choisis un emplacement libre.'}}</small></span>
        <div class="selected-actions">
          <button v-if="tool.kind==='furniture'" :disabled="locked" data-housing-rotate @click="rotateTool">↻ Tourner <small>{{tool.rotation||0}}°</small></button>
          <button v-if="tool.kind==='furniture'&&installed" :disabled="locked" @click="remove">▤ Ranger</button>
          <button @click="deselect">× Désélectionner</button>
        </div>
      </div>
      </div>
      <p v-if="draft.stairs.up||draft.stairs.down" class="house-stairs-tools">Les escaliers sont fixes à gauche. Garde leurs accès dégagés.</p>
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
      view: 'room',
      viewportWidth: 1,
      viewportHeight: 1,
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
      return { x: Math.max(0, m.x - 2), y: m.y - 3, w: m.w + 3, h: m.h + 5 };
    },
    canvasWidth() {
      return Math.max(1,Math.min(this.viewportWidth-12,(this.viewportHeight-12)*this.bounds.w/this.bounds.h))*this.zoom;
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
    installed() {
      return this.tool?.kind==='furniture' && this.draft.placements.some(p=>p.id===this.tool.id);
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
    zoom(value,old) {
      const el=this.$refs.viewport;if(!el)return;
      const ratio=value/old;
      const x=(el.scrollLeft+el.clientWidth/2)/Math.max(el.clientWidth,this.canvasWidth/ratio);
      const y=(el.scrollTop+el.clientHeight/2)/Math.max(el.clientHeight,this.canvasHeight/ratio);
      this.$nextTick(()=>{el.scrollLeft=x*Math.max(el.clientWidth,this.canvasWidth)-el.clientWidth/2;el.scrollTop=y*Math.max(el.clientHeight,this.canvasHeight)-el.clientHeight/2;});
    },
    view() { this.$nextTick(()=>{this.measure();this.draw();}); },
    query() {
      this.$nextTick(this.draw);
    },
  },
  async mounted() {
    this._resize=new ResizeObserver(()=>this.measure());
    this._resize.observe(this.$refs.viewport);
    this.measure();
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
    this._resize?.disconnect();
  },
  methods: {
    measure() {
      const el=this.$refs.viewport;
      if(el?.clientWidth&&el?.clientHeight){this.viewportWidth=el.clientWidth;this.viewportHeight=el.clientHeight;}
    },
    adjustZoom(step){this.zoom=Math.max(.6,Math.min(3,this.zoom+step));},
    deselect(){this.clearDrag();this.tool=null;this.preview=null;this.previewError='';this.draw();},
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
      this.zoom = 1;
      this.view = 'room';
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
    stockClick(item) {
      if (performance.now() < (this._ignoreClick || 0) || item.available <= 0)
        return;
      this.tool = {
        kind: 'furniture',
        key: item.key,
        id: crypto.randomUUID(),
        rotation: 0,
      };
      this.view = 'room';
      this.preview = null;
      this.draw();
    },
    stockDown(e, item) {
      if(this.locked||item.available<=0||e.isPrimary===false||(e.pointerType==='mouse'&&e.button!==0))return;
      this.armDrag(e,()=>{
        this.tool={kind:'furniture',key:item.key,rotation:0,id:crypto.randomUUID()};
        this.view='room';
      },{fromStock:true});
    },
    armDrag(e, activate, options={}) {
      this.clearDrag();
      const origin={x:e.clientX,y:e.clientY,id:e.pointerId};
      let started=false,moved=false;
      const start=()=>{if(started)return;started=true;activate();this._dragOffset=options.offset||null;};
      if(e.pointerType==='touch')this._hold=setTimeout(start,180);
      const move=ev=>{
        if(ev.pointerId!==origin.id)return;
        if(Math.hypot(ev.clientX-origin.x,ev.clientY-origin.y)<7&&!moved)return;
        if(options.fromStock&&e.pointerType==='touch'&&!started){this.clearDrag();return;}
        moved=true;start();ev.preventDefault();this.setPreview(ev);
      };
      const end=ev=>{
        if(ev.pointerId!==origin.id)return;
        if(started&&moved){this._ignoreClick=performance.now()+350;this.commitAt(ev);}
        else options.tap?.(ev);
        this.clearDrag();
      };
      const cancel=()=>{this.clearDrag();this.preview=null;this.draw();};
      window.addEventListener('pointermove',move,{passive:false});
      window.addEventListener('pointerup',end);window.addEventListener('pointercancel',cancel);
      this._stop=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',cancel);};
    },
    clearDrag() {
      clearTimeout(this._hold);this._stop?.();this._stop=null;this._dragOffset=null;
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
      if(this.locked||!this.ready||e.isPrimary===false||(e.pointerType==='mouse'&&e.button!==0))return;
      e.preventDefault();this.$refs.scene.focus({preventScroll:true});
      const point=this.location(e);if(!point)return;
      const rect=this.$refs.scene.getBoundingClientRect();
      const world={x:(this.bounds.x+(e.clientX-rect.left)/rect.width*this.bounds.w)*32,y:(this.bounds.y+(e.clientY-rect.top)/rect.height*this.bounds.h)*32};
      const hit=[...this.draft.placements].reverse().find(p=>{const b=furnitureBounds(p);return world.x>=b.x&&world.x<b.x+b.w&&world.y>=b.y&&world.y<b.y+b.h;});
      if(this.tool&&(this.tool.kind==='stair'||!this.installed)){
        this.armDrag(e,()=>{},{tap:ev=>this.commitAt(ev)});return;
      }
      if(hit){
        this.tool={kind:'furniture',key:hit.key,id:hit.id,rotation:hit.rotation||0};this.preview=null;this.previewError='';this.draw();
        this.armDrag(e,()=>{},{offset:{x:point.x-hit.x,y:point.y-hit.y}});return;
      }
      // Empty drag scrolls a zoomed room; an empty tap only deselects.
      this.clearDrag();const v=this.$refs.viewport,base={x:e.clientX,y:e.clientY,left:v.scrollLeft,top:v.scrollTop};let moved=false;
      const move=ev=>{if(ev.pointerId!==e.pointerId)return;if(Math.hypot(ev.clientX-base.x,ev.clientY-base.y)>7)moved=true;if(moved){ev.preventDefault();v.scrollLeft=base.left-(ev.clientX-base.x);v.scrollTop=base.top-(ev.clientY-base.y);}};
      const end=ev=>{if(ev.pointerId!==e.pointerId)return;this.clearDrag();if(!moved)this.deselect();};
      const cancel=()=>this.clearDrag();window.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',end);window.addEventListener('pointercancel',cancel);
      this._stop=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',cancel);};
    },
    sceneHover(e) {
      if(this.tool&&!this.installed&&!this._stop&&e.pointerType!=='touch')this.setPreview(e);
    },
    dropLocation(e){const p=this.location(e);return p?{x:p.x-(this._dragOffset?.x||0),y:p.y-(this._dragOffset?.y||0)}:null;},
    setPreview(e) {
      const p = this.dropLocation(e);
      if (!p || !this.tool) return;
      if (this.preview?.x === p.x && this.preview?.y === p.y) return;
      this.preview = p;
      this.previewError = layoutError(
        projected(this.draft, this.tool, p.x, p.y)
      );
      this.scheduleDraw();
    },
    commitAt(e) {
      const p = this.dropLocation(e);
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
      const previous=this.tool;
      this.tool = {
        ...this.tool,
        rotation: ((this.tool.rotation || 0) + 90) % 360,
      };
      const placed = this.draft.placements.find((p) => p.id === this.tool.id);
      if (placed) {
        const next = projected(this.draft, this.tool, placed.x, placed.y),
          error = layoutError(next);
        if (error) {this.previewError=error;this.tool=previous;}
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
.housing-editor{height:100%;min-height:0;min-width:0;display:flex;flex-direction:column;gap:8px;color:var(--journal-ink)}
button{font:inherit;color:inherit;background:var(--journal-card);border:1px solid var(--journal-border);border-radius:9px;cursor:pointer;min-height:44px;padding:8px 12px;font-size:12px}button:disabled{opacity:.45;cursor:default}button:focus-visible,input:focus-visible,summary:focus-visible{outline:2px solid var(--journal-accent);outline-offset:2px}.editor-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;flex:none}.editor-tabs{display:flex;gap:6px}.editor-tabs button[aria-pressed=true]{background:var(--journal-selected);border-color:var(--journal-accent);font-weight:700}.editor-tabs small{font-weight:400;opacity:.7;margin-left:7px}.editor-undo{background:transparent;font-size:11px}.house-library{min-height:0;display:flex;flex:1;flex-direction:column}.house-library input{width:100%;box-sizing:border-box;border:1px solid var(--journal-border);background:var(--journal-paper);color:inherit;font:inherit;padding:12px;border-radius:9px;font-size:13px}.house-library-help,.house-empty{font-size:12px;color:var(--journal-muted);line-height:1.5}.house-stock{overflow:auto;overscroll-behavior:contain;min-height:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-content:start;gap:10px;padding:3px}.house-stock button{min-width:0;display:flex;align-items:center;gap:8px;text-align:left;min-height:88px;touch-action:pan-y}.house-stock button>span:nth-child(2){flex:1;min-width:0}.house-stock b,.house-stock small{display:block;font-size:12px}.house-stock small{font-size:10px;color:var(--journal-muted);margin-top:6px}.house-stock button[aria-pressed=true]{background:var(--journal-selected);border-color:var(--journal-accent)}.house-workspace{flex:1;min-height:0;min-width:0;display:flex;flex-direction:column;gap:7px}.house-placement-help{flex:none;min-height:29px;font-size:11px;color:var(--journal-muted);line-height:1.4;margin:0}.house-placement-help.is-invalid{color:#c75553}.house-scene-area{display:flex;gap:5px;flex:1;min-height:0;min-width:0}.house-grid-viewport{min-height:0;min-width:0;flex:1;overflow:auto;border:1px solid var(--journal-border);border-radius:12px;background:#0a111a;overscroll-behavior:contain;scrollbar-width:thin}.house-scene-content{display:grid;place-items:center;box-sizing:border-box}.house-grid-viewport canvas{display:block;touch-action:none;image-rendering:pixelated;max-width:none;flex:none;cursor:crosshair;outline-offset:-3px}.house-zoom{width:42px;flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;font-size:18px;background:var(--journal-soft);border-radius:12px}.zoom-track{position:relative;height:min(160px,calc(100% - 55px));width:40px;display:grid;place-items:center}.zoom-track input{width:clamp(60px,20vh,160px);height:36px;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-90deg);margin:0;max-width:none;accent-color:var(--journal-accent);cursor:ns-resize;touch-action:none}.house-selection-slot{flex:none;height:62px}.house-selected{box-sizing:border-box;height:62px;flex:none;display:flex;align-items:center;gap:12px;border:1px solid var(--journal-border);border-radius:10px;padding:9px;background:var(--journal-card)}.house-selected>span{flex:1;min-width:0}.house-selected b{font-size:12px}.house-selected small{display:block;font-size:10px;line-height:1.4;color:var(--journal-muted);margin-top:3px}.selected-actions{display:flex;gap:5px;flex-wrap:wrap}.selected-actions button{font-size:11px;min-height:44px}.selected-actions button[data-housing-rotate]{background:var(--journal-selected);border-color:var(--journal-accent)}.selected-actions button small{display:inline;margin-left:4px}.house-stairs-tools{flex:none;font-size:11px;color:var(--journal-muted)}.house-stairs-tools summary{cursor:pointer;padding:5px 0}.house-stairs-tools button{font-size:10px;margin-right:6px}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
@media(max-width:700px){.house-selection-slot{height:62px}.house-stock{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.house-stock button{padding:7px;min-height:90px;gap:5px}.house-stock button>span:last-child{display:none}.house-stock b{font-size:11px}.house-selected{flex-direction:column;align-items:stretch;gap:3px;padding:0;border:0;background:transparent}.house-selected>span{display:flex;align-items:center;gap:8px}.house-selected>span small{display:none}.selected-actions{flex-wrap:nowrap}.selected-actions button{padding:5px 4px;flex:1;font-size:10px;min-height:40px}.house-zoom{width:36px}.zoom-track{position:relative;height:min(120px,calc(100% - 55px));width:36px}.zoom-track input{width:clamp(50px,16vh,120px)}.house-placement-help{font-size:10px;min-height:28px}.editor-tabs button{font-size:11px;padding:7px 10px}.editor-tabs small{margin-left:3px}.editor-undo{font-size:10px;padding:7px}.house-workspace{gap:5px}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
@media(max-height:550px){.house-selection-slot{height:44px}.house-selected{height:44px;padding:0;border:0;background:transparent;flex-direction:row}.house-selected>span{display:none}.selected-actions{width:100%;flex-wrap:nowrap}.selected-actions button{flex:1;min-height:40px}.house-placement-help{min-height:0;font-size:10px}.editor-heading button{min-height:36px;padding:6px 8px}.housing-editor{gap:5px}}
</style>
