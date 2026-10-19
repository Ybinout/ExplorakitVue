<template>
  <section class="drift-passives" data-drift-recap :aria-label="title">
    <header><strong>{{ title }}</strong><span>{{ drifts.length }} / {{ limit }}</span></header>
    <p v-if="!entries.length">Aucun Drift équipé. Les Drifts du sac n’accordent aucun bonus tant qu’ils ne sont pas équipés.</p>
    <ul v-else>
      <li v-for="d in entries" :key="d.uuid || d.definitionId" :class="{ inactive: d.inactive }" :data-passive-id="d.definitionId">
        <div><strong>{{ d.name }}<template v-if="d.element"> · {{ typeName(d.element) }}</template></strong><b>{{ d.value }}{{ d.unit }}</b></div>
        <p>{{ d.description }}</p>
        <small v-if="d.inactive">Inactif en duel PvP · bonus d’exploration</small><small v-else-if="d.rule">{{ d.rule }}</small>
      </li>
    </ul>
    <p v-if="entries.length" class="recap-note">Valeurs après fusion. Chaque passif suit sa condition ; ces pourcentages ne s’additionnent pas en un bonus permanent unique.</p>
  </section>
</template>
<script>
import { localizeTypeName } from '@/services/pokemonTypes';
export default {
  name:'DriftPassives',
  props:{drifts:{type:Array,default:()=>[]},catalogue:Object,pvp:Boolean,title:{type:String,default:'Mes passifs équipés'},limit:{type:Number,default:5}},
  computed:{entries(){return this.drifts.map(d=>{const definition=this.catalogue?.definitions.find(v=>v.id===d.definitionId)||{};return {...definition,...d,name:definition.name||d.name||d.definitionId,value:d.value??definition.values?.[d.rarity],inactive:this.pvp&&Number(d.definitionId.slice(4))>=43&&Number(d.definitionId.slice(4))<=54};});}},
  methods:{typeName:localizeTypeName}
};
</script>
<style scoped>
.drift-passives{padding:14px;margin:14px 0;border:1px solid #b7c9bc;border-radius:10px;background:#eef3e8;color:#253b39;font:12px/1.5 Arial,sans-serif}.drift-passives header{display:flex;justify-content:space-between;gap:12px;align-items:center}.drift-passives header>strong{font:600 18px Georgia,serif}.drift-passives header>span{white-space:nowrap;color:#36675a}.drift-passives ul{list-style:none;margin:12px 0 0;padding:0;display:grid;gap:10px}.drift-passives li{padding-top:10px;border-top:1px solid #ccd9ca;min-width:0}.drift-passives li>div{display:flex;justify-content:space-between;gap:12px}.drift-passives li strong{overflow-wrap:anywhere}.drift-passives li b{font-size:15px;color:#286e61;white-space:nowrap}.drift-passives p{font:12px/1.5 Arial,sans-serif!important;margin:4px 0;color:#405e52!important}.drift-passives small{display:block;font-size:11px;color:#5c716b}.drift-passives .inactive{opacity:.7}.drift-passives .inactive small{color:#8a4e36}.drift-passives .recap-note{font-size:10px!important;margin-top:12px}
</style>
