<template><div class="player-ground" :class="'ground-'+material" :style="position" data-player-ground aria-hidden="true"><i/></div></template>
<script>
import {portraitGround,groundStyle,groundMaterial} from '@/services/battleGround';
import {pokemonSpriteMetrics} from '@/services/pokemonSprites';
export default{
 props:{geometry:Object,environment:{type:String,default:'grass'},selector:String,identity:String},
 data:()=>({measured:null}),
 computed:{position(){return groundStyle(this.geometry||this.measured);},material(){return groundMaterial(this.environment);}},
 watch:{identity(){this.$nextTick(this.measure);}},
 mounted(){if(this.geometry)return;this.stage=this.$el.parentElement;this.observer=new ResizeObserver(this.measure);this.observer.observe(this.stage);this.stage.addEventListener('load',this.measure,true);this.$nextTick(this.measure);},
 beforeDestroy(){this.closed=true;cancelAnimationFrame(this.measureFrame);this.observer?.disconnect();this.stage?.removeEventListener('load',this.measure,true);},
 methods:{measure(){if(this.closed)return;cancelAnimationFrame(this.measureFrame);this.measureFrame=requestAnimationFrame(()=>{if(this.closed)return;const next=portraitGround(this.stage?.querySelector(this.selector),this.stage,pokemonSpriteMetrics);if(JSON.stringify(next)!==JSON.stringify(this.measured))this.measured=next;});}}
};
</script>
<style scoped>
.player-ground{position:absolute;z-index:2;transform:translate(-50%,-45%);pointer-events:none;border-radius:50%;box-sizing:border-box;overflow:hidden;background:var(--gym-ground,#8196ab);border:2px solid var(--gym-rim,#a8b7b7);box-shadow:0 4px 0 var(--gym-edge,#364a5355),0 8px 12px #14283022,inset 0 2px 0 #f3f6e744;opacity:.96}
.player-ground::before{content:'';position:absolute;inset:0;border-radius:inherit;background:repeating-linear-gradient(8deg,transparent 0 10px,#f5f7e30d 11px 12px),linear-gradient(#ffffff12,#111f3022)}.player-ground i{position:absolute;left:29%;top:28%;width:46%;height:32%;border-radius:50%;background:radial-gradient(ellipse,#10202f40,transparent 70%)}
.ground-grass{background:#78a640;border-color:#b0bb62;box-shadow:0 3px 0 #3e692b,inset 0 2px 0 #c2d18b}.ground-snow{background:#d8e9f3;border-color:#a9c8dc;box-shadow:0 3px 0 #779cb4,inset 0 3px 0 #f9ffff}.ground-water{background:#69a7b8;border-color:#94c9d0;box-shadow:0 3px 0 #3e758f,inset 0 2px 0 #c7e9eb}.ground-stone{background:var(--gym-ground,#877e92);border-color:var(--gym-rim,#a397af)}.ground-wood{background:var(--gym-ground,#5b5061);border-color:var(--gym-rim,#8a7d90)}.ground-sand{background:var(--gym-ground,#d1ae70);border-color:var(--gym-rim,#b0925e)}
</style>
