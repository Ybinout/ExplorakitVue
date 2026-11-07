<template>
 <svg class="raid-cracked-shield" viewBox="0 0 200 220" preserveAspectRatio="none" aria-hidden="true" :class="{'is-hit':hit}">
  <defs><clipPath id="raid-shield-ellipse"><ellipse cx="100" cy="110" rx="93" ry="102"/></clipPath></defs>
  <ellipse class="raid-shield-surface" cx="100" cy="110" rx="93" ry="102"/>
  <g clip-path="url(#raid-shield-ellipse)" fill="none" stroke-linecap="round" stroke-linejoin="round">
   <g v-for="(crack,i) in cracks" :key="i" :style="{opacity:Math.max(0,Math.min(1,(damage-i*.15)*5))}"><path :d="crack" class="raid-crack-glow"/><path :d="crack" class="raid-crack-core"/></g>
  </g>
 </svg>
</template>
<script>
const cracks=['M152 51L133 74 145 92 116 116 125 139M145 92L171 100 180 119','M116 116L91 101 72 119 57 112M91 101L91 76 73 66','M125 139L99 153 102 177 81 201M99 153L72 148 59 168','M72 119L40 139 38 159 10 177M40 139L18 129','M133 74L121 48 132 24 121 6M121 48L100 37','M125 139L153 155 173 148 193 166M153 155L158 180 179 202'];
export default{props:{shield:Object,hit:Boolean},data:()=>({cracks}),computed:{damage(){return this.shield?.max?1-this.shield.hp/this.shield.max:0;}}};
</script>
<style scoped>
.raid-cracked-shield{position:absolute;inset:-5% 0 0;width:100%;height:105%;z-index:4;pointer-events:none;overflow:visible}.raid-shield-surface{stroke:#d9b5f2;stroke-width:1.6;fill:#a679cf18}.raid-crack-glow{stroke:#8b50bb;stroke-width:5;opacity:.6}.raid-crack-core{stroke:#f0daff;stroke-width:1.35}.raid-cracked-shield g{transition:opacity .45s}.raid-cracked-shield.is-hit{animation:shield-impact .36s ease-out}@keyframes shield-impact{20%{translate:-3px 1px;opacity:.65}50%{translate:3px -1px}to{translate:0;opacity:1}}@media(prefers-reduced-motion:reduce){.raid-cracked-shield,.raid-cracked-shield g{animation:none;transition:none}}
</style>
