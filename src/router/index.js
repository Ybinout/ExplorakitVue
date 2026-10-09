import Vue from 'vue';
import Router from 'vue-router';
import HomeMenu from '@/components/HomeMenu.vue';
import { hasAuthenticatedSession } from '@/services/session';

const Inscription = () => import(/* webpackChunkName: "account" */ '@/components/UserInscription.vue');
const Connexion = () => import(/* webpackChunkName: "account" */ '@/components/UserConnexion.vue');
const Game = () => import(/* webpackChunkName: "game" */ '@/components/UserMap.vue');
const TestView = () => import(/* webpackChunkName: "test-view" */ '@/components/UserTest.vue');

Vue.use(Router);

function isAuthenticated() {
  return hasAuthenticatedSession();
}

const router = new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Home',
      component: HomeMenu
    },
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
      component: Game,
      meta: { requiresAuth: true }
    },
    {
      path: '/test',
      name: 'test',
      component: TestView
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
});

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated()) {
    return next('/connexion');
  }
  return next();
});

export default router;
