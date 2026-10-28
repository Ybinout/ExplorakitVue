<template>
  <div class="adventure-opening" :class="[phase, { reduced }]" data-adventure-opening :data-phase="phase" role="status" aria-live="polite" aria-busy="true">
    <span class="opening-accessible">{{ language === 'en' ? 'Your adventure begins…' : 'Ton aventure commence…' }}</span>
  </div>
</template>

<script>
export default {
  props: { ready: Boolean, reduced: Boolean, language: { type: String, default: 'fr' } },
  data: () => ({ phase: 'cover', covered: false }),
  watch: { ready() { this.reveal(); } },
  mounted() {
    this.onVisibility = () => { if (!document.hidden) this.reveal(); };
    document.addEventListener('visibilitychange', this.onVisibility);
    this.timer = setTimeout(() => { this.covered = true; this.phase = 'black'; this.reveal(); }, this.reduced ? 0 : 500);
  },
  beforeDestroy() { clearTimeout(this.timer); document.removeEventListener('visibilitychange', this.onVisibility); },
  methods: {
    reveal() {
      if (!this.ready || !this.covered || document.hidden || this.phase !== 'black') return;
      this.phase = 'hold';
      this.timer = setTimeout(() => {
        if (!this.ready || document.hidden) { this.phase = 'black'; return; }
        this.phase = 'reveal';
        this.timer = setTimeout(() => {
          if (document.hidden) { this.phase = 'black'; return; }
          this.phase = 'done'; this.$emit('finished');
        }, this.reduced ? 0 : 1400);
      }, 650);
    }
  }
};
</script>

<style scoped>
.adventure-opening { position:fixed; inset:0; z-index:20000; background:#000; pointer-events:auto; }
.cover { animation:opening-cover .5s ease-out both; }
.reveal { animation:opening-reveal 1.4s ease-in-out both; }
.done { opacity:0; }
.reduced { animation:none; }
.opening-accessible { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
@keyframes opening-cover { from { opacity:0; } to { opacity:1; } }
@keyframes opening-reveal { from { opacity:1; } to { opacity:0; } }
</style>
