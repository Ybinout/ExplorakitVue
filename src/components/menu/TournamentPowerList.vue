<template>
  <div class="tournament-powers" data-tournament-powers>
    <p v-if="!passives.length">Aucune augmentation active. Les cartes mythiques peuvent te donner un pouvoir pour toute la tentative.</p>
    <ul v-else><li v-for="power in passives" :key="power.key" :data-active-power="power.key"><span aria-hidden="true">✦</span><div><strong>{{ power.name }}</strong><p>{{ power.description }}</p></div></li></ul>
    <small>Ces pouvoirs disparaissent à la fin de la tentative.</small>
  </div>
</template>
<script>
export default {props:{passives:{type:Array,default:()=>[]}}};
</script>
<style scoped>
.tournament-powers{color:var(--journal-ink)}.tournament-powers ul{list-style:none;padding:0;margin:0;display:grid;gap:9px}.tournament-powers li{display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px solid var(--journal-border);border-radius:8px;background:var(--journal-card)}.tournament-powers li>span{color:var(--journal-accent);font-size:23px}.tournament-powers strong{font-size:13px;color:var(--journal-heading)}.tournament-powers p{margin:5px 0 0;font-size:12px;line-height:1.55;color:var(--journal-ink)}.tournament-powers small{display:block;margin-top:10px;font-size:11px;color:var(--journal-muted)}
</style>
