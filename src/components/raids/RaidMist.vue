<template><canvas ref="fog" width="448" height="320" class="raid-mist" aria-hidden="true"/></template>
<script>
import {DarkContinentMist} from '@/services/darkContinentMist';
// Same cached cloud bitmap as the world. Low-resolution, 20 Hz, no filters,
// suspended in background tabs and entirely behind the Pokémon and HUD.
export default {
  props:{reduced:Boolean},
  watch:{reduced(){this.restart();}},
  mounted(){this._mist=new DarkContinentMist();this._visibility=()=>this.restart();document.addEventListener('visibilitychange',this._visibility);this.restart();},
  beforeDestroy(){cancelAnimationFrame(this._raf);document.removeEventListener('visibilitychange',this._visibility);this._mist?.suspend();},
  methods:{restart(){
    cancelAnimationFrame(this._raf);if(document.hidden)return;
    const c=this.$refs.fog.getContext('2d');if(!c)return;
    let last=-Infinity;
    const draw=now=>{
      if(now-last>=50){last=now;c.clearRect(0,0,448,320);c.globalAlpha=.64;this._mist.paint(c,'jungle5',now/1000,!this.reduced);}
      if(!this.reduced)this._raf=requestAnimationFrame(draw);
    };
    this._raf=requestAnimationFrame(draw);
  }}
};
</script>
<style scoped>.raid-mist{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;opacity:.65}</style>
