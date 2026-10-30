<template>
  <div v-if="stats.length" class="battle-stat-change" :class="`stat-intensity-${intensity}`" :data-stat-change="directions.join(' ')" aria-hidden="true">
    <div v-for="direction in directions" :key="direction" :class="['stat-stream',`stat-stream-${direction}`]">
      <span v-for="i in columns" :key="`ribbon-${i}`" class="stat-ribbon" :style="columnStyle(i)"><svg viewBox="0 0 24 64" fill="none"><path class="stat-chevron-outline" d="m3 19 9-9 9 9M3 36l9-9 9 9M3 53l9-9 9 9" /><path d="m3 19 9-9 9 9M3 36l9-9 9 9M3 53l9-9 9 9" /></svg></span>
      <i v-for="i in 5" :key="`spark-${i}`" class="stat-spark" :style="{'--spark-x':`${(i*29)%90+5}%`,'--spark-delay':`${i*52}ms`}" />
    </div>
    <div class="stat-change-label" :class="{'stat-change-many':stats.length>2}">
      <span v-for="stat in stats" :key="stat.key" :class="`stat-label-${stat.kind}`"><b>{{ stat.symbol }}</b>{{ label(stat) }}</span>
    </div>
  </div>
</template>
<script>
const english={attack:'ATK',defense:'DEF',specialAttack:'SP. ATK',specialDefense:'SP. DEF',speed:'SPEED',accuracy:'ACC',evasion:'EVA',critical:'CRIT'};
export const STAT_CHANGE_DURATION=1240;
export default {
 props:{effects:{type:Array,default:()=>[]},language:{type:String,default:'fr'}},
 computed:{stats(){return this.effects.filter(e=>e.kind==='up'||e.kind==='down');},directions(){return [...new Set(this.stats.map(e=>e.kind))];},intensity(){return Math.min(3,Math.max(1,...this.stats.map(e=>Math.abs(e.delta||1))));},columns(){return this.intensity===1?4:6;}},
 methods:{columnStyle(i){return {'--ribbon-x':`${8+(i-1)*84/(this.columns-1)}%`,'--ribbon-delay':`${(i%3)*70}ms`,'--ribbon-scale':String(.76+(i%3)*.12)};},label(stat){return this.language==='en'?`${english[stat.key]||stat.key} ${stat.delta>0?'+':''}${stat.delta}`:stat.text;}}
};
</script>
<style scoped>
.battle-stat-change{position:absolute;inset:0;pointer-events:none;--stat-power:1}.stat-intensity-2{--stat-power:1.12}.stat-intensity-3{--stat-power:1.25}.stat-stream{position:absolute;inset:-8% 0 0;color:#ffd783}.stat-stream-down{color:#9ac3ff}.stat-ribbon{position:absolute;left:var(--ribbon-x);bottom:-2%;width:clamp(15px,16%,30px);height:72%;margin-left:-12px;opacity:0;animation:stat-flow-up 1.05s cubic-bezier(.2,.6,.25,1) both;animation-delay:var(--ribbon-delay)}.stat-ribbon::before{content:'';position:absolute;left:40%;top:24%;bottom:0;width:20%;background:linear-gradient(to top,transparent,currentColor);opacity:.35}.stat-ribbon svg{position:absolute;width:100%;height:100%;overflow:visible;}.stat-ribbon path{stroke:currentColor;stroke-width:calc(2.5px * var(--stat-power));stroke-linecap:square;stroke-linejoin:miter}.stat-ribbon path.stat-chevron-outline{stroke:#102337;stroke-width:calc(5px * var(--stat-power));opacity:.65}.stat-stream-down .stat-ribbon{bottom:auto;top:0;animation-name:stat-flow-down}.stat-stream-down svg{transform:rotate(180deg);}.stat-stream-down .stat-ribbon::before{top:0;bottom:24%;background:linear-gradient(to bottom,transparent,currentColor)}.stat-spark{position:absolute;left:var(--spark-x);bottom:10%;width:4px;height:4px;background:currentColor;opacity:0;animation:stat-spark-up .8s ease-out both;animation-delay:var(--spark-delay)}.stat-stream-down .stat-spark{bottom:auto;top:15%;animation-name:stat-spark-down}.stat-change-label{position:absolute;z-index:2;left:50%;bottom:calc(100% + 3px - var(--stat-label-offset-y,0px));transform:translateX(calc(-50% + var(--stat-label-shift,0px)));width:max-content;max-width:160px;box-sizing:border-box;display:flex;flex-direction:column;align-items:stretch;gap:3px;padding:5px 7px;background:#132d45f2;border:1px solid #d8e5f0;border-radius:6px;box-shadow:0 2px 0 #0917239c;animation:stat-label-reveal 1.12s ease both;font:700 11px/1.35 Arial,sans-serif;letter-spacing:.025em;white-space:nowrap}.stat-change-label span{display:flex;gap:5px;align-items:center;color:#ffe2a4}.stat-change-label b{font-size:15px;line-height:1}.stat-change-label .stat-label-down{color:#b7d5ff}.stat-change-many{display:grid;grid-template-columns:repeat(2,max-content);column-gap:10px;font-size:10px}
@keyframes stat-flow-up{0%{opacity:0;transform:translateY(22%) scaleY(.7)}20%,68%{opacity:.95}100%{opacity:0;transform:translateY(-32%) scaleY(var(--ribbon-scale))}}
@keyframes stat-flow-down{0%{opacity:0;transform:translateY(-27%) scaleY(.7)}20%,68%{opacity:.95}100%{opacity:0;transform:translateY(32%) scaleY(var(--ribbon-scale))}}
@keyframes stat-spark-up{0%{opacity:0;transform:translateY(0) rotate(45deg)}24%,65%{opacity:.9}100%{opacity:0;transform:translateY(-65px) rotate(45deg) scale(.3)}}
@keyframes stat-spark-down{0%{opacity:0;transform:translateY(0) rotate(45deg)}24%,65%{opacity:.9}100%{opacity:0;transform:translateY(65px) rotate(45deg) scale(.3)}}
@keyframes stat-label-reveal{0%{opacity:0;translate:0 5px}16%,82%{opacity:1;translate:0 0}100%{opacity:0;translate:0 -4px}}
@media(prefers-reduced-motion:reduce){.battle-stat-change{display:none}}
</style>
