<template>
  <main class="home-menu">
    <div class="ambient ambient-one"></div>
    <div class="ambient ambient-two"></div>

    <section class="hero">
      <p class="kicker">UN MONDE À EXPLORER ENSEMBLE</p>
      <h1>Explora<span>kit</span></h1>
      <p class="tagline">Pars sur les traces de ta sœur, forme une équipe unique et affronte les dresseurs qui se dressent sur ta route.</p>

      <div class="feature-row" aria-label="Fonctionnalités principales">
        <span>Monde partagé</span>
        <span>Combats tactiques</span>
        <span>Progression infinie</span>
      </div>

      <div v-if="isLoggedIn" class="player-card">
        <div class="online-dot"></div>
        <div>
          <small>PARTIE DISPONIBLE</small>
          <strong>{{ username }}</strong>
        </div>
      </div>

      <div class="home-actions">
        <button v-if="isLoggedIn" class="main-action" @click="goTo('/game')">
          Continuer l’aventure <span>→</span>
        </button>
        <button v-else class="main-action" @click="goTo('/inscription')">
          Commencer l’aventure <span>→</span>
        </button>

        <button v-if="!isLoggedIn" class="secondary-action" @click="goTo('/connexion')">J’ai déjà une partie</button>
        <button v-else class="secondary-action" @click="logout">Changer de dresseur</button>
      </div>
    </section>

    <footer>Fan game privé · Une aventure créée entre amis</footer>
  </main>
</template>

<script>
import { clearSession, getSession } from '@/services/session';

export default {
  name: 'HomeMenu',
  data() {
    return { isLoggedIn: false, username: '' };
  },
  created() {
    this.syncAuthState();
    window.addEventListener('storage', this.syncAuthState);
  },
  beforeDestroy() {
    window.removeEventListener('storage', this.syncAuthState);
  },
  methods: {
    syncAuthState() {
      try {
        const user = getSession();
        this.isLoggedIn = Boolean(user?.id && user?.token);
        this.username = this.isLoggedIn ? user.username : '';
      } catch (error) {
        clearSession();
        this.isLoggedIn = false;
        this.username = '';
      }
    },
    goTo(path) { this.$router.push(path); },
    logout() {
      clearSession();
      this.syncAuthState();
    }
  }
};
</script>

<style scoped>
.home-menu { position: relative; min-height: 100vh; box-sizing: border-box; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 50px 24px 26px; color: white; background: linear-gradient(90deg, rgba(4, 4, 17, .9) 0%, rgba(11, 7, 29, .63) 50%, rgba(7, 5, 22, .35) 100%), url("~@/assets/backgroundmenu.webp") center/cover; isolation: isolate; }
.home-menu::after { content: ''; position: absolute; inset: 0; z-index: -1; background: linear-gradient(0deg, rgba(4,3,14,.8), transparent 42%); }
.ambient { position: absolute; z-index: -1; border-radius: 50%; filter: blur(80px); opacity: .35; }
.ambient-one { width: 380px; height: 380px; left: -180px; top: 5%; background: #8738ba; }
.ambient-two { width: 300px; height: 300px; right: -100px; bottom: -120px; background: #e25f9a; }
.hero { width: min(730px, 100%); text-align: center; animation: reveal .7s ease-out both; }
.kicker { margin: 0 0 10px; color: #edbdfb; font-size: 12px; font-weight: 900; letter-spacing: .24em; }
h1 { margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(66px, 13vw, 132px); font-weight: 500; line-height: .92; letter-spacing: -.065em; text-shadow: 0 14px 44px rgba(0,0,0,.45); }
h1 span { color: #e9a6e7; }
.tagline { max-width: 660px; margin: 26px auto; color: #ddd8e8; font-size: clamp(16px, 2.2vw, 20px); line-height: 1.65; text-shadow: 0 2px 16px rgba(0,0,0,.6); }
.feature-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 9px; margin-bottom: 30px; }
.feature-row span { padding: 7px 11px; border: 1px solid rgba(239,218,255,.23); border-radius: 999px; background: rgba(18,12,37,.45); color: #cbc3d9; font-size: 12px; backdrop-filter: blur(8px); }
.player-card { width: min(390px, 100%); box-sizing: border-box; display: flex; align-items: center; gap: 13px; margin: 0 auto 13px; padding: 13px 16px; border: 1px solid rgba(255,255,255,.16); border-radius: 14px; background: rgba(11,8,25,.62); text-align: left; backdrop-filter: blur(12px); }
.online-dot { width: 10px; height: 10px; border-radius: 50%; background: #80e4ae; box-shadow: 0 0 13px #80e4ae; }
.player-card div:last-child { display: grid; gap: 2px; }
.player-card small { color: #9b91ab; font-size: 9px; letter-spacing: .16em; }
.player-card strong { font-size: 15px; }
.home-actions { width: min(390px, 100%); display: grid; gap: 11px; margin: auto; }
.home-actions button { width: 100%; border-radius: 13px; padding: 14px 18px; color: white; font-size: 15px; font-weight: 800; cursor: pointer; transition: transform .18s, filter .18s, background .18s; }
.home-actions button:hover { transform: translateY(-2px); filter: brightness(1.08); }
.main-action { display: flex; align-items: center; justify-content: center; gap: 14px; border: 1px solid #efb8ff; background: linear-gradient(135deg, #9e50ca, #d25c9a); box-shadow: 0 13px 35px rgba(152, 54, 161, .32); }
.main-action span { font-size: 21px; }
.secondary-action { border: 1px solid rgba(255,255,255,.2); background: rgba(9,7,22,.6); backdrop-filter: blur(10px); }
footer { position: absolute; bottom: 18px; color: rgba(236,228,244,.5); font-size: 11px; letter-spacing: .08em; }
@keyframes reveal { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 560px) { .home-menu { justify-content: flex-start; padding-top: 16vh; } .kicker { font-size: 10px; } .tagline { margin-block: 20px; } footer { position: static; margin-top: 42px; } }
</style>
