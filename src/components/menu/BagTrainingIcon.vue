<template>
  <g>
    <!-- Different silhouettes remain recognisable even without colour. -->
    <g v-if="design.kind==='vitamin'">
      <rect x="17" y="4" width="14" height="8" rx="2" fill="var(--item-main)"/>
      <path d="M18 12v4l-5 5v19q0 3 3 3h16q3 0 3-3V21l-5-5v-4" fill="var(--item-main)"/>
      <path d="M21 5v6m6-6v6M14 22h20v15H14Z" fill="var(--item-light)"/>
      <path :d="glyph" transform="translate(18 23) scale(.75)"/>
    </g>
    <g v-else-if="design.kind==='iv-roll'">
      <path d="m6 15 13-7 15 8 1 18-14 8-15-8Z" fill="var(--item-main)"/>
      <path d="m6 15 15 8 13-7m-13 7v19"/>
      <path d="m11 29 4 2m10-2 4-2m-4 9 4-2M16 15l5 3" stroke-width="3"/>
      <path d="M29 6a10 10 0 0 1 13 10m0-6v6h-6"/>
      <path :d="glyph" transform="translate(30 29) scale(.85)" fill="var(--item-light)"/>
    </g>
    <g v-else-if="design.kind==='ev-reset'">
      <path d="m7 29 17-21q2-2 4 0l13 11q2 2 0 4L25 42H13l-6-6q-3-3 0-7Z" fill="var(--item-main)"/>
      <path d="m15 20 19 16-9 6H13l-6-6q-3-3 0-7Z" fill="var(--item-light)"/>
      <path d="M5 11a8 8 0 0 1 12-5m-1-4 1 4-5 1"/>
      <path v-if="design.stat==='all'" d="m25 14 9 8m-6-11 9 8"/>
      <path v-else :d="glyph" transform="translate(22 12) rotate(40 8 8) scale(.7)"/>
    </g>
    <g v-else>
      <path d="m13 12 5-5a10 10 0 0 1 14 0l9 12a10 10 0 0 1-1 14l-5 5a10 10 0 0 1-14 0L12 26a10 10 0 0 1 1-14Z" fill="var(--item-main)"/>
      <path d="m13 12 22 26M14 13l-1 1a8 8 0 0 0 0 11l9 12a8 8 0 0 0 12 1Z" fill="var(--item-light)"/>
      <path v-if="design.kind==='nature-capsule'" d="M25 24c-3-9 1-13 8-12 1 7-2 12-8 12Zm0 0 5-7"/>
      <path v-else d="m29 10 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/>
    </g>
  </g>
</template>
<script>
import {BAG_STAT_GLYPHS} from '@/services/bagItemPresentation';
export default {name:'BagTrainingIcon',props:{design:{type:Object,required:true}},computed:{glyph(){return BAG_STAT_GLYPHS[this.design.stat]||'';}}};
</script>
