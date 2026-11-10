<template>
  <div id="app">
    <router-view :patch-notice-open="patchNoticeOpen" @patch-notice-ready="patchNoticeReady = $event" @patch-notice-check="patchNoticeCheck++"></router-view>
    <patch-notes :allowed="patchNoticeAllowed" :check="patchNoticeCheck" @visibility="patchNoticeOpen = $event" />
  </div>
</template>

<script>
import { startGamepadControls } from './services/gamepad';
import { loadGamePreferences } from './services/gamePreferences';
import PatchNotes from './components/menu/PatchNotes.vue';

export default {
  name: 'App',
  components: { PatchNotes },
  data: () => ({ patchNoticeOpen: false, patchNoticeReady: false, patchNoticeCheck: 0 }),
  computed: {
    patchNoticeAllowed() {
      if (['Connexion', 'Inscription', 'test'].includes(this.$route.name)) return false;
      return !['Game', 'DriftGame', 'ColosseumGame'].includes(this.$route.name) || this.patchNoticeReady;
    }
  },
  mounted() {
    this._gamepad = startGamepadControls(this.$el, loadGamePreferences());
    // Safari can ignore viewport zoom limits. Cancel only its native gestures;
    // pointer events still drive the minimap's own pinch and drag controls.
    this._mobileZoomGuard = event => {
      if (window.matchMedia('(any-pointer: coarse)').matches && event.cancelable) event.preventDefault();
    };
    for (const type of ['gesturestart', 'gesturechange']) document.addEventListener(type, this._mobileZoomGuard, { passive:false });
  },
  beforeDestroy() {
    this._gamepad?.destroy();
    for (const type of ['gesturestart', 'gesturechange']) document.removeEventListener(type, this._mobileZoomGuard);
  },
  watch: { '$route'(to, from) { if (to.name !== from.name) this.patchNoticeReady = false; this._gamepad?.reset(); } }
}
</script>

<style>
@media (hover: hover) and (pointer: fine) {
  #app :is(.battle,.raid-battle,.double-battle) [data-keyboard-number] { position:relative; }
  #app :is(.battle,.raid-battle,.double-battle) [data-keyboard-number]::after {
    content:attr(data-keyboard-number); position:absolute; top:3px; right:5px;
    display:grid; place-items:center; min-width:16px; height:16px; padding:0 3px;
    border-radius:5px; background:rgba(10,29,42,.67); color:#fff; font:700 10px/1 sans-serif;
    pointer-events:none;
  }
  #app .keyboard-battle-focus:focus { outline:3px solid #a6e2ff !important; outline-offset:2px; }
}
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: #080611;
}

/* Keep native scrolling, while page pinch/double-tap zoom is disabled. */
html,
body,
#app {
  touch-action: pan-x pan-y;
}

button,
input {
  font: inherit;
}

#app .gamepad-focus:focus {
  outline: 3px solid var(--journal-accent, #397da4);
  outline-offset: 3px;
  box-shadow: 0 0 0 5px var(--journal-paper, #edf5fc);
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  /* margin-top: 60px; */
  /* background-color: red; */

}

/* Keep text editing and copy/paste available in forms and chat. */
#app input,
#app textarea,
#app [contenteditable="true"],
#app [contenteditable=""],
#app [contenteditable="plaintext-only"] {
  -webkit-user-select: text;
  user-select: text;
  -webkit-touch-callout: default;
}

/* Small fields trigger automatic focus zoom on iPhone. */
@media (any-pointer: coarse) {
  #app input,
  #app textarea,
  #app select {
    font-size: 16px !important;
  }
}
</style>
