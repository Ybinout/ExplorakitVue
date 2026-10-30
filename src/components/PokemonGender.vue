<template>
  <span v-if="info" class="pokemon-gender" :class="pokemon.gender" :data-pokemon-gender="pokemon.gender" role="img" :aria-label="description" :title="description">
    <span class="gender-symbol" aria-hidden="true">{{ info.symbol }}</span><span v-if="detailed" aria-hidden="true">{{ info.label }}</span>
  </span>
</template>
<script>
export default {
  props:{pokemon:{type:Object,required:true},language:{type:String,default:'fr'},detailed:Boolean},
  computed:{
    info(){if(this.pokemon.isEgg)return null;const en=this.language==='en';return {
      male:{symbol:'♂',label:en?'Male':'Mâle'},female:{symbol:'♀',label:en?'Female':'Femelle'},genderless:{symbol:'—',label:en?'Genderless':'Asexué'}
    }[this.pokemon.gender] || null;},
    description(){return `${this.language==='en'?'Sex':'Sexe'} : ${this.info?.label || ''}`;}
  }
};
</script>
<style scoped>
.pokemon-gender{display:inline-flex;align-items:center;justify-content:center;gap:5px;min-width:22px;min-height:22px;padding:2px 5px;border-radius:5px;flex:none;font:700 11px/1.2 var(--journal-font);white-space:nowrap;color:var(--journal-muted);background:var(--journal-soft)}
.gender-symbol{font-size:16px;line-height:18px}
.male{color:#326488;background:#e0eff9}.female{color:#963f60;background:#f8e4ed}
</style>
