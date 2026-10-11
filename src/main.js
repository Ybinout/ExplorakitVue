import Vue from 'vue';
import App from './App.vue';
import router from './router/index';  // Importez le routeur que vous venez de créer

Vue.prototype.$assetBase = process.env.BASE_URL;
Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
  router  // Ajoutez cette ligne
}).$mount('#app');
