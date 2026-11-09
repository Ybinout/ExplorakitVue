<template>
  <canvas ref="image" width="256" height="180" aria-hidden="true" />
</template>
<script>
import { housingModel } from '@/services/housingArt';
import { resolveMapAsset } from '@/services/mapAssets';
export default {
  props: { modelKey: String },
  mounted() {
    this.paint();
  },
  watch: {
    modelKey() {
      this.paint();
    },
  },
  methods: {
    paint() {
      const m = housingModel(this.modelKey),
        image = new Image();
      image.onload = () => {
        if (this._isDestroyed) return;
        const c = this.$refs.image?.getContext('2d');
        if (!c) return;
        c.fillStyle = '#142635';
        c.fillRect(0, 0, 256, 180);
        c.imageSmoothingEnabled = false;
        const w = m.w * 16 + 8,
          h = m.h * 16 + 62,
          scale = Math.min(248 / w, 172 / h);
        c.drawImage(
          image,
          m.x * 16 - 4,
          (m.y - 3) * 16 - 4,
          w,
          h,
          (256 - w * scale) / 2,
          (180 - h * scale) / 2,
          w * scale,
          h * scale
        );
      };
      image.src = resolveMapAsset('housing_' + this.modelKey);
    },
  },
};
</script>
<style scoped>
canvas {
  display: block;
  width: 100%;
  height: auto;
  background: #142635;
  border-radius: 7px;
  image-rendering: pixelated;
}
</style>
