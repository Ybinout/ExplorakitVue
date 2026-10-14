<template><span class="rank-badge" :class="rank.key" data-rank-badge><svg viewBox="0 0 28 32" aria-hidden="true"><path d="M14 2 26 8v13L14 30 2 21V8Z"/><path d="m14 8 6 8-6 8-6-8Z"/></svg><span>{{ rank.name }}<small v-if="detail">{{ detail }}</small></span></span></template>
<script>
export default { name:'RankBadge',props:{rank:{type:Object,required:true},detail:{type:String,default:''}} };
</script>
<style scoped>
.rank-badge{display:inline-flex;align-items:center;gap:9px;color:#6b7975;font:700 14px/1.3 Arial;min-width:0}.rank-badge svg{width:27px;height:32px;flex-shrink:0;fill:currentColor}.rank-badge svg path+path{fill:#fcfcf8;opacity:.8}.rank-badge small{display:block;font:11px/1.5 Arial;color:#5c716b;margin-top:3px}.bronze{color:#95633f}.silver{color:#627e8d}.gold{color:#9b791f}.platinum{color:#2a867c}.diamond{color:#5165a9}.unranked svg{fill:none;stroke:currentColor;stroke-width:1.5}
</style>
