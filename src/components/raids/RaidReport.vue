<template>
 <section class="raid-report" aria-labelledby="raid-report-title" data-raid-report>
  <header><small>LE COMBAT EN CHIFFRES</small><h3 id="raid-report-title">La contribution de chacun</h3><p>Dégâts réellement infligés au boss et PV réellement rendus aux alliés, soins personnels compris.</p></header>
  <p v-if="report.partial" class="report-partial">Raid commencé avant la mise à jour : seules les actions enregistrées depuis sont comptées.</p>
  <article v-for="trainer in report.trainers" :key="trainer.id" :class="{'is-you':trainer.id===userId}" :data-report-trainer="trainer.id">
   <h4>{{ trainer.name }} <small v-if="trainer.id===userId">TOI</small></h4>
   <div class="report-totals"><span class="damage"><small>Dégâts · PV</small><b>{{ number(trainer.damage) }}</b></span><span class="shield"><small>Bouclier</small><b>{{ number(trainer.shield) }}</b></span><span class="healing"><small>Soins · PV</small><b>{{ number(trainer.healing) }}</b></span></div>
   <details :open="report.trainers.length===1"><summary>Détail des {{ trainer.pokemon.length }} Pokémon</summary><div class="report-pokemon-labels" aria-hidden="true"><span>Pokémon</span><span>PV boss</span><span>Bouclier</span><span>Soins</span></div><div v-for="p in trainer.pokemon" :key="p.uuid" class="report-pokemon" :data-report-pokemon="p.uuid"><span><pokemon-portrait :src="$pokemonSprite(p)" alt=""/><b>{{ p.name }}</b></span><strong :aria-label="number(p.damage)+' dégâts sur les PV du boss'">{{ number(p.damage) }}</strong><strong :aria-label="number(p.shield)+' dégâts au bouclier'">{{ number(p.shield) }}</strong><strong :aria-label="number(p.healing)+' PV soignés'">{{ number(p.healing) }}</strong></div></details>
  </article>
 </section>
</template>
<script>
import PokemonPortrait from '../PokemonPortrait.vue';
export default {components:{PokemonPortrait},props:{report:{type:Object,required:true},userId:Number},methods:{number:value=>Number(value||0).toLocaleString('fr-FR')}};
</script>
<style scoped>
.raid-report{margin:18px 0;padding:16px;border:1px solid var(--journal-border);border-radius:12px;background:var(--journal-card);text-align:left;color:var(--journal-ink)}
header>small{font-size:9px;letter-spacing:.12em;color:var(--journal-accent)}h3{margin:5px 0 9px;font:22px Georgia,serif;color:var(--journal-heading)}header p,.report-partial{font-size:12px;line-height:1.5;color:var(--journal-muted);margin:0 0 14px}.report-partial{padding:10px;background:var(--journal-soft);border-radius:7px}
article{border:1px solid var(--journal-border);border-radius:10px;background:var(--journal-paper);padding:12px;margin-top:10px}article.is-you{border-color:var(--journal-accent)}h4{margin:0 0 12px;font-size:14px;overflow-wrap:anywhere}h4 small{font-size:9px;color:var(--journal-accent);margin-left:7px}
.report-totals{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.report-totals>span{padding:9px;border-radius:7px;border-bottom:2px solid var(--metric);background:color-mix(in srgb,var(--metric) 10%,var(--journal-paper))}.damage{--metric:#c18182}.shield{--metric:#a48dc7}.healing{--metric:#72a78d}.report-totals small{display:block;color:var(--journal-muted);font-size:10px}.report-totals b{display:block;font-size:18px;margin-top:4px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
details{margin-top:10px}summary{cursor:pointer;padding:10px 0;font-size:12px;color:var(--journal-accent);min-height:24px}summary:focus-visible{outline:2px solid var(--journal-accent);outline-offset:2px}.report-pokemon,.report-pokemon-labels{display:grid;grid-template-columns:minmax(0,1.6fr) repeat(3,minmax(0,1fr));align-items:center;gap:6px}.report-pokemon-labels{font-size:9px;color:var(--journal-muted);padding:7px 0}.report-pokemon-labels>span:not(:first-child),.report-pokemon>strong{text-align:right}.report-pokemon{padding:7px 0;border-top:1px solid var(--journal-border);font-size:11px}.report-pokemon>span{display:flex;align-items:center;gap:5px;min-width:0}.report-pokemon b{overflow-wrap:anywhere;font-weight:500}.report-pokemon .pokemon-portrait{width:30px;height:30px;flex:none}.report-pokemon>strong{font-weight:500;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
@media(max-width:400px){.raid-report{padding:10px}article{padding:10px}.report-totals{gap:5px}.report-totals>span{padding:8px 6px}.report-totals b{font-size:16px}.report-pokemon>span{flex-direction:column;align-items:flex-start}.report-pokemon{font-size:10px;gap:4px}}
</style>
