<template>
  <div class="league-progress" data-league-progress>
    <div class="league-heading"><rank-badge :rank="rank"/><strong v-if="rank.division" data-league-points>{{ rank.lp }} <small>/ 100 PL</small></strong></div>
    <template v-if="rank.division">
      <progress :value="rank.lp" max="100" :aria-label="`${rank.label} : ${rank.lp} points de ligue sur 100`"/>
      <p v-if="rank.next">{{ number(Math.max(0,rank.next.minimum-value)) }} {{ unit }} avant <strong>{{ rank.next.name }}</strong></p>
      <p v-else>{{ rank.lp===100 ? 'Rang maximal atteint. Continue à améliorer ta place !' : 'Dernière division : vise les 100 PL.' }}</p>
    </template>
    <p v-else>{{ emptyHint }}</p>
  </div>
</template>
<script>
import RankBadge from './RankBadge.vue';
export default {name:'RankProgress',components:{RankBadge},props:{rank:{type:Object,required:true},value:{type:Number,default:0},unit:{type:String,default:'points'},emptyHint:{type:String,default:'Termine une tentative avec une victoire pour obtenir ton premier rang.'}},methods:{number(n){return Number(n).toLocaleString('fr-FR');}}};
</script>
<style scoped>
.league-progress{min-width:0}.league-heading{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}.league-heading>strong{font:28px Georgia,serif;color:#287366;white-space:nowrap}.league-heading>strong small{font:10px Arial;color:#5c716b}.league-progress progress{display:block;appearance:none;box-sizing:border-box;width:100%;height:8px;border:0;border-radius:8px;background:#e1e8dc;margin-top:18px;overflow:hidden;accent-color:#287366}.league-progress progress::-webkit-progress-bar{background:#e1e8dc;border-radius:8px}.league-progress progress::-webkit-progress-value{background:#287366;border-radius:8px}.league-progress progress::-moz-progress-bar{background:#287366;border-radius:8px}.league-progress p{font:12px/1.6 Arial;color:#5c716b;margin:10px 0 0}.league-progress p strong{color:#253b39}
</style>
