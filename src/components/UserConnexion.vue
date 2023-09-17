<template>
  <div class="face">
    <h2>Connexion</h2>
    <input v-model="user.nom" placeholder="Nom" />
    <input type="password" v-model="user.mdp" placeholder="Mot de passe" />
    <button @click="login">Se connecter</button>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      user: {
        nom: '',
        mdp: ''
      }
    };
  },
  methods: {
    async login() {
      try {
        const response = await axios.post('http://localhost:3000/api/users/login', this.user);
        console.log('Réponse:', response.data);
        // Si la connexion est réussie, vous pourriez stocker les informations de l'utilisateur ou un jeton dans un store ou un local storage, et rediriger vers une autre page.
      } catch (error) {
        console.error('Erreur lors de la connexion:', error.response.data);
        // Gérer les erreurs, par exemple, informer l'utilisateur que la connexion a échoué ou que les informations d'identification sont incorrectes.
      }
    }
  }
};
</script>
<style>

</style>