<template>
 <article class="raid-card" :class="{'has-hand-request':requested,'is-request-mine':requestMine}" :aria-label="pokemon.name+(targeted?', ciblé par le boss':'')+(displayed?', en combat':'')">
  <div class="raid-card-header"><battle-pokemon-info v-if="inspectionPokemon?.inspectionMoves?.length" :pokemon="inspectionPokemon"/><span class="raid-card-flags">
   <span v-if="targeted" class="raid-card-target" data-raid-targeted><svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="4"/><path d="M8 1v4m0 6v4M1 8h4m6 0h4"/></svg>Ciblé</span><span v-else/>
   <span v-if="displayed" class="raid-card-active" data-raid-displayed><svg viewBox="0 0 16 16"><path d="m2 2 8 7m-7 1 4 4m-5 0 3-3M14 2 6 9m7 1-4 4m5 0-3-3M2 2l1 4m11-4-1 4"/></svg>En combat</span><span v-else/>
  </span><button v-if="canRequest||requestMine" class="raid-hand-button" :class="{'is-sent':requestMine}" :disabled="requestBusy" :aria-label="(requestMine?'Annuler la demande de main pour ':'Demander la main pour ')+pokemon.name" :title="requestMine?'Annuler la demande':'Demander la main'" :aria-pressed="requestMine" @click="$emit('request')" data-raid-request-hand>✋</button><span v-else-if="requested" class="raid-hand-signal" :title="pokemon.name+' demande la main'" aria-label="Main demandée">✋</span><span class="raid-card-order" :class="{'is-spent':!order}" :aria-label="order?'Ordre d’action : '+order:'Action terminée'" data-raid-order>{{ order||'—' }}</span></div>
  <button class="raid-card-pick" :disabled="disabled" :aria-pressed="displayed" @click="$emit('choose')" :aria-label="'Choisir '+pokemon.name"><span class="raid-card-body">
   <span class="raid-card-portrait"><pokemon-portrait :src="src" alt=""/><span v-if="hit" :key="hit.id" class="raid-card-hit" :class="{'is-heal':hit.kind==='-heal'}">{{ hit.kind==='-heal'?'+':'−' }}{{ hit.amount }}</span></span>
   <span class="raid-card-detail"><span class="raid-card-name"><b>{{ pokemon.name }}</b><small>{{ stateLabel }}</small></span><span class="raid-card-health"><i :style="{width:percent+'%'}"/></span><span class="raid-card-life">{{ pokemon.currentHp }}/{{ pokemon.maxHp }} PV <battle-status-pill v-if="pokemon.status!=='normal'" :status="pokemon.status" compact/></span><span class="raid-card-threat"><i :style="{width:pokemon.aggro+'%'}"/></span></span>
  </span>
  <span class="raid-card-meta"><span :title="pokemon.ownerName">{{ pokemon.ownerName }} <b>{{ ready?'✓':controlled?'· toi':'' }}</b></span><small>Aggro <b>{{ pokemon.aggro }} %</b></small></span>
 </button><small v-if="multiplayer" class="raid-card-request-note" aria-live="polite">{{ requested?(requestMine?'Demande envoyée':'Demande la main'):actionsLeft>0?actionsLeft+' action'+(actionsLeft>1?'s':'')+' disponible'+(actionsLeft>1?'s':''):'Action terminée' }}</small>
 </article>
</template>
<script>
import BattlePokemonInfo from '../battle/BattlePokemonInfo.vue';
import PokemonPortrait from '../PokemonPortrait.vue';
import BattleStatusPill from '../battle/BattleStatusPill.vue';
export default{components:{BattlePokemonInfo,PokemonPortrait,BattleStatusPill},props:{inspectionPokemon:Object,pokemon:Object,src:String,disabled:Boolean,displayed:Boolean,targeted:Boolean,order:Number,hit:Object,ready:Boolean,controlled:Boolean,requested:Boolean,canRequest:Boolean,requestMine:Boolean,requestBusy:Boolean,multiplayer:Boolean,actionsLeft:Number},computed:{stateLabel(){return this.pokemon.withdrawn?'Retiré':!this.pokemon.currentHp?this.pokemon.survivalKitUsed?'K.O. protégé':this.pokemon.permanentlyLost?'Perdu':'K.O.':this.actionsLeft>1?this.actionsLeft+' actions':'';},percent(){return Math.max(0,Math.min(100,this.pokemon.currentHp/this.pokemon.maxHp*100));}}};
</script>
<style scoped>
.raid-card{border:1px solid var(--journal-border);border-radius:7px;background:var(--journal-card);color:var(--journal-ink);box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;text-align:left;line-height:1.2;min-width:0}.raid-card-flags{width:100%;display:flex;justify-content:space-between;gap:3px;min-height:17px;flex-shrink:0}.raid-card-flags>span{display:inline-flex;align-items:center;gap:3px;white-space:nowrap;font-size:9px;font-weight:600;line-height:15px}.raid-card-flags svg{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}.raid-card-target{color:var(--journal-danger,#a33b51)}.raid-card-active{color:var(--journal-accent,#795b9b)}.raid-card-body{display:grid;grid-template-columns:36px minmax(0,1fr);align-items:center;gap:5px;width:100%}.raid-card-portrait{position:relative;display:flex;align-items:center;justify-content:center;width:36px;min-height:44px}.raid-card-portrait .pokemon-portrait{width:36px;height:42px}.raid-card-detail{display:flex;flex-direction:column;min-width:0;gap:4px}.raid-card-name{display:flex;align-items:center;justify-content:space-between;gap:3px}.raid-card-name b{font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.raid-card-name small{font-size:8px;opacity:.7}.raid-card-health,.raid-card-threat{display:block;position:relative;width:100%;height:5px;background:var(--journal-border,#bed0df);border-radius:4px;overflow:hidden}.raid-card-health i,.raid-card-threat i{display:block;height:100%;background:#6dba91;transition:width .7s ease-out}.raid-card-threat{height:3px}.raid-card-threat i{background:#dbab58;transition:width .25s ease-out}.raid-card-life{display:flex;align-items:center;gap:3px;font-size:9px;white-space:nowrap}.raid-card-meta{display:flex;justify-content:space-between;align-items:center;width:100%;min-width:0;gap:4px;font-size:8px;margin-top:2px}.raid-card-meta>span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.raid-card-meta small{font-size:8px;white-space:nowrap;opacity:.85}.raid-card-meta b{font-size:inherit;font-weight:600}.raid-card-hit{position:absolute;left:0;bottom:0;font-size:14px;font-weight:700;color:#fca1a8;text-shadow:0 1px 2px #121624}.raid-card-hit.is-heal{color:#7ae4a2}@media(min-width:1001px) and (min-height:601px){.raid-card-body{grid-template-columns:1fr;gap:5px}.raid-card-portrait{width:100%;min-height:32px}.raid-card-portrait .pokemon-portrait{width:36px;height:35px}.raid-card-detail{width:100%}.raid-card-life{font-size:10px}.raid-card-flags>span{font-size:8px;gap:2px}}@media(prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
<style scoped>
.raid-card:hover{background:var(--journal-card);color:var(--journal-ink)}.raid-card.is-corrupted:hover{background:#9471b12b}
</style>

<style scoped>
.raid-card-header{display:flex;align-items:center;gap:3px;width:100%;min-height:19px;flex:none}.raid-card-flags{flex:1;min-width:0}.raid-card-pick{flex-shrink:0;display:flex;flex-direction:column;gap:4px;width:100%;min-width:0;min-height:0;text-align:left;background:transparent;border:0;padding:0;color:inherit;font:inherit;cursor:pointer}.raid-card-pick:disabled{cursor:default;opacity:1}.raid-card-pick:focus-visible,.raid-hand-button:focus-visible{outline:2px solid var(--journal-accent);outline-offset:2px}.raid-card-body,.raid-card-meta{width:100%}.raid-card-header .raid-card-flags>span{font-size:8px;gap:2px}.raid-hand-button,.raid-hand-signal{display:grid;place-items:center;flex:none;min-height:26px;width:28px;padding:0;border:1px solid var(--journal-border);border-radius:6px;background:var(--journal-soft);color:var(--journal-ink);font-size:16px;line-height:1;cursor:pointer}.raid-hand-button.is-sent,.raid-hand-signal{border-color:#d6a55f;background:color-mix(in srgb,#d6a55f 18%,var(--journal-card));color:#d8a96f}.raid-hand-signal{cursor:default}.raid-card-request-note{display:block;flex:none;width:100%;min-height:11px;font-size:8px;line-height:11px;color:var(--journal-muted);text-align:left}.has-hand-request .raid-card-request-note{color:var(--journal-accent);font-weight:700}.has-hand-request{border-color:#cba169}.raid-card-meta{margin-top:1px}.raid-card-health,.raid-card-threat{flex-shrink:0}
</style>

<style scoped>
.raid-card-header{min-height:26px;gap:4px}.raid-card-flags{flex-wrap:wrap;align-content:center;justify-content:flex-start;column-gap:6px;row-gap:0}.raid-card-header .raid-card-flags>span{font-size:8px;line-height:12px}.raid-card-flags>span:empty{display:none}
.raid-card-order{flex:none;display:grid;place-items:center;width:26px;height:26px;border-radius:50%;border:1px solid #c5b8db;background:#49365c;color:#fff2d8;box-shadow:0 1px 3px #11182733;font-size:16px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums}.raid-card-order.is-spent{background:var(--journal-soft);color:var(--journal-muted);border-color:var(--journal-border);font-size:13px}
.is-acting .raid-card-order{background:#275846;border-color:#85cba8;color:#e7fff0}.raid-card-active{color:#54a47b}
.raid-card-life ::v-deep .battle-status-pill{max-width:58px;font-size:7px}
</style>

<style scoped>
/* Compact phones keep every HP, threat and owner line inside its card. */
@media(max-width:700px) and (max-height:700px){
 .raid-card-header{min-height:24px}
 .raid-card-order{width:24px;height:24px;font-size:15px}
 .raid-card-pick{gap:2px}
 .raid-card-body{grid-template-columns:28px minmax(0,1fr);gap:4px}
 .raid-card-portrait{width:28px;min-height:32px}
 .raid-card-portrait .pokemon-portrait{width:28px;height:32px}
 .raid-card-detail{gap:3px}
 .raid-card-name b{font-size:10px}
 .raid-card-life{font-size:8px;line-height:11px}
 .raid-card-health{height:4px}
 .raid-card-threat{height:3px}
 .raid-card-meta{font-size:7px;line-height:10px}
 .raid-card-meta small{font-size:7px}
}
</style>
