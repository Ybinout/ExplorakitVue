<template>
  <div class="login-container" @click="startMusicOnInteraction">
    <!-- Vidéo en arrière-plan -->
    <video src="@/assets/background-video.mp4" autoplay muted playsinline class="background-video"></video>

    <!-- Audio en arrière-plan -->
    <audio ref="backgroundMusic" src="@/assets/extended.mp3" loop></audio>

    <!-- Formulaire de connexion -->
    <div class="login-form">
      <h2>Connexion</h2>
      <input type="text" v-model="users.username" placeholder="Nom d'utilisateur" />
      <input type="password" v-model="users.password" placeholder="Mot de passe" />
      <button class="selectedbtn" @click="login">Se connecter</button>
    </div>

    <!-- Contrôle du volume -->
    <div class="volume-control">
      <label for="volume">Volume: </label>
      <input id="volume" type="range" min="0" max="1" step="0.01" v-model="volume" @input="setVolume" />
    </div>

    <!-- Bouton pour lancer la musique (optionnel) -->
    <div class="music-control" v-if="!musicStarted">
      <button @click="playMusic">Unmute</button>
    </div>

    
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      users: {
        username: '',
        password: ''
      },
      volume: 0.3,  // Volume initial à 10%
      musicStarted: false,  // Pour suivre si la musique a déjà démarré
      errorMessage: ''
    };
  },
  mounted() {
    // Le volume est réglé au montage du composant
    this.$refs.backgroundMusic.volume = this.volume;
  },
  methods: {
    startMusicOnInteraction() {
      if (!this.musicStarted) {
        this.playMusic();
        this.musicStarted = true;
      }
    },
    playMusic() {
      this.$refs.backgroundMusic.play().catch(error => {
        console.warn('Failed to play music:', error);
      });
    },
    setVolume() {
      // Régler le volume de l'audio selon la sélection de l'utilisateur
      this.$refs.backgroundMusic.volume = this.volume;
    },
    async login() {
      try {
        // Envoyer une requête POST à l'API pour tenter de se connecter
        const response = await axios.post('http://localhost:3000/api/login', this.users);

        // Si la connexion est réussie
        if (response.status === 200) {
          // Stocker les informations de l'utilisateur dans le localStorage si nécessaire
          localStorage.setItem('user', JSON.stringify(response.data.user));

          // Rediriger l'utilisateur vers une autre page, par exemple, le tableau de bord
          this.$router.push('/game');
        } else {
          console.error('La connexion a échoué, vérifiez vos identifiants.');
        }
      } catch (error) {
        console.error('Erreur lors de la connexion:', error.response?.data || error.message);
        // Afficher un message d'erreur à l'utilisateur
        this.errorMessage = 'Erreur lors de la connexion. Veuillez vérifier vos identifiants.';
      }
    }
  }
};
</script>

<style scoped>
.login-container {
  position: relative;
  width: 100%;
  height: 95vh;
  overflow: hidden;
}

.background-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
}

.login-form {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.6);
  padding: 40px;
  border-radius: 10px;
  text-align: center;
  color: #fff;
}

.login-form h2 {
  margin-bottom: 30px;
  font-size: 32px;
}

.login-form input {
  width: 100%;
  padding: 15px;
  margin-bottom: 20px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
}

.login-form button {
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 5px;
  background-color: #df191900;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.login-form button:hover {
  background-color: #cacaca4f;
}

.volume-control {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: #fff;
}

.volume-control input[type="range"] {
  width: 200px;
}

.music-control {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.music-control button {
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  background-color: #ff6b6b;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.music-control button:hover {
  background-color: #ff4757;
}
</style>
