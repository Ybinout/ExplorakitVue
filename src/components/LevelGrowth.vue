<template>
  <section v-if="growth && rows.length===6" class="level-growth" :class="{compact}" data-level-growth :aria-label="`Statistiques gagnées par ${growth.name}`">
    <header><strong>{{ growth.name }}</strong><span>Niv. {{ growth.previousLevel }} → {{ growth.level }}</span></header>
    <dl><div v-for="row in rows" :key="row.key" :data-growth-stat="row.key"><dt>{{ row.label }}</dt><dd><span v-if="!compact" class="growth-before">{{ row.before }} → </span><span>{{ row.after }}</span><strong :class="{'growth-decrease':row.gain<0}">{{ row.gain>0?'+':'' }}{{ row.gain }}</strong></dd></div></dl>
    <small v-if="growth.evolved">Évolution comprise dans les nouvelles statistiques.</small>
  </section>
</template>
<script>
const labels={hp:'PV',attack:'Attaque',defense:'Défense',specialAttack:'Atq. Spé.',specialDefense:'Déf. Spé.',speed:'Vitesse'};
export default {props:{growth:Object,compact:Boolean},computed:{rows(){return Object.entries(labels).flatMap(([key,label])=>{const stat=this.growth?.stats?.[key];return stat&&[stat.before,stat.after,stat.gain].every(Number.isFinite)?[{key,label,...stat}]:[];});}}};
</script>
<style scoped>
.level-growth{box-sizing:border-box;padding:14px;margin:12px 0;border:1px solid var(--journal-border);border-radius:12px;background:var(--journal-soft);color:var(--journal-ink);font:12px/1.45 var(--journal-font);min-width:0}.level-growth header{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;color:var(--journal-heading)}header>strong{font-size:14px}header>span{font-size:11px;font-weight:700;color:var(--journal-accent)}dl{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;margin:12px 0 0}dl>div{display:flex;align-items:center;justify-content:space-between;gap:5px;padding:6px 0;border-bottom:1px solid var(--journal-border)}dt{font-size:11px;color:var(--journal-muted)}dd{margin:0;white-space:nowrap;font-variant-numeric:tabular-nums;font-size:11px}dd strong{display:inline-block;min-width:20px;margin-left:5px;color:var(--journal-accent);text-align:right}.growth-before{color:var(--journal-muted)}dd .growth-decrease{color:var(--journal-ink)}small{display:block;margin-top:8px;color:var(--journal-muted);font-size:10px}.compact{padding:10px;margin:0}.compact dl{margin-top:6px;gap:2px 10px}.compact dl>div{padding:3px 0}@media(max-width:380px){.level-growth:not(.compact) dl{grid-template-columns:1fr}.level-growth{padding:10px}}
</style>
