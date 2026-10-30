<template>
  <div class="team-traits" data-team-traits role="group" :aria-label="language==='en'?'Potential, sex and types':'Potentiel, sexe et types'">
    <potential-star class="team-potential" :value="pokemon.k" :language="language" />
    <pokemon-gender :pokemon="pokemon" :language="language" />
    <span v-for="type in types" :key="type" class="team-type" :data-pokemon-type="type" :style="typeStyle(type)">{{ language==='en'?type:typeName(type) }}</span>
  </div>
</template>

<script>
import PotentialStar from './PotentialStar.vue';
import PokemonGender from './PokemonGender.vue';
import {localizeTypeName,typeBadgeStyle} from '@/services/pokemonTypes';
export default {
  components:{PotentialStar,PokemonGender},
  props:{pokemon:{type:Object,required:true},language:{type:String,default:'fr'}},
  computed:{types(){return this.pokemon.isEgg?[]:[...new Set(Array.isArray(this.pokemon.data?.type)?this.pokemon.data.type:[])];}},
  methods:{typeName:localizeTypeName,typeStyle:typeBadgeStyle}
};
</script>

<style scoped>
.team-traits{display:flex;align-items:center;flex-wrap:wrap;gap:5px;min-width:0;margin:0 0 6px}
.team-potential{width:24px;height:24px;flex:0 0 24px}
.team-potential ::v-deep svg{max-width:24px;max-height:24px}
.team-type{padding:3px 7px;border-radius:5px;background:var(--pokemon-type-color);color:var(--pokemon-type-ink);font-size:10px;font-weight:700;line-height:1.2;white-space:nowrap}
</style>
