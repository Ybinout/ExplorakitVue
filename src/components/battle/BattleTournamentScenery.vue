<template><canvas ref="canvas" class="tournament-battle-scenery" data-tournament-battle-scenery aria-hidden="true"></canvas></template>
<script>
import {drawTournamentBattleSky,TOURNAMENT_BATTLE_SCENERY} from '@/services/tournamentBattleSky';
export default {
  props:{animationsEnabled:{type:Boolean,default:true}},
  watch:{animationsEnabled(){this.sync();}},
  mounted(){
    this._image=this.$el.parentElement.querySelector('[data-battle-environment="super-tournament"] img');
    this._image?.addEventListener('load',this.sync);
    this._motion=window.matchMedia('(prefers-reduced-motion: reduce)');this._motion.addEventListener('change',this.sync);
    document.addEventListener('visibilitychange',this.sync);
    this._resize=new ResizeObserver(this.sync);this._resize.observe(this.$el);this.sync();
  },
  beforeDestroy(){
    this._disposed=true;cancelAnimationFrame(this._frame);this._image?.removeEventListener('load',this.sync);
    this._motion?.removeEventListener('change',this.sync);document.removeEventListener('visibilitychange',this.sync);this._resize?.disconnect();
    if(this.$refs.canvas){this.$refs.canvas.width=0;this.$refs.canvas.height=0;}
  },
  methods:{
    sync(){
      if(this._disposed)return;cancelAnimationFrame(this._frame);this._frame=null;
      const c=this.$refs.canvas,image=this._image;if(!c)return;
      if(document.hidden||!this.animationsEnabled||this._motion.matches||!image?.complete||!image.naturalWidth){c.width=c.height=0;return;}
      this._kind=image.naturalWidth>image.naturalHeight?'wide':'mobile';const p=TOURNAMENT_BATTLE_SCENERY[this._kind];
      c.width=p.width/2;c.height=p.height/2;this._paintAt=-Infinity;this.paint(performance.now());
    },
    paint(time){
      this._frame=null;if(this._disposed||document.hidden)return;
      const canvas=this.$refs.canvas,c=canvas?.getContext('2d');if(!c)return;
      if(time-this._paintAt>=50){c.clearRect(0,0,canvas.width,canvas.height);drawTournamentBattleSky(c,time,this._kind);this._paintAt=time;}
      this._frame=requestAnimationFrame(this.paint);
    }
  }
};
</script>
<style scoped>
.tournament-battle-scenery{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;image-rendering:pixelated;}
</style>
