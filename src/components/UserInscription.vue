<template>
  <div>
    <h2>Inscription</h2>
    <input v-model="users.username" placeholder="Nom" />
    <input type="password" v-model="users.password" placeholder="Mot de passe" />
    <button @click="register">S'inscrire</button>
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
      }
    };
  },
  methods: {
    async register() {
        try {
            // Envoyer une requête POST à l'API pour tenter de s'inscrire
            const response = await axios.post('http://localhost:3000/api/users', this.users);

            // Afficher la réponse dans la console (facultatif)
            console.log('Réponse:', response.data);

            // Si l'inscription est réussie, informer l'utilisateur et éventuellement rediriger
            if (response.status === 201) {
                // Informer l'utilisateur que l'inscription a réussi
                alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');

                // Rediriger l'utilisateur vers la page de connexion
                this.$router.push('/connexion');
            } else {
                console.error('Erreur inattendue lors de l’inscription.');
            }
        } catch (error) {
            console.error('Erreur lors de l’inscription:', error.response?.data || error.message);
            // Afficher un message d'erreur à l'utilisateur
            this.errorMessage = error.response?.data?.message || 'Une erreur est survenue lors de l’inscription.';
        }
    }
}

};
</script>
