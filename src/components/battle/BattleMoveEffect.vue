<template>
  <svg class="move-library" :data-move-family="fx.family" :data-move-phase="fx.stage" aria-hidden="true" :style="{color, '--flight':`${fx.travelMs}ms`}">
    <g v-if="['travel','impact'].includes(fx.stage) && fx.family === 'beam'" class="move-beam" :class="{'move-beam-fading':fx.stage === 'impact'}">
        <path :d="line" pathLength="1" stroke="currentColor" stroke-width="18" opacity=".22" fill="none"/>
        <path :d="line" pathLength="1" stroke="currentColor" stroke-width="9" fill="none"/>
        <path :d="line" pathLength="1" stroke="#f4ffff" stroke-width="3" fill="none"/>
        <circle :cx="path.startX" :cy="path.startY" r="18" fill="currentColor" opacity=".75"/>
      </g>
    <g v-if="fx.stage === 'travel'">
      <g v-if="fx.family === 'projectile' || fx.family === 'drain'" :style="flightStyle" class="move-flight">
        <ellipse rx="23" ry="8" :transform="`rotate(${angle})`" fill="currentColor" opacity=".3"/>
        <circle r="11" fill="currentColor"/><circle r="5" fill="#fff9df"/>
        <circle cx="-13" cy="7" r="3" fill="currentColor"/>
      </g>
    </g>
    <g v-if="fx.stage === 'impact'" :transform="`translate(${path.targetX} ${fx.family === 'zone' ? path.groundY : path.targetY})`">
      <g v-if="fx.family === 'bite'" class="move-jaws" fill="#fff8dc" stroke="currentColor" stroke-width="2">
        <path class="jaw-top" d="M-30,-28 Q0,-42 30,-28 L22,-9 12,-27 0,-5 -12,-27 -22,-9 Z"/>
        <path class="jaw-bottom" d="M-30,28 Q0,42 30,28 L22,9 12,27 0,5 -12,27 -22,9 Z"/>
      </g>
      <g v-else-if="fx.family === 'claw'" fill="none" stroke-linecap="round">
        <path v-for="n in 3" :key="n" :d="`M${-32+n*14},-30 Q${-20+n*14},0 ${-49+n*14},32`" class="move-slash" stroke="currentColor" stroke-width="7" :style="{'--delay':`${(n-1)*45}ms`}"/>
      </g>
      <g v-else-if="fx.family === 'zone'" fill="none" stroke="currentColor" stroke-width="4">
        <ellipse v-for="n in 3" :key="n" rx="52" ry="17" class="move-ground-wave" :style="{'--delay':`${(n-1)*90}ms`}"/>
        <path v-for="n in 8" :key="`stone-${n}`" d="M0,-18 l-4,-8 6,-5 4,9z" fill="currentColor" :transform="`rotate(${n*45})`" class="move-spark"/>
      </g>
      <circle v-if="fx.family !== 'zone'" r="32" fill="none" stroke="currentColor" stroke-width="3" class="move-impact-ring"/>
    </g>
    <g v-if="fx.stage === 'drain'" class="move-return">
      <g v-for="n in 5" :key="n" class="move-energy" :style="{...returnStyle,'--delay':`${(n-1)*45}ms`}">
        <circle :cy="(n%2 ? 1:-1)*9" r="5" fill="#a4f0ad"/><circle :cy="(n%2 ? 1:-1)*9" r="2" fill="#f5ffe3"/>
      </g>
    </g>
    <g v-if="fx.family==='purify' && ['travel','aura'].includes(fx.stage)" :transform="`translate(${path.targetX} ${path.targetY})`" class="move-purify">
      <path v-for="n in 9" :key="n" d="M0 -9 4 0 0 9 -4 0Z" :fill="n%2?'#e7d6ff':'#a5d3c5'" :style="{'--px':`${(n%3-1)*24}px`,'--py':`${Math.floor(n/3)*12-12}px`,'--delay':`${(n-1)*30}ms`}" />
    </g>
    <g v-if="fx.stage === 'aura' && !fx.fieldMove && fx.family!=='purify'" :transform="`translate(${path.targetX} ${path.targetY})`" fill="none" stroke="currentColor" stroke-width="3">
      <circle r="30" class="move-impact-ring"/><ellipse rx="40" ry="12" class="move-contact"/>
    </g>
    <g v-if="fx.stage === 'miss'" :transform="`translate(${path.targetX} ${path.targetY})`" class="move-dissipate" fill="none" stroke="currentColor" opacity=".5">
      <path d="M-28,-20 -40,-28 M28,-20 40,-28 M-28,20 -40,28 M28,20 40,28" stroke-width="3"/>
    </g>
  </svg>
</template>
<script>
export default {
  props: {fx:Object,path:Object,color:String},
  computed: {
    line() { return `M${this.path.startX},${this.path.startY} L${this.path.targetX},${this.path.targetY}`; },
    angle() { return Math.atan2(this.path.targetY-this.path.startY,this.path.targetX-this.path.startX)*180/Math.PI; },
    flightStyle() { return {'--sx':`${this.path.startX}px`,'--sy':`${this.path.startY}px`,'--tx':`${this.path.targetX}px`,'--ty':`${this.path.targetY}px`}; },
    returnStyle() {return {'--sx':`${this.path.targetX}px`,'--sy':`${this.path.targetY}px`,'--tx':`${this.path.startX}px`,'--ty':`${this.path.startY}px`};}
  }
};
</script>
<style scoped>
.move-library{position:absolute;inset:0;width:100%;height:100%;z-index:56;pointer-events:none;overflow:hidden;stroke-linecap:round}
.move-flight{animation:move-flight var(--flight) cubic-bezier(.4,.1,.7,.9) both}
.move-beam{stroke-dasharray:1;animation:move-beam var(--flight) ease-out both}
.move-beam-fading{animation:move-fade .4s ease-out both}
.move-contact{animation:move-contact .42s ease-out both;transform-box:fill-box;transform-origin:center}
.move-impact-ring{animation:move-ring .5s ease-out both;transform-box:fill-box;transform-origin:center}
.move-slash{stroke-dasharray:100;animation:move-slash .35s var(--delay) ease-out both}
.jaw-top{animation:move-jaw-top .32s ease-out both}.jaw-bottom{animation:move-jaw-bottom .32s ease-out both}
.move-ground-wave{animation:move-ground .5s var(--delay) ease-out both;transform-origin:center;transform-box:fill-box}
.move-energy{animation:move-flight .36s var(--delay) ease-in-out both}.move-return{opacity:.95}
.move-dissipate,.move-spark{animation:move-fade .45s ease-out both}
.move-purify path{animation:move-purify .65s var(--delay) ease-out both}
@keyframes move-purify{from{transform:translate(var(--px),var(--py)) scale(.5);opacity:0}20%{opacity:1}to{transform:translate(var(--px),calc(var(--py) - 65px)) scale(.1);opacity:0}}
@keyframes move-flight{from{transform:translate(var(--sx),var(--sy));opacity:.2}20%{opacity:1}to{transform:translate(var(--tx),var(--ty));opacity:1}}
@keyframes move-beam{from{stroke-dashoffset:1;opacity:.2}to{stroke-dashoffset:0;opacity:1}}
@keyframes move-contact{0%{transform:scale(.3);opacity:0}20%{transform:scale(1.12);opacity:1}to{transform:scale(.85);opacity:0}}
@keyframes move-ring{from{transform:scale(.3);opacity:.9}to{transform:scale(1.5);opacity:0}}
@keyframes move-slash{from{stroke-dashoffset:100;opacity:0}30%{opacity:1}to{stroke-dashoffset:0;opacity:0}}
@keyframes move-jaw-top{from{transform:translateY(-22px);opacity:0}40%{transform:translateY(5px);opacity:1}to{transform:translateY(0);opacity:0}}
@keyframes move-jaw-bottom{from{transform:translateY(22px);opacity:0}40%{transform:translateY(-5px);opacity:1}to{transform:translateY(0);opacity:0}}
@keyframes move-ground{from{transform:scale(.25);opacity:1}to{transform:scale(1.8);opacity:0}}
@keyframes move-fade{from{opacity:.8}to{opacity:0}}
@media(prefers-reduced-motion:reduce){.move-library{display:none}}
</style>
