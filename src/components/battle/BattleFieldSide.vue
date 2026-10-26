<template>
  <div class="battle-field-side" :data-field-side="side" aria-hidden="true">
    <svg viewBox="0 0 240 140" class="field-side-art" :class="{'field-still':!animationsEnabled}">
      <g v-if="hazards.stickyWeb" data-hazard="stickyWeb" class="field-web"><path d="M15 110 Q120 84 225 110 M25 121 Q120 95 215 121 M50 132 Q120 108 190 132 M120 91V136 M42 100L195 132 M198 100L45 132 M15 110L215 121 M225 110L25 121" /></g>
      <g v-if="hazards.stealthRock" data-hazard="stealthRock" class="field-rocks"><path v-for="(p,i) in rocks" :key="i" :transform="`translate(${p[0]},${p[1]})`" d="M-7 0L-10-12L-3-24L5-20L9-5L2 3Z M-3-24L-1-7L9-5 M-10-12L-1-7L2 3" /></g>
      <g v-for="(count,kind) in {spikes:hazards.spikes,toxicSpikes:hazards.toxicSpikes}" :key="kind" :data-hazard="count?kind:null" :class="kind==='spikes'?'field-spikes':'field-toxic'">
        <path v-for="i in count*3" :key="i" :transform="`translate(${26+((i*53)%186)},${112+(i%3)*7})`" d="M-7 2L0-12L3-2L8 1L0 4Z" />
      </g>
      <g v-if="screens.reflectTurns || screens.lightScreenTurns || screens.safeguardTurns || screens.wideGuardTurns || screens.quickGuardTurns || screens.matBlockTurns || screens.craftyShieldTurns" class="field-screen" :style="{color:screens.lightScreenTurns?'#f6e3a2':screens.safeguardTurns?'#9be5c3':'#a5c7ff'}"><path d="M32 125V34L116 14L207 33V125L116 106Z M116 14V106" /><path class="field-screen-glint" d="M45 71L94 27M137 91L194 47" /></g>
      <g v-if="screens.tailwindTurns" class="field-wind"><path d="M20 80Q80 57 160 72T224 63M15 93Q100 72 180 88T230 79M42 52Q114 34 195 48" /></g>
      <g v-if="screens.mistTurns" class="field-mist"><path d="M18 107Q80 88 221 112M13 119Q112 99 229 123" /></g>
      <g v-if="screens.luckyChantTurns" class="field-chant"><path d="M38 69v14m-7-7h14M192 42v14m-7-7h14M183 95v10m-5-5h10" /></g>
      <g v-if="entryNonce" :key="entryNonce" class="field-contact"><path v-for="i in 6" :key="i" :transform="`translate(${30+i*28},${110+(i%2)*10})`" d="M0 0L-3-16L2-12L5-23L7-6Z" /></g>
      <g v-if="changes.length" :key="`change-${nonce}`" class="field-build" :class="{'field-dissolve':changes.every(e=>e.change==='end')}" :style="{color:changes[0].color}"><path v-for="i in 8" :key="i" :transform="`translate(${15+i*26},${95+(i%3)*12})`" d="M-3 0L0-7L3 0L0 5Z" /></g>
    </svg>
  </div>
</template>
<script>
import { hazardEntryVisible } from '@/services/battleField';
export default {
  props:{state:Object,side:String,pokemon:Object,changes:Array,nonce:Number,animationsEnabled:Boolean},
  data:()=>({entryNonce:0,rocks:[[27,107],[75,126],[181,124],[218,105]]}),
  computed:{hazards(){return this.state.sides[this.side].hazards;},screens(){return this.state.sides[this.side].screens;}},
  watch:{'pokemon.uuid'(next,old){if(old&&next!==old&&hazardEntryVisible(this.state,this.side,this.pokemon))this.entryNonce++;}}
};
</script>
<style scoped>
.battle-field-side{position:absolute;z-index:52;width:var(--sprite-visible-size);height:0;pointer-events:none}.field-side-art{position:absolute;left:0;bottom:0;width:200%;height:auto;overflow:visible;transform:translateX(-50%)}
path{stroke-linecap:round;stroke-linejoin:round}.field-rocks{fill:#998666;stroke:#4a493e;stroke-width:1.5;filter:drop-shadow(0 2px 0 #272b3040)}.field-rocks path{animation:field-rock-set .55s ease-out both}.field-spikes{fill:#c6d8df;stroke:#566c7c;stroke-width:1.4}.field-toxic{fill:#b283d0;stroke:#5e4379;stroke-width:1.4}.field-web{fill:none;stroke:#f0e7ca;stroke-width:1.5;opacity:.8;animation:field-web-set .6s ease-out both}.field-screen{color:#a5c7ff;fill:currentColor;fill-opacity:.12;stroke:currentColor;stroke-width:1.5;animation:field-screen-set .6s ease-out both}.field-screen-glint{stroke-width:4;opacity:.5}.field-wind{fill:none;stroke:#b8f1eb;stroke-width:2;opacity:.6;animation:field-side-wind 3s ease-in-out infinite alternate}.field-mist{fill:none;stroke:#e1f3fc;stroke-width:9;opacity:.22}.field-chant{stroke:#f3d0ea;stroke-width:2;opacity:.8}.field-contact{fill:#ffe8ac;stroke:#b18c56;stroke-width:.7;animation:field-contact .65s ease-out both}
@keyframes field-rock-set{from{opacity:0;translate:0 -22px}to{opacity:1;translate:0 0}}@keyframes field-web-set{from{opacity:0}to{opacity:.8}}@keyframes field-screen-set{from{opacity:0;translate:0 15px}to{opacity:1;translate:0 0}}@keyframes field-side-wind{to{transform:translateX(6px);opacity:.35}}@keyframes field-contact{0%{opacity:0;translate:0 4px}25%{opacity:1}100%{opacity:0;translate:0 -18px}}
.field-still *{animation:none!important}.field-still .field-contact{display:none}@media(prefers-reduced-motion:reduce){*{animation:none!important}.field-contact{display:none}}
.field-build{fill:currentColor;animation:field-build .7s ease-out both}.field-dissolve{animation-name:field-dissolve}@keyframes field-build{0%{opacity:0;translate:0 -22px}30%{opacity:1}100%{opacity:0;translate:0 0}}@keyframes field-dissolve{0%{opacity:1;translate:0 0}100%{opacity:0;translate:0 -30px}}.field-still .field-build{display:none}@media(prefers-reduced-motion:reduce){.field-build{display:none}}
</style>
