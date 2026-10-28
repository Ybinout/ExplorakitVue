<template>
  <span class="pc-pokemon-portrait" :title="label">
    <pokemon-portrait :src="src"/>
    <span class="pc-portrait-flags" aria-hidden="true">
      <potential-star :value="pokemon.potential"/>
      <span v-if="pokemon.heldItem" class="pc-held-item" data-pc-held-item><bag-item-icon :pocket="pokemon.heldItem.endsWith('_berry')?'berries':'held'" :item-key="pokemon.heldItem"/></span>
    </span>
  </span>
</template>
<script>
import PokemonPortrait from '../PokemonPortrait.vue';
import PotentialStar from '../PotentialStar.vue';
import BagItemIcon from './BagItemIcon.vue';
export default {
  components:{PokemonPortrait,PotentialStar,BagItemIcon},
  props:{pokemon:{type:Object,required:true},src:String},
  computed:{label(){return `Potentiel K${this.pokemon.potential || 1}${this.pokemon.heldItem?` · Objet : ${this.pokemon.heldItemName || this.pokemon.heldItem}`:''}`;}}
};
</script>
<style scoped>
.pc-pokemon-portrait{display:block;position:relative;flex:none;width:100%;aspect-ratio:1}.pc-pokemon-portrait>.pokemon-portrait{width:100%}.pc-portrait-flags{position:absolute;inset:1px 1px auto;display:flex;align-items:center;justify-content:space-between;pointer-events:none}.pc-portrait-flags .potential-star,.pc-held-item{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;flex:0 0 16px;border-radius:50%;background:var(--journal-paper);box-shadow:0 0 0 1px var(--journal-border)}.pc-portrait-flags ::v-deep .potential-star svg{width:14px;height:14px}.pc-portrait-flags ::v-deep .potential-star__sparkles{animation:none}.pc-held-item .bag-object-icon{width:12px;height:12px}
</style>
