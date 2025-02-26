<template>
  <div style="overflow:hidden">
    <div class="text-with-image">
      <img class="imagetoto" :src="currentImageSrc" alt="Illustration" />
      <div class="text">{{ displayedText }}</div>
      <div class="texts"></div>
      
    </div>
  </div>
</template>

<script>
export default {
  props: {
    sequence: {
      type: Array,
      required: true,
    },
    charPerStep: {
      type: Number,
      default: 120, // Nombre de caractères à afficher à chaque appui sur la touche espace
    },
  },
  data() {
    return {
      currentIndex: 0,
      displayedText: '',
      currentCharIndex: 0,
      audio: null, // Ajout de la variable pour le son
    };
  },
  computed: {
    currentText() {
      return this.sequence[this.currentIndex]?.text || '';
    },
    currentImageSrc() {
      return this.sequence[this.currentIndex]?.image || '';
    },
  },
  methods: {
    handleSpacePress(event) {
      if (event.code === 'Space') {
        this.playSound();  // Lecture du son
        this.advanceText();
      }
    },
    playSound() {
      if (this.audio) {
        this.audio.currentTime = 0; // Remet le son au début si déjà joué
        this.audio.play();
      }
    },
    advanceText() {
      if (this.currentCharIndex < this.currentText.length) {
        let nextCharIndex = this.currentCharIndex + this.charPerStep;

        if (nextCharIndex < this.currentText.length) {
          let nextSpaceIndex = this.currentText.lastIndexOf(' ', nextCharIndex);
          if (nextSpaceIndex > this.currentCharIndex) {
            nextCharIndex = nextSpaceIndex;
          }
        }

        this.displayedText = this.currentText.slice(this.currentCharIndex, nextCharIndex);
        this.currentCharIndex = nextCharIndex;
      } else {
        this.advanceToNext();
      }
    },
    advanceToNext() {
      if (this.currentIndex < this.sequence.length - 1) {
        this.currentIndex++;
        this.resetText();
        this.advanceText();
      } else {
        this.notifyParentSequenceEnd(); // Notifie le parent que toutes les séquences sont terminées
      }
    },
    resetText() {
      this.displayedText = '';
      this.currentCharIndex = 0;
    },
    notifyParentSequenceEnd() {
      this.$emit('sequence-end'); // Émettre l'événement 'sequence-end' au parent
    },
  },
  mounted() {
    this.audio = new Audio(require('@/assets/msc/skip.mp3')); // Chargement du son
    this.audio.volume = 0.02; // Ajuste le volume
    this.resetText();
    this.advanceText();  // Affiche immédiatement le premier segment de texte
    window.addEventListener('keydown', this.handleSpacePress);
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleSpacePress);
  },
};
</script>

<style scoped>
.imagetoto {
  position: absolute;
  top: 0px;
  left: 50%;
  transform: translate(-50%);
  max-width: 896px;
  margin-top: 10%;
}

.text-with-image {
  text-align: center;
}

.text-with-image p {
  margin-top: 10px;
  font-size: 16px;
  white-space: pre-wrap;
  /* Pour préserver les retours à la ligne du texte */
}

.text {
  background-color: #fff;
  /* width: 100%; */
  max-width: 900px;
  left: 50%;
  position: relative;
  left: 50%;
  transform: translate(-50%);
  height: 85px;
  font-size: 28px;
  border: 5px solid gray;
  top: 0;
  font-family: Arial, Helvetica, sans-serif;
  padding: 5px;
}

.texts {
  background-color: #000000;
  /* width: 100%; */
  max-width: 900px;
  left: 50%;
  position: relative;
  left: 50%;
  transform: translate(-50%);
  height: 500px;
  font-size: 32px;
  border: 10px solid rgb(0, 0, 0);
  top: 0;
}
</style>
