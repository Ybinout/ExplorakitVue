<template>
  <div v-if="stats.length" class="battle-stat-change" :class="`stat-intensity-${intensity}`" :data-stat-change="directions.join(' ')" aria-hidden="true">
    <div v-for="direction in directions" :key="direction" :class="['stat-stream',`stat-stream-${direction}`]">
      <span v-for="i in columns" :key="`ribbon-${i}`" class="stat-ribbon" :style="columnStyle(i)"><svg viewBox="0 0 28 80" fill="none"><path class="stat-arrow-halo" d="M14 5 26 19H20V37H8V19H2Z"/><path class="stat-arrow-body" d="M14 7 24 19H18V35H10V19H4Z"/><path class="stat-arrow-edge" d="m7 18 7-8 7 8M12 20v11"/><path class="stat-chevron" d="m6 47 8-7 8 7m-16 15 8-7 8 7"/></svg></span>
      <i v-for="i in 5" :key="`spark-${i}`" class="stat-spark" :style="{'--spark-x':`${(i*29)%90+5}%`,'--spark-delay':`${i*52}ms`}" />
    </div>
    <div class="stat-change-label" :class="{'stat-change-many':stats.length>2}">
      <span v-for="stat in labels" :key="stat.key" :class="`stat-label-${stat.kind}`"><b>{{ stat.symbol }}</b>{{ label(stat) }}</span>
    </div>
  </div>
</template>
<script>
const english={attack:'ATK',defense:'DEF',specialAttack:'SP. ATK',specialDefense:'SP. DEF',speed:'SPEED',accuracy:'ACC',evasion:'EVA',critical:'CRIT'};
export const STAT_CHANGE_DURATION=1240;
export default {
 props:{effects:{type:Array,default:()=>[]},language:{type:String,default:'fr'}},
 computed:{stats(){return this.effects.filter(e=>e.kind==='up'||e.kind==='down');},directions(){return [...new Set(this.stats.map(e=>e.kind))];},intensity(){return Math.min(3,Math.max(1,...this.stats.map(e=>Math.abs(e.delta||1))));},columns(){return this.intensity===1?4:6;},labels(){return this.stats.length<=2?this.stats:this.directions.map(kind=>({key:kind,kind,symbol:kind==='up'?'↑':'↓',text:`${this.stats.filter(e=>e.kind===kind).length} stats`,summary:true}));}},
 methods:{columnStyle(i){return {'--ribbon-x':`${8+(i-1)*84/(this.columns-1)}%`,'--ribbon-delay':`${(i%3)*70}ms`,'--ribbon-scale':String(.76+(i%3)*.12)};},label(stat){return stat.summary?stat.text:this.language==='en'?`${english[stat.key]||stat.key} ${stat.delta>0?'+':''}${stat.delta}`:stat.text;}}
};
</script>
<style scoped>
.battle-stat-change{position:absolute;inset:0;pointer-events:none;--stat-power:1}.stat-intensity-2{--stat-power:1.12}.stat-intensity-3{--stat-power:1.25}.stat-stream{position:absolute;inset:-8% 0 0;color:#71c8ff}.stat-stream-down{color:#ff8291}.stat-stream::before{content:'';position:absolute;inset:12% 4% 0;border-radius:50%;background:radial-gradient(ellipse at 50% 80%,currentColor,transparent 65%);animation:stat-glow 1.24s ease both;opacity:0}
.stat-ribbon{position:absolute;left:var(--ribbon-x);bottom:-2%;width:clamp(18px,17%,32px);height:78%;margin-left:-14px;opacity:0;animation:stat-flow-up 1.05s cubic-bezier(.16,.64,.26,1) both;animation-delay:var(--ribbon-delay)}.stat-ribbon::before{content:'';position:absolute;left:34%;top:24%;bottom:4%;width:32%;background:linear-gradient(to top,transparent,currentColor);opacity:.25}.stat-ribbon svg{position:absolute;width:100%;height:100%;overflow:visible}.stat-arrow-halo{fill:currentColor;opacity:.18;transform:scale(1.16);transform-origin:14px 20px}.stat-arrow-body{fill:currentColor;stroke:#f1faff88;stroke-width:.8;stroke-linejoin:round}.stat-arrow-edge{stroke:#fff;stroke-width:1.3;stroke-linecap:round;opacity:.8}.stat-chevron{stroke:currentColor;stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round;opacity:.65}
.stat-stream-down .stat-ribbon{bottom:auto;top:0;animation-name:stat-flow-down}.stat-stream-down svg{transform:rotate(180deg)}.stat-stream-down .stat-ribbon::before{background:linear-gradient(to bottom,transparent,currentColor)}.stat-spark{position:absolute;left:var(--spark-x);bottom:10%;width:4px;height:4px;border-radius:1px;background:currentColor;box-shadow:0 0 3px currentColor;opacity:0;animation:stat-spark-up .85s ease-out both;animation-delay:var(--spark-delay)}.stat-stream-down .stat-spark{bottom:auto;top:15%;animation-name:stat-spark-down}
.stat-change-label{position:absolute;z-index:2;left:50%;bottom:calc(100% + 3px - var(--stat-label-offset-y,0px));transform:translateX(calc(-50% + var(--stat-label-shift,0px)));width:max-content;max-width:var(--stat-label-max-width,160px);box-sizing:border-box;display:flex;flex-direction:column;align-items:stretch;gap:3px;padding:5px 8px;background:#132d45f2;border:1px solid #c4dce9;border-radius:7px;box-shadow:0 2px 0 #09172370;animation:stat-label-reveal 1.12s ease both;font:700 11px/1.35 Arial,sans-serif;letter-spacing:.025em;white-space:nowrap}.stat-change-label span{display:flex;gap:5px;align-items:center;color:#a7dfff}.stat-change-label b{font-size:15px;line-height:1}.stat-change-label .stat-label-down{color:#ffb1bb}.stat-change-many{font-size:11px}
@keyframes stat-glow{0%,100%{opacity:0}25%,65%{opacity:.15}}
@keyframes stat-flow-up{0%{opacity:0;transform:translate(-3px,24%) scale(.7)}23%,66%{opacity:.96}100%{opacity:0;transform:translate(3px,-36%) scale(var(--ribbon-scale))}}
@keyframes stat-flow-down{0%{opacity:0;transform:translate(3px,-25%) scale(.7)}23%,66%{opacity:.96}100%{opacity:0;transform:translate(-3px,36%) scale(var(--ribbon-scale))}}
@keyframes stat-spark-up{0%{opacity:0;transform:translate(0,0) rotate(45deg)}24%,65%{opacity:.85}100%{opacity:0;transform:translate(9px,-65px) rotate(120deg) scale(.25)}}
@keyframes stat-spark-down{0%{opacity:0;transform:translate(0,0) rotate(45deg)}24%,65%{opacity:.85}100%{opacity:0;transform:translate(-9px,65px) rotate(120deg) scale(.25)}}
@keyframes stat-label-reveal{0%{opacity:0;translate:0 5px}16%,82%{opacity:1;translate:0 0}100%{opacity:0;translate:0 -4px}}
@media(prefers-reduced-motion:reduce){.battle-stat-change{display:none}}
</style>
