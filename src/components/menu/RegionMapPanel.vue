<template>
  <div class="region-backdrop" @mousedown.self="$emit('close')">
    <section class="region-panel" role="dialog" aria-modal="true" aria-labelledby="region-title" @keydown.stop="onKey" @keyup.stop :class="{'reduce-motion': !animationsEnabled}">
      <header class="region-header">
        <div><p>RIFTMON <span>/ {{ en ? 'REGION GUIDE' : 'CARTE DE LA RÉGION' }}</span></p><h2 id="region-title">{{ pokemon ? pokemon.name : 'Minimap' }}</h2></div>
        <button ref="close" class="region-close" :aria-label="en ? 'Close map' : 'Fermer la carte'" @click="$emit('close')">×</button>
      </header>
      <div v-if="loading || error" class="region-state" role="status"><p>{{ error || (en ? 'Unfolding the map…' : 'Ouverture de la carte…') }}</p><button v-if="error" @click="load">{{ en ? 'Retry' : 'Réessayer' }}</button></div>
      <div v-else-if="atlas" class="region-content">
        <div class="region-location"><span class="you-dot"></span><span>{{ en ? 'You are here' : 'Tu es ici' }} <strong>{{ currentLabel }}</strong></span><button @click="showCurrent" :disabled="!currentNode">{{ en ? 'Locate me' : 'Me situer' }}</button></div>
        <div v-if="pokemon" class="habitat-heading" role="status">
          <img :src="`${$assetBase}img/pokemon/front/${pokemon.id}.png`" alt="" width="40" height="40">
          <span v-if="habitat.kind === 'wild'">{{ en ? 'Wild encounters' : 'Rencontres sauvages' }}<small>{{ en ? 'Choose a marker or a location below.' : 'Choisis un repère ou un lieu ci-dessous.' }}</small></span>
          <span v-else-if="habitat.kind === 'evolution'">{{ en ? 'Obtained through evolution' : 'À obtenir par évolution' }}<small>{{ en ? 'The markers show where to catch its earlier forms.' : 'Les repères indiquent où capturer ses pré-évolutions.' }}</small></span>
          <span v-else>{{ en ? 'No known wild habitat' : 'Aucun habitat sauvage connu' }}<small>{{ en ? 'This species has no wild encounter in the current region.' : 'Cette espèce ne se rencontre pas dans la région actuelle.' }}</small></span>
        </div>
        <div class="map-scroll" ref="mapScroll" :class="{dragging}" tabindex="0" :aria-label="en ? 'Regional map. Zoom with + and −; move with arrow keys.' : 'Carte régionale. Zoome avec + et − ; déplace avec les flèches.'"
          @wheel.prevent="wheelZoom" @pointerdown.prevent="beginPointer" @pointermove="movePointer" @pointerup="endPointer" @pointercancel="endPointer" @lostpointercapture="endPointer" @click.capture="mapClick">
          <div class="map-surface" :style="surfaceStyle">
          <svg class="region-art" :style="artStyle" :viewBox="`0 0 ${atlas.width} ${atlas.height}`" role="img" :aria-label="en ? 'Towns, routes and your position' : 'Villes, routes et ta position'">
            <defs>
              <pattern id="region-sea" width="32" height="28" patternUnits="userSpaceOnUse"><rect width="32" height="28" fill="#369fb1"/><path d="M2 20h10v2H2M20 7h8v2h-8" fill="#66bdc1" opacity=".4"/></pattern>
              <pattern id="region-forest" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M6 2h4v3h3v6H3V5h3" fill="#73ae64"/><path d="M3 10h10v2H3M7 12h2v2H7" fill="#5b995a"/></pattern>
              <pattern id="region-snow" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#d9ead9"/><path d="M2 4h4v2H2m10 8h6v2h-6" fill="#bdd6cd"/></pattern>
            </defs>
            <g shape-rendering="crispEdges">
              <path fill="url(#region-sea)" d="M0 0H512V448H0Z"/>
              <path d="M24 96H40V80H88V92H112V124H124V180H144V196H240V168H272V176H308V188H348V176H400V188H480V204H496V304H476V326H404V352H392V432H40V424H24V396H32V288H20V248H28V168H16V124H24Z" fill="#76c6b1" stroke="#76c6b1" stroke-width="16"/>
              <path d="M24 96H40V80H88V92H112V124H124V180H144V196H240V168H272V176H308V188H348V176H400V188H480V204H496V304H476V326H404V352H392V432H40V424H24V396H32V288H20V248H28V168H16V124H24Z" fill="#b3ce70" stroke="#e4d68a" stroke-width="6"/>
              <path d="M32 104H48V88H84V100H104V136H116V176H104V200H36V164H24V128H32Z" fill="url(#region-snow)"/>
              <path d="M36 210H100V248H88V280H100V360H84V386H40V368H48V284H36Z" fill="#aeae78"/>
              <path d="M46 222v-10h8v-8h8v8h8v10h8v10H38v-10m4 72v-10h8v-10h12v10h8v10h8v10H34v-10m10 43v-10h10v-12h10v12h10v10h8v8H36v-8" fill="#8d9c78"/>
              <path d="M38 126v-8h8v-12h10V96h8v10h10v12h8v8h8v8H30v-8" fill="#9ab9b6"/><path d="M46 118v-12h10V96h8v10h10v12H64v-6h-8v6Z" fill="#f2f6dd"/>
              <path d="M100 210h40v30h-24v42h-20v-8H84v-30h16m70 74h72v58h-16v26h-60v-24h-16v-32h20m122-52h40v38h-12v72h-40v-30h12m112-70h42v42h-12v18h-30Z" fill="url(#region-forest)"/>
              <path d="M174 206h56v12h16v30h-14v14h-56v-12h-16v-28h14Z" fill="#e2d38a"/><path d="M178 210h48v12h16v22h-14v14h-48v-12h-16v-20h14Z" fill="#54b7c3"/><path d="M184 216h34v4h-34m-8 22h50v4h-50" fill="none" stroke="#8dd4d1" stroke-width="2"/>
              <path d="M282 174h12v8h12v12h12v20h-12v-8h-12v-10h-12v10h-14v-12h6v-12h8m44 16h8v8h8v10h-24v-10h8" fill="#8ea573"/>
              <path d="M294 380h18v10h18v28h-42v-18h6" fill="#5cbcc4"/>
              <path d="M4 52h16v-8h12v8h8v24H12v-8H4m426 34h20V76h24v14h8v20h-24v12h-32Z" fill="#88bd78" stroke="#e5d68c" stroke-width="4"/>
              <g v-for="edge in edges" :key="edge.id">
                <path :d="edge.path" fill="none" :stroke="edge.cave ? '#7e8765' : '#d1aa65'" stroke-width="10"/>
                <path :d="edge.path" fill="none" :stroke="edge.cave ? '#d0c2a1' : '#f4db8b'" stroke-width="6" :stroke-dasharray="edge.cave ? '5 3' : null"/>
              </g>
              <g v-for="node in atlas.nodes" :key="node.id" :data-map-node="node.id" class="map-node" @click="selected = node.id">
                <title>{{ label(node.id) }}</title>
                <rect :x="node.x-12" :y="node.y-12" width="24" height="24" fill="transparent"/>
                <rect v-if="node.kind === 'town'" :x="node.x-7" :y="node.y-6" width="14" height="12" fill="#f7f0c5" stroke="#94745b" stroke-width="1"/>
                <path v-if="node.kind === 'town'" :d="`M${node.x-5} ${node.y-4}h10v8h-10Z`" fill="#d87765"/>
                <rect v-else :x="node.x-3" :y="node.y-3" width="6" height="6" :fill="node.kind==='cave' ? '#6b7967' : '#f7edb4'"/>
                <text v-if="node.kind==='route'" :x="node.x+10" :y="node.y+3" class="route-label">{{ label(node.id).replace('Route ','') }}</text>
                <text v-if="node.kind === 'town'" :x="node.x" :y="node.y - (currentNode?.id === node.id ? 28 : 14)" text-anchor="middle" class="town-label">{{ shortLabel(node.id) }}</text>
              </g>
            </g>
            <g v-for="node in habitatNodes" :key="`habitat-${node.id}`" class="habitat-ping" :data-habitat-ping="node.id" @click="selected = node.id">
              <circle :cx="node.x" :cy="node.y" r="11" fill="#f8b14555" stroke="#a94b29" stroke-width="2"/>
              <circle class="ping-ring" :cx="node.x" :cy="node.y" r="14" fill="none" stroke="#ffd273" stroke-width="2"/>
            </g>
            <rect v-if="selectedNode" :x="selectedNode.x-13" :y="selectedNode.y-13" width="26" height="26" rx="3" fill="none" stroke="#fff7cf" stroke-width="2" class="map-selection"/>
            <g v-if="currentNode" :transform="`translate(${currentNode.x},${currentNode.y})`" data-current-marker pointer-events="none">
              <path d="M0 2-7-11a8 8 0 1 1 14 0Z" fill="#244e71" stroke="#fffde1" stroke-width="2"/>
              <circle cy="-15" r="3" fill="#fffde1"/>
            </g>
            <g transform="translate(458,44)" fill="#e4f3da"><path d="m0 0 5 12-5-3-5 3Z"/><text x="0" y="-7" text-anchor="middle" font-size="9" font-weight="bold">N</text></g>
            <text x="192" y="66" text-anchor="middle" fill="#d2eee1" font-size="11" letter-spacing="3">RIFTMON</text><text x="192" y="82" text-anchor="middle" fill="#b6e0d8" font-size="7" letter-spacing="1">{{ en ? 'REGIONAL ATLAS' : 'ATLAS RÉGIONAL' }}</text>
          </svg>
          </div>
        </div>
        <div class="map-tools">
          <div class="map-legend"><span><i class="legend-town"></i>{{ en ? 'Town' : 'Ville' }}</span><span><i class="legend-route"></i>Route</span><span v-if="pokemon"><i class="legend-habitat"></i>Habitat</span></div>
          <div class="map-zoom-controls" role="group" :aria-label="en ? 'Map zoom' : 'Zoom de la carte'">
            <button data-map-zoom="out" :disabled="zoom<=1" :aria-label="en ? 'Zoom out' : 'Dézoomer'" @click="changeZoom(zoom/1.25)">−</button>
            <span class="map-zoom-level">{{ Math.round(zoom*100) }} %</span>
            <button data-map-zoom="in" :disabled="zoom>=4" :aria-label="en ? 'Zoom in' : 'Zoomer'" @click="changeZoom(zoom*1.25)">+</button>
            <button data-map-zoom="reset" :disabled="zoom===1" @click="changeZoom(1)">{{ en ? 'Overview' : 'Vue d’ensemble' }}</button>
          </div>
          <p class="map-gesture-hint">{{ en ? 'Scroll or pinch to zoom · Drag to move' : 'Molette ou pincement pour zoomer · Glisse pour déplacer' }}</p>
        </div>
        <div class="region-detail">
          <label for="region-place">{{ pokemon ? (en ? 'Habitats' : 'Localisations') : (en ? 'Explore the map' : 'Explorer la carte') }}</label>
          <select id="region-place" v-model="selected" @change="centerOn(selectedNode)"><option value="">{{ en ? 'Choose a location' : 'Choisir un lieu' }}</option><option v-for="node in selectableNodes" :key="node.id" :value="node.id">{{ label(node.id) }}</option></select>
          <div v-if="selectedNode" class="place-detail" aria-live="polite"><strong>{{ label(selectedNode.id) }}</strong><span v-if="selectedNode.id === currentNode?.id" class="here-label">{{ en ? 'You are here' : 'Tu es ici' }}</span><p v-for="(entry,i) in selectedHabitats" :key="i">{{ methodLabel(entry.method) }}<template v-if="entry.level"> · {{ en ? 'Lv.' : 'Niv.' }} {{ entry.level.min }}–{{ entry.level.max }}</template><template v-if="entry.speciesId"> · {{ speciesName(entry.speciesId) }}</template></p></div>
        </div>
        <footer class="region-footer">{{ pokemon ? (en ? 'Presence areas, not guaranteed encounters.' : 'Zones de présence, rencontres non garanties.') : (en ? 'Select a town or route to find your way.' : 'Sélectionne une ville ou une route pour te repérer.') }}</footer>
      </div>
    </section>
  </div>
</template>
<script>
import api from '@/services/api';
import { getMapLocationLabel } from '@/services/mapLocations';
import { mapLayout, anchoredMapScroll, clampMapZoom } from '@/services/regionMapViewport';
export default {
  name:'RegionMapPanel',
  props:{currentMap:String,currentRegion:String,pokemon:Object,entries:{type:Array,default:()=>[]},language:{type:String,default:'fr'},animationsEnabled:{type:Boolean,default:true}},
  data:()=>({atlas:null,loading:true,error:'',selected:'',zoom:1,dragging:false,viewport:{width:512,height:448}}),
  computed:{
    layout(){return mapLayout(this.atlas || {width:512,height:448},this.viewport,this.zoom);},
    artStyle(){return {width:this.layout.mapWidth+'px',height:this.layout.mapHeight+'px'};},
    surfaceStyle(){return {width:Math.max(this.viewport.width,this.layout.mapWidth)+'px',height:Math.max(this.viewport.height,this.layout.mapHeight)+'px'};},
    en(){return this.language==='en';},
    habitat(){return this.pokemon?.habitat || {kind:'unavailable',locations:[]};},
    locations(){return this.habitat.kind==='evolution' ? (this.habitat.ancestors || []).flatMap(a=>a.locations.map(l=>({...l,speciesId:a.speciesId}))) : this.habitat.locations || [];},
    currentNode(){return this.atlas?.nodes.find(n=>n.id===(this.currentRegion || this.atlas.aliases[this.currentMap]));},
    currentLabel(){return this.currentNode ? this.label(this.currentNode.id) : this.label(this.currentMap);},
    selectedNode(){return this.atlas?.nodes.find(n=>n.id===this.selected);},
    selectedHabitats(){return this.locations.filter(l=>l.map===this.selected);},
    habitatNodes(){const ids=new Set(this.locations.map(l=>l.map));return (this.atlas?.nodes || []).filter(n=>ids.has(n.id));},
    selectableNodes(){return this.pokemon ? this.habitatNodes : this.atlas?.nodes || [];},
    edges(){return (this.atlas?.edges || []).map(([a,b])=>{const from=this.atlas.nodes.find(n=>n.id===a),to=this.atlas.nodes.find(n=>n.id===b);return {id:a+':'+b,path:`M${from.x} ${from.y}H${to.x}V${to.y}`,cave:from.kind==='cave'||to.kind==='cave'};});}
  },
  mounted(){this.previousFocus=document.activeElement;this.$refs.close.focus({preventScroll:true});this.load();},
  beforeDestroy(){this.disposed=true;this._resizeObserver?.disconnect();window.removeEventListener('resize',this.measureViewport);this._pointers?.clear();if(this.previousFocus?.isConnected)this.previousFocus.focus({preventScroll:true});},
  methods:{
    label(id){return getMapLocationLabel(id,this.language);},
    shortLabel(id){return id==='start' ? (this.en?'Home village':'Village de départ') : this.label(id);},
    speciesName(id){return this.entries.find(p=>p.id===id)?.name || `#${id}`;},
    methodLabel(method){return ({grass:this.en?'Tall grass':'Hautes herbes',fishing:this.en?'Fishing · Fishing Rod required':'Pêche · Canne nécessaire',cave:this.en?'Cave encounters':'Rencontres en grotte'})[method];},
    async load(){this.loading=true;this.error='';try{const {data}=await api.get('/world-map');if(this.disposed)return;this.atlas=data;this.selected=this.pokemon ? this.habitatNodes[0]?.id || '' : this.currentNode?.id || '';}catch{if(!this.disposed)this.error=this.en?'The map could not be loaded.':'Impossible de charger la carte.';}finally{if(!this.disposed){this.loading=false;this.$nextTick(this.observeViewport);}}},
    showCurrent(){if(this.currentNode){this.selected=this.currentNode.id;this.centerOn(this.currentNode);}},
    observeViewport(){
      this._resizeObserver?.disconnect();window.removeEventListener('resize',this.measureViewport);
      if(!this.$refs.mapScroll)return;this.measureViewport();
      if(window.ResizeObserver){this._resizeObserver=new ResizeObserver(this.measureViewport);this._resizeObserver.observe(this.$refs.mapScroll);}
      else window.addEventListener('resize',this.measureViewport);
    },
    scrollPosition(){const el=this.$refs.mapScroll;return this._pendingScroll || {x:el.scrollLeft,y:el.scrollTop};},
    applyScroll(position){
      const revision=(this._scrollRevision||0)+1;this._scrollRevision=revision;this._pendingScroll=position;
      this.$nextTick(()=>{if(this.disposed||revision!==this._scrollRevision)return;const el=this.$refs.mapScroll;if(el){el.scrollLeft=position.x;el.scrollTop=position.y;}this._pendingScroll=null;});
    },
    measureViewport(){
      const el=this.$refs.mapScroll;if(!el||!el.clientWidth||!el.clientHeight)return;
      const before=this.layout,scroll=this.scrollPosition(),width=el.clientWidth,height=el.clientHeight;
      if(width===this.viewport.width&&height===this.viewport.height)return;
      this.viewport={width,height};this.applyScroll(anchoredMapScroll(before,this.layout,scroll,{x:before.width/2,y:before.height/2},{x:width/2,y:height/2}));
    },
    changeZoom(value,anchor=null,nextAnchor=null){
      const el=this.$refs.mapScroll;if(!el)return;
      const control=document.activeElement;
      const before=this.layout,scroll=this.scrollPosition();anchor ||= {x:this.viewport.width/2,y:this.viewport.height/2};
      this.zoom=clampMapZoom(value);this.applyScroll(anchoredMapScroll(before,this.layout,scroll,anchor,nextAnchor||anchor));
      this.$nextTick(()=>{if(!this.disposed&&control?.disabled&&this.$el.contains(control))this.$refs.mapScroll?.focus({preventScroll:true});});
    },
    point(event){const el=this.$refs.mapScroll,r=el.getBoundingClientRect();return {x:event.clientX-r.left-el.clientLeft,y:event.clientY-r.top-el.clientTop};},
    wheelZoom(event){const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?this.viewport.height:1);this.changeZoom(this.zoom*Math.exp(-Math.max(-100,Math.min(100,delta))*.003),this.point(event));},
    beginPointer(event){
      if(event.pointerType==='mouse'&&event.button!==0)return;
      this.$refs.mapScroll.focus({preventScroll:true});
      this._pointers ||= new Map();const point=this.point(event);this._pointers.set(event.pointerId,point);
      this._moved=this._pointers.size>1;this._origin=point;this.dragging=true;
      this._tapNode=event.target.closest('[data-map-node],[data-habitat-ping]');
      this.$refs.mapScroll.setPointerCapture(event.pointerId);
    },
    movePointer(event){
      const pointers=this._pointers;if(!pointers?.has(event.pointerId))return;
      const before=[...pointers.values()],old=pointers.get(event.pointerId),point=this.point(event);pointers.set(event.pointerId,point);
      if(Math.hypot(point.x-this._origin.x,point.y-this._origin.y)>5)this._moved=true;
      if(pointers.size>=2){
        this._moved=true;const after=[...pointers.values()];
        const distance=p=>Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),middle=p=>({x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2});
        if(distance(before)>1)this.changeZoom(this.zoom*distance(after)/distance(before),middle(before),middle(after));
      }else if(this._moved){const scroll=this.scrollPosition();this.applyScroll({x:Math.max(0,Math.min(this.layout.mapWidth-this.viewport.width,scroll.x+old.x-point.x)),y:Math.max(0,Math.min(this.layout.mapHeight-this.viewport.height,scroll.y+old.y-point.y))});}
    },
    endPointer(event){
      if(!this._pointers?.has(event.pointerId))return;
      if(!this._moved&&event.type==='pointerup'&&this._tapNode)this.selected=this._tapNode.dataset.mapNode||this._tapNode.dataset.habitatPing;
      this._pointers.delete(event.pointerId);this._tapNode=null;
      if(this._moved)this._ignoreClickUntil=performance.now()+400;
      this._moved=true;this.dragging=this._pointers.size>0;
      if(this.$refs.mapScroll?.hasPointerCapture(event.pointerId))this.$refs.mapScroll.releasePointerCapture(event.pointerId);
      if(this._pointers.size)this._origin=[...this._pointers.values()][0];
    },
    mapClick(event){if(performance.now()<(this._ignoreClickUntil||0)){event.preventDefault();event.stopPropagation();}},
    centerOn(node){if(!node)return;this.applyScroll({x:Math.max(0,Math.min(this.layout.mapWidth-this.viewport.width,this.layout.offsetX+node.x/this.atlas.width*this.layout.mapWidth-this.viewport.width/2)),y:Math.max(0,Math.min(this.layout.mapHeight-this.viewport.height,this.layout.offsetY+node.y/this.atlas.height*this.layout.mapHeight-this.viewport.height/2))});},
    onKey(e){if(e.target===this.$refs.mapScroll){if(['+','=','-','0'].includes(e.key)){e.preventDefault();this.changeZoom(e.key==='0'?1:e.key==='-'?this.zoom/1.25:this.zoom*1.25);return;}const direction={ArrowLeft:[-40,0],ArrowRight:[40,0],ArrowUp:[0,-40],ArrowDown:[0,40]}[e.key];if(direction){e.preventDefault();this.$refs.mapScroll.scrollBy(...direction);return;}}if(e.key==='Escape'){e.preventDefault();this.$emit('close');}if(e.key!=='Tab')return;const controls=[...this.$el.querySelectorAll('button:not(:disabled),select,[tabindex="0"]')];const first=controls[0],last=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
  }
};
</script>
<style scoped>
.region-backdrop{position:fixed;inset:0;z-index:1210;display:flex;align-items:center;justify-content:center;padding:16px;background:var(--journal-backdrop);backdrop-filter:blur(7px)}
.region-panel,.region-panel *{box-sizing:border-box}.region-panel{width:650px;max-width:100%;max-height:94dvh;display:flex;flex-direction:column;overflow:hidden;background:var(--journal-paper);color:var(--journal-ink);border:1px solid var(--journal-border);border-radius:18px;box-shadow:0 24px 80px #0005;text-align:left;font:14px var(--journal-font)}
.region-header{display:flex;align-items:center;justify-content:space-between;padding:17px 22px;background:var(--journal-card);border-bottom:1px solid var(--journal-border);gap:12px}.region-header p{margin:0 0 5px;font-size:9px;letter-spacing:.13em;color:var(--journal-muted)}.region-header p span{letter-spacing:.06em}.region-header h2{margin:0;font-size:24px;color:var(--journal-heading)}
.region-panel button,.region-panel select{font:inherit;cursor:pointer;color:var(--journal-ink);background:var(--journal-card);border:1px solid var(--journal-border);border-radius:8px;min-height:44px;padding:8px 12px}.region-panel button:disabled{opacity:.5;cursor:default}.region-panel button:focus-visible,.region-panel select:focus-visible,.map-scroll:focus-visible{outline:3px solid var(--journal-accent);outline-offset:2px}.region-close{font-size:24px!important;width:44px;flex:none}.region-content{overflow:auto;min-height:0;overscroll-behavior:contain}.region-location{display:flex;align-items:center;gap:9px;padding:10px 18px;font-size:11px}.region-location strong{display:block;font-size:13px;margin-top:2px}.region-location button{margin-left:auto;font-size:11px}.you-dot{width:10px;height:10px;border-radius:50%;background:#34658c;outline:2px solid #fff;flex:none}
.map-scroll{overflow:auto;min-width:0;height:clamp(180px,45dvh,420px);background:#369fb1;border-block:3px solid #86b5ae;touch-action:none;position:relative;overscroll-behavior:contain;cursor:grab;user-select:none}.map-scroll.dragging{cursor:grabbing}.map-surface{display:grid;place-items:center}.region-art{display:block;flex:none;max-width:none;max-height:none}.route-label{font-size:8px;fill:#6b653f;paint-order:stroke;stroke:#f4e7a9;stroke-width:2px;font-weight:700}.town-label{font-size:9px;fill:#284634;paint-order:stroke;stroke:#edf1c7;stroke-width:3;stroke-linejoin:round;font-weight:700}.map-node,.habitat-ping{cursor:pointer}.map-selection{filter:drop-shadow(0 1px 1px #234)}.ping-ring{animation:habitat-pulse 1.8s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes habitat-pulse{50%{opacity:.35;transform:scale(1.25)}}.reduce-motion .ping-ring{animation:none}@media(prefers-reduced-motion:reduce){.ping-ring{animation:none}}
.map-tools{padding:8px 12px;background:var(--journal-card);border-bottom:1px solid var(--journal-border)}.map-legend{display:flex;align-items:center;gap:15px;font-size:11px;margin-bottom:6px}.map-zoom-controls{display:flex;align-items:center;gap:5px}.map-zoom-controls button{min-width:44px;padding:6px 10px}.map-zoom-controls [data-map-zoom="reset"]{margin-left:auto;font-size:11px}.map-zoom-level{min-width:42px;text-align:center;font-size:11px;font-variant-numeric:tabular-nums}.map-gesture-hint{margin:6px 0 0;font-size:10px;color:var(--journal-muted)}.map-legend span{display:flex;align-items:center;gap:6px}.map-legend i{display:inline-block;width:10px;height:10px}.legend-town{background:#d87765;border:2px solid #f4ddb3}.legend-route{background:#f4db8b;border:1px solid #b49c67}.legend-habitat{border:2px solid #ba602c;border-radius:50%;background:#ffce76}
.region-detail{padding:14px 18px}.region-detail label{display:block;font-size:11px;color:var(--journal-muted);margin-bottom:6px}.region-detail select{width:100%}.place-detail{padding-top:13px;font-size:13px}.place-detail p{margin:6px 0;font-size:12px;color:var(--journal-muted)}.here-label{font-size:10px;margin-left:10px;color:var(--journal-accent)}.region-footer{padding:10px 18px;font-size:10px;color:var(--journal-muted);border-top:1px solid var(--journal-border)}.region-state{padding:35px;text-align:center}.habitat-heading{display:flex;align-items:center;gap:10px;padding:4px 18px 10px;font-weight:700;font-size:13px}.habitat-heading small{display:block;font-size:11px;font-weight:400;color:var(--journal-muted);margin-top:3px}.habitat-heading img{object-fit:contain;image-rendering:pixelated}
@media(min-width:921px){.region-panel{width:780px}.region-content{display:grid;grid-template-columns:minmax(0,1fr) 190px;align-content:start}.region-location,.habitat-heading,.region-footer{grid-column:1 / -1}.region-location{grid-row:1}.habitat-heading{grid-row:2}.region-footer{grid-row:5}.map-scroll{grid-column:1;grid-row:3}.map-tools{grid-column:1;grid-row:4}.region-detail{grid-column:2;grid-row:3 / 5;padding:16px 12px;border-left:1px solid var(--journal-border)}.map-scroll{height:clamp(180px,calc(var(--game-popup-height,90dvh) - 340px),420px)}.here-label{display:block;margin:6px 0 0}.place-detail{line-height:1.5}}
@media(max-width:600px){.region-backdrop{padding:8px}.region-panel{border-radius:13px;max-height:96dvh}.region-header{padding:12px 14px}.region-header h2{font-size:21px}.region-location,.region-detail{padding-inline:12px}.map-legend{gap:10px;padding-inline:12px}.region-art{max-height:none}.region-header p{font-size:8px}}
</style>
