<template><canvas ref="canvas" class="battle-sand-layer" data-battle-sand aria-hidden="true"></canvas></template>
<script>
import { SandstormRenderer } from '@/services/sandstorm';
export default {
  props: { animationsEnabled: { type: Boolean, default: true }, environment: { type: String, default: 'grass' } },
  watch: { animationsEnabled() { this.sync(); }, environment() { this.sync(); } },
  mounted() {
    this._sandRenderer = new SandstormRenderer();
    this._motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    this._motionListener = () => this.sync(); this._motionQuery?.addEventListener?.('change', this._motionListener);
    document.addEventListener('visibilitychange', this.sync);
    this._resizeObserver = new ResizeObserver(this.sync); this._resizeObserver.observe(this.$refs.canvas);
    this.sync();
  },
  beforeDestroy() {
    this._disposed = true; cancelAnimationFrame(this._sandFrame); this._resizeObserver?.disconnect();
    this._motionQuery?.removeEventListener?.('change', this._motionListener); document.removeEventListener('visibilitychange', this.sync);
    this._sandRenderer?.destroy(); const canvas = this.$refs.canvas; if (canvas) { canvas.width = 0; canvas.height = 0; }
  },
  methods: {
    sync() {
      if (this._disposed) return;
      cancelAnimationFrame(this._sandFrame); this._sandFrame = null;
      const canvas = this.$refs.canvas; if (!canvas || !this._sandRenderer) return;
      if (document.hidden) { canvas.width = 0; canvas.height = 0; this._sandRenderer.suspend(); return; }
      const rect = canvas.getBoundingClientRect(); this._sandSize = { width: rect.width, height: rect.height, pixelRatio: Math.min(1.5, window.devicePixelRatio || 1) };
      const width = Math.round(rect.width * this._sandSize.pixelRatio), height = Math.round(rect.height * this._sandSize.pixelRatio);
      if (width <= 0 || height <= 0) return;
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      this._sandMotion = this.animationsEnabled && !this._motionQuery?.matches; this._sandRenderer.reset();
      this.paint(performance.now());
    },
    paint(timestamp) {
      this._sandFrame = null;
      if (this._disposed || document.hidden) return;
      const context = this.$refs.canvas?.getContext('2d'); if (!context) return;
      this._sandRenderer.draw(context, timestamp, { ...this._sandSize, environment: this.environment, motion: this._sandMotion });
      if (this._sandMotion) this._sandFrame = requestAnimationFrame(this.paint);
    }
  }
};
</script>
<style scoped>
.battle-sand-layer{position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none;}
</style>
