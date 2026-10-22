<template><canvas ref="canvas" class="battle-snow-layer" data-battle-snow aria-hidden="true"></canvas></template>
<script>
import { BattleSnowRenderer } from '@/services/battleSnow';
export default {
  props: { animationsEnabled: { type: Boolean, default: true }, environment: { type: String, default: 'grass' } },
  watch: { animationsEnabled() { this.sync(); }, environment() { this.sync(); } },
  mounted() {
    this._snowRenderer = new BattleSnowRenderer();
    this._motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    this._motionListener = () => this.sync(); this._motionQuery?.addEventListener?.('change', this._motionListener);
    document.addEventListener('visibilitychange', this.sync);
    this._resizeObserver = new ResizeObserver(this.sync); this._resizeObserver.observe(this.$refs.canvas);
    this.sync();
  },
  beforeDestroy() {
    this._disposed = true; cancelAnimationFrame(this._snowFrame); this._resizeObserver?.disconnect();
    this._motionQuery?.removeEventListener?.('change', this._motionListener); document.removeEventListener('visibilitychange', this.sync);
    this._snowRenderer?.destroy(); const canvas = this.$refs.canvas; if (canvas) { canvas.width = 0; canvas.height = 0; }
  },
  methods: {
    sync() {
      if (this._disposed) return;
      cancelAnimationFrame(this._snowFrame); this._snowFrame = null;
      const canvas = this.$refs.canvas; if (!canvas || !this._snowRenderer) return;
      if (document.hidden) { canvas.width = 0; canvas.height = 0; this._snowRenderer.reset(); return; }
      const rect = canvas.getBoundingClientRect(); this._snowSize = { width: rect.width, height: rect.height, pixelRatio: Math.min(1.5, window.devicePixelRatio || 1) };
      const width = Math.round(rect.width * this._snowSize.pixelRatio), height = Math.round(rect.height * this._snowSize.pixelRatio);
      if (width <= 0 || height <= 0) return;
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      this._snowMotion = this.animationsEnabled && !this._motionQuery?.matches; this._snowRenderer.reset();
      this.paint(performance.now());
    },
    paint(timestamp) {
      this._snowFrame = null;
      if (this._disposed || document.hidden) return;
      const context = this.$refs.canvas?.getContext('2d'); if (!context) return;
      this._snowRenderer.draw(context, timestamp, { ...this._snowSize, environment: this.environment, motion: this._snowMotion });
      if (this._snowMotion) this._snowFrame = requestAnimationFrame(this.paint);
    }
  }
};
</script>
<style scoped>
.battle-snow-layer{position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none;background:linear-gradient(180deg,#466c8b20,#b9d8e70a 65%,#d0e9f00d);}
</style>
