<template>
  <svg :class="{'is-fainted':state==='ko','is-hurt':state==='hurt'}" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    <circle class="ball-bottom" cx="10" cy="10" r="8.5" />
    <path class="ball-top" d="M1.5 10a8.5 8.5 0 0 1 17 0Z" />
    <circle class="ball-outline" cx="10" cy="10" r="8.5" />
    <path class="ball-seam" d="M2 10h16" />
    <circle class="ball-button" cx="10" cy="10" r="3" />
  </svg>
</template>
<script>
export default {name:'BattleBall',props:{state:{type:String,default:'ready'}}};
</script>
<style scoped>
svg{display:block;width:14px;height:14px;flex:none;--ball-top:#df5e57;--ball-bottom:#f8fcff;--ball-line:#354a58;--ball-button:#fff}
.ball-top{fill:var(--ball-top)}.ball-bottom{fill:var(--ball-bottom)}.ball-outline,.ball-seam{fill:none;stroke:var(--ball-line);stroke-width:1.5}.ball-button{fill:var(--ball-button);stroke:var(--ball-line);stroke-width:1.5}
.is-hurt{--ball-top:#ed9b2d;--ball-bottom:#fff1d6;--ball-line:#705024;--ball-button:#ffe0a6}
.is-fainted{--ball-top:#9ba4ab;--ball-bottom:#b8c0c5;--ball-line:#7c878f;--ball-button:#c5cdd1;opacity:.72}
</style>
