<template>
  <div style="overflow:hidden">
    <div class="text-with-image">
      
      <div class="text">{{ displayedText }}</div>
      <div class="texts">
        <img class="imagetoto" :src="currentImageSrc" alt="Illustration" />
      </div>
      
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
    soundVolume: {
      type: Number,
      default: 0.35,
    },
    soundEnabled: {
      type: Boolean,
      default: true,
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
  watch: {
    soundVolume(value) {
      if (this.audio) this.audio.volume = Math.max(0, Math.min(1, Number(value) || 0));
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
      if (this.audio && this.soundEnabled && this.soundVolume > 0) {
        this.audio.currentTime = 0; // Remet le son au début si déjà joué
        this.audio.play().catch(() => {});
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
    this.audio.volume = Math.max(0, Math.min(1, this.soundVolume));
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
  z-index: 999;
}

.text-with-image {
  text-align: center;
  margin: 100px;
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
  height: 600px;
  font-size: 32px;
  border: 10px solid rgb(0, 0, 0);
  top: 0;
}

@media (max-width: 920px) {
  .text-with-image {
    margin: 8px 10px 0;
  }

  .text {
    max-width: 100%;
    min-height: 108px;
    height: auto;
    font-size: 18px;
    line-height: 1.35;
    border-width: 3px;
    padding: 10px 12px;
    text-align: left;
    white-space: pre-wrap;
  }

  .texts {
    max-width: 100%;
    height: calc(100vh - 190px);
    min-height: 280px;
    border-width: 6px;
    overflow: hidden;
  }

  .imagetoto {
    width: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
}
</style>
