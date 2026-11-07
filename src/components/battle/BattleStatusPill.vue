<template><span v-if="info" class="battle-status-ailment" :class="['status-'+info.key,{'is-compact':compact}]" :title="info.label" :aria-label="info.label">{{ info.code }}</span></template>
<script>
import {getBattleStatus} from '@/services/gameView';
export default {props:{status:String,compact:Boolean},computed:{info(){return getBattleStatus(this.status);}}};
</script>
<style scoped>
/* Same status codes and palette as BattleOverlay, with a readable raid size. */
.battle-status-ailment{display:inline-flex;align-items:center;justify-content:center;min-width:38px;height:20px;padding:0 7px;border-radius:999px;font:700 10px/1 var(--journal-font);letter-spacing:.4px;color:#fff;box-shadow:inset 0 -1px #0003,0 2px 4px #0002;flex:none}.status-burn{background:linear-gradient(145deg,#ff8b42,#d94716)}.status-poison{background:linear-gradient(145deg,#ac6cff,#7336d1)}.status-badly_poison{background:linear-gradient(145deg,#9e52ff,#5f1fb8)}.status-paralyze{background:linear-gradient(145deg,#f3d44d,#b89416);color:#2d2200}.status-sleep{background:linear-gradient(145deg,#6f8bff,#415bc8)}.status-freeze{background:linear-gradient(145deg,#6ad4f7,#2788d7)}.status-corrupted{background:#7946a3}.status-other{background:#687b8c}.is-compact{min-width:24px;height:14px;padding:0 4px;font-size:7px}
</style>
