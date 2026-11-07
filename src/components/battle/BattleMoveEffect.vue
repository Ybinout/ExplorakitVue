<template>
 <canvas ref="canvas" class="move-library" :data-move-family="fx.family" :data-move-style="fx.style" :data-move-phase="fx.stage" :data-move-element="fx.moveType" aria-hidden="true"/>
</template>
<script>
import {MoveEffectRenderer} from '@/services/moveEffectRenderer';
export default {
 props:{fx:Object,path:Object,color:String},
 watch:{'fx.stage'(){this.begin();},'fx.pulse'(){this.begin();}},
 mounted(){this.renderer=new MoveEffectRenderer(this.$refs.canvas,{quality:window.innerWidth<700?.78:1});this._visibility=()=>{if(document.hidden)this.renderer?.clear();else if(this.renderer&&performance.now()-this.renderer.started<this.renderer.duration())this.renderer.schedule();};document.addEventListener('visibilitychange',this._visibility);this._resize=new ResizeObserver(()=>this.begin());this._resize.observe(this.$el.parentElement);this.begin();},
 beforeDestroy(){this._resize?.disconnect();document.removeEventListener('visibilitychange',this._visibility);this.renderer?.dispose();},
 methods:{begin(){if(!this.renderer||document.hidden)return;const parent=this.$el.parentElement,r=parent.getBoundingClientRect();this.renderer.resize(parent.clientWidth,parent.clientHeight,window.devicePixelRatio||1);const exclusions=[...parent.querySelectorAll('.battle-status,.raid-boss-hud,.double-card,.double-owner,.battle-weather-info,.double-weather')].map(n=>{const b=n.getBoundingClientRect();return{x:b.left-r.left,y:b.top-r.top,width:b.width,height:b.height};});this.renderer.setEffect({...this.fx},this.path,exclusions);}}
};
</script>
<style scoped>
.move-library{position:absolute;inset:0;width:100%;height:100%;z-index:56;pointer-events:none;image-rendering:auto}
@media(prefers-reduced-motion:reduce){.move-library{display:none}}
</style>
