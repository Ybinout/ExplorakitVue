<template>
  <drift-lobby v-if="isLoggedIn" @logout="syncAuthState" />
  <main v-else class="home-menu">
    <section class="welcome" aria-labelledby="home-title">
      <p class="kicker">UNE ÉQUIPE. UNE VIE. TA LÉGENDE.</p>
      <h1 id="home-title">Rift<span>Mon</span><i aria-hidden="true">✦</i></h1>
      <p class="tagline">Le monde t’attend.<br /><strong>Tes prochains rivaux aussi.</strong></p>
      <div class="companions" aria-hidden="true">
        <span class="rift-ring"></span>
        <img class="companion-left" :src="$assetBase + 'img/pokemon/front/280.png'" alt="" />
        <img class="companion-center" :src="$assetBase + 'img/pokemon/front/133.png'" alt="" />
        <img class="companion-right" :src="$assetBase + 'img/pokemon/front/25.png'" alt="" />
      </div>
      <p class="pitch">Explore, compose ton équipe et affronte les survivants.<br />De 2 à 16 dresseurs, jusqu’à cinq heures d’aventure.</p>
      <div class="home-actions">
        <router-link class="main-action" to="/connexion">Se connecter <span aria-hidden="true">→</span></router-link>
        <router-link class="secondary-action" to="/inscription">Créer mon dresseur</router-link>
      </div>
      <p class="solo-note">L’Aventure solo t’attend aussi au camp.</p>
    </section>
    <footer>Fan game privé · Une aventure créée entre amis</footer>
  </main>
</template>

<script>
import { getSession } from '@/services/session';

export default {
  name: 'HomeMenu',
  components: { DriftLobby: () => import(/* webpackChunkName: "drift" */ './drift/DriftLobby.vue') },
  data() { return { isLoggedIn: false }; },
  created() {
    this.syncAuthState();
    window.addEventListener('storage', this.syncAuthState);
  },
  beforeDestroy() { window.removeEventListener('storage', this.syncAuthState); },
  methods: {
    syncAuthState() {
      const user = getSession();
      this.isLoggedIn = Boolean(user?.id && user?.token);
    }
  }
};
</script>

<style scoped>
.home-menu { box-sizing: border-box; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 50px 24px 24px; color: #f7f0df; background: radial-gradient(ellipse at 50% 30%, #247bd35c, transparent 62%), linear-gradient(135deg, #071c34f5, #163e63eb), url('~@/assets/backgroundmenu.webp') center/cover; font-family: 'Trebuchet MS', Arial, sans-serif; }
.welcome { width: min(580px, 100%); text-align: center; }.kicker { margin: 0 0 15px; color: #a0cce9; font-size: 10px; font-weight: 700; letter-spacing: .22em; }h1 { position: relative; width: fit-content; margin: auto; color: #8cccff; font: 700 clamp(62px, 14vw, 108px)/1 Georgia, serif; letter-spacing: -.055em; text-shadow: 0 5px #091b3080, 0 0 50px #52a7ff38; }h1 span { color: #d5ecff; }h1 i { position: absolute; right: -22px; top: -6px; color: #e7c886; font: 24px Georgia, serif; }.tagline { margin: 19px 0 0; color: #a6bfd3; font-size: 16px; line-height: 1.6; }.tagline strong { color: #f7f0df; font-weight: 400; }.companions { position: relative; height: 215px; width: 330px; max-width: 100%; margin: 0 auto; }.rift-ring { position: absolute; width: 190px; height: 170px; top: 25px; left: calc(50% - 95px); border: 1px solid #7cc3fa40; border-radius: 50%; box-shadow: 0 0 0 12px #79bdff09, inset 0 0 40px #63b5ff19; transform: rotate(-15deg); }.companions img { position: absolute; width: 125px; height: 125px; object-fit: contain; image-rendering: pixelated; filter: drop-shadow(0 12px 7px #0414257a); }.companions .companion-left { left: 0; top: 28px; }.companions .companion-right { right: 0; top: 33px; }.companions .companion-center { width: 155px; height: 155px; top: 60px; left: calc(50% - 77px); }.pitch { margin: 6px 0 25px; color: #b8cfdf; font-size: 13px; line-height: 1.8; }.home-actions { display: grid; gap: 11px; max-width: 350px; margin: auto; }.home-actions a { display: flex; align-items: center; justify-content: center; gap: 20px; min-height: 49px; padding: 5px 20px; border: 1px solid #86bce3; border-radius: 10px 4px 10px 4px; color: #eff7ff; font-weight: 700; font-size: 14px; text-decoration: none; }.home-actions .main-action { background: linear-gradient(#3687c6, #225f96); box-shadow: inset 0 -3px #0e375955, 0 8px 20px #03142640; }.home-actions .secondary-action { border-color: #adc1c754; background: #102b435c; color: #d1e1eb; }.home-actions a:focus-visible { outline: 3px solid #ecd69c; outline-offset: 4px; }.home-actions a:hover { filter: brightness(1.15); }.solo-note { margin: 19px 0 0; color: #8fabbe; font-size: 11px; }footer { margin-top: 40px; color: #7998af; font-size: 10px; }
@media (max-width: 420px) { .home-menu { padding-top: 40px; }.kicker { font-size: 8px; letter-spacing: .14em; }.companions { height: 185px; }.companions .companion-center { top: 36px; }.companions .companion-left { top: 15px; }.companions .companion-right { top: 18px; }.pitch { font-size: 12px; }.tagline { font-size: 14px; }footer { margin-top: 30px; } }
@media (max-height: 600px) and (min-width: 600px) { .home-menu { padding-top: 25px; }h1 { font-size: 66px; }.companions { height: 130px; }.companions img { width: 90px; height: 90px; }.companions .companion-center { width: 115px; height: 115px; top: 18px; left: calc(50% - 57px); }.rift-ring { width: 150px; height: 110px; top: 10px; left: calc(50% - 75px); }.tagline { margin-top: 12px; }.pitch { margin-bottom: 15px; }footer { margin-top: 20px; } }
</style>
