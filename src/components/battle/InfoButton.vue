<template>
 <button type="button" class="game-info-button" v-bind="$attrs" v-on="$listeners"><span aria-hidden="true">i</span></button>
</template>
<script>
export default {inheritAttrs:false};
</script>
<style scoped>
/* A small silver face, with a generous transparent touch target. */
.game-info-button{display:inline-grid!important;place-items:center!important;flex:none;box-sizing:border-box;width:36px!important;height:36px!important;min-width:36px!important;min-height:36px!important;max-width:44px;padding:0!important;margin:0;border:0!important;border-radius:50%!important;background:transparent!important;color:#536274!important;box-shadow:none!important;cursor:pointer;line-height:1!important;touch-action:manipulation}
.game-info-button>span{display:grid;place-items:center;box-sizing:border-box;width:24px;height:24px;border:1px solid #b9c5d0;border-radius:50%;background:linear-gradient(150deg,#fff 5%,#eff3f6 55%,#dce4eb);box-shadow:inset 0 1px 0 #fff,0 1px 3px #17263724;color:#536274;font:italic 600 16px/1 Georgia,serif;text-shadow:0 1px #fff;transition:border-color .15s ease,box-shadow .15s ease}
.game-info-button:focus-visible{outline:none!important}.game-info-button:focus-visible>span{outline:2px solid var(--journal-accent,#618597);outline-offset:3px}.game-info-button[aria-expanded=true]>span{border-color:#8399aa;box-shadow:inset 0 1px 3px #40576b24}
@media(hover:hover){.game-info-button:hover>span{border-color:#829bab;box-shadow:inset 0 1px #fff,0 2px 5px #17263733}}
@media(pointer:coarse){.game-info-button{width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important}}
@media(prefers-reduced-motion:reduce){.game-info-button>span{transition:none}}
</style>
