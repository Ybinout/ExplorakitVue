<template>
  <div id="app">
    <TextWithImage :sequence="textImageSequence" />
  </div>
</template>

<script>
import TextWithImage from './TextWithImage.vue';

export default {
  name: 'App',
  components: {
    TextWithImage,
  },
  data() {
    return {
      textImageSequence: this.generateTextImageSequence(),
    };
  },
  methods: {
    importAllImages(r) {
      let images = {};
      r.keys().forEach((item) => {
        images[item.replace('./', '')] = r(item);
      });
      return images;
    },
    generateTextImageSequence() {
      // Utiliser un chemin relatif correct basé sur l'emplacement du composant
      const images = this.importAllImages(require.context('@/assets/image', false, /\.(png|jpe?g|svg)$/));

      // Créer une séquence texte-image en associant chaque image à un texte
      const texts = [
        {
          text: "Bonjour mon chéri, je voulais te parler... Le monde est vaste et rempli de mystères. Ta sœur est partie pour l'aventure il y a plusieurs mois, mais nous n'avons plus de nouvelles d'elle depuis. Je sais que cela t'inquiète, mais je suis sûre qu'elle est en sécurité. Cependant, je pense qu'il est temps pour toi de partir à sa recherche. Tu es prêt, n'est-ce pas ? Avant que tu partes, tu devrais aller voir le Professeur Chêne. Il pourra t'aider à te préparer pour ton voyage. Prends soin de toi, mon chéri.",
          imageName: 'wanda.png'
        },
        {
          text: "Ah, te voilà ! Ta mère m'a parlé de ta décision. C'est une grande responsabilité que tu assumes, mais je suis sûr que tu es prêt.Avant que tu ne partes, je veux te donner un Pokémon. Ce sera ton premier compagnon d'aventure. Choisis bien, car il sera à tes côtés tout au long de ton voyage. Ces trois Pokémon sont tous spéciaux à leur manière. Prends ton temps pour faire ton choix. Je suis là pour répondre à tes questions. Une fois que tu auras choisi, ton aventure commencera officiellement. N'oublie pas, c'est dangereux de partir seul. Bonne chance, jeune dresseur !",
          imageName: 'ana.png'
        },

      ];

      // Associer les textes aux images
      return texts.map((item) => {
        return { text: item.text, image: images[item.imageName] };
      });
    },
  },
};
</script>
