<template><span class="pokemon-portrait"><img :src="src" :alt="alt" :style="imageStyle" @load="fitSprite"></span></template>
<script>
export default {
  props: { src: String, alt: { type: String, default: '' } },
  data: () => ({ imageStyle: {} }),
  watch: { src() { this.imageStyle = {}; } },
  methods: {
    fitSprite(event) {
      const image = event.target;
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
</style>
