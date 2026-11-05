<template><span class="pokemon-portrait" :class="{'is-shiny':shiny}" :title="shiny?'Pokémon chromatique':null"><img :src="src" :alt="alt" :style="imageStyle" @load="fitSprite"><span v-if="shiny" class="portrait-shiny" aria-label="Pokémon chromatique">✦</span></span></template>
<script>
import { pokemonSpriteMetrics } from '@/services/pokemonSprites';
export default {
  props: { src: String, alt: { type: String, default: '' } },
  data: () => ({ imageStyle: {} }),
  computed: { shiny() { return String(this.src || '').includes('/shiny/'); } },
  watch: { src() { this.imageStyle = {}; } },
  methods: {
    fitSprite(event) {
      const image = event.target;
      const metrics = pokemonSpriteMetrics(image.src);
      if(metrics){
        const [left,top,right,bottom]=metrics.bounds,[width,height]=metrics.size;
        const extent=Math.max(right-left,bottom-top)/0.78;
        this.imageStyle={width:`${width/extent*100}%`,height:`${height/extent*100}%`,left:`${(0.5-(left+right)/2/extent)*100}%`,top:`${(0.5-(top+bottom)/2/extent)*100}%`};
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      try {
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let left = canvas.width, right = -1, top = canvas.height, bottom = -1;
        for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
          if (pixels[(y * canvas.width + x) * 4 + 3] <= 8) continue;
          left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
        }
        if (right < left) return;
        const extent = Math.max(right - left + 1, bottom - top + 1) / 0.78;
        this.imageStyle = { width: `${canvas.width / extent * 100}%`, height: 'auto',
          left: `${(0.5 - (left + right + 1) / 2 / extent) * 100}%`, top: `${(0.5 - (top + bottom + 1) / 2 / extent) * 100}%` };
      } catch (error) { /* External images retain the untrimmed fallback. */ }
    }
  }
};
</script>
<style scoped>
.pokemon-portrait{position:relative;display:block;aspect-ratio:1;overflow:hidden;flex-shrink:0}.pokemon-portrait img{position:absolute;left:0;top:0;width:100%;height:100%;max-width:none;object-fit:contain;image-rendering:pixelated}
.portrait-shiny{position:absolute;right:1px;top:0;z-index:1;font:700 14px/1.1 sans-serif;color:#a87815;text-shadow:0 1px #fff5c6;pointer-events:none}
</style>
