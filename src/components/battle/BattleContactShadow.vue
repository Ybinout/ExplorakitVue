<template><div class="battle-contact-shadow" :style="position" data-contact-shadow aria-hidden="true"/></template>
<script>
import {portraitGround} from '@/services/battleGround';
import {pokemonSpriteMetrics} from '@/services/pokemonSprites';
export default{props:{geometry:Object,selector:String,identity:String},data:()=>({measured:null}),computed:{position(){const g=this.geometry||this.measured;if(!g)return{display:'none'};return{left:g.centerX+'px',top:(g.bottomY-2)+'px',width:Math.min(180,Math.max(38,g.width*.65))+'px',height:Math.min(25,Math.max(9,g.width*.11))+'px'};}},watch:{identity(){this.$nextTick(this.measure);}},mounted(){if(this.geometry)return;this.stage=this.$el.parentElement;this.observer=new ResizeObserver(this.measure);this.observer.observe(this.stage);this.stage.addEventListener('load',this.measure,true);this.$nextTick(this.measure);},beforeDestroy(){this.closed=true;cancelAnimationFrame(this.frame);this.observer?.disconnect();this.stage?.removeEventListener('load',this.measure,true);},methods:{measure(){if(this.closed)return;cancelAnimationFrame(this.frame);this.frame=requestAnimationFrame(()=>{if(!this.closed)this.measured=portraitGround(this.stage?.querySelector(this.selector),this.stage,pokemonSpriteMetrics);});}}};
</script>
<style scoped>
.battle-contact-shadow{position:absolute;z-index:3;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(ellipse,#0007 0%,#0005 28%,#0002 53%,#0000 74%);pointer-events:none}
</style>
