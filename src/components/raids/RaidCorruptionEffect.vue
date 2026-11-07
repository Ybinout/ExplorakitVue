<template><canvas ref="canvas" class="raid-corruption-fx" aria-hidden="true"/></template>
<script>
// Burst-only overlay: bounded particles, no idle RAF and no full-screen filters.
export default {
  props: {
    event: Object,
    reduced: Boolean
  },
  watch: {
    event() {
      this.begin();
    }
  },
  mounted() {
    this.begin();
  },
  beforeDestroy() {
    cancelAnimationFrame(this._raf);
  },
  methods: {
    begin() {
      cancelAnimationFrame(this._raf);
      if (!this.event || this.reduced) return;
      const c = this.$refs.canvas,
        stage = c.parentElement,
        w = stage.clientWidth,
        h = stage.clientHeight,
        dpr = Math.min(1.5, devicePixelRatio || 1);
      c.width = w * dpr;
      c.height = h * dpr;
      c.style.width = w + 'px';
      c.style.height = h + 'px';
      const ctx = c.getContext('2d');
      ctx.scale(dpr, dpr);
      const e = this.event,
        burst = e.kind === 'shieldBreak',
        saved = e.kind === 'friendship',
        count = w < 640 ? 24 : 40;
      const shards = Array.from({
        length: count
      }, (_, i) => ({
        a: i * 2.399 + Math.random() * .4,
        r: 25 + Math.random() * 75,
        size: 2 + Math.random() * 5,
        spin: Math.random() * 6 - 3,
        delay: Math.random() * .15
      }));
      const started = performance.now();
      const draw = now => {
        const t = (now - started) / 900;
        ctx.clearRect(0, 0, w, h);
        if (t >= 1 || document.hidden) return;
        const p = e.point || {
          x: w * .75,
          y: h * .5
        };
        ctx.save();
        ctx.translate(p.x, p.y);
        for (const s of shards) {
          const progress = Math.max(0, Math.min(1, (t - s.delay) / .85)),
            f = 1 - Math.pow(1 - progress, 3),
            radius = burst ? s.r * f : s.r * (1 - f),
            x = Math.cos(s.a) * radius,
            y = Math.sin(s.a) * radius * .8 + (burst ? 24 * progress * progress : 0);
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(s.spin + progress * 3);
          ctx.globalAlpha = Math.sin(progress * Math.PI) * .9;
          ctx.fillStyle = saved ? '#ffe9a9' : s.size > 5 ? '#e7d7ff' : '#ab7bdb';
          ctx.beginPath();
          ctx.moveTo(0, -s.size);
          ctx.lineTo(s.size * .55, s.size * .7);
          ctx.lineTo(-s.size * .7, s.size * .45);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        if (burst && t < .35) {
          ctx.strokeStyle = '#e9dafa';
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 1 - t / .35;
          for (let i = 0; i < 9; i++) {
            const a = i * 2.399;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
            ctx.lineTo(Math.cos(a + .14) * 36, Math.sin(a + .14) * 36);
            ctx.lineTo(Math.cos(a - .05) * 60, Math.sin(a - .05) * 60);
            ctx.stroke();
          }
        }
        ctx.restore();
        this._raf = requestAnimationFrame(draw);
      };
      this._raf = requestAnimationFrame(draw);
    }
  }
};
</script>
<style scoped>.raid-corruption-fx{position:absolute;inset:0;z-index:60;pointer-events:none;image-rendering:auto}</style>
