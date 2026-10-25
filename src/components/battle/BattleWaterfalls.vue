<template><canvas ref="canvas" class="battle-waterfalls" data-battle-waterfalls aria-hidden="true"></canvas></template>
<script>
import { WaterfallRenderer, waterfallProfile } from '@/services/waterfalls';
export default {
  props: { animationsEnabled: {type:Boolean,default:true} },
  watch: { animationsEnabled(){this.sync();} },
  mounted(){
    this._renderer=new WaterfallRenderer();
    this._image=this.$el.parentElement.querySelector('[data-battle-environment="lake-gym"] img');
    this._image?.addEventListener('load',this.sync);
    this._motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');this._motionQuery.addEventListener('change',this.sync);
    document.addEventListener('visibilitychange',this.sync);
    this._resizeObserver=new ResizeObserver(this.sync);this._resizeObserver.observe(this.$el);this.sync();
  },
  beforeDestroy(){
    this._disposed=true;cancelAnimationFrame(this._frame);this._image?.removeEventListener('load',this.sync);
    this._motionQuery?.removeEventListener('change',this.sync);document.removeEventListener('visibilitychange',this.sync);
    this._resizeObserver?.disconnect();this._renderer?.destroy();
    if(this.$refs.canvas){this.$refs.canvas.width=0;this.$refs.canvas.height=0;}
  },
  methods:{
    sync(){
      if(this._disposed)return;cancelAnimationFrame(this._frame);this._frame=null;
      const canvas=this.$refs.canvas,image=this._image;if(!canvas||!this._renderer)return;
      if(document.hidden||!this.animationsEnabled||this._motionQuery.matches||!image?.complete||!image.naturalWidth){canvas.width=0;canvas.height=0;this._renderer.suspend();return;}
      this._kind=image.naturalWidth>image.naturalHeight?'wide':'mobile';const p=waterfallProfile(this._kind);
      if(canvas.width!==p.width||canvas.height!==p.height){canvas.width=p.width;canvas.height=p.height;}
      this._paintAt=-Infinity;this.paint(performance.now());
    },
    paint(timestamp){
      this._frame=null;if(this._disposed||document.hidden)return;
      const c=this.$refs.canvas?.getContext('2d');if(!c)return;
      if(timestamp-this._paintAt>=50){
        c.clearRect(0,0,this.$refs.canvas.width,this.$refs.canvas.height);
        this._renderer.draw(c,this._image,timestamp,this._kind);this._paintAt=timestamp;
      }
      this._frame=requestAnimationFrame(this.paint);
    },
  },
};
</script>
<style scoped>
.battle-waterfalls{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;image-rendering:pixelated;}
</style>
