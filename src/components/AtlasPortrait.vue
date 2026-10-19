<template><canvas ref="portrait" class="portrait-atlas" width="192" height="192" role="img" aria-label="Portrait du personnage" /></template>
<script>
import { drawNpcFrame } from '@/services/npcFrames';
export default { props:{src:String,frame:Object},mounted(){this.renderPortrait();},watch:{src(){this.renderPortrait();},frame:{deep:true,handler(){this.renderPortrait();}}},beforeDestroy(){this.generation++;},methods:{async renderPortrait(){const generation=this.generation=(this.generation||0)+1,image=new Image();image.src=this.src;try{await image.decode();if(generation!==this.generation||!this.$refs.portrait)return;const ctx=this.$refs.portrait.getContext('2d');ctx.clearRect(0,0,192,192);drawNpcFrame(ctx,image,this.frame,0,0,192);}catch{/* Keep the portrait slot stable while a resource is unavailable. */}}} };
</script>
<style scoped>.portrait-atlas{width:100%;max-width:190px;height:auto;aspect-ratio:1;image-rendering:pixelated}</style>
