<template>
  <main class="onboarding-shell">
    <button class="back-home" type="button" @click="$router.push('/')">← Retour</button>

    <section class="onboarding-card">
      <header class="onboarding-header">
        <p class="eyebrow">NOUVELLE PARTIE</p>
        <h1>{{ stepTitle }}</h1>
        <p>{{ stepDescription }}</p>
        <div class="steps" aria-label="Progression de la création">
          <span v-for="index in 4" :key="index" :class="{ active: index - 1 <= step }"></span>
        </div>
      </header>

      <form v-if="step === 0" class="panel identity-panel" @submit.prevent="nextStep">
        <div class="professor-message">
          <span class="professor-avatar">?</span>
          <p>Bienvenue à Explorakit. Avant de partir sur les traces de ta sœur, dis-moi qui tu es.</p>
        </div>
        <label>
          Nom du dresseur
          <input v-model.trim="form.username" maxlength="50" autocomplete="username" placeholder="Ton nom" />
        </label>
        <label>
          Mot de passe
          <input v-model="form.password" type="password" maxlength="128" autocomplete="new-password" placeholder="8 caractères minimum" />
        </label>
        <label>
          Confirmer le mot de passe
          <input v-model="passwordConfirmation" type="password" maxlength="128" autocomplete="new-password" placeholder="Répète ton mot de passe" />
        </label>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <button class="primary-button" type="submit">Choisir mon apparence</button>
      </form>

      <section v-else-if="step === 1" class="panel">
        <div class="choice-grid avatar-grid">
          <button
            v-for="avatar in avatars"
            :key="avatar.file"
            type="button"
            class="choice-card avatar-card"
            :class="{ selected: form.sprite === avatar.file }"
            @click="form.sprite = avatar.file"
          >
            <span class="avatar-frame" :style="{ backgroundImage: `url(${avatar.image})` }"></span>
            <strong>{{ avatar.name }}</strong>
            <small>{{ avatar.description }}</small>
          </button>
        </div>
        <div class="navigation-actions">
          <button class="secondary-button" type="button" @click="step -= 1">Retour</button>
          <button class="primary-button" type="button" @click="nextStep">Choisir mon starter</button>
        </div>
      </section>

      <section v-else-if="step === 2" class="panel starter-panel">
        <div class="choice-grid starter-grid">
          <button
            v-for="starter in starters"
            :key="starter.id"
            type="button"
            class="choice-card starter-card"
            :class="[`type-${starter.type.toLowerCase()}`, { selected: form.starterId === starter.id }]"
            @click="form.starterId = starter.id"
          >
            <span class="starter-number">N°{{ String(starter.id).padStart(3, '0') }}</span>
            <img :src="starter.image" :alt="starter.name" />
            <strong>{{ starter.name }}</strong>
            <span class="type-pill">{{ starter.type }}</span>
            <small>{{ starter.description }}</small>
          </button>
        </div>
        <p class="fair-start">Ton premier compagnon possède un potentiel <b>k=2</b>. Les potentiels supérieurs existent, mais sont rares dans la nature.</p>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <div class="navigation-actions">
          <button class="secondary-button" type="button" @click="step -= 1">Retour</button>
          <button class="primary-button" type="button" :disabled="submitting" @click="register">
            {{ submitting ? 'Création du monde…' : 'Confirmer mon aventure' }}
          </button>
        </div>
      </section>

      <section v-else class="panel ready-panel">
        <div class="ready-glow">
          <img :src="selectedStarter.image" :alt="selectedStarter.name" />
        </div>
        <p class="eyebrow">AVENTURE CRÉÉE</p>
        <h2>{{ form.username }}, {{ selectedStarter.name }} t’attend.</h2>
        <p>Ta mère a une mission importante à te confier. Le village est calme, mais la route ne le restera pas longtemps.</p>
        <button class="primary-button launch-button" type="button" @click="$router.push('/game')">Entrer dans le monde</button>
      </section>
    </section>
  </main>
</template>

<script>
import api from '@/services/api';
import { storeSession } from '@/services/session';
import avatarOne from '@/assets/sprite.png';
import avatarTwo from '@/assets/sprite2.png';
import bulbasaur from '@/assets/dp2/1.png';
import charmander from '@/assets/dp2/4.png';
import squirtle from '@/assets/dp2/7.png';

export default {
  name: 'UserInscription',
  data() {
    return {
      step: 0,
      submitting: false,
      errorMessage: '',
      passwordConfirmation: '',
      form: { username: '', password: '', sprite: 'sprite.png', starterId: 1 },
      avatars: [
        { file: 'sprite.png', image: avatarOne, name: 'Éclaireur', description: 'Tenue vive pour les longues routes.' },
        { file: 'sprite2.png', image: avatarTwo, name: 'Veilleur', description: 'Style nocturne et déterminé.' }
      ],
      starters: [
        { id: 1, name: 'Bulbizarre', type: 'Plante', image: bulbasaur, description: 'Patient et résistant. Idéal pour contrôler le combat.' },
        { id: 4, name: 'Salamèche', type: 'Feu', image: charmander, description: 'Offensif et audacieux. Sa puissance grandit vite.' },
        { id: 7, name: 'Carapuce', type: 'Eau', image: squirtle, description: 'Solide et équilibré. Un compagnon très fiable.' }
      ]
    };
  },
  computed: {
    stepTitle() {
      return ['Quel est ton nom ?', 'Choisis ton apparence', 'Choisis ton compagnon', 'Le voyage commence'][this.step];
    },
    stepDescription() {
      return [
        'Chaque grande aventure commence par une identité.',
        'Cette apparence sera visible par les autres dresseurs.',
        'Ce choix façonnera tes premiers combats.',
        'Ton équipe et ton sac sont prêts.'
      ][this.step];
    },
    selectedStarter() {
      return this.starters.find((starter) => starter.id === this.form.starterId) || this.starters[0];
    }
  },
  methods: {
    nextStep() {
      this.errorMessage = '';
      if (this.step === 0) {
        if (this.form.username.length < 3) return this.showError('Ton nom doit contenir au moins 3 caractères.');
        if (this.form.password.length < 8) return this.showError('Ton mot de passe doit contenir au moins 8 caractères.');
        if (this.form.password !== this.passwordConfirmation) return this.showError('Les mots de passe ne correspondent pas.');
      }
      this.step += 1;
    },
    showError(message) {
      this.errorMessage = message;
      return false;
    },
    async register() {
      this.submitting = true;
      this.errorMessage = '';
      try {
        const response = await api.post('/users', this.form);
        storeSession(response.data.user, response.data.token);
        this.step = 3;
      } catch (error) {
        this.errorMessage = error.response?.data?.message || 'Impossible de créer ton aventure pour le moment.';
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>

<style scoped>
.onboarding-shell { min-height: 100vh; box-sizing: border-box; display: grid; place-items: center; padding: 56px 20px 30px; color: #f7f4ff; background: linear-gradient(145deg, rgba(8, 7, 23, .82), rgba(32, 15, 57, .58)), url("~@/assets/backgroundmenu.webp") center/cover fixed; }
.back-home { position: fixed; top: 20px; left: 22px; z-index: 2; border: 0; background: rgba(10, 8, 24, .65); color: #eee9ff; border-radius: 999px; padding: 10px 16px; cursor: pointer; backdrop-filter: blur(10px); }
.onboarding-card { width: min(980px, 100%); min-height: 640px; box-sizing: border-box; padding: 34px; border: 1px solid rgba(223, 193, 255, .28); border-radius: 28px; background: linear-gradient(155deg, rgba(17, 12, 35, .92), rgba(26, 19, 51, .82)); box-shadow: 0 30px 90px rgba(0, 0, 0, .48); backdrop-filter: blur(16px); }
.onboarding-header { max-width: 650px; margin: 0 auto 30px; }
.eyebrow { margin: 0 0 8px; color: #f0b8ff; font-weight: 800; font-size: 12px; letter-spacing: .18em; }
h1, h2 { margin: 0; font-family: Georgia, 'Times New Roman', serif; }
h1 { font-size: clamp(30px, 5vw, 48px); }
.onboarding-header > p:not(.eyebrow) { color: #c8c0dc; }
.steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; max-width: 360px; margin: 22px auto 0; }
.steps span { height: 4px; border-radius: 4px; background: rgba(255,255,255,.14); transition: background .25s, transform .25s; }
.steps span.active { background: linear-gradient(90deg, #c77dff, #ff9fcc); transform: scaleY(1.35); }
.panel { max-width: 850px; margin: 0 auto; }
.identity-panel { max-width: 520px; display: grid; gap: 16px; text-align: left; }
.professor-message { display: flex; align-items: center; gap: 14px; margin-bottom: 4px; padding: 14px; border-radius: 14px; background: rgba(128, 87, 169, .16); color: #ddd4ee; }
.professor-message p { margin: 0; line-height: 1.5; }
.professor-avatar { flex: 0 0 42px; height: 42px; display: grid; place-items: center; border-radius: 50%; background: linear-gradient(145deg, #9d63ca, #5b3f83); font: 700 22px Georgia; }
label { display: grid; gap: 7px; color: #d9d1ea; font-weight: 700; font-size: 14px; }
input { box-sizing: border-box; width: 100%; border: 1px solid rgba(212, 186, 239, .28); border-radius: 12px; padding: 14px 15px; background: rgba(7, 5, 18, .62); color: white; font-size: 16px; outline: none; }
input:focus { border-color: #c77dff; box-shadow: 0 0 0 3px rgba(199, 125, 255, .15); }
.choice-grid { display: grid; gap: 16px; }
.avatar-grid { grid-template-columns: repeat(2, minmax(0, 250px)); justify-content: center; }
.starter-grid { grid-template-columns: repeat(3, 1fr); }
.choice-card { position: relative; display: flex; flex-direction: column; align-items: center; gap: 8px; min-height: 220px; padding: 20px; border: 1px solid rgba(255,255,255,.12); border-radius: 20px; background: rgba(255,255,255,.055); color: #f9f7ff; cursor: pointer; transition: transform .18s, border-color .18s, background .18s; }
.choice-card:hover { transform: translateY(-4px); background: rgba(255,255,255,.09); }
.choice-card.selected { border-color: #e5a7ff; box-shadow: 0 0 0 3px rgba(198, 112, 239, .18), 0 18px 40px rgba(0,0,0,.2); }
.choice-card strong { font-size: 19px; }
.choice-card small { color: #bbb2ce; line-height: 1.45; }
.avatar-frame { width: 96px; height: 96px; image-rendering: pixelated; background-size: 384px 384px; background-position: 0 0; transform: scale(1.2); transform-origin: center; margin: 12px 0 20px; }
.starter-card img { width: min(150px, 100%); aspect-ratio: 1; object-fit: contain; filter: drop-shadow(0 14px 16px rgba(0,0,0,.4)); }
.starter-number { position: absolute; top: 14px; left: 16px; color: #978fa9; font-size: 11px; letter-spacing: .1em; }
.type-pill { border-radius: 999px; padding: 5px 10px; background: rgba(255,255,255,.1); font-size: 12px; }
.type-plante.selected { background: linear-gradient(160deg, rgba(42, 126, 83, .38), rgba(255,255,255,.05)); }
.type-feu.selected { background: linear-gradient(160deg, rgba(181, 72, 61, .38), rgba(255,255,255,.05)); }
.type-eau.selected { background: linear-gradient(160deg, rgba(55, 106, 181, .4), rgba(255,255,255,.05)); }
.fair-start { margin: 22px auto 0; color: #bdb4cf; font-size: 13px; }
.navigation-actions { display: flex; justify-content: center; gap: 12px; margin-top: 26px; }
.primary-button, .secondary-button { border-radius: 12px; padding: 13px 20px; color: white; font-weight: 800; font-size: 15px; cursor: pointer; }
.primary-button { border: 1px solid #e6b2ff; background: linear-gradient(135deg, #9b55cf, #d05e9d); box-shadow: 0 10px 28px rgba(156, 66, 184, .3); }
.secondary-button { border: 1px solid rgba(255,255,255,.2); background: rgba(255,255,255,.06); }
.primary-button:disabled { opacity: .55; cursor: wait; }
.error-message { margin: 0; color: #ffb3c1; font-size: 14px; text-align: center; }
.ready-panel { max-width: 560px; text-align: center; }
.ready-glow { width: 230px; height: 230px; display: grid; place-items: center; margin: 0 auto 20px; border-radius: 50%; background: radial-gradient(circle, rgba(245,188,255,.32), rgba(137,86,190,.05) 68%, transparent 70%); }
.ready-glow img { width: 210px; filter: drop-shadow(0 20px 24px rgba(0,0,0,.4)); }
.ready-panel h2 { font-size: clamp(25px, 4vw, 38px); }
.ready-panel > p:not(.eyebrow) { color: #c9c0d8; line-height: 1.6; }
.launch-button { margin-top: 16px; padding-inline: 34px; }
@media (max-width: 760px) { .onboarding-card { padding: 26px 16px; min-height: 0; } .starter-grid { grid-template-columns: 1fr; } .starter-card { min-height: 0; display: grid; grid-template-columns: 100px 1fr; text-align: left; } .starter-card img { grid-row: span 3; width: 100px; } .starter-number { display: none; } .avatar-grid { grid-template-columns: 1fr 1fr; } .navigation-actions { flex-direction: column-reverse; } }
@media (max-width: 480px) { .avatar-grid { grid-template-columns: 1fr; } .back-home { position: absolute; } }
</style>
