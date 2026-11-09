<template>
  <canvas ref="icon" width="64" height="64" aria-hidden="true" />
</template>
<script>
import { loadHousingArt, drawItemIcon } from '@/services/housingArt';
export default {
  props: { itemKey: String },
  watch: {
    itemKey() {
      this.paint();
    },
  },
  mounted() {
    this.paint();
  },
  methods: {
    async paint() {
      const art = await loadHousingArt().catch(() => null);
      if (art && !this._isDestroyed && this.$refs.icon)
        drawItemIcon(this.$refs.icon.getContext('2d'), art, this.itemKey);
    },
  },
};
</script>
<style scoped>
canvas {
  width: 56px;
  height: 56px;
  object-fit: contain;
  image-rendering: pixelated;
  flex: none;
}
</style>
