<template>
  <div>
    <h2>Inscription</h2>
    <input v-model="user.nom" placeholder="Nom" />
    <input type="password" v-model="user.mdp" placeholder="Mot de passe" />
    <button @click="register">S'inscrire</button>
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
    async register() {
      try {
        const response = await axios.post('http://localhost:3000/api/users', this.user);
        console.log('Réponse:', response.data);
        // Ici, vous pouvez gérer la réponse, par exemple, informer l'utilisateur que l'inscription a réussi.
      } catch (error) {
        console.error('Erreur lors de l’inscription:', error.response.data);
        // Gérer les erreurs, par exemple, informer l'utilisateur qu'une erreur s'est produite.
      }
    }
  }
};
</script>
