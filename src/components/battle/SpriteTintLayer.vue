<template><img class="sprite-tint-layer" :src="src" alt="" aria-hidden="true" :style="{filter:retainedFilter||'none','--sprite-tint-opacity':tint?.filter?.length ? .84 : 0}"></template>
<script>
// Fade a fixed color copy, preserving hue and avoiding WebKit filter-chain crashes.
export default {
 props:{src:String,tint:{type:Object,default:()=>({})}},
 data:()=>({retainedFilter:''}),
 watch:{'tint.filter':{immediate:true,handler(value){if(value)this.retainedFilter=value;}}}
};
</script>
<style scoped>
.sprite-tint-layer{opacity:var(--sprite-tint-opacity,0)!important;pointer-events:none;transition:opacity .16s ease;user-select:none}
@media(prefers-reduced-motion:reduce){.sprite-tint-layer{display:none;transition:none}}
</style>
