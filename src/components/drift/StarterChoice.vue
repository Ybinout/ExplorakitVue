<template>
  <div class="starter-backdrop" @keydown.tab="trap">
    <section ref="dialog" class="starter-card" role="dialog" aria-modal="true" aria-labelledby="starter-title" tabindex="-1">
      <p class="eyebrow">LE DÉPART DE TON EXPÉDITION</p><h1 id="starter-title">Choisis ton compagnon</h1>
      <p v-if="choices.length">Trois rencontres au hasard. Une seule équipe à construire.</p>
      <p v-else role="status">Ton compagnon est prêt. Les autres dresseurs choisissent encore…</p>
      <div class="choices"><button v-for="pokemon in choices" :key="pokemon.uuid" :data-starter-choice="pokemon.uuid" :disabled="busy" @click="$emit('choose',pokemon.uuid)">
        <pokemon-portrait :src="`${$assetBase}img/pokemon/front/${pokemon.data.id}.png`" :alt="pokemon.truename" />
        <strong>{{ pokemon.truename }}</strong><span>{{ pokemon.data.type.map(typeName).join(' · ') }}</span><small>Niveau {{ pokemon.level }} · {{ pokemon.maxHp }} PV</small><b>Partir ensemble →</b>
      </button></div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p class="note">{{ seconds }} s pour choisir. Sans choix, le premier compagnon est sélectionné. Le chrono d’exploration commence après cette préparation.</p>
    </section>
  </div>
</template>
<script>
import PokemonPortrait from '../PokemonPortrait.vue';
import { localizeTypeName } from '@/services/pokemonTypes';
export default {
  components:{PokemonPortrait},props:{choices:{type:Array,default:()=>[]},seconds:Number,busy:Boolean,error:String},
  mounted(){this.$refs.dialog.focus();},
  methods:{typeName(type){return localizeTypeName(type,'fr');},trap(event){const buttons=[...this.$el.querySelectorAll('button:not(:disabled)')];if(!buttons.length){event.preventDefault();return;}const i=buttons.indexOf(document.activeElement);if(event.shiftKey&&i<=0){event.preventDefault();buttons.at(-1).focus();}else if(!event.shiftKey&&i===buttons.length-1){event.preventDefault();buttons[0].focus();}}}
};
</script>
<style scoped>
.starter-backdrop{position:fixed;inset:0;z-index:220;background:#162f35ed;display:grid;place-items:center;padding:max(12px,env(safe-area-inset-top)) 12px;overflow:auto;color:#253b39;font-family:Arial,sans-serif}.starter-card{box-sizing:border-box;width:min(840px,100%);max-height:100%;overflow:auto;padding:32px;border:1px solid #d3ddd2;border-radius:18px;background:#f7f8f3;outline:none}.eyebrow{font-size:10px;letter-spacing:.15em;color:#8a6d36}h1{font:36px Georgia,serif;margin:12px 0}p{font-size:13px;line-height:1.6;color:#5c716b}.choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:24px 0}.choices button{display:flex;align-items:center;flex-direction:column;gap:9px;background:#fcfcf8;border:1px solid #cbd9cb;border-radius:12px;padding:18px 10px;color:#253b39;cursor:pointer;min-height:44px}.choices button:hover,.choices button:focus-visible{background:#e5eddd;outline:2px solid #287366}.choices .pokemon-portrait{width:110px;height:110px}.choices strong{font-size:18px}.choices span,.choices small{font-size:11px}.choices b{font-size:12px;color:#287366;margin-top:10px}.note{font-size:11px}.error{color:#a33f35}@media(max-width:540px){.starter-card{padding:20px}.choices{grid-template-columns:1fr;gap:8px;margin:15px 0}.choices button{display:grid;grid-template-columns:65px 1fr;text-align:left;gap:4px 12px;padding:10px}.choices .pokemon-portrait{grid-row:span 4;width:65px;height:65px}.choices strong{font-size:16px}.choices b{margin:0}h1{font-size:28px}}
</style>
