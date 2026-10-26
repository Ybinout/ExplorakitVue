<template>
  <main class="login-page">
    <button class="back-home" type="button" @click="$router.push('/')">← Retour</button>
    <section class="login-card">
      <p class="eyebrow">RIFTMON · RETOUR AU CAMP</p>
      <h1>Bon retour,<br />dresseur.</h1>
      <p class="intro">Retrouve ton dresseur, rejoins un Rift ou poursuis ton Aventure.</p>
      <p v-if="$route.query.reason === 'session-expired'" class="session-notice" role="alert" data-session-expired>
        Ta session a expiré ou n’est plus valide. Reconnecte-toi pour reprendre ta partie.
      </p>

      <form @submit.prevent="login">
        <label>
          Nom du dresseur
          <input v-model.trim="credentials.username" autocomplete="username" placeholder="Ton nom" />
        </label>
        <label>
          Mot de passe
          <input v-model="credentials.password" type="password" autocomplete="current-password" placeholder="Ton mot de passe" />
        </label>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <button class="login-button" type="submit" :disabled="submitting">
          {{ submitting ? 'Connexion…' : ($route.query.redirect === '/game' ? 'Continuer l’aventure →' : 'Choisir mon aventure →') }}
        </button>
      </form>

      <button class="new-game" type="button" @click="$router.push({ path: '/inscription', query: { redirect: loginDestination($route.query.redirect) } })">Créer un dresseur</button>
    </section>
  </main>
</template>

<script>
import api from '@/services/api';
import { storeSession, loginDestination } from '@/services/session';

export default {
  name: 'UserConnexion',
  data() {
    return {
      credentials: { username: '', password: '' },
      errorMessage: '',
      submitting: false
    };
  },
  methods: {
    loginDestination,
    async login() {
      this.errorMessage = '';
      this.submitting = true;
      try {
        const response = await api.post('/login', this.credentials);
        storeSession(response.data.user, response.data.token);
        this.$router.push(loginDestination(this.$route.query.redirect));
      } catch (error) {
        this.errorMessage = error.response?.data?.message || 'Connexion impossible. Vérifie tes identifiants.';
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>

<style scoped>
.login-page { min-height: 100vh; min-height: 100dvh; box-sizing: border-box; display: grid; place-items: center; padding: 76px 20px 40px; color: #254760; background: #edf5fb; color-scheme: light; }
.back-home { position: fixed; top: 20px; left: 22px; border: 1px solid #cbdce9; border-radius: 999px; padding: 10px 16px; min-height: 44px; background: #f8fbff; color: #386581; cursor: pointer; }
.login-card { width: min(440px, 100%); box-sizing: border-box; padding: 38px; border: 1px solid #cadde9; border-radius: 26px; background: #fbfdff; box-shadow: 0 16px 44px #587b9412; text-align: left; }
.eyebrow { margin: 0 0 9px; color: #397b9f; font-size: 11px; font-weight: 900; letter-spacing: .2em; }
h1 { margin: 0; font: 500 clamp(36px, 7vw, 54px)/1.05 Georgia, serif; }
.intro { margin: 18px 0 27px; color: #57738a; line-height: 1.55; }
form { display: grid; gap: 16px; }
label { display: grid; gap: 7px; color: #36576d; font-size: 13px; font-weight: 800; }
input { box-sizing: border-box; width: 100%; border: 1px solid #bfd4e3; border-radius: 12px; padding: 14px; background: #f1f7fc; color: #254760; font-size: 16px; outline: none; }
input::placeholder { color: #597185; opacity: 1; }
input:focus { border-color: #397b9f; box-shadow: 0 0 0 3px #6a9fc327; }
.login-button { border: 1px solid #2e6f9a; border-radius: 12px; padding: 14px; background: #2e6f9a; color: #fff; font-weight: 900; font-size: 15px; cursor: pointer; box-shadow: 0 7px 18px #3c77941a; }
.login-button:hover { background: #285f85; }
.login-button:disabled { opacity: .6; cursor: wait; }
.new-game { display: block; margin: 21px auto 0; border: 0; min-height: 44px; background: transparent; color: #356e91; cursor: pointer; text-decoration: underline; text-underline-offset: 4px; }
button:focus-visible { outline: 3px solid #397b9f; outline-offset: 3px; }
.error-message { margin: 0; color: #a13b52; font-size: 13px; text-align: center; }
.session-notice { margin: 0 0 22px; padding: 12px 14px; border: 1px solid #b9d0e2; border-radius: 10px; background: #eaf3fb; color: #2b526c; font: 14px/1.5 Arial,sans-serif; }
@media (max-width: 520px) { .login-card { padding: 30px 21px; } .back-home { position: absolute; } }
</style>
