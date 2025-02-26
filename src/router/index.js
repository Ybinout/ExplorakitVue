import Vue from 'vue';
import Router from 'vue-router';
import Inscription from '@/components/UserInscription.vue';
import Connexion from '@/components/UserConnexion.vue';
import test from '@/components/UserTest.vue';
import Game from '@/components/UserMap.vue';

Vue.use(Router);

export default new Router({
  mode: 'history',  // Utilise le mode HTML5 History API. Retirez cette ligne si vous préférez le mode hash (#).
  routes: [
    {
      path: '/inscription',
      name: 'Inscription',
      component: Inscription
    },
    {
      path: '/connexion',
      name: 'Connexion',
      component: Connexion
    },
    {
      path: '/game',
      name: 'Game',
      component: Game
    },
    {
      path: '/test',
      name: 'test',
      component: test
    }
  ]
});
