<template>
  <canvas ref="portrait" class="portrait-atlas" width="384" height="384" role="img"
    aria-label="Portrait illustré du personnage" :aria-busy="loading" :data-portrait-ready="ready" />
</template>
<script>
import { drawDialoguePortrait } from '@/services/dialoguePortrait';
export default {
  props: { src: String, frame: Object },
  data() { return { ready: false, loading: false }; },
  mounted() { this.renderPortrait(); },
  watch: { src() { this.renderPortrait(); }, frame: { deep: true, handler() { this.renderPortrait(); } } },
  beforeDestroy() { this.generation++; },
  methods: {
    async renderPortrait() {
      const generation = this.generation = (this.generation || 0) + 1;
      const canvas = this.$refs.portrait;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      this.ready = false;
      this.loading = Boolean(this.src);
      if (!this.src) return;
      const image = new Image();
      image.src = this.src;
      try {
        await image.decode();
        if (generation !== this.generation || !this.$refs.portrait) return;
        this.ready = drawDialoguePortrait(context, image, this.frame, canvas.width, canvas.height);
      } catch { /* Keep the empty portrait slot stable if an illustration is unavailable. */ }
      finally { if (generation === this.generation) this.loading = false; }
    },
  },
};
</script>
<style scoped>
.portrait-atlas { width:100%; max-width:190px; height:auto; aspect-ratio:1; image-rendering:auto; }
</style>
