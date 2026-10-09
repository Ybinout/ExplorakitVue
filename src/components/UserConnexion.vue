<template>
  <main class="login-page">
    <button class="back-home" type="button" @click="$router.push('/')">← Retour</button>
    <section class="login-card">
      <p class="eyebrow">REPRENDRE LA ROUTE</p>
      <h1>Bon retour,<br />dresseur.</h1>
      <p class="intro">Ton équipe et le monde d’Explorakit t’attendent exactement là où tu les as laissés.</p>

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
          {{ submitting ? 'Connexion…' : 'Continuer l’aventure →' }}
        </button>
      </form>

      <button class="new-game" type="button" @click="$router.push('/inscription')">Créer une nouvelle aventure</button>
    </section>
  </main>
</template>

<script>
import api from '@/services/api';
import { storeSession } from '@/services/session';

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
    async login() {
      this.errorMessage = '';
      this.submitting = true;
      try {
        const response = await api.post('/login', this.credentials);
        storeSession(response.data.user, response.data.token);
        this.$router.push('/game');
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
.login-page { min-height: 100vh; box-sizing: border-box; display: grid; place-items: center; padding: 60px 20px; color: #f8f5ff; background: linear-gradient(100deg, rgba(6,4,18,.88), rgba(22,10,39,.55)), url("~@/assets/backgroundmenu.webp") center/cover; }
.back-home { position: fixed; top: 20px; left: 22px; border: 0; border-radius: 999px; padding: 10px 16px; background: rgba(10,8,24,.65); color: #eee9ff; cursor: pointer; backdrop-filter: blur(10px); }
.login-card { width: min(440px, 100%); box-sizing: border-box; padding: 38px; border: 1px solid rgba(229,194,255,.25); border-radius: 26px; background: rgba(16,11,33,.88); box-shadow: 0 30px 80px rgba(0,0,0,.48); text-align: left; backdrop-filter: blur(16px); }
.eyebrow { margin: 0 0 9px; color: #e8adf6; font-size: 11px; font-weight: 900; letter-spacing: .2em; }
h1 { margin: 0; font: 500 clamp(36px, 7vw, 54px)/1.05 Georgia, serif; }
.intro { margin: 18px 0 27px; color: #bfb6ce; line-height: 1.55; }
form { display: grid; gap: 16px; }
label { display: grid; gap: 7px; color: #ddd5e9; font-size: 13px; font-weight: 800; }
input { box-sizing: border-box; width: 100%; border: 1px solid rgba(223,196,242,.25); border-radius: 12px; padding: 14px; background: rgba(5,4,14,.62); color: white; font-size: 16px; outline: none; }
input:focus { border-color: #c97cec; box-shadow: 0 0 0 3px rgba(201,124,236,.14); }
.login-button { border: 1px solid #e6b0f8; border-radius: 12px; padding: 14px; background: linear-gradient(135deg, #9b52c8, #cc5e9b); color: white; font-weight: 900; font-size: 15px; cursor: pointer; box-shadow: 0 12px 30px rgba(142,53,157,.28); }
.login-button:disabled { opacity: .6; cursor: wait; }
.new-game { display: block; margin: 21px auto 0; border: 0; background: transparent; color: #cdbbd9; cursor: pointer; text-decoration: underline; text-underline-offset: 4px; }
.error-message { margin: 0; color: #ffb1c0; font-size: 13px; text-align: center; }
@media (max-width: 520px) { .login-card { padding: 30px 21px; } .back-home { position: absolute; } }
</style>
