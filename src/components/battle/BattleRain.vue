<template><canvas ref="canvas" class="battle-rain-layer" data-battle-rain aria-hidden="true"></canvas></template>
<script>
import { BattleRainRenderer } from '@/services/battleRain';
export default {
  props: { animationsEnabled: { type: Boolean, default: true }, environment: { type: String, default: 'grass' } },
  watch: { animationsEnabled() { this.sync(); }, environment() { this.sync(); } },
  mounted() {
    this._rainRenderer = new BattleRainRenderer();
    this._motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    this._motionListener = () => this.sync(); this._motionQuery?.addEventListener?.('change', this._motionListener);
    document.addEventListener('visibilitychange', this.sync);
    this._resizeObserver = new ResizeObserver(this.sync); this._resizeObserver.observe(this.$refs.canvas);
    this.sync();
  },
  beforeDestroy() {
    this._disposed = true; cancelAnimationFrame(this._rainFrame); this._resizeObserver?.disconnect();
    this._motionQuery?.removeEventListener?.('change', this._motionListener); document.removeEventListener('visibilitychange', this.sync);
    this._rainRenderer?.destroy(); const canvas = this.$refs.canvas; if (canvas) { canvas.width = 0; canvas.height = 0; }
  },
  methods: {
    sync() {
      if (this._disposed) return;
      cancelAnimationFrame(this._rainFrame); this._rainFrame = null;
      const canvas = this.$refs.canvas; if (!canvas || !this._rainRenderer) return;
      if (document.hidden) { canvas.width = 0; canvas.height = 0; this._rainRenderer.reset(); return; }
      const rect = canvas.getBoundingClientRect(); this._rainSize = { width: rect.width, height: rect.height, pixelRatio: Math.min(1.5, window.devicePixelRatio || 1) };
      const width = Math.round(rect.width * this._rainSize.pixelRatio), height = Math.round(rect.height * this._rainSize.pixelRatio);
      if (width <= 0 || height <= 0) return;
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      this._rainMotion = this.animationsEnabled && !this._motionQuery?.matches; this._rainRenderer.reset();
      this.paint(performance.now());
    },
    paint(timestamp) {
      this._rainFrame = null;
      if (this._disposed || document.hidden) return;
      const context = this.$refs.canvas?.getContext('2d'); if (!context) return;
      this._rainRenderer.draw(context, timestamp, { ...this._rainSize, environment: this.environment, motion: this._rainMotion });
      if (this._rainMotion) this._rainFrame = requestAnimationFrame(this.paint);
    }
  }
};
</script>
<style scoped>
.battle-rain-layer{position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none;background:linear-gradient(180deg,#16314918,#152d3a0b);}
</style>
