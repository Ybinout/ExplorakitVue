<template>
  <section class="merchant">
    <p class="merchant-note">Six offres par session, un exemplaire de chaque par joueur. Le stock reste identique après une reconnexion.</p>
    <div class="merchant-offers"><article v-for="offer in stock.offers" :key="offer.id" :data-merchant-offer="offer.id">
      <div><small>{{ rarity(offer.drift.rarity) }}</small><h3>{{ definition(offer.drift).name }}</h3><p>{{ definition(offer.drift).description }} · {{ definition(offer.drift).values[offer.drift.rarity] }}{{ definition(offer.drift).unit }}</p><p v-if="offer.drift.element">Type {{ typeName(offer.drift.element) }}</p></div>
      <button :disabled="busy || !offer.stock || money<offer.price" @click="$emit('command',{name:'drift:merchantBuy',data:{offerId:offer.id}})">{{ offer.stock ? `Acheter · ${offer.price} ₽` : 'Épuisé' }}</button>
    </article></div>
    <h3 class="exchange-title">Trois Drifts, une nouvelle chance</h3>
    <p class="merchant-note">Choisis trois Drifts non équipés. Tu recevras un Drift aléatoire, au moins de la rareté la plus faible du trio, avec 20 % de chances de gagner un cran. Les trois objets seront consommés.</p>
    <div class="merchant-owned"><article v-for="drift in drifts" :key="drift.uuid"><label><input v-model="selected" type="checkbox" :value="drift.uuid" :disabled="busy || equipped.includes(drift.uuid) || (selected.length>=3 && !selected.includes(drift.uuid))"><span><strong>{{ definition(drift).name }}</strong><small>{{ rarity(drift.rarity) }}{{ equipped.includes(drift.uuid)?' · équipé':'' }}</small></span></label><button :disabled="busy || equipped.includes(drift.uuid)" @click="confirm={kind:'sell',drift}">Vendre · {{ sellPrice(drift) }} ₽</button></article></div>
    <p v-if="!drifts.length" class="merchant-note">Tes Drifts trouvés ou achetés apparaîtront ici.</p>
    <button class="exchange-button" data-merchant-exchange :disabled="busy || selected.length!==3" @click="confirm={kind:'exchange',ids:[...selected]}">Échanger les {{ selected.length }} / 3 Drifts</button>
    <section v-if="confirm" class="merchant-confirm" ref="confirmation" role="group" tabindex="-1" aria-label="Confirmer la transaction">
      <h3>{{ confirm.kind==='sell'?'Vendre ce Drift ?':'Échanger ces trois Drifts ?' }}</h3>
      <p v-if="confirm.kind==='sell'">{{ definition(confirm.drift).name }} · {{ rarity(confirm.drift.rarity) }} → {{ sellPrice(confirm.drift) }} ₽</p>
      <p v-else>{{ confirm.ids.map(id=>definition(drifts.find(d=>d.uuid===id)).name).join(' · ') }}</p>
      <p>Cette transaction est définitive.</p><div><button :disabled="busy" @click="confirm=null">Annuler</button><button data-merchant-confirm :disabled="busy" @click="commit">Confirmer</button></div>
    </section>
  </section>
</template>
<script>
import { localizeTypeName } from '@/services/pokemonTypes';
export default {
  props:{stock:Object,catalogue:Object,drifts:Array,equipped:Array,money:Number,busy:Boolean},
  data(){return {selected:[],confirm:null};},
  watch:{confirm(value){if(value)this.$nextTick(()=>this.$refs.confirmation?.focus());},drifts(){this.selected=this.selected.filter(id=>this.drifts.some(d=>d.uuid===id));}},
  methods:{typeName(t){return localizeTypeName(t,'fr');},definition(d){return this.catalogue?.definitions?.find(x=>x.id===d?.definitionId)||{name:'Drift',values:{}};},rarity(r){return {common:'Commun',rare:'Rare',epic:'Épique',legendary:'Légendaire',mythic:'Mythique'}[r]||r;},sellPrice(d){const perk=this.drifts.find(x=>x.definitionId==='DRF-053'&&this.equipped.includes(x.uuid));const bonus=perk?Number(this.definition(perk).values[perk.rarity])||0:0;return Math.floor(({common:50,rare:120,epic:300,legendary:800,mythic:2000}[d.rarity]||0)*(1+bonus/100));},commit(){const c=this.confirm;this.confirm=null;this.$emit('command',c.kind==='sell'?{name:'drift:sell',data:{uuid:c.drift.uuid}}:{name:'drift:exchange',data:{uuids:c.ids}});}}
};
</script>
<style scoped>
.merchant{font-family:Arial,sans-serif}.merchant-note{font-size:12px;color:#5c716b;line-height:1.65}.merchant-offers{display:grid;grid-template-columns:1fr 1fr;gap:10px}.merchant-offers article{padding:14px;border:1px solid #d3ddd2;border-radius:10px;display:flex;flex-direction:column;justify-content:space-between;background:#fcfcf8}.merchant h3{font-size:14px;line-height:1.4;margin:6px 0}.merchant p{font-size:12px;line-height:1.6}.merchant small{font-size:10px;color:#8a6d36}.merchant button{min-height:44px;padding:9px 12px;background:#287366;border:1px solid #287366;border-radius:7px;color:white;font:700 12px Arial;cursor:pointer}.merchant button:disabled{opacity:.45;cursor:default}.merchant button:focus-visible,.merchant input:focus-visible{outline:3px solid #b29b70;outline-offset:2px}.exchange-title{margin-top:28px!important}.merchant-owned article{display:flex;align-items:center;gap:10px;justify-content:space-between;border-bottom:1px solid #d3ddd2;padding:10px 0}.merchant-owned label{display:flex;align-items:center;min-height:44px;gap:8px;flex:1;font-size:12px}.merchant-owned small{display:block;margin-top:5px}.merchant-owned input{min-width:20px;min-height:20px;accent-color:#287366}.exchange-button{width:100%;margin:16px 0}.merchant-confirm{position:sticky;bottom:0;background:#f7f8f3;border:2px solid #287366;border-radius:10px;padding:16px;box-shadow:0 -5px 30px #10221b40}.merchant-confirm>div{display:flex;gap:10px}.merchant-confirm button{flex:1}@media(max-width:540px){.merchant-offers{grid-template-columns:1fr}.merchant-owned article{flex-wrap:wrap}.merchant-owned label{min-width:160px}}
</style>
