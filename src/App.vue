<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>


export default {
  name: 'App',
  components: {
  }
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
