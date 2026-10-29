<template>
  <div class="machine-use" :aria-busy="busy">
    <dl class="machine-details" data-bag-cs-stats><div v-for="stat in stats(machine.move)" :key="stat.label"><dt>{{ stat.label }}</dt><dd>{{ stat.value }}</dd></div></dl>
    <p class="machine-description" data-machine-description>{{ description(machine.move) }}</p>
    <label>À qui apprendre cette attaque ?
      <select data-machine-target :value="target" :disabled="busy || !allowed" @change="choose($event.target.value)">
        <option value="">Choisir un Pokémon…</option>
        <option v-for="p in team" :key="p.uuid" :value="p.uuid" :disabled="!!reason(p)">{{ p.name }} · {{ reason(p) || 'Compatible' }}</option>
      </select>
    </label>
    <template v-if="pokemon">
      <p v-if="expectedMoves.length===4">Choisis l’attaque à oublier.</p>
      <div v-if="expectedMoves.length===4" class="machine-slots">
        <button v-for="(move,index) in expectedMoves" :key="index" :data-machine-slot="index" :aria-pressed="slot===index" :disabled="busy || !allowed" @click="slot=index"><strong>{{ label(move) }}</strong><small>{{ details(move) }}</small><span class="machine-description" data-machine-description>{{ description(move) }}</span></button>
      </div>
      <p v-if="slot!==null" class="machine-preview" role="status">{{ slot < expectedMoves.length ? label(expectedMoves[slot]) + ' → ' : '' }}{{ label(machine.move) }}</p>
      <div class="machine-confirm">
        <button data-machine-confirm :disabled="busy || !allowed || slot===null || !!reason(pokemon)" @click="confirm">{{ busy ? 'Sauvegarde…' : 'Apprendre ' + label(machine.move) }}</button>
        <button :disabled="busy" @click="choose('')">Annuler</button>
      </div>
    </template>
    <small>{{ allowed ? 'Une CS sera consommée uniquement après confirmation.' : 'Disponible hors combat.' }}</small>
  </div>
</template>
<script>
import machines from '@/data/machines.json';
import moves from '@/data/moveLearning.json';
import reference from '@/data/pokemonReference.fr.json';
import { localizeMoveName } from '@/services/i18n';
import { localizeTypeName } from '@/services/pokemonTypes';
export default {
  props:{item:{type:Object,required:true},team:{type:Array,default:()=>[]},busy:Boolean,allowed:Boolean},
  data:()=>({target:'',slot:null,expectedMoves:[]}),
  computed:{machine(){return machines[this.item.key];},pokemon(){return this.team.find(p=>p.uuid===this.target);},teamMoves(){return JSON.stringify(this.team.map(p=>[p.uuid,p.abilities]));}},
  watch:{teamMoves(){this.choose('');}},
  methods:{
    stats(name){const m=moves[name]||{};return [{label:'Type',value:localizeTypeName(m.type)},{label:'Catégorie',value:{physical:'Physique',special:'Spéciale',status:'Statut'}[reference.moves[name]?.category]||'—'},{label:'Puissance',value:m.power||'—'},{label:'Précision',value:m.accuracy?m.accuracy+' %':'—'},{label:'PP',value:m.pp||'—'}];},
    label(move){return localizeMoveName(move,'fr');},
    description(move){return reference.moves[move]?.description || 'Description de cette capacité indisponible.';},
    details(name){const m=moves[name],category={physical:'Physique',special:'Spéciale',status:'Statut'}[reference.moves[name]?.category]||'—';return m?`${localizeTypeName(m.type)} · ${category} · Puiss. ${m.power||'—'} · Préc. ${m.accuracy||'—'} · ${m.pp} PP`:'';},
    reason(p){if(p.isEgg)return 'Œuf';if(!(p.currentHp>0))return 'K.O.';if(!this.machine.species.includes(p.data?.id))return 'Incompatible';if(p.abilities.includes(this.machine.move))return 'Déjà apprise';return '';},
    choose(uuid){this.target=uuid;this.expectedMoves=[...(this.pokemon?.abilities||[])];this.slot=uuid&&this.expectedMoves.length<4?this.expectedMoves.length:null;},
    confirm(){if(!this.pokemon||this.busy||!this.allowed||this.slot===null||this.reason(this.pokemon))return;this.$emit('use',{itemKey:this.item.key,pokemonUuid:this.target,slot:this.slot,expectedMoves:[...this.expectedMoves]});}
  }
};
</script>
<style scoped>
.machine-details{display:flex;flex-wrap:wrap;gap:8px 18px;margin:0}.machine-details div{display:grid;gap:3px}.machine-details dt{font-weight:800;color:var(--journal-heading)}.machine-details dd{margin:0;font-weight:700;color:var(--journal-ink)}
.machine-description{font-size:12px;line-height:1.55;font-weight:400;color:var(--journal-ink)}
.machine-use{display:grid;gap:12px;min-width:0;color:var(--journal-ink);font:12px/1.5 var(--journal-font)}.machine-use p{margin:0}.machine-use label{display:grid;gap:8px}.machine-use select,.machine-use button{box-sizing:border-box;max-width:100%;min-width:0;min-height:44px;padding:10px;border:1px solid var(--journal-border);border-radius:8px;background:var(--journal-card);color:var(--journal-ink);font:inherit}.machine-use select{width:100%}.machine-use button{cursor:pointer}.machine-use button:disabled{opacity:.5;cursor:default}.machine-use :focus-visible{outline:2px solid var(--journal-accent);outline-offset:2px}.machine-use small,.machine-details{color:var(--journal-muted)}.machine-slots{display:grid;grid-template-columns:1fr 1fr;gap:7px}.machine-slots button{display:grid;gap:5px;text-align:left}.machine-slots [aria-pressed=true]{background:var(--journal-selected);border-color:var(--journal-accent)}.machine-slots small{font-size:10px}.machine-preview{font-weight:600}.machine-confirm{display:flex;gap:8px;flex-wrap:wrap}.machine-confirm button:first-child{flex:1;background:var(--journal-selected);font-weight:600}@media(max-width:360px){.machine-slots{grid-template-columns:1fr}}
</style>
