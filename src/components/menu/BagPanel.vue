<template>
  <div class="bag-backdrop" @click.self="$emit('close')" @keydown="handleKeydown">
    <section ref="dialog" class="bag-panel expedition-bag" role="dialog" aria-modal="true" aria-labelledby="bag-heading" :aria-busy="loading">
      <header class="pack-header">
        <div><small>RIFTMON / {{ expedition ? (english ? 'EXPEDITION' : 'EXPÉDITION') : (english ? 'ADVENTURE' : 'AVENTURE') }}</small><h2 id="bag-heading">{{ english ? 'Your bag' : 'Ton sac' }}</h2></div>
        <button ref="close" class="panel-close" :aria-label="english?'Close bag':'Fermer le sac'" @click="$emit('close')">×</button>
      </header>
      <div class="pack-layout">
        <aside class="pack-cover" aria-hidden="true">
          <svg class="backpack" viewBox="0 0 180 240" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path class="pack-strap" d="M49 60C20 70 24 161 37 186m94-126c29 10 25 101 12 126"/>
            <path class="pack-handle" d="M71 38V24c0-21 38-21 38 0v14"/>
            <path class="pack-body" d="M36 76c0-28 20-43 54-43s54 15 54 43l8 115c2 20-13 29-62 29s-64-9-62-29Z"/>
            <path class="pack-seam" d="M42 82c0-27 96-27 96 0l7 104c2 18-8 27-55 27s-57-9-55-27Z"/>
            <path class="pack-flap" d="M35 69c0-25 20-39 55-39s55 14 55 39v21c0 19-110 19-110 0Z"/>
            <path class="pack-stitch" d="M42 69v17c0 14 96 14 96 0V69"/>
            <path class="pack-buckle" d="M81 91h18v24H81Z"/><path class="pack-metal" d="M82 100h16v13H82Zm8 1v6"/>
            <rect class="pack-pocket" x="45" y="134" width="90" height="65" rx="14"/>
            <path class="pack-stitch" d="M52 145v35c0 9 5 12 14 12h48c9 0 14-3 14-12v-35"/>
            <path class="pack-zip" d="M51 149h78m-9 1v10m-3-1h6v8h-6Z"/>
            <circle class="pack-patch" cx="88" cy="173" r="12"/><path class="pack-compass" d="m93 167-3 9-7 4 3-9Z"/>
          </svg>
          <span class="pack-tag">{{ english ? 'READY TO GO' : 'PRÊT À PARTIR' }}</span><span class="pack-total">{{ total }} {{ english ? 'items packed' : 'objets rangés' }}</span>
        </aside>
        <div class="pack-content">
          <nav class="pack-pockets" role="tablist" :aria-label="english?'Bag pockets':'Poches du sac'">
            <button v-for="p in pockets" :id="`bag-pocket-${p.key}`" :key="p.key" :ref="`pocket-${p.key}`" role="tab" :data-bag-pocket="p.key" :aria-selected="activePocket===p.key" :tabindex="activePocket===p.key?0:-1" aria-controls="bag-pocket-content" @click="choosePocket(p.key)" @keydown="movePocket($event,p.key)">
              <bag-item-icon :pocket="p.key"/><span>{{ english?p.en:p.name }}</span><small :aria-label="`${p.count} ${english?'items':'objets'}`">{{ p.count }}</small>
            </button>
          </nav>
          <div ref="scroll" id="bag-pocket-content" class="pack-scroll" role="tabpanel" :aria-labelledby="`bag-pocket-${activePocket}`" tabindex="0">
            <div class="pocket-heading"><div><small>{{ english?'POCKET':'POCHE' }} {{ pocketNumber }} / {{ pockets.length }}</small><h3>{{ english?current.en:current.name }}</h3></div><bag-item-icon :pocket="activePocket"/></div>
            <p class="pocket-hint">{{ english?current.enHint:current.hint }}</p>
            <nav v-if="activePocket==='training'" class="bag-filters" :aria-label="english?'Training categories':'Catégories d’entraînement'">
              <button :aria-pressed="trainingFilter==='all'" @click="trainingFilter='all'">{{ english?'All':'Tout' }}</button>
              <button v-for="group in trainingGroups" :key="group.key" :data-training-group="group.key" :aria-pressed="trainingFilter===group.key" @click="trainingFilter=group.key">{{ english?group.en:group.name }} <small>{{ group.count }}</small></button>
            </nav>
            <label v-if="activePocket==='machines'" class="bag-sort">{{ english?'Sort CS':'Trier les CS' }}<select v-model="machineSort" data-bag-cs-sort><option value="name">{{ english?'Name':'Nom' }}</option><option value="type">{{ english?'Type, then name':'Type, puis nom' }}</option></select></label>
            <p v-if="repelSteps>0" class="pack-notice" role="status" data-repel-state>{{ english ? `Repel active · ${repelSteps} steps left` : `Repousse actif · ${repelSteps} pas restants` }}</p>
            <p v-if="error" class="pack-notice pack-error" role="alert">{{ error }}</p><p v-if="notice" class="pack-notice" role="status">{{ notice }}</p>
            <p v-if="loading" class="pack-empty" role="status">{{ english?'Opening your bag…':'Ouverture du sac…' }}</p>
            <div v-else-if="!visibleItems.length" class="pack-empty"><bag-item-icon :pocket="activePocket"/><strong>{{ english?'This pocket is empty':'Cette poche est vide' }}</strong><span>{{ total ? (english?'Your other items are in the other pockets.':'Tes autres objets sont dans les autres poches.') : emptyLabel }}</span></div>
            <div v-else class="bag-items">
              <article v-for="item in visibleItems" :key="item.key" :data-item-key="item.key" class="bag-item-row" :class="{'item-open':selectedKey===item.key}" :style="machine(item) ? typeStyle(machine(item).type) : null">
                <button class="bag-item-select" :aria-expanded="selectedKey===item.key" :aria-controls="`bag-item-${item.key}`" @click="selectedKey=selectedKey===item.key?null:item.key">
                  <span class="item-stamp"><bag-item-icon :pocket="activePocket" :item-key="item.key"/></span><span class="bag-item-name"><span :class="{'bag-machine-name':machine(item)}" :data-bag-machine-name="machine(item)?'':null">{{ itemName(item) }}</span><span v-if="machine(item)" class="bag-machine-meta"><span data-bag-machine-type>{{ english?machine(item).type:typeName(machine(item).type) }}</span><span aria-hidden="true">·</span><span data-bag-machine-class>{{ machineClass(item) }}</span></span><small v-if="item.experienceModule" class="item-module-status" :class="{enabled:item.active}">{{ item.active ? (english?'Active · +15 levels':'Actif · +15 niveaux') : (english?'Inactive':'Désactivé') }}</small><small v-if="item.unique" class="item-unique">Unique</small></span><span class="bag-item-qty">x{{ item.quantity }}</span><span class="item-chevron" aria-hidden="true">{{ selectedKey===item.key?'⌄':'›' }}</span>
                </button>
                <div v-if="selectedKey===item.key" :id="`bag-item-${item.key}`" class="bag-item-detail">
                  <p class="bag-item-description">{{ description(item) }}</p>
                  <p v-if="item.unique" class="bag-use-hint">{{ english?'Only one discovery per Adventure or expedition.':`Un seul exemplaire à trouver dans ${expedition?'cette expédition':'ton aventure'}.` }}</p>
                  <slot name="actions" :item="item"/>
                  <p v-if="activePocket==='balls'" class="bag-use-hint">{{ english?'Choose a Ball from your bag during a wild battle.':'Choisis une Ball dans le sac pendant un combat sauvage.' }}</p>
                  <button v-if="activePocket==='held' || activePocket==='berries'" class="bag-equip-link" @click="$emit('team')">{{ english?'Give to a Pokémon':'Faire tenir à un Pokémon' }} <span aria-hidden="true">→</span></button>
                  <p v-if="item.key==='exp_share'" class="bag-use-hint" data-exp-share-active>{{ english ? `Equip on the first Pokémon in your team · fighter 100% · reserves ${expedition ? 'at least 50%' : '40%'} · no stacking.` : `À faire tenir au premier Pokémon de ton équipe · combattant 100 % · réserves ${expedition ? 'au moins 50 %' : '40 %'} · sans cumul.` }}</p>
                  <p v-else-if="activePocket==='key'" class="bag-use-hint">{{ english?'Keep this item: it is part of your story.':'Cet objet est conservé pour ton histoire.' }}</p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
      <footer class="pack-footer"><span>{{ expedition ? (english?'Items for this expedition only.':'Le contenu de ce sac appartient à cette expédition.') : (english?'Your bag travels with your Adventure save.':'Ton sac t’accompagne tout au long de l’aventure.') }}</span><span>{{ total }} {{ english?'items':'objets' }}</span></footer>
    </section>
  </div>
</template>
<script>
import BagItemIcon from './BagItemIcon.vue';
import {BAG_POCKETS,bagPocket,TRAINING_GROUPS,trainingGroup} from '@/services/bagPockets';
import {bagItemName} from '@/services/bagItemPresentation';
import machines from '@/data/machines.json';
import reference from '@/data/pokemonReference.fr.json';
import {localizeTypeName,typeBadgeStyle} from '@/services/pokemonTypes';
export default {
  name:'BagPanel',components:{BagItemIcon},
  props:{items:{type:Array,default:()=>[]},loading:Boolean,error:String,notice:String,repelSteps:{type:Number,default:0},emptyLabel:String,expedition:Boolean,language:String},
  data(){return {activePocket:'medicine',selectedKey:null,previousFocus:null,trainingFilter:'all',machineSort:'name'};},
  computed:{
    english(){return this.language==='en';},
    owned(){return this.items.filter(i=>Number(i.quantity)>0);},
    total(){return this.owned.reduce((n,i)=>n+Number(i.quantity),0);},
    pockets(){return BAG_POCKETS.filter(p=>p.key!=='other'||this.owned.some(i=>bagPocket(i)==='other')).map(p=>({...p,count:this.owned.filter(i=>bagPocket(i)===p.key).reduce((n,i)=>n+Number(i.quantity),0)}));},
    current(){return this.pockets.find(p=>p.key===this.activePocket)||this.pockets[0];},
    pocketNumber(){return this.pockets.indexOf(this.current)+1;},
    trainingGroups(){return TRAINING_GROUPS.map(g=>({...g,count:this.owned.filter(i=>bagPocket(i)==='training'&&trainingGroup(i)===g.key).length})).filter(g=>g.count);},
    visibleItems(){const items=this.owned.filter(i=>bagPocket(i)===this.activePocket&&(this.activePocket!=='training'||this.trainingFilter==='all'||trainingGroup(i)===this.trainingFilter));
      if(this.activePocket==='machines')items.sort((a,b)=>(this.machineSort==='type'?(this.english?this.machine(a)?.type:this.typeName(this.machine(a)?.type)).localeCompare(this.english?this.machine(b)?.type:this.typeName(this.machine(b)?.type),'fr'):0)||a.name.localeCompare(b.name,'fr',{sensitivity:'base'})||a.key.localeCompare(b.key));return items;}
  },
  watch:{visibleItems(){this.reconcile();}},
  mounted(){this.previousFocus=document.activeElement;if(!this.visibleItems.length&&this.owned.length)this.activePocket=bagPocket(this.owned[0]);this.reconcile();this.$refs.close.focus({preventScroll:true});},
  beforeDestroy(){const previous=this.previousFocus;this.$nextTick(()=>{const target=previous?.isConnected&&previous!==document.body&&previous!==document.documentElement?previous:document.querySelector('.menu-toggle-btn');target?.focus({preventScroll:true});});},
  methods:{
    itemName(item){return bagItemName(item,this.language);},
    machine(item){return item.category==='machine'?machines[item.key]:null;},
    typeName:localizeTypeName,
    typeStyle:typeBadgeStyle,
    machineClass(item){const category=reference.moves[this.machine(item)?.move]?.category;return (this.english?{physical:'Physical',special:'Special',status:'Status'}:{physical:'Physique',special:'Spéciale',status:'Statut'})[category]||'—';},
    description(item){const balls={pokeball:'Une Ball pour capturer un Pokémon sauvage.',superball:'Une Ball offrant de meilleures chances de capture.',hyperball:'Une Ball très performante pour les captures difficiles.'};return !this.english&&balls[item.key]?balls[item.key]:item.description;},
    reconcile(){if(!this.pockets.some(p=>p.key===this.activePocket))this.activePocket='medicine';if(!this.visibleItems.some(i=>i.key===this.selectedKey))this.selectedKey=this.visibleItems[0]?.key||null;},
    choosePocket(key){this.activePocket=key;this.selectedKey=null;this.$nextTick(()=>{this.reconcile();this.$refs.scroll.scrollTop=0;});},
    movePocket(e,key){if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const i=this.pockets.findIndex(p=>p.key===key),n=this.pockets.length;const next=e.key==='Home'?0:e.key==='End'?n-1:(i+(e.key==='ArrowRight'?1:-1)+n)%n;this.choosePocket(this.pockets[next].key);this.$nextTick(()=>this.$refs[`pocket-${this.activePocket}`][0].focus());},
    handleKeydown(e){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();this.$emit('close');}if(e.key!=='Tab')return;const nodes=[...this.$refs.dialog.querySelectorAll('button:not(:disabled),select:not(:disabled),[tabindex="0"]')].filter(n=>n.getClientRects().length),first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  }
};
</script>
<style scoped>
.item-module-status{display:block;margin-top:4px;font-size:10px;color:var(--journal-muted);font-weight:600}.item-module-status.enabled{color:var(--journal-accent)}
.bag-filters{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 16px}.bag-filters button,.bag-sort select{min-height:44px;padding:8px 10px;border:1px solid var(--journal-border);border-radius:8px;background:var(--journal-card);color:var(--journal-ink);font:600 11px var(--journal-font)}.bag-filters button{cursor:pointer}.bag-filters [aria-pressed=true]{background:var(--journal-selected);border-color:var(--journal-accent)}.bag-filters small{margin-left:4px;opacity:.75}.bag-sort{display:flex;align-items:center;gap:12px;margin:0 0 14px;font-weight:700}.bag-sort select{flex:1;min-width:0}

.bag-machine-name{padding:2px 5px;border-radius:5px;background:var(--pokemon-type-color);color:var(--pokemon-type-ink);line-height:1.7;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.bag-machine-meta{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;color:var(--journal-muted);font-size:10px;font-weight:700}
.bag-backdrop{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:20px;background:var(--journal-backdrop);backdrop-filter:blur(5px)}
.bag-backdrop .bag-panel.expedition-bag{box-sizing:border-box;position:relative;inset:auto;display:flex;flex-direction:column;width:min(840px,100%);height:min(690px,calc(100dvh - 40px));max-height:none;padding:0;overflow:hidden;border:2px solid var(--journal-border);border-radius:28px 28px 18px 18px;color:var(--journal-ink);background:var(--journal-paper);font:13px/1.45 var(--journal-font);box-shadow:var(--journal-shadow)}
.item-unique{display:block;font-size:10px;color:var(--journal-muted);font-weight:400;margin-top:3px}.expedition-bag *{box-sizing:border-box}.pack-header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 24px;border-bottom:1px solid var(--journal-border);background:var(--journal-card)}.pack-header small{font-size:9px;letter-spacing:.13em;font-weight:700;color:var(--journal-muted)}.pack-header h2{margin:3px 0 0;font:600 29px/1.2 Georgia,serif;color:var(--journal-heading)}.pack-header .panel-close{width:44px;height:44px;flex:none;border:1px solid var(--journal-border);border-radius:50%;background:var(--journal-soft);color:var(--journal-ink);font:26px Arial;cursor:pointer}
.pack-layout{display:flex;min-height:0;flex:1}.pack-cover{width:205px;flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:22px 16px;background:var(--journal-soft);border-right:1px solid var(--journal-border);position:relative}.pack-cover:after{content:'';position:absolute;inset:8px;border:1px dashed var(--journal-border);border-radius:16px;pointer-events:none}.backpack{width:170px;max-width:100%;filter:drop-shadow(0 8px 2px #142d4019);stroke:var(--journal-accent);stroke-width:2}.pack-strap{stroke:var(--journal-progress);stroke-width:15}.pack-handle{stroke:var(--journal-accent);stroke-width:9}.pack-body{fill:var(--journal-selected)}.pack-seam{stroke:var(--journal-progress)}.pack-flap{fill:var(--journal-accent)}.pack-stitch{stroke:var(--journal-progress);stroke-dasharray:3 4}.pack-buckle{fill:var(--journal-progress)}.pack-metal{stroke:#ad925b;fill:#e4d6aa}.pack-pocket{fill:var(--journal-card)}.pack-zip{stroke:var(--journal-accent)}.pack-patch{fill:var(--journal-soft);stroke:var(--journal-border)}.pack-compass{stroke:var(--journal-accent)}.pack-tag{margin-top:21px;font-weight:700;font-size:10px;letter-spacing:.15em;color:var(--journal-heading)}.pack-total{margin-top:8px;font-size:11px;color:var(--journal-muted)}
.pack-content{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column}.pack-pockets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;padding:12px;border-bottom:1px solid var(--journal-border);background:var(--journal-card)}.pack-pockets button{position:relative;display:flex;align-items:center;justify-content:flex-start;gap:6px;min-height:48px;padding:7px;border:1px solid transparent;border-radius:10px;color:var(--journal-muted);background:transparent;text-align:left;font:600 11px var(--journal-font);cursor:pointer}.pack-pockets .bag-object-icon{width:26px;height:26px}.pack-pockets button>span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pack-pockets small{flex:none;font-size:10px;font-variant-numeric:tabular-nums}.pack-pockets button[aria-selected=true]{color:var(--journal-heading);background:var(--journal-selected);border-color:var(--journal-progress);box-shadow:inset 0 -3px var(--journal-progress)}.pack-scroll{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:20px 22px}.pocket-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.pocket-heading small{font-size:9px;letter-spacing:.13em;color:var(--journal-muted)}.pocket-heading h3{margin:4px 0 0;font:500 25px/1.2 Georgia,serif;color:var(--journal-heading)}.pocket-heading>.bag-object-icon{width:38px;height:38px}.pocket-hint{margin:9px 0 18px;color:var(--journal-muted);font-size:12px}.pack-notice{padding:10px 12px;background:var(--journal-soft);border-left:3px solid var(--journal-accent);border-radius:4px;font-size:12px}.pack-error{color:var(--journal-danger);border-color:var(--journal-danger)}
.bag-backdrop .bag-item-row{display:block;padding:0;overflow:hidden;border:1px solid var(--journal-border);border-radius:12px;background:var(--journal-card);color:var(--journal-ink)}.bag-items{display:grid;gap:8px}.bag-backdrop .bag-item-row.item-open{border-color:var(--journal-progress)}.bag-item-select{display:flex;align-items:center;gap:10px;width:100%;min-height:64px;padding:10px;border:0;background:none;color:var(--journal-ink);text-align:left;cursor:pointer}.item-open .bag-item-select{background:var(--journal-soft)}.item-stamp{display:grid;place-items:center;width:42px;height:42px;flex:none;background:var(--journal-paper);border:1px solid var(--journal-border);border-radius:10px}.item-stamp .bag-object-icon{width:32px;height:32px}.bag-item-select .bag-item-name{flex:1;min-width:0;font-size:13px;font-weight:600;overflow-wrap:anywhere}.bag-item-select .bag-item-qty{flex:none;min-width:30px;padding:4px 6px;background:var(--journal-paper);color:var(--journal-accent);border-radius:6px;font-size:12px}.item-chevron{width:14px;text-align:center;color:var(--journal-muted);font-size:18px}.bag-item-detail{padding:12px 14px}.bag-backdrop .bag-item-description{margin:0 0 12px;color:var(--journal-muted);font:12px/1.6 var(--journal-font)}.bag-backdrop .bag-item-detail select{margin:0 0 8px}.bag-backdrop .bag-use-button{color:var(--journal-on-accent)}.bag-backdrop .bag-use-hint{display:block;margin:9px 0 0;font-size:11px;color:var(--journal-muted)}.bag-equip-link{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:44px;width:100%;padding:9px 0;margin-top:8px;border:0;border-top:1px solid var(--journal-border);background:none;color:var(--journal-accent);font:600 12px var(--journal-font);text-align:left;cursor:pointer}.pack-empty{display:flex;align-items:center;flex-direction:column;gap:12px;max-width:280px;margin:25px auto;padding:10px;text-align:center;color:var(--journal-muted);font-size:12px}.pack-empty>.bag-object-icon{width:50px;height:50px;opacity:.7}.pack-empty strong{color:var(--journal-heading);font-size:14px}.pack-empty span{line-height:1.6}.pack-footer{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 22px;border-top:1px solid var(--journal-border);color:var(--journal-muted);background:var(--journal-soft);font-size:10px}.pack-footer>span:last-child{white-space:nowrap}.expedition-bag :is(button,select,[tabindex]):focus-visible{outline:2px solid var(--journal-accent);outline-offset:-3px}
@media(max-width:600px){.bag-backdrop{padding:8px}.bag-backdrop .bag-panel.expedition-bag{height:calc(100dvh - 16px);border-radius:22px 22px 14px 14px}.pack-header{padding:13px 16px 13px 86px;min-height:80px}.pack-header h2{font-size:24px}.pack-header small{font-size:8px}.pack-layout{position:relative}.pack-cover{position:absolute;left:13px;top:-80px;width:64px;height:80px;padding:2px;background:none;border:0;pointer-events:none}.pack-cover:after,.pack-tag,.pack-total{display:none}.backpack{width:62px;height:78px;filter:none}.pack-pockets{grid-template-columns:repeat(3,minmax(0,1fr));padding:8px;gap:4px}.pack-pockets button{gap:4px;font-size:10px;padding:5px;min-height:46px}.pack-pockets .bag-object-icon{width:23px;height:23px}.pack-pockets small{font-size:9px}.pack-scroll{padding:16px 12px}.pocket-heading h3{font-size:23px}.pocket-hint{font-size:11px;margin-bottom:13px}.bag-item-detail{padding:12px}.pack-footer{padding:10px 12px;font-size:9px;gap:10px}}
@media(max-height:500px){.bag-backdrop{padding:6px}.bag-backdrop .bag-panel.expedition-bag{height:calc(100dvh - 12px)}.pack-header{padding:8px 18px;min-height:60px}.pack-header h2{font-size:23px}.pack-cover{width:145px;padding:10px}.backpack{width:115px}.pack-tag{margin-top:8px;font-size:9px}.pack-total{font-size:10px}.pack-pockets{padding:5px;gap:3px;grid-template-columns:repeat(8,minmax(0,1fr))}.pack-pockets button{flex-direction:column;justify-content:center;gap:2px;min-height:54px;padding:4px 2px;font-size:9px;text-align:center}.pack-pockets small{display:none}.pack-pockets .bag-object-icon{width:22px;height:22px}.pack-scroll{padding:12px 16px}.pocket-heading h3{font-size:20px}.pocket-hint{margin-bottom:10px}.pack-footer{padding:7px 16px}}
@media(max-height:500px) and (max-width:600px){.pack-header{padding-left:74px}.pack-cover{top:-60px;width:52px;height:60px;padding:0}.backpack{width:48px;height:60px}.pack-pockets{grid-template-columns:repeat(3,minmax(0,1fr))}.pack-pockets button{min-height:44px;flex-direction:row;font-size:9px}.pack-pockets .bag-object-icon{width:20px;height:20px}.pack-scroll{padding:10px}.pocket-heading>.bag-object-icon,.pocket-hint{display:none}.pocket-heading{margin-bottom:10px}.pack-footer{font-size:9px}}
</style>
