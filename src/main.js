import Vue from 'vue';
import App from './App.vue';
import { initializePwa } from './services/pwa';
import './styles/field-journal.css';
import router from './router/index';  // Importez le routeur que vous venez de créer

Vue.prototype.$assetBase = process.env.BASE_URL;
Vue.config.productionTip = false;

initializePwa();

new Vue({
  render: h => h(App),
  router  // Ajoutez cette ligne
}).$mount('#app');
