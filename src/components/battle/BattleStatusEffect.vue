<template>
 <div v-if="effect && !reduced" class="battle-status-effect" :class="'status-visual-'+effect.status" :data-status-visual="effect.status" :data-status-phase="effect.phase" :style="{'--status-color':palette.color,'--status-accent':palette.accent,'--status-duration':duration+'ms'}" aria-hidden="true">
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
   <template v-if="effect.status==='poison'">
    <g v-for="(p,i) in bubbles" :key="i" class="status-rise" :style="delay(i)"><circle :cx="p.x" :cy="p.y" :r="p.r" fill="var(--status-accent)" opacity=".38"/><circle :cx="p.x-1" :cy="p.y-2" :r="p.r*.67" fill="var(--status-color)" opacity=".85"/><path :d="`M${p.x-2} ${p.y-3}l2 -1`" stroke="#f7dfff" stroke-width="2" stroke-linecap="round"/></g>
   </template>
   <template v-else-if="effect.status==='burn'">
    <g v-for="(x,i) in [40,68,96,120]" :key="x" class="status-flame" :style="delay(i)"><path :d="`M${x} 128 C${x-20} 110 ${x+3} 101 ${x-3} 78 C${x+17} 96 ${x+9} 103 ${x+15} 108 C${x+20} 98 ${x+21} 96 ${x+20} 92 C${x+35} 118 ${x+15} 135 ${x} 128Z`" fill="var(--status-accent)"/><path :d="`M${x+5} 126 Q${x-1} 118 ${x+9} 104 Q${x+8} 115 ${x+16} 118 Q${x+17} 129 ${x+5} 126Z`" fill="var(--status-color)"/><path :d="`M${x+7} 71l2 -7`" stroke="var(--status-color)" stroke-width="3" stroke-linecap="round"/></g>
   </template>
   <template v-else-if="effect.status==='confusion'">
    <g class="status-confused"><path d="M34 39C52 20 110 20 128 39M129 43C111 57 53 59 33 45" stroke="var(--status-accent)" stroke-width="2" stroke-dasharray="8 13" opacity=".7"/><path v-for="(p,i) in [[32,40],[80,25],[129,42]]" :key="i" :transform="`translate(${p[0]} ${p[1]}) rotate(${i*25})`" d="M0 -8 2 -2 8 0 2 2 0 8 -2 2 -8 0 -2 -2Z" fill="var(--status-color)"/><text x="78" y="62" text-anchor="middle" font-size="22" font-family="sans-serif" fill="var(--status-color)">?</text></g>
   </template>
   <template v-else-if="effect.status==='disable'">
    <g class="status-bind" stroke="var(--status-color)" stroke-width="3"><path d="M24 53 54 83 26 112M136 53 106 83 134 112"/><path d="m39 63 81 44M39 107l81 -44" stroke="var(--status-accent)" stroke-dasharray="8 5"/><rect x="68" y="71" width="24" height="24" rx="4" fill="#3d315b"/><path d="M74 70v-5a6 6 0 0 1 12 0v5M80 80v7"/></g>
   </template>
   <template v-else-if="effect.status==='paralysis'">
    <g class="status-electric" stroke="var(--status-color)" stroke-width="3.5" stroke-linejoin="round"><path d="m28 47 11 24 -10 -3 15 26M125 40l-10 27 12 -4 -13 25M60 123l14 -11 -1 12 20 -16M73 29l8 13 6 -10"/><path d="m28 47 11 24 -10 -3 15 26M125 40l-10 27 12 -4 -13 25" stroke="#fff6d5" stroke-width="1"/></g>
   </template>
   <template v-else-if="effect.status==='sleep'">
    <g v-for="(p,i) in [[91,49],[110,33],[124,18]]" :key="i" class="status-drift" :style="delay(i)"><path :d="`M${p[0]-5} ${p[1]-6}h12l-12 12h12`" stroke="var(--status-color)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle :cx="p[0]-11" :cy="p[1]+15" r="3" fill="var(--status-accent)" opacity=".7"/></g>
   </template>
   <template v-else-if="effect.status==='freeze'">
    <g v-for="(p,i) in [[36,100],[58,115],[100,116],[126,95]]" :key="i" class="status-crystal" :style="delay(i)"><path :d="`M${p[0]} ${p[1]-31}l11 21 -4 22 -14 0 -5 -23Z`" fill="#8fd5ed66" stroke="var(--status-color)" stroke-width="2"/><path :d="`M${p[0]} ${p[1]-31}v42l7 -21`" stroke="var(--status-color)" stroke-width="1"/></g>
   </template>
   <template v-else-if="effect.status==='attraction'">
    <path v-for="(p,i) in [[44,70],[111,46],[113,108]]" :key="i" class="status-rise" :style="delay(i)" :transform="`translate(${p[0]} ${p[1]})`" d="M0 10C-22 -2 -11 -17 0 -7C11 -17 22 -2 0 10Z" fill="var(--status-color)" stroke="var(--status-accent)"/>
   </template>
   <template v-else-if="effect.status==='curse'">
    <g class="status-curse"><path d="M43 104Q25 79 44 58M117 104Q135 79 116 58M61 116l5 -12m28 0 5 12" stroke="var(--status-accent)" stroke-width="5" stroke-linecap="round"/><path d="m58 42 7 -11 8 11 -8 12ZM88 42l7 -11 8 11 -8 12Z" stroke="var(--status-color)" stroke-width="3"/><path d="M58 77q22 23 44 0" stroke="var(--status-color)" stroke-width="3"/></g>
   </template>
   <template v-else-if="effect.status==='seed' || effect.status==='trap'">
    <g class="status-bind" stroke="var(--status-accent)" stroke-width="3" stroke-linecap="round"><path d="M31 119Q62 99 38 80M129 119Q98 99 122 80M46 127q34 -13 68 0"/><template v-if="effect.status==='seed'"><path d="M38 94q-19 -20 -20 0q14 9 20 0M122 94q19 -20 20 0q-14 9 -20 0" fill="var(--status-color)"/></template><path v-else d="M44 55 31 72 41 82M116 55l13 17 -10 10" stroke="var(--status-color)"/></g>
   </template>
   <template v-else-if="effect.status==='recoil'">
    <g class="status-recoil" stroke="var(--status-color)" stroke-width="4" stroke-linecap="round"><path d="M31 55 47 64M129 55l-16 9M27 106l20 -8M133 106l-20 -8M67 33l5 17M93 33l-5 17"/><path d="M50 122q30 16 60 0" stroke="var(--status-accent)" stroke-width="2"/></g>
   </template>
   <template v-else>
    <g v-for="(p,i) in [[42,91],[119,71],[75,39],[104,116]]" :key="i" class="status-rise" :style="delay(i)"><path :d="`M${p[0]} ${p[1]-6}v12m-6 -6h12`" stroke="var(--status-color)" stroke-width="3" stroke-linecap="round"/></g>
   </template>
  </svg>
 </div>
</template>
<script>
import {STATUS_VISUALS} from '@/services/battleStatusVisuals';
import {BATTLE_PACING} from '@/services/battlePacing';
const bubbles=Object.freeze([{x:32,y:113,r:8},{x:49,y:88,r:6},{x:119,y:107,r:10},{x:102,y:73,r:5},{x:73,y:126,r:7},{x:130,y:59,r:5}]);
export default {
 props:{effect:Object,reduced:Boolean,duration:{type:Number,default:BATTLE_PACING.status}},
 computed:{palette(){return STATUS_VISUALS[this.effect?.status]||STATUS_VISUALS.cure;},bubbles(){return bubbles;}},
 methods:{delay(i){return {'--status-delay':`${i*45}ms`};}}
};
</script>
<style scoped>
.battle-status-effect{position:absolute;inset:0;pointer-events:none;z-index:58;isolation:isolate;animation:status-envelope var(--status-duration) ease both;contain:layout style;overflow:visible}.battle-status-effect svg{display:block;width:100%;height:100%;overflow:visible}.battle-status-effect svg>g,.battle-status-effect svg>path{transform-box:fill-box;transform-origin:center;animation-duration:calc(var(--status-duration) - 220ms);animation-delay:var(--status-delay,0ms);animation-fill-mode:both;animation-timing-function:ease-in-out}.status-rise{animation-name:status-rise}.status-flame{animation-name:status-flame;transform-origin:center bottom!important}.status-confused{animation-name:status-confused}.status-bind{animation-name:status-bind}.status-electric{animation-name:status-electric}.status-drift{animation-name:status-drift}.status-crystal{animation-name:status-crystal;transform-origin:center bottom!important}.status-curse{animation-name:status-curse}.status-recoil{animation-name:status-recoil}
@keyframes status-envelope{0%,100%{opacity:0}12%,80%{opacity:1}}@keyframes status-rise{from{opacity:0;translate:0 10px;scale:.6}30%{opacity:1}to{opacity:0;translate:0 -20px;scale:1.05}}@keyframes status-flame{from{scale:.6 .4;opacity:0}30%{scale:1 1;opacity:1}65%{scale:.9 1.13}to{scale:.7 .8;translate:0 -9px;opacity:0}}@keyframes status-confused{from{translate:-5px 0;rotate:-7deg}50%{translate:5px -4px;rotate:7deg}to{translate:-3px 0;rotate:-4deg}}@keyframes status-bind{from{scale:1.18;opacity:0}30%,65%{scale:.95;opacity:1}to{scale:1.05;opacity:0}}@keyframes status-electric{0%,35%,75%{opacity:.25}15%,50%,90%{opacity:1}to{opacity:0}}@keyframes status-drift{from{translate:-4px 9px;opacity:0;scale:.8}35%{opacity:1}to{translate:5px -10px;opacity:0;scale:1.1}}@keyframes status-crystal{from{scale:.8 .15;opacity:0}40%,75%{scale:1 1;opacity:1}to{translate:0 3px;scale:1.08 .95;opacity:0}}@keyframes status-curse{from{opacity:0;scale:.7}45%{opacity:1;scale:1.04}to{opacity:0;scale:.95;translate:0 -8px}}@keyframes status-recoil{from{scale:.5;opacity:0}25%{scale:1.06;opacity:1}60%{scale:.95}to{scale:1.2;opacity:0}}
@media(prefers-reduced-motion:reduce){.battle-status-effect{display:none}}
</style>
