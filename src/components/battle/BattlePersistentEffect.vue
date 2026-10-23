<template>
  <div class="persistent-move" :class="{'is-reduced':reduced}" aria-hidden="true">
    <transition name="barrier"><svg v-if="effects.shield" class="persistent-shield" data-battle-shield viewBox="0 0 100 110"><path d="M50 4 90 22 86 65 Q76 92 50 105 Q24 92 14 65 L10 22Z" fill="#b8edff33" stroke="#a7edff" stroke-width="3"/><path d="M50 16 77 29 73 64 Q65 81 50 92" fill="none" stroke="#eaffff" opacity=".8" stroke-width="2"/></svg></transition>
    <transition name="decoy"><svg v-if="effects.clone" class="persistent-clone" data-battle-clone viewBox="0 0 90 95"><ellipse cx="45" cy="86" rx="32" ry="6" fill="#102e3744"/><path d="M20 35 16 12 35 26 Q45 22 54 26 L73 12 69 37 Q80 49 74 69 L80 82 61 84 Q45 91 28 84 L10 82 18 66 Q11 49 20 35Z" fill="#70b69b" stroke="#244c48" stroke-width="3" stroke-linejoin="round"/><ellipse cx="45" cy="65" rx="18" ry="20" fill="#e3edc1"/><path d="M28 42h7m20 0h7M37 52q8 6 16 0" fill="none" stroke="#244c48" stroke-width="3" stroke-linecap="round"/></svg></transition>
  </div>
</template>
<script>
export default {props:{effects:Object,reduced:Boolean}};
</script>
<style scoped>
.persistent-move{position:absolute;transform:translate(-50%,-50%);pointer-events:none;z-index:56}
.persistent-shield{position:absolute;inset:-15%;width:130%;height:130%;filter:drop-shadow(0 0 4px #8cdcef55)}
.persistent-clone{position:absolute;bottom:-8%;left:10%;width:80%;height:80%;filter:drop-shadow(0 3px 1px #102e3744)}
.barrier-enter-active,.barrier-leave-active{transition:opacity .3s,transform .3s}.barrier-enter,.barrier-leave-to{opacity:0;transform:scale(1.2)}
.decoy-enter-active{transition:opacity .3s,transform .3s}.decoy-enter{opacity:0;transform:scale(.5)}
.decoy-leave-active{animation:decoy-break .45s ease-out both}
@keyframes decoy-break{30%{transform:translateX(-5px);opacity:.9}60%{transform:translateX(5px) scale(1.12);opacity:.6}to{transform:translateY(12px) scale(.4);opacity:0}}
.is-reduced *{animation:none!important;transition:none!important}
</style>
