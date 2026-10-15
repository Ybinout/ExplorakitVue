<template>
  <div class="experience-strip" :title="`${progress.remaining} XP avant le niveau ${Number(pokemon.level) + 1}`">
    <span class="experience-label">EXP</span>
    <div class="experience-track" role="progressbar" aria-label="Expérience vers le prochain niveau"
      :aria-valuenow="Math.round(visiblePercent)" aria-valuemin="0" aria-valuemax="100"
      :aria-valuetext="playbackPercent === null ? `${progress.earned} sur ${progress.needed} XP` : `${Math.round(visiblePercent)} % du niveau`">
      <div class="experience-fill" :style="{ width: `${visiblePercent}%`, transition: playbackPercent === null ? undefined : 'none' }"></div>
    </div>
    <span v-if="detailed" class="experience-count">{{ progress.earned }} / {{ progress.needed }}</span>
  </div>
</template>
<script>
import { experienceProgress } from '@/services/pokemonProgress';
export default {
  props: { pokemon: { type: Object, required: true }, detailed: Boolean, playbackPercent: { type: Number, default: null } },
  computed: {
    progress() { return experienceProgress(this.pokemon); },
    visiblePercent() { return this.playbackPercent ?? this.progress.percent; }
  }
};
</script>
<style scoped>
.experience-strip { display:flex; align-items:center; gap:7px; min-width:0; margin-top:7px; }
.experience-label { color:#3774a4; font:bold 9px Arial,sans-serif; letter-spacing:1px; }
.experience-track { flex:1; height:5px; overflow:hidden; border-radius:4px; background:#cbd6dc; box-shadow:inset 0 1px 2px #172d4940; }
.experience-fill { height:100%; background:linear-gradient(90deg,#2784df,#71d3ff); transition:width .8s ease; }
.experience-count { font:10px Arial,sans-serif; color:#526279; }
@media(prefers-reduced-motion:reduce) { .experience-fill { transition:none; } }
.reduced-game-motion .experience-fill { transition:none; }
</style>
