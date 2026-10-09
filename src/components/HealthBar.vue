<template>
  <div
    class="health-bar-container"
    role="progressbar"
    :aria-label="`Points de vie : ${safeCurrent} sur ${safeMax}`"
    :aria-valuemin="0"
    :aria-valuemax="safeMax"
    :aria-valuenow="safeCurrent"
  >
    <div class="health-bar-trail" :style="trailStyle"></div>
    <div class="health-bar" :style="healthBarStyle"></div>
  </div>
</template>

<script>
export default {
  props: {
    currentHp: {
      type: [Number, String],
      default: 0
    },
    hpMax: {
      type: [Number, String],
      default: 1
    }
  },
  data() {
    return {
      trailPercentage: 100,
      trailTimer: null
    };
  },
  computed: {
    safeMax() {
      return Number(this.hpMax) > 0 ? Number(this.hpMax) : 1;
    },
    safeCurrent() {
      return Math.max(0, Math.min(this.safeMax, Number(this.currentHp) || 0));
    },
    percentage() {
      return Math.max(0, Math.min(100, (this.safeCurrent / this.safeMax) * 100));
    },
    healthBarStyle() {
      const color = this.getHealthBarColor(this.percentage);
      return {
        width: `${this.percentage}%`,
        background: `linear-gradient(90deg, ${color.start}, ${color.end})`
      };
    },
    trailStyle() {
      return { width: `${this.trailPercentage}%` };
    }
  },
  watch: {
    percentage: {
      immediate: true,
      handler(nextPercentage, previousPercentage) {
        if (this.trailTimer) {
          clearTimeout(this.trailTimer);
          this.trailTimer = null;
        }

        if (!Number.isFinite(previousPercentage) || nextPercentage >= previousPercentage) {
          this.trailPercentage = nextPercentage;
          return;
        }

        this.trailTimer = setTimeout(() => {
          this.trailPercentage = nextPercentage;
          this.trailTimer = null;
        }, 420);
      }
    }
  },
  beforeDestroy() {
    if (this.trailTimer) clearTimeout(this.trailTimer);
  },
  methods: {
    getHealthBarColor(percentage) {
      if (percentage > 50) return { start: '#64e16a', end: '#2cb55b' };
      if (percentage > 20) return { start: '#f4d35e', end: '#e6a13b' };
      return { start: '#ff6e6e', end: '#d14444' };
    }
  }
};
</script>

<style scoped>
.health-bar-container {
  position: relative;
  width: 100%;
  height: 14px;
  background: rgba(11, 17, 31, 0.26);
  border: 1px solid rgba(16, 20, 34, 0.4);
  border-radius: 999px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
}

.health-bar,
.health-bar-trail {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 999px;
}

.health-bar-trail {
  background: #f7c94d;
  transition: width 0.55s ease 0.05s;
}

.health-bar {
  z-index: 1;
  transition: width 0.42s cubic-bezier(0.22, 0.8, 0.3, 1), background 0.35s ease;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

@media (prefers-reduced-motion: reduce) {
  .health-bar,
  .health-bar-trail {
    transition-duration: 0.01ms;
    transition-delay: 0ms;
  }
}
</style>
