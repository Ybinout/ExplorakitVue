<template><canvas class="battle-ambience" ref="canvas" :data-battle-ambience="environment" aria-hidden="true"/></template>
<script>
import {BattleAmbienceRenderer} from '@/services/battleAmbience';
export default{
 props:{environment:{type:String,default:'grass'},background:Object,animationsEnabled:{type:Boolean,default:true}},
 watch:{environment(){this.$nextTick(this.sync);},background(){this.$nextTick(this.sync);},animationsEnabled(){this.sync();}},
 mounted(){this.motion=window.matchMedia('(prefers-reduced-motion: reduce)');this.motion.addEventListener('change',this.sync);document.addEventListener('visibilitychange',this.sync);this.observer=new ResizeObserver(this.sync);this.observer.observe(this.$el.parentElement);this.sync();},
 beforeDestroy(){this.closed=true;cancelAnimationFrame(this.frame);this.observer?.disconnect();this.motion?.removeEventListener('change',this.sync);document.removeEventListener('visibilitychange',this.sync);this.image?.removeEventListener('load',this.sync);this.renderer?.dispose();},
 methods:{
  sync(){
   if(this.closed)return;cancelAnimationFrame(this.frame);this.frame=0;
   if(!this.animationsEnabled||document.hidden||this.motion?.matches){this.renderer?.dispose();this.renderer=null;this.$refs.canvas.width=this.$refs.canvas.height=0;return;}
   const stage=this.$el.parentElement,art=stage.querySelector('picture img.battle-background'),src=this.background?(stage.clientWidth<=700?this.background.mobile:this.background.wide):art?.currentSrc||art?.src;
   if(!src)return;
   if(this.source!==src||this.art!==art){this.image?.removeEventListener('load',this.sync);this.renderer?.dispose();this.renderer=null;this.source=src;this.art=art;this.image=art||new Image();this.image.addEventListener('load',this.sync);if(!art)this.image.src=src;}
   if(!this.image.complete||!this.image.naturalWidth)return;
   const style=art?getComputedStyle(art):getComputedStyle(stage),position=(art?style.objectPosition:style.backgroundPosition).split(' ').map(v=>v.includes('%')?parseFloat(v)/100:.5),fit=art?style.objectFit:'cover';
   if(!this.renderer||this.renderer.environment!==this.environment){this.renderer?.dispose();this.renderer=new BattleAmbienceRenderer(this.$refs.canvas,this.image,this.environment,{fit,position});}
   const w=stage.clientWidth,h=stage.clientHeight;if(w<=0||h<=0)return;
   if(this.renderer.width!==w||this.renderer.height!==h)this.renderer.resize(w,h);this.lastPaint=-Infinity;this.paint(performance.now());
  },
  paint(time){this.frame=0;if(this.closed||!this.renderer||document.hidden||!this.animationsEnabled)return;if(time-this.lastPaint>=50){this.renderer.paintAt(time);this.lastPaint=time;}this.frame=requestAnimationFrame(this.paint);}
 }
};
</script>
<style scoped>
.battle-ambience{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;transition:none!important}
</style>
