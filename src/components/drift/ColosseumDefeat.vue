<template>
  <details v-if="defeat" class="colosseum-defeat" data-colosseum-defeat>
    <summary>Dernier adversaire <span v-if="defeat.wave">· Défi {{ defeat.wave }}</span> · {{ defeat.name }}</summary>
    <p>{{ defeat.outcome === 'draw' ? 'Double K.O.' : 'Défaite' }}<template v-if="defeat.turns"> après {{ defeat.turns }} tour{{ defeat.turns > 1 ? 's' : '' }}</template>. Voici son équipe au début du combat.</p>
    <div class="defeat-roster"><article v-for="(p,index) in defeat.team" :key="index">
      <pokemon-portrait :src="`${$assetBase}img/pokemon/front/${p.pokemonId}.png`" :alt="p.name"/>
      <div><strong>{{ p.name }} · N. {{ p.level }}</strong><small>{{ p.knockedOut ? 'Vaincu' : 'Encore debout' }}</small><p v-if="p.heldItem">{{ itemName(p.heldItem) }}</p><p v-if="p.passiveAbility">{{ abilityName(p.passiveAbility) }}</p><p class="moves">{{ (p.moveNames || p.moves || []).join(' · ') }}</p></div>
    </article></div>
  </details>
</template>
<script>
import PokemonPortrait from '../PokemonPortrait.vue';
import heldItems from '@/data/heldItems.json';
import { localizeAbilityName } from '@/services/i18n';
export default { components:{PokemonPortrait},props:{defeat:Object},methods:{itemName(key){return heldItems[key]?.name || key;},abilityName(name){return localizeAbilityName(name,'fr');}} };
</script>
<style scoped>
.colosseum-defeat{margin-top:14px;border:1px solid #d3ddd2;border-radius:10px;background:#faf7ee;color:#253b39;font:12px/1.6 Arial,sans-serif}.colosseum-defeat summary{cursor:pointer;padding:12px;min-height:44px;box-sizing:border-box;overflow-wrap:anywhere;font-weight:700}.colosseum-defeat>p{margin:0;padding:0 12px 12px}.defeat-roster{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr));gap:10px;padding:0 12px 12px}.defeat-roster article{display:flex;gap:8px;align-items:center;min-width:0;border-top:1px solid #e3dfd1;padding-top:8px}.defeat-roster .pokemon-portrait{width:62px;flex:none}.defeat-roster article>div{min-width:0}.defeat-roster small{display:block;color:#806849}.defeat-roster p{font-size:11px;margin:3px 0;overflow-wrap:anywhere}.moves{color:#5c716b}
</style>
