import Vue from 'vue';
import {OverlayBackStack,backDirective} from './services/overlayBackStack';
import App from './App.vue';
import { initializePwa } from './services/pwa';
import './styles/field-journal.css';
import { loadGamePreferences } from './services/gamePreferences';
import { applyGameTheme } from './services/gameTheme';
import router from './router/index';  // Importez le routeur que vous venez de créer
import { pokemonSprite, pokemonSpriteFallback, setPokemonSpriteMotion } from './services/pokemonSprites';

Vue.prototype.$assetBase = process.env.BASE_URL;
Vue.prototype.$pokemonSprite = pokemonSprite;
document.addEventListener('error', pokemonSpriteFallback, true);
Vue.config.productionTip = false;
Vue.directive('back',backDirective(new OverlayBackStack(window)));

applyGameTheme(loadGamePreferences());
setPokemonSpriteMotion(loadGamePreferences());
window.addEventListener('riftmon:preferences', event=>setPokemonSpriteMotion(event.detail));
initializePwa();

new Vue({
  render: h => h(App),
  router  // Ajoutez cette ligne
}).$mount('#app');
