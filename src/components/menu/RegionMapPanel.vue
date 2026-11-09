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
          <img :src="$pokemonSprite(pokemon)" alt="" width="40" height="40">
          <span v-if="habitat.kind === 'wild'">{{ en ? 'Wild encounters' : 'Rencontres sauvages' }}<small>{{ legendaryNote || (en ? 'Choose a marker or a location below.' : 'Choisis un repère ou un lieu ci-dessous.') }}</small></span>
          <span v-else-if="habitat.kind === 'evolution'">{{ en ? 'Obtained through evolution' : 'À obtenir par évolution' }}<small>{{ en ? 'The markers show where to catch its earlier forms.' : 'Les repères indiquent où capturer ses pré-évolutions.' }}</small></span>
          <span v-else>{{ en ? 'No known wild habitat' : 'Aucun habitat sauvage connu' }}<small>{{ en ? 'This species has no wild encounter in the current region.' : 'Cette espèce ne se rencontre pas dans la région actuelle.' }}</small></span>
        </div>
        <div class="map-scroll" ref="mapScroll" :class="{dragging,'is-overview':zoom===1}" tabindex="0" :aria-label="en ? 'Regional map. Zoom with + and −; move with arrow keys.' : 'Carte régionale. Zoome avec + et − ; déplace avec les flèches.'"
          @wheel.prevent="wheelZoom" @pointerdown.prevent="beginPointer" @pointermove="movePointer" @pointerup="endPointer" @pointercancel="endPointer" @lostpointercapture="endPointer" @click.capture="mapClick">
          <div class="map-surface" :style="surfaceStyle">
          <svg class="region-art" :style="artStyle" :viewBox="`0 0 ${atlas.width} ${atlas.height}`" role="group" :aria-label="en ? 'Towns, routes and your position' : 'Villes, routes et ta position'">
            <region-map-terrain :width="atlas.width" :height="atlas.height" :dark-offset="atlas.darkContinent?.offsetX || 0" :safari="atlas.safari" :en="en"/>
            <g shape-rendering="geometricPrecision" stroke-linejoin="round" stroke-linecap="round">
              <g v-for="edge in edges" :key="edge.id">
                <path :d="edge.path" fill="none" :stroke="edge.cave ? '#7e8765' : '#d1aa65'" stroke-width="8"/>
                <path :d="edge.path" fill="none" :stroke="edge.cave ? '#d0c2a1' : '#f4db8b'" stroke-width="4" :stroke-dasharray="edge.cave ? '5 3' : null"/>
              </g>
              <g v-for="node in displayNodes" :key="node.id" :data-map-node="node.id" class="map-node" role="button" tabindex="0" :aria-label="label(node.id)" :aria-pressed="selected === node.id" @click="selected = node.id" @keydown.enter.prevent="selected = node.id" @keydown.space.prevent="selected = node.id">
                <title>{{ label(node.id) }}</title>
                <rect :x="node.x-12" :y="node.y-12" width="24" height="24" fill="transparent"/>
                <path v-if="node.kind==='house'" :d="`M${node.x-8} ${node.y-1}l8-7 8 7h-2v9h-12v-9Z`" fill="#fff1cb" stroke="#885f46" stroke-width="2" data-house-marker/>
                <rect v-if="node.kind === 'town'" :x="node.x-7" :y="node.y-6" width="14" height="12" fill="#f7f0c5" stroke="#94745b" stroke-width="1"/>
                <path v-if="node.kind === 'town'" :d="`M${node.x-5} ${node.y-4}h10v8h-10Z`" fill="#d87765"/>
                <rect v-else-if="node.kind!=='house'" :x="node.x-3" :y="node.y-3" width="6" height="6" :fill="node.kind==='cave' ? '#6b7967' : '#f7edb4'"/>
                <text v-if="node.kind==='route' && !isSafari(node.id)" :x="node.x+10" :y="node.y+3" class="route-label">{{ routeLabel(node.id) }}</text>
                <text v-if="node.kind === 'town' || node.kind === 'event' || node.kind === 'house'" :x="node.x" :y="node.y - (currentNode?.id === node.id ? 28 : 14)" text-anchor="middle" class="town-label">{{ shortLabel(node.id) }}</text>
              </g>
            </g>
            <g v-for="node in habitatNodes" :key="`habitat-${node.id}`" class="habitat-ping" :data-habitat-ping="node.id" @click="selected = node.id">
              <circle :cx="node.x" :cy="node.y" r="11" fill="#f8b14555" stroke="#a94b29" stroke-width="2"/>
              <circle class="ping-ring" :cx="node.x" :cy="node.y" r="14" fill="none" stroke="#ffd273" stroke-width="2"/>
            </g>
            <rect v-if="selectedNode" :x="selectedNode.x-13" :y="selectedNode.y-13" width="26" height="26" rx="3" fill="none" stroke="#fff7cf" stroke-width="2" class="map-selection"/>
            <g v-for="member in friendMarkers" :key="'friend-'+member.id" :data-friend-marker="member.id" :transform="`translate(${member.x},${member.y})`" class="friend-map-marker" role="button" tabindex="0" :aria-label="`${member.username} · ${label(member.nodeId)}`" @click="selectFriendMember(member)" @keydown.enter.prevent="selectFriendMember(member)" @keydown.space.prevent="selectFriendMember(member)"><title>{{ member.username }} · {{ modeLabel(member.mode) }}</title><circle r="6" :fill="member.color" stroke="#fffde1" stroke-width="2"/><path d="m-2 0 2-3 2 3-2 3Z" fill="#fffde1"/></g>
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
        <div v-if="friendMarkers.length" class="map-friend-list" aria-label="Amis dans la région"><button v-for="member in friendMarkers" :key="member.id" :data-friend-location="member.id" @click="selectFriendMember(member)"><i :style="{background:member.color}"></i><strong>{{ member.username }}</strong><span>{{ label(member.nodeId) }} · {{ modeLabel(member.mode) }}{{ member.afk?' · AFK':'' }}</span></button></div>
        <div class="region-detail">
          <div v-if="flightAllowed && !pokemon" class="flight-module" data-flight-module>
            <strong>{{ en ? 'Flight Module' : 'Module Vol' }}</strong>
            <p>{{ flight?.unlocked ? (en ? 'Choose a visited town or your house, then take flight.' : 'Choisis une ville visitée ou ta maison, puis prends ton envol.') : (en ? 'Raphael will give you this module after your victory.' : 'Raphael te remettra ce module après ta victoire.') }}</p>
          </div>
          <template v-if="pokemon">
            <label for="region-place">{{ en ? 'Habitats' : 'Localisations' }}</label>
            <select id="region-place" v-model="selected" @change="centerOn(selectedNode)"><option value="">{{ en ? 'Choose a location' : 'Choisir un lieu' }}</option><option v-for="node in selectableNodes" :key="node.id" :value="node.id">{{ label(node.id) }}</option></select>
          </template>
          <div v-if="selectedNode" class="place-detail" aria-live="polite"><strong>{{ label(selectedNode.id) }}</strong><span v-if="selectedNode.id === currentNode?.id" class="here-label">{{ en ? 'You are here' : 'Tu es ici' }}</span><p v-for="(entry,i) in selectedHabitats" :key="i">{{ methodLabel(entry.method) }}<template v-if="entry.level"> · {{ en ? 'Lv.' : 'Niv.' }} {{ entry.level.min }}–{{ entry.level.max }}</template><template v-if="entry.speciesId"> · {{ speciesName(entry.speciesId) }}</template><template v-if="entry.day && entry.day!=='all'"> · {{ entry.day==='even'?(en?'Even dates':'Jours pairs'):(en?'Odd dates':'Jours impairs') }}</template><template v-if="entry.oneIn"> · 1 / {{ entry.oneIn }}</template></p></div>

        </div>
        <footer class="region-footer">{{ pokemon ? (en ? 'Presence areas, not guaranteed encounters.' : 'Zones de présence, rencontres non garanties.') : (en ? 'Select a town or route to find your way.' : 'Sélectionne une ville ou une route pour te repérer.') }}</footer>
      </div>
      <div v-if="flightAllowed && !pokemon && ['town','house'].includes(selectedNode?.kind) && flight?.unlocked" class="flight-actionbar">
        <div><small>{{ en ? 'Flight destination' : 'Destination du vol' }}</small><strong>{{ label(selected) }}</strong></div>
        <button class="flight-button" data-fly :disabled="!canFlySelected" @click="$emit('fly',selected)">{{ canFlySelected ? (en ? 'Fly here ↗' : 'Voler ici ↗') : (en ? 'Not visited' : 'Non visitée') }}</button>
      </div>
    </section>
  </div>
</template>
<script>
import RegionMapTerrain from './RegionMapTerrain.vue';
import api from '@/services/api';
import { getMapLocationLabel } from '@/services/mapLocations';
import { mapLayout, anchoredMapScroll, clampMapZoom } from '@/services/regionMapViewport';
export default {
  name:'RegionMapPanel',components:{RegionMapTerrain},
  props:{friendMembers:{type:Array,default:()=>[]},currentMap:String,currentRegion:String,pokemon:Object,entries:{type:Array,default:()=>[]},language:{type:String,default:'fr'},animationsEnabled:{type:Boolean,default:true},flight:{type:Object,default:null},flightAllowed:Boolean},
  data:()=>({atlas:null,loading:true,error:'',selected:'',zoom:1,dragging:false,viewport:{width:512,height:448}}),
  computed:{
    friendMarkers(){if(!this.atlas)return [];const colors=['#9b5e9d','#35798e','#a27432','#407e54','#a95463','#5d64a0'],offsets=[[12,0],[-12,0],[0,12],[0,-12],[12,12],[-12,12]],counts={};return this.friendMembers.filter(p=>p.online&&p.location).map(p=>{const node=this.atlas.nodes.find(n=>n.id===p.location.nodeId);if(!node)return null;const k=counts[node.id]||0;counts[node.id]=k+1;const offset=offsets[k%offsets.length];return {...p,nodeId:node.id,mode:p.location.mode,x:node.x+offset[0],y:node.y+offset[1],color:p.afk?'#db942e':colors[p.id%colors.length]};}).filter(Boolean);},

    canFlySelected(){return this.flightAllowed&&this.flight?.unlocked&&this.flight.owned!==false&&(this.selectedNode?.kind==='house'||this.selectedNode?.kind==='town'&&this.flight.visited.includes(this.selected));},
    layout(){return mapLayout(this.atlas || {width:512,height:448},this.viewport,this.zoom);},
    artStyle(){return {width:this.layout.mapWidth+'px',height:this.layout.mapHeight+'px'};},
    surfaceStyle(){return {width:Math.max(this.viewport.width,this.layout.mapWidth)+'px',height:Math.max(this.viewport.height,this.layout.mapHeight)+'px'};},
    en(){return this.language==='en';},
    habitat(){return this.pokemon?.habitat || {kind:'unavailable',locations:[]};},
    legendaryNote(){const rare=this.habitat.legendary;if(!rare)return '';const odds=Number(rare.oneIn).toLocaleString(this.en?'en-US':'fr-FR');return this.en?`1 in ${odds} chance of a legendary, then a draw among ${rare.poolSize} species.`:`1 chance sur ${odds} pour un légendaire, puis tirage parmi ${rare.poolSize} espèces.`;},
    locations(){return this.habitat.kind==='evolution' ? (this.habitat.ancestors || []).flatMap(a=>a.locations.map(l=>({...l,speciesId:a.speciesId}))) : this.habitat.locations || [];},
    currentNode(){return this.atlas?.nodes.find(n=>n.id===(this.currentRegion || this.atlas.aliases[this.currentMap]));},
    currentLabel(){return this.isDark(this.currentNode?.id)?'Dark Continent':this.currentNode ? this.label(this.currentNode.id) : this.label(this.currentMap);},
    houseNode(){if(this.pokemon||!this.flight?.house)return null;const n=this.atlas?.nodes.find(n=>n.id===this.flight.house.nodeId);return n?{id:'owned-house',kind:'house',x:n.x+17,y:n.y+12}:null;},
    displayNodes(){return [...(this.atlas?.nodes||[]).filter(n=>!this.isDark(n.id)),...(this.houseNode?[this.houseNode]:[])];},
    selectedNode(){return this.displayNodes.find(n=>n.id===this.selected);},
    selectedHabitats(){return this.locations.filter(l=>l.map===this.selected);},
    habitatNodes(){const ids=new Set(this.locations.map(l=>l.map));return (this.atlas?.nodes || []).filter(n=>ids.has(n.id));},
    selectableNodes(){return this.pokemon ? this.habitatNodes : this.displayNodes;},
    edges(){return (this.atlas?.edges || []).filter(([a,b])=>!this.isDark(a)&&!this.isDark(b)&&!this.isSafari(a)&&!this.isSafari(b)).map(([a,b])=>{const from=this.atlas.nodes.find(n=>n.id===a),to=this.atlas.nodes.find(n=>n.id===b);return {id:a+':'+b,path:`M${from.x} ${from.y}H${to.x}V${to.y}`,cave:from.kind==='cave'||to.kind==='cave'};});}
  },
  mounted(){this.previousFocus=document.activeElement;this.$refs.close.focus({preventScroll:true});this.load();},
  beforeDestroy(){this.disposed=true;this._resizeObserver?.disconnect();window.removeEventListener('resize',this.measureViewport);this._pointers?.clear();if(this.previousFocus?.isConnected)this.previousFocus.focus({preventScroll:true});},
  methods:{
    modeLabel(mode){return {adventure:'Aventure',rift:'Rift',colosseum:'Colosseum'}[mode]||'';},
    selectFriendMember(member){this.selected=member.nodeId;this.centerOn(this.atlas.nodes.find(n=>n.id===member.nodeId));},

    isSafari(id){return /^safari(?:[1-9]|1[0-5])$/.test(id||'');},
    isDark(id){return /^jungle[1-9]$/.test(id||'');},
    label(id){if(id==='owned-house')return this.en?'My house':'Ma maison';return this.isDark(id)?'Dark Continent':getMapLocationLabel(id,this.language);},
    routeLabel(id){return /^jungle[1-9]$/.test(id)?'Jungle '+id.slice(6):this.label(id).replace('Route ','');},
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
.friend-map-marker{cursor:pointer}.friend-map-marker:focus{outline:none}.friend-map-marker:focus circle{stroke:#f6ca5d;stroke-width:3}.map-friend-list{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 12px}.map-friend-list button{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-height:44px;padding:7px 10px;border:1px solid var(--journal-border);border-radius:7px;background:var(--journal-card);color:var(--journal-ink);font:11px var(--journal-font);cursor:pointer}.map-friend-list i{width:8px;height:8px;border-radius:50%;flex:none}.map-friend-list span{font-size:10px;color:var(--journal-muted)}

.map-node:focus-visible{outline:none}.map-node:focus-visible>rect:first-of-type{stroke:#fff7cf;stroke-width:2}
.flight-actionbar{flex-shrink:0;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 18px;border-top:1px solid var(--journal-border);background:var(--journal-card)}.flight-actionbar small{display:block;color:var(--journal-muted);font-size:10px;margin-bottom:4px}.flight-actionbar strong{font-size:13px}

.flight-module{padding:12px;background:var(--journal-soft);border:1px solid var(--journal-border);border-radius:10px;margin-bottom:12px}.flight-module p,.flight-unvisited{font-size:12px;line-height:1.5;margin:6px 0;color:var(--journal-muted)}.region-panel .flight-button{min-width:130px;background:var(--journal-accent);color:var(--journal-paper);font-weight:700}

.region-backdrop{position:fixed;inset:0;z-index:1210;display:flex;align-items:center;justify-content:center;padding:16px;background:var(--journal-backdrop);backdrop-filter:blur(7px)}
.region-panel,.region-panel *{box-sizing:border-box}.region-panel{width:650px;max-width:100%;max-height:94dvh;display:flex;flex-direction:column;overflow:hidden;background:var(--journal-paper);color:var(--journal-ink);border:1px solid var(--journal-border);border-radius:18px;box-shadow:0 24px 80px #0005;text-align:left;font:14px var(--journal-font)}
.region-header{display:flex;align-items:center;justify-content:space-between;padding:17px 22px;background:var(--journal-card);border-bottom:1px solid var(--journal-border);gap:12px}.region-header p{margin:0 0 5px;font-size:9px;letter-spacing:.13em;color:var(--journal-muted)}.region-header p span{letter-spacing:.06em}.region-header h2{margin:0;font-size:24px;color:var(--journal-heading)}
.region-panel button,.region-panel select{font:inherit;cursor:pointer;color:var(--journal-ink);background:var(--journal-card);border:1px solid var(--journal-border);border-radius:8px;min-height:44px;padding:8px 12px}.region-panel button:disabled{opacity:.5;cursor:default}.region-panel button:focus-visible,.region-panel select:focus-visible,.map-scroll:focus-visible{outline:3px solid var(--journal-accent);outline-offset:2px}.region-close{font-size:24px!important;width:44px;flex:none}.region-content{overflow:auto;min-height:0;overscroll-behavior:contain}.region-location{display:flex;align-items:center;gap:9px;padding:10px 18px;font-size:11px}.region-location strong{display:block;font-size:13px;margin-top:2px}.region-location button{margin-left:auto;font-size:11px}.you-dot{width:10px;height:10px;border-radius:50%;background:#34658c;outline:2px solid #fff;flex:none}
.map-scroll{overflow:scroll;min-width:0;height:clamp(180px,45dvh,420px);background:#2b637f;border-block:3px solid #86b5ae;touch-action:none;position:relative;overscroll-behavior:contain;cursor:grab;user-select:none}.map-scroll.dragging{cursor:grabbing}.map-surface{display:grid;place-items:center}.region-art{display:block;flex:none;max-width:none;max-height:none}.route-label{font-size:8px;fill:#6b653f;paint-order:stroke;stroke:#f4e7a9;stroke-width:2px;font-weight:700}.town-label{font-size:9px;fill:#284634;paint-order:stroke;stroke:#edf1c7;stroke-width:3;stroke-linejoin:round;font-weight:700}.map-node,.habitat-ping{cursor:pointer}.map-selection{filter:drop-shadow(0 1px 1px #234)}.ping-ring{animation:habitat-pulse 1.8s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes habitat-pulse{50%{opacity:.35;transform:scale(1.25)}}.reduce-motion .ping-ring{animation:none}@media(prefers-reduced-motion:reduce){.ping-ring{animation:none}}
/* Keep both scrollbar tracks while zoomed: toggling one changes the fitted map
   height and can make ResizeObserver alternate between two sizes forever. */
.map-scroll.is-overview{overflow:hidden}
.map-tools{padding:8px 12px;background:var(--journal-card);border-bottom:1px solid var(--journal-border)}.map-legend{display:flex;align-items:center;gap:15px;font-size:11px;margin-bottom:6px}.map-zoom-controls{display:flex;align-items:center;gap:5px}.map-zoom-controls button{min-width:44px;padding:6px 10px}.map-zoom-controls [data-map-zoom="reset"]{margin-left:auto;font-size:11px}.map-zoom-level{min-width:42px;text-align:center;font-size:11px;font-variant-numeric:tabular-nums}.map-gesture-hint{margin:6px 0 0;font-size:10px;color:var(--journal-muted)}.map-legend span{display:flex;align-items:center;gap:6px}.map-legend i{display:inline-block;width:10px;height:10px}.legend-town{background:#d87765;border:2px solid #f4ddb3}.legend-route{background:#f4db8b;border:1px solid #b49c67}.legend-habitat{border:2px solid #ba602c;border-radius:50%;background:#ffce76}
.region-detail{padding:14px 18px}.region-detail label{display:block;font-size:11px;color:var(--journal-muted);margin-bottom:6px}.region-detail select{width:100%}.place-detail{padding-top:13px;font-size:13px}.place-detail p{margin:6px 0;font-size:12px;color:var(--journal-muted)}.here-label{font-size:10px;margin-left:10px;color:var(--journal-accent)}.region-footer{padding:10px 18px;font-size:10px;color:var(--journal-muted);border-top:1px solid var(--journal-border)}.region-state{padding:35px;text-align:center}.habitat-heading{display:flex;align-items:center;gap:10px;padding:4px 18px 10px;font-weight:700;font-size:13px}.habitat-heading small{display:block;font-size:11px;font-weight:400;color:var(--journal-muted);margin-top:3px}.habitat-heading img{object-fit:contain;image-rendering:pixelated}
@media(min-width:921px){.region-panel{width:780px}.region-content{display:grid;grid-template-columns:minmax(0,1fr) 190px;align-content:start}.region-location,.habitat-heading,.region-footer{grid-column:1 / -1}.region-location{grid-row:1}.habitat-heading{grid-row:2}.region-footer{grid-row:5}.map-scroll{grid-column:1;grid-row:3}.map-tools{grid-column:1;grid-row:4}.region-detail{grid-column:2;grid-row:3 / 5;padding:16px 12px;border-left:1px solid var(--journal-border)}.map-scroll{height:clamp(180px,calc(var(--game-popup-height,90dvh) - 340px),420px)}.here-label{display:block;margin:6px 0 0}.place-detail{line-height:1.5}}
@media(max-width:600px){.region-backdrop{padding:8px}.region-panel{border-radius:13px;max-height:96dvh}.region-header{padding:12px 14px}.region-header h2{font-size:21px}.region-location,.region-detail{padding-inline:12px}.map-legend{gap:10px;padding-inline:12px}.region-art{max-height:none}.region-header p{font-size:8px}}
</style>
