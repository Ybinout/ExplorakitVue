<template><div class="battle-sun" :class="{'sun-still':!animationsEnabled}" data-battle-sun aria-hidden="true"/></template>
<script>export default{props:{animationsEnabled:{type:Boolean,default:true}}};</script>
<style scoped>
.battle-sun{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden;background:linear-gradient(140deg,#ffe3a526,transparent 54%,#ffc56c0d)}.battle-sun::before{content:'';position:absolute;inset:-20%;background:repeating-linear-gradient(114deg,transparent 0 12%,#ffefb41a 15%,transparent 20% 31%);animation:sun-warmth 9s ease-in-out infinite alternate}.battle-sun::after{content:'';position:absolute;inset:45% -10% -10%;background:repeating-linear-gradient(2deg,transparent 0 17px,#ffeabe12 19px,transparent 22px 45px);animation:sun-heat 5s ease-in-out infinite alternate}
@keyframes sun-warmth{from{transform:translateX(-2%);opacity:.5}to{transform:translateX(2%);opacity:.85}}@keyframes sun-heat{from{transform:skewX(-1deg) translateY(0)}to{transform:skewX(1deg) translateY(-5px)}}.sun-still::before,.sun-still::after{animation:none}@media(prefers-reduced-motion:reduce){.battle-sun::before,.battle-sun::after{animation:none}}
</style>
