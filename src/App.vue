<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
import { startGamepadControls } from './services/gamepad';
import { loadGamePreferences } from './services/gamePreferences';

export default {
  name: 'App',
  mounted() { this._gamepad = startGamepadControls(this.$el, loadGamePreferences()); },
  beforeDestroy() { this._gamepad?.destroy(); },
  watch: { '$route'() { this._gamepad?.reset(); } }
}
</script>

<style>
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: #080611;
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
</style>
