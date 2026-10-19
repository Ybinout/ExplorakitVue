<template>
  <section class="drift-inventory">
    <header class="loadout-summary"><div><h3>Mes Drifts</h3><p>Équipe jusqu’à cinq bonus. Chaque changement est enregistré immédiatement.</p></div><strong>{{ state.equipped.length }} / {{ state.slotLimit }} équipés</strong></header>
    <p class="fusion-help">Les Drifts de même famille et élément se regroupent, même de raretés différentes. Leur puissance augmente jusqu’au maximum Mythique ; le surplus conserve sa valeur de revente.</p>
    <p v-if="state.lastDriftFusion" class="fusion-notice" data-drift-fusion>Dernière fusion : {{ state.lastDriftFusion.name }} · {{ rarity(state.lastDriftFusion) }}<span v-if="state.lastDriftFusion.count>1"> ({{ state.lastDriftFusion.count }} fusions en chaîne)</span>.</p>
    <drift-passives :drifts="equipped" :catalogue="catalogue" :limit="state.slotLimit" :pvp="state.mode !== 'colosseum' && ['preparation','tournament'].includes(state.phase)" />
    <label class="search-label">Chercher un Drift<input v-model="search" class="drift-search" type="search" placeholder="Nom ou catégorie…" /></label>
    <p role="status" class="inventory-notice">{{ notice }}</p>
    <div class="drift-cards">
      <article v-for="drift in filtered" :key="drift.uuid" :data-drift-id="drift.uuid" class="drift-card" :class="{equipped: isEquipped(drift)}">
        <header><drift-glyph :category="definition(drift).category" :rarity="drift.rarity" /><div><h4>{{ definition(drift).name }}</h4><small>{{ rarity(drift) }}<span v-if="isEquipped(drift)"> · Équipé</span></small></div><strong>{{ drift.value == null ? definition(drift).values[drift.rarity] : drift.value }}{{ definition(drift).unit }}</strong></header>
        <p>{{ definition(drift).description }}<span v-if="drift.element"> · Type {{ typeName(drift.element) }}</span></p>
        <p v-if="drift.points" class="fusion-progress">{{ drift.nextPoints ? `${drift.points} / ${drift.nextPoints} essences · prochaine rareté` : `Puissance maximale · ${drift.points} essences` }}</p>
        <button class="equip-button" :data-drift-action="isEquipped(drift)?'unequip':'equip'" :disabled="busy || !state.alive" @click="toggle(drift)">{{ isEquipped(drift) ? 'Retirer' : family(drift) ? 'Remplacer la version équipée' : state.equipped.length >= state.slotLimit ? 'Équiper à la place de…' : 'Équiper' }}</button>
        <div v-if="replacing===drift.uuid" class="replace-options"><p>Quel bonus veux-tu remplacer ?</p><button v-for="old in equipped" :key="old.uuid" :data-replace-drift="old.uuid" :disabled="busy" @click="send('drift:replace',{uuid:drift.uuid,replaceUuid:old.uuid},'Combinaison mise à jour.')">{{ definition(old).name }} · {{ rarity(old) }}</button><button :disabled="busy" @click="replacing=null">Annuler</button></div>
        <button class="discard-button" data-drift-action="discard" :disabled="busy || !state.alive" @click="$emit('discard',drift)">Supprimer ce Drift</button>
        <details><summary>Détails et gestion</summary><p v-if="definition(drift).rule">{{ definition(drift).rule }}</p><p>{{ definition(drift).category }} · {{ definition(drift).stat }}</p><div class="manage-actions"><button v-if="inShop && state.phase==='exploration'" data-drift-action="sell" :disabled="busy || isEquipped(drift) || !state.alive" @click="send('drift:sell',{uuid:drift.uuid},'Drift vendu.')">Vendre · {{ salePrice(drift) }} ₽</button></div></details>
      </article>
    </div>
    <p v-if="!filtered.length" class="empty-inventory">{{ state.drifts.length ? 'Aucun Drift ne correspond à cette recherche.' : 'Bats ou capture des Pokémon, défie un dresseur ou rends visite au marchand pour trouver des Drifts.' }}</p>
  </section>
</template>
<script>
import DriftPassives from './DriftPassives.vue';
import DriftGlyph from './DriftGlyph.vue';
export default {
  components:{DriftGlyph,DriftPassives},props:{state:Object,catalogue:Object,inShop:Boolean,execute:Function},
  data(){return {search:'',busy:false,notice:'',replacing:null};},
  computed:{
    equipped(){return this.state.drifts.filter(d=>this.isEquipped(d));},
    filtered(){const normal=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return this.state.drifts.filter(d=>normal(this.definition(d).name+' '+this.definition(d).category).includes(normal(this.search)));}
  },
  methods:{
    definition(d){return this.catalogue?.definitions.find(v=>v.id===d.definitionId)||{name:d.definitionId,values:{}};},
    rarity(d){return this.catalogue?.rarities.find(r=>r.key===d.rarity)?.name||d.rarity;},
    isEquipped(d){return this.state.equipped.includes(d.uuid);},
    family(d){return this.equipped.find(old=>old.definitionId===d.definitionId);},
    typeName(t){return {Fire:'Feu',Water:'Eau',Grass:'Plante',Electric:'Électrik',Ground:'Sol',Rock:'Roche',Ice:'Glace',Fighting:'Combat',Flying:'Vol',Psychic:'Psy',Bug:'Insecte',Ghost:'Spectre',Dark:'Ténèbres',Steel:'Acier',Fairy:'Fée'}[t]||t;},
    salePrice(d){const merchant=this.equipped.find(v=>v.definitionId==='DRF-053');return Math.floor((d.salePrice == null ? {common:50,rare:120,epic:300,legendary:800,mythic:2000}[d.rarity] : d.salePrice)*(1+(merchant?(merchant.value == null ? this.definition(merchant).values[merchant.rarity] : merchant.value)/100:0)));},
    async send(name,data,message){if(this.busy)return;this.busy=true;this.notice='';try{const ok=await this.execute({name,data});this.notice=ok?message:'Action non enregistrée. Vérifie ta connexion puis réessaie.';if(ok)this.replacing=null;}finally{this.busy=false;}},
    toggle(d){if(this.isEquipped(d))return this.send('drift:equip',{uuid:d.uuid,enabled:false},'Drift retiré.');const old=this.family(d);if(old)return this.send('drift:replace',{uuid:d.uuid,replaceUuid:old.uuid},'Version équipée remplacée.');if(this.state.equipped.length>=this.state.slotLimit){this.replacing=d.uuid;return;}return this.send('drift:equip',{uuid:d.uuid,enabled:true},'Drift équipé.');}
  }
};
</script>
<style scoped>
.discard-button{min-height:44px;margin-top:8px;background:transparent;color:#88504b;border:1px solid #d7bfb1;border-radius:8px;width:100%;cursor:pointer}.fusion-progress{font-size:12px;color:#377161}.fusion-help,.fusion-notice{font-size:13px;line-height:1.5}.fusion-notice{padding:12px;border-radius:8px;background:#e7efdc;color:#326d57}.drift-inventory{color:var(--journal-ink,#173d48);min-width:0}.loadout-summary{display:flex;justify-content:space-between;align-items:start;gap:12px}.loadout-summary h3{font:24px Georgia,serif;margin:0}.loadout-summary p{font-size:13px;line-height:1.5}.loadout-summary>strong{white-space:nowrap;font-size:13px;padding:9px;background:#e0e9df;border-radius:8px}.equipped-list{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 18px;font-size:12px}.equipped-list span{background:#e2e9dd;border:1px solid #b9c6b7;padding:7px 9px;border-radius:6px}.search-label{display:grid;gap:6px;font-size:12px}.drift-search{width:100%;box-sizing:border-box;min-height:44px;border:1px solid #b3bfad;border-radius:8px;background:#fffdf4;padding:10px;color:inherit;font:inherit}.inventory-notice{min-height:18px;font-size:13px}.drift-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.drift-card{min-width:0;border:1px solid #c5c7b0;border-radius:12px;background:#fffdf3;padding:16px}.drift-card.equipped{border:2px solid #347563;padding:15px;background:#f0f4e8}.drift-card header{display:flex;gap:10px;align-items:center}.drift-card header>svg{width:32px;height:32px;flex-shrink:0}.drift-card header>div{flex:1;min-width:0}.drift-card h4{font:600 17px Georgia,serif;margin:0 0 5px;overflow-wrap:anywhere}.drift-card small{font-size:12px;color:#50685c}.drift-card p{font-size:13px;line-height:1.55;overflow-wrap:anywhere}.drift-card header>strong{font-size:17px;white-space:nowrap}.drift-card button{min-height:44px;border:1px solid #b7bfaa;border-radius:7px;padding:10px;font:inherit;cursor:pointer;background:#eef0e3;color:inherit}.drift-card button:disabled{opacity:.5;cursor:default}.drift-card .equip-button{width:100%;background:#286e61;border-color:#286e61;color:#fff;font-size:14px}.drift-card summary{cursor:pointer;padding:14px 0;font-size:12px;min-height:44px;box-sizing:border-box}.replace-options{display:grid;gap:7px;margin:12px 0}.replace-options p{margin:0}.manage-actions{display:flex;flex-wrap:wrap;gap:8px;font-size:12px}.empty-inventory{padding:28px 12px;text-align:center;line-height:1.6}button:focus-visible,input:focus-visible,summary:focus-visible{outline:3px solid #a8873b;outline-offset:3px}@media(max-width:600px){.drift-cards{grid-template-columns:1fr}.loadout-summary{flex-wrap:wrap}.drift-card{padding:13px}.drift-card.equipped{padding:12px}}
</style>
