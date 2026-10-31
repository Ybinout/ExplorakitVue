<template>
  <div class="teleporter-charge-notice" :class="{'is-in-battle':inBattle,'is-complete':charge===5}" data-teleporter-charge role="status" aria-live="polite" aria-atomic="true">
    <bag-item-icon pocket="key" item-key="void_teleporter" aria-hidden="true"/>
    <div><strong>{{ language==='en' ? `Teleporter charged to ${charge}/5` : `Téléporteur chargé à ${charge}/5` }}</strong><span class="charge-segments" aria-hidden="true"><i v-for="n in 5" :key="n" :class="{charged:n<=charge}"></i></span></div>
  </div>
</template>
<script>
import BagItemIcon from './BagItemIcon.vue';
export default {components:{BagItemIcon},props:{charge:{type:Number,required:true},inBattle:Boolean,language:String}};
</script>
<style scoped>
.teleporter-charge-notice{position:absolute;z-index:80;left:50%;top:calc(var(--game-toolbar-height,64px) + 12px);transform:translateX(-50%);display:flex;align-items:center;gap:9px;width:max-content;max-width:calc(100% - 24px);padding:10px 14px;border:1px solid #a598c4;border-radius:12px;background:var(--journal-card,#edf5fc);color:var(--journal-heading,#294453);box-shadow:0 4px 15px #101b3430;pointer-events:none;font:600 12px/1.4 var(--journal-font,sans-serif);animation:charge-arrival .22s ease-out}
.teleporter-charge-notice.is-in-battle{top:calc(var(--game-toolbar-height,64px) + 25%)}
.teleporter-charge-notice>.bag-object-icon{width:32px;height:32px;flex:none}.teleporter-charge-notice>div{min-width:0}.teleporter-charge-notice strong{font-weight:700}.charge-segments{display:flex;gap:4px;margin-top:6px}.charge-segments i{height:4px;flex:1;border-radius:3px;background:var(--journal-border,#cedbe8)}.charge-segments i.charged{background:#a888d7}.is-complete .charge-segments i.charged{background:#789f8a}
@keyframes charge-arrival{from{opacity:0;transform:translate(-50%,6px)}to{opacity:1;transform:translate(-50%,0)}}
@media(prefers-reduced-motion:reduce){.teleporter-charge-notice{animation:none}}
</style>
