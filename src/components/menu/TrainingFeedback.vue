<template>
  <div class="training-feedback-backdrop" @keydown.esc.stop.prevent="close" @keydown.tab="trapFocus">
    <section ref="panel" class="training-feedback-panel" :role="confirmation?'alertdialog':'dialog'" aria-modal="true" aria-labelledby="training-feedback-title" :aria-busy="busy" data-training-feedback>
      <header><div><small>{{ confirmation?'AVANT LA RELANCE':'ENTRAÎNEMENT TERMINÉ' }}</small><h2 id="training-feedback-title">{{ confirmation?'Relancer cet IV ?':entry.pokemonName }}</h2></div><button aria-label="Fermer" :disabled="busy" @click="close">×</button></header>
      <template v-if="confirmation">
        <p>{{ entry.pokemonName }} · {{ labels[entry.stat] }}</p>
        <p class="training-current" data-iv-current>{{ entry.before }}<small> / 31</small></p>
        <p class="training-warning">{{ entry.before>=26?'Cet IV est déjà élevé.':'Vérifie la valeur actuelle avant de relancer.' }} La nouvelle valeur sera tirée entre <strong>0 et 31</strong> et remplacera celle-ci, même si elle est plus basse.</p>
        <footer><button ref="primary" data-iv-cancel :disabled="busy" @click="close">Conserver cet IV</button><button class="training-confirm" data-iv-confirm :disabled="busy" @click="$emit('confirm')">Relancer quand même</button></footer>
      </template>
      <template v-else>
        <p class="training-item">{{ entry.itemName }}{{ entry.quantity>1?` × ${entry.quantity}`:'' }}</p>
        <article v-if="entry.change.kind==='ability'" class="training-result training-ability" data-training-result>
          <h3>Talent</h3><p>{{ abilityName(entry.change.before) }} <span aria-hidden="true">→</span> <strong>{{ abilityName(entry.change.after) }}</strong></p>
          <p class="training-ability-description">{{ abilityDescription(entry.change.after) }}</p>
        </article>
        <div v-else class="training-results" :class="{'training-results-many':rows.length>1}">
          <article v-for="row in rows" :key="row.stat" class="training-result" :class="{'training-result-lower':row.after<row.before}" data-training-result>
            <h3>{{ entry.change.kind==='iv'?'IV':'EV' }} {{ labels[row.stat] }}</h3>
            <div class="training-values"><span>{{ row.before }}</span><span class="training-arrow" aria-hidden="true">→</span><strong>{{ row.after }}</strong><small>/ {{ entry.change.kind==='iv'?31:252 }}</small></div>
            <small class="training-difference">{{ row.after===row.before?'Valeur inchangée':`${row.after>row.before?'+':''}${row.after-row.before}` }}</small>
          </article>
        </div>
        <p class="training-saved">{{ entry.change.kind==='ability'?'Nouveau talent sauvegardé.':entry.change.kind==='iv'?'Nouvel IV sauvegardé. Potentiel K inchangé.':'Entraînement sauvegardé.' }}</p>
        <footer><button ref="primary" class="training-continue" data-training-close @click="close">Continuer</button></footer>
      </template>
    </section>
  </div>
</template>
<script>
import {localizeAbilityName} from '@/services/i18n';
import reference from '@/data/pokemonReference.fr.json';
const labels={hp:'PV',attack:'Attaque',defense:'Défense',specialAttack:'Attaque Spéciale',specialDefense:'Défense Spéciale',speed:'Vitesse'};
export default {
  props:{entry:{type:Object,required:true},busy:Boolean},
  data:()=>({labels,previousFocus:null}),
  computed:{confirmation(){return this.entry.kind==='confirm';},rows(){const c=this.entry.change;if(!c||c.kind==='ability')return [];if(c.kind==='evReset')return Object.keys(labels).filter(stat=>c.before[stat]!==c.after[stat]).map(stat=>({stat,before:c.before[stat],after:c.after[stat]}));return [{stat:c.stat,before:c.before,after:c.after}];}},
  mounted(){this.previousFocus=document.activeElement;this.$refs.primary?.focus({preventScroll:true});},
  beforeDestroy(){const previous=this.previousFocus;this.$nextTick(()=>{if(document.querySelector('[data-training-feedback]'))return;(previous?.isConnected?previous:document.querySelector('.pack-close, .bag-panel button'))?.focus({preventScroll:true});});},
  methods:{abilityName(name){return localizeAbilityName(name,'fr');},abilityDescription(name){return reference.abilities[name]||'';},close(){if(!this.busy)this.$emit('close');},trapFocus(event){const buttons=[...this.$refs.panel.querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons[buttons.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}}
};
</script>
<style scoped>
.training-ability p{margin:7px 0;overflow-wrap:anywhere}.training-ability strong{color:var(--journal-accent)}.training-ability-description{font-size:12px;color:var(--journal-muted)}
.training-feedback-backdrop{position:fixed;inset:0;z-index:3200;display:grid;place-items:center;padding:12px;background:var(--journal-backdrop);color:var(--journal-ink);font:14px/1.55 var(--journal-font)}.training-feedback-panel{box-sizing:border-box;width:min(440px,100%);max-height:calc(100dvh - 24px);overflow:auto;overscroll-behavior:contain;padding:22px;border:2px solid var(--journal-border);border-radius:16px;background:var(--journal-paper);box-shadow:var(--journal-shadow)}header{display:flex;align-items:center;justify-content:space-between;gap:12px}header small{font-size:9px;letter-spacing:.12em;color:var(--journal-muted)}h2{margin:4px 0;font:500 25px Georgia,serif;color:var(--journal-heading);overflow-wrap:anywhere}button{font:inherit;min-height:44px;min-width:44px;border:1px solid var(--journal-border);border-radius:9px;color:var(--journal-ink);background:var(--journal-card);padding:9px 13px;cursor:pointer}button:disabled{opacity:.5;cursor:wait}button:focus-visible{outline:2px solid var(--journal-accent);outline-offset:3px}header button{font-size:22px;padding:0;flex:none}.training-current{margin:8px 0;font-size:42px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--journal-heading)}.training-current small{font-size:17px;color:var(--journal-muted)}.training-warning{padding:13px;border-left:3px solid var(--journal-progress);background:var(--journal-soft)}footer{display:flex;gap:9px;margin-top:20px}footer button{flex:1}.training-confirm{color:var(--journal-danger);border-color:var(--journal-danger)}.training-continue{background:var(--journal-accent);color:var(--journal-on-accent);font-weight:600}.training-item,.training-saved{color:var(--journal-muted);font-size:12px}.training-results{display:grid;gap:9px}.training-results-many{grid-template-columns:repeat(2,minmax(0,1fr))}.training-result{padding:14px;border:1px solid var(--journal-border);border-radius:10px;background:var(--journal-card)}.training-result h3{font-size:12px;margin:0 0 8px;color:var(--journal-muted);font-weight:500}.training-values{display:flex;align-items:baseline;gap:9px;font-variant-numeric:tabular-nums}.training-values>span{font-size:22px}.training-values .training-arrow{font-size:16px;color:var(--journal-muted)}.training-values strong{font-size:34px;color:var(--journal-accent)}.training-values small{color:var(--journal-muted);font-size:11px}.training-difference{display:block;margin-top:4px;color:var(--journal-accent)}.training-result-lower .training-values strong,.training-result-lower .training-difference{color:var(--journal-danger)}@media(max-width:360px){.training-feedback-panel{padding:16px}.training-result{padding:10px}.training-values{gap:5px}.training-values strong{font-size:29px}footer{flex-direction:column}}
</style>
