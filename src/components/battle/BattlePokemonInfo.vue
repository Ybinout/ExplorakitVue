<template>
 <div class="battle-companion-info">
  <info-button ref="trigger" class="companion-info-trigger" data-pokemon-info :aria-label="'Consulter '+name+' et ses capacités'" :aria-expanded="opened" @click.stop="open"/>
  <div v-if="opened" v-back="close" class="companion-info-backdrop" data-battle-pokemon-info @pointerdown.stop @click.stop @keydown.stop="keys" @keyup.stop>
   <section ref="sheet" role="dialog" aria-modal="true" :aria-label="'Fiche de '+name" class="companion-info-sheet">
    <header><div><small>ÉQUIPE · CONSULTATION</small><h2>{{ name }} <small>N. {{ pokemon.level }}</small></h2></div><button ref="close" type="button" aria-label="Fermer la fiche" @click="close">×</button></header>
    <div class="companion-info-identity"><pokemon-portrait :src="$pokemonSprite(pokemon,{animated:false})" :alt="name"/><div><div class="companion-info-types"><span v-for="t in types" :key="t" :style="typeStyle(t)">{{ typeName(t) }}</span></div><p>{{ pokemon.currentHp }} / {{ pokemon.maxHp }} PV</p><p v-if="ability"><b>{{ abilityLabel }}</b> · {{ abilityDescription }}</p></div></div>
    <h3>Capacités</h3>
    <article v-for="(m,i) in moves" :key="i" class="companion-info-move" :style="typeStyle(m.type)"><div><strong>{{ moveName(m.name) }}</strong><span>{{ m.pp }} / {{ m.maxPp }} PP</span></div><p class="companion-info-metadata"><b>{{ typeName(m.type) }}</b> · {{ category(m.damageClass) }} · Puissance {{ m.powerLabel }} · Précision {{ m.accuracy>0?m.accuracy+' %':'—' }}</p><p>{{ m.description }}</p></article>
    <p v-if="!moves.length">Aucune capacité à afficher.</p>
    <footer>Consulter ne change pas de Pokémon. Le combat et son chronomètre continuent.</footer>
    <button type="button" class="companion-info-return" @click="close">Revenir au combat</button>
   </section>
  </div>
 </div>
</template>
<script>
import InfoButton from './InfoButton.vue';
import PokemonPortrait from '../PokemonPortrait.vue';
import {createPokemonReference} from '@/services/pokemonReference';
import catalog from '@/data/pokemonReference.fr.json';
import {localizeMoveName,localizeAbilityName} from '@/services/i18n';
import {localizeTypeName,typeBadgeStyle} from '@/services/pokemonTypes';
const reference=createPokemonReference(catalog);
export default {
 components:{PokemonPortrait,InfoButton},props:{pokemon:{type:Object,required:true}},data:()=>({opened:false}),
 computed:{
  name(){return this.pokemon.name||this.pokemon.truename||'Pokémon';},
  types(){return this.pokemon.types||this.pokemon.data?.type||[];},
  ability(){return this.pokemon.passiveAbility||this.pokemon.ability;},
  abilityLabel(){return localizeAbilityName(this.ability,'fr')||this.ability;},
  abilityDescription(){return reference.abilityDescription(this.ability);},
  moves(){const p=this.pokemon,raw=p.inspectionMoves||p.abilities||p.moves||[];return reference.moves({...p,abilities:raw.map(m=>typeof m==='string'?m:m.ename||m.name||m.id),movePp:p.movePp||raw.map(m=>m.pp),moveDetails:raw.map(m=>typeof m==='string'?{}:{...m,name:m.ename||m.name||m.id,maxPp:m.maxpp??m.maxPp})});}
 },
 watch:{'pokemon.uuid'(){this.opened=false;}},
 methods:{typeName:localizeTypeName,typeStyle:typeBadgeStyle,moveName:m=>localizeMoveName(m,'fr')||m,category:c=>({physical:'Physique',Physical:'Physique',special:'Spéciale',Special:'Spéciale',status:'Statut',Status:'Statut'}[c]||'—'),open(){this.opened=true;this.$nextTick(()=>this.$refs.close?.focus({preventScroll:true}));},close(){this.opened=false;this.$nextTick(()=>this.$refs.trigger?.$el?.focus({preventScroll:true}));},keys(e){if(e.key==='Escape'){e.preventDefault();this.close();}if(e.key==='Tab'){const buttons=[...this.$refs.sheet.querySelectorAll('button:not(:disabled)')];e.preventDefault();buttons[(buttons.indexOf(document.activeElement)+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();}}}
};
</script>
<style scoped>
.battle-companion-info{flex:none;min-width:36px}.companion-info-backdrop{position:fixed;inset:0;z-index:4300;display:grid;place-items:center;padding:12px;background:var(--journal-backdrop);text-align:left}.companion-info-sheet{box-sizing:border-box;width:min(580px,100%);max-height:calc(100dvh - 24px);overflow:auto;overscroll-behavior:contain;padding:18px;border:1px solid var(--journal-border);box-shadow:0 12px 36px #10203130;border-radius:16px;background:var(--journal-paper);color:var(--journal-ink);font:13px/1.5 var(--journal-font)}.companion-info-sheet header{display:flex;justify-content:space-between;align-items:center;gap:8px}.companion-info-sheet header>div{min-width:0}.companion-info-sheet h2{font:600 24px Georgia,serif;margin:4px 0;overflow-wrap:anywhere}.companion-info-sheet header small{font:10px var(--journal-font);color:var(--journal-muted)}.companion-info-sheet button{min-width:44px;min-height:44px;border:1px solid var(--journal-border);border-radius:9px;background:var(--journal-card);color:var(--journal-ink);font:inherit;cursor:pointer}.companion-info-identity{display:flex;gap:12px;align-items:center;margin-top:12px}.companion-info-identity>.pokemon-portrait{width:68px;height:68px;flex:none}.companion-info-identity p{margin:5px 0}.companion-info-types{display:flex;gap:5px;flex-wrap:wrap}.companion-info-types span{padding:2px 8px;border-radius:6px;background:var(--pokemon-type-color);color:var(--pokemon-type-ink);border:1px solid var(--pokemon-type-color)}.companion-info-sheet h3{font-size:13px;margin:14px 0 8px}.companion-info-move{padding:10px 12px;margin:8px 0;border:1px solid var(--journal-border);border-left:4px solid var(--pokemon-type-color);border-radius:8px;background:var(--journal-card)}.companion-info-move>div{display:flex;justify-content:space-between;gap:8px}.companion-info-move>div span{white-space:nowrap;color:var(--journal-muted);font-size:11px}.companion-info-move p{margin:5px 0 0}.companion-info-metadata{font-size:11px}.companion-info-sheet footer{font-size:11px;color:var(--journal-muted);margin:14px 0 10px}.companion-info-return{width:100%}@media(max-width:380px){.companion-info-sheet{padding:12px}.companion-info-identity{align-items:flex-start;gap:7px}.companion-info-identity>.pokemon-portrait{width:48px;height:48px}.companion-info-sheet h2{font-size:21px}}
</style>
