<template><span class="health-liquid-response" :class="pulse" aria-hidden="true" data-health-liquid><i :key="serial"/></span></template>
<script>
export default{props:{value:[Number,String]},data:()=>({pulse:'',serial:0}),watch:{value(next,old){if(Number(next)===Number(old))return;clearTimeout(this.timer);this.serial++;this.pulse=Number(next)>Number(old)?'is-healing':'is-draining';this.timer=setTimeout(()=>{this.pulse='';},720);}},beforeDestroy(){clearTimeout(this.timer);}};
</script>
<style scoped>
.health-liquid-response{position:absolute;inset:0;pointer-events:none;z-index:2;border-radius:inherit;box-shadow:inset 0 1px 0 #fff9,inset 0 -2px 2px #142b3a55}.health-liquid-response i{position:absolute;inset:-30% -25%;opacity:0;background:repeating-radial-gradient(ellipse at 50% 110%,transparent 0 6px,#ffffff90 7px 8px,transparent 9px 17px)}.is-draining i{animation:health-drain-surge .72s ease-out both}.is-healing i{background:linear-gradient(110deg,transparent 28%,#efffff 45%,#fff8 55%,transparent 70%);animation:health-heal-surge .72s ease-out both}
@keyframes health-drain-surge{0%{opacity:.9;transform:translateX(6%) scaleY(1.6)}45%{opacity:.65;transform:translateX(-6%) scaleY(.85)}100%{opacity:0;transform:translateX(-15%) scaleY(1.1)}}@keyframes health-heal-surge{0%{opacity:0;transform:translateX(-55%)}25%{opacity:.85}100%{opacity:0;transform:translateX(55%)}}
@media(prefers-reduced-motion:reduce){.health-liquid-response i{animation:none;opacity:0}}
</style>
