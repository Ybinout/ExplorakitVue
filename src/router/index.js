import Vue from 'vue';
import Router from 'vue-router';
import HomeMenu from '@/components/HomeMenu.vue';
import { hasAuthenticatedSession, loginDestination } from '@/services/session';

const Inscription = () => import(/* webpackChunkName: "account" */ '@/components/UserInscription.vue');
const Connexion = () => import(/* webpackChunkName: "account" */ '@/components/UserConnexion.vue');
const Game = () => import(/* webpackChunkName: "game" */ '@/components/UserMap.vue');
const Drift = () => import(/* webpackChunkName: "drift" */ '@/components/drift/DriftLobby.vue');
const TestView = () => import(/* webpackChunkName: "test-view" */ '@/components/UserTest.vue');

Vue.use(Router);

function isAuthenticated() {
  return hasAuthenticatedSession();
}

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
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
      path: '/drift',
      name: 'Drift',
      component: Drift,
      meta: { requiresAuth: true }
    },
    {
      path: '/drift/game',
      name: 'DriftGame',
      component: Game,
      meta: { requiresAuth: true }
    },
    { path: '/colosseum', name: 'Colosseum', component: () => import(/* webpackChunkName: "colosseum" */ '@/components/drift/ColosseumLobby.vue'), meta: { requiresAuth: true } },
    { path: '/colosseum/game', name: 'ColosseumGame', component: Game, meta: { requiresAuth: true } },
    { path: '/dresseurs', name: 'Trainers', component: () => import(/* webpackChunkName: "community" */ '@/components/social/TrainerCommunity.vue'), meta: { requiresAuth: true } },
    { path: '/classements', name: 'Rankings', component: () => import(/* webpackChunkName: "community" */ '@/components/social/TrainerCommunity.vue'), meta: { requiresAuth: true } },
    { path: '/profil/:id', name: 'TrainerProfile', component: () => import(/* webpackChunkName: "community" */ '@/components/social/TrainerCommunity.vue'), meta: { requiresAuth: true } },
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
    return next({ path: '/connexion', query: { redirect: to.path.startsWith('/profil/') || ['/dresseurs','/classements'].includes(to.path) ? loginDestination(to.fullPath) : to.path.startsWith('/colosseum') ? '/colosseum' : to.path.startsWith('/drift') ? '/drift' : '/game' } });
  }
  return next();
});

export default router;
