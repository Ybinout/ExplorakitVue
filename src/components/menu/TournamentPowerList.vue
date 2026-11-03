<template>
  <div class="tournament-powers" data-tournament-powers>
    <p v-if="!passives.length">Aucune augmentation active. Les cartes de pouvoir et les pactes peuvent renforcer cette tentative.</p>
    <ul v-else><li v-for="power in passives" :key="power.key" :data-active-power="power.key"><span aria-hidden="true">{{ power.key==='fortune_charm'?'♣':power.cost?'⚖':'✦' }}</span><div><strong>{{ power.name }} <span v-if="power.stackable" class="power-stack" data-active-stacks>×{{ power.stacks }}</span></strong><template v-if="power.boon"><p class="power-boon"><b>Bonus :</b> {{ power.boon }}</p><p class="power-cost"><b>Malus :</b> {{ power.cost }}</p></template><p v-else>{{ power.description }}</p><p v-if="power.cumulativeDescription" class="power-total" data-active-total><b>Total :</b> {{ power.cumulativeDescription }}</p><small v-if="power.duration">{{ power.duration }}</small></div></li></ul>
    <small class="power-damage-help" data-tournament-damage-help>Les dégâts d’attaque viennent des attaques qui touchent. Le poison, la brûlure, la météo et le recul sont des dégâts séparés.</small>
    <small>Les pactes et pouvoirs disparaissent à la fin de la tentative. Une carte « prochain combat » est consommée à l’entrée du duel.</small>
  </div>
</template>
<script>
export default {props:{passives:{type:Array,default:()=>[]}}};
</script>
<style scoped>
.power-damage-help{display:block;margin:12px 0;padding:10px;border-left:3px solid var(--journal-accent);background:var(--journal-soft);line-height:1.6}
.power-stack{display:inline-block;margin-left:5px;padding:1px 6px;background:var(--journal-soft);border:1px solid var(--journal-border);border-radius:5px;color:var(--journal-accent)}.power-total{overflow-wrap:anywhere}

.tournament-powers{color:var(--journal-ink)}.tournament-powers ul{list-style:none;padding:0;margin:0;display:grid;gap:9px}.tournament-powers li{display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px solid var(--journal-border);border-radius:8px;background:var(--journal-card)}.tournament-powers li>span{color:var(--journal-accent);font-size:23px}.tournament-powers strong{font-size:13px;color:var(--journal-heading)}.tournament-powers p{margin:5px 0 0;font-size:12px;line-height:1.55;color:var(--journal-ink)}.tournament-powers small{display:block;margin-top:10px;font-size:11px;color:var(--journal-muted)}
</style>
