<template>
  <div class="dialogue-shell" :class="{ 'is-cinematic': typewriterMs > 0 }">
    <div class="text-with-image">
      
      <div class="text" role="button" tabindex="0" aria-label="Continuer le dialogue" @click="continueText" @keydown.enter.stop.prevent="continueText" @keydown.space.stop.prevent="continueText"><span v-if="typewriterMs" class="dialogue-reserved" aria-hidden="true">{{ currentText }}</span><span class="dialogue-visible">{{ displayedText }}</span></div>
      <div class="texts">
        <atlas-portrait v-if="portraitFrame" :src="currentImageSrc" :frame="portraitFrame" />
        <img v-else class="imagetoto" :src="currentImageSrc" alt="Illustration" />
      </div>
      
    </div>
  </div>
</template>

<script>
import AtlasPortrait from './AtlasPortrait.vue';
export default {
  components:{AtlasPortrait},
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
    typewriterMs() { return Math.max(0, Number(this.sequence[this.currentIndex]?.typewriterMs) || 0); },
    portraitFrame() { return this.sequence[this.currentIndex]?.portraitFrame; },
    currentText() {
      return this.sequence[this.currentIndex]?.text || '';
    },
    currentImageSrc() {
      return this.sequence[this.currentIndex]?.image || '';
    },
  },
  watch: {
    sequence() { this.currentIndex = 0; this.resetText(); this.advanceText(); },
    soundVolume(value) {
      if (this.audio) this.audio.volume = Math.max(0, Math.min(1, Number(value) || 0));
    },
  },
  methods: {
    continueText() { this.playSound(); this.advanceText(); },
    handleSpacePress(event) {
      if (event.code === 'Space') {
        event.preventDefault();
        if (!event.repeat) this.continueText();
      }
    },
    playSound() {
      if (this.audio && this.soundEnabled && this.soundVolume > 0) {
        this.audio.currentTime = 0; // Remet le son au début si déjà joué
        this.audio.play().catch(() => {});
      }
    },
    advanceText() {
      if (this._typingTimer != null) {
        this.stopTyping();
        this.currentCharIndex = this.currentText.length;
        this.displayedText = this.currentText;
        return;
      }
      if (this.typewriterMs && this.currentText.length && this.currentCharIndex === 0) {
        this.revealNextCharacter();
        return;
      }
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
      this.stopTyping();
      this.displayedText = '';
      this.currentCharIndex = 0;
    },
    stopTyping() {
      clearTimeout(this._typingTimer);
      this._typingTimer = null;
    },
    revealNextCharacter() {
      this._typingTimer = null;
      if (this.currentCharIndex >= this.currentText.length) return;
      this.currentCharIndex++;
      this.displayedText = this.currentText.slice(0, this.currentCharIndex);
      if (this.currentCharIndex < this.currentText.length) {
        const last = this.displayedText.slice(-1);
        const pause = /[.!?…]/.test(last) ? 360 : /[,;:]/.test(last) ? 150 : 0;
        this._typingTimer = setTimeout(this.revealNextCharacter, this.typewriterMs + pause);
      }
    },
    notifyParentSequenceEnd() {
      this.stopTyping();
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
    this.stopTyping();
    window.removeEventListener('keydown', this.handleSpacePress);
  },
};
</script>

<style scoped>
.is-cinematic .text { display:grid; }
.is-cinematic .dialogue-reserved,.is-cinematic .dialogue-visible { grid-area:1 / 1; }
.dialogue-reserved { visibility:hidden; pointer-events:none; }
.dialogue-shell {
  box-sizing: border-box;
  display: grid;
  place-items: center;
  height: 100vh;
  height: 100dvh;
  padding: 24px;
  overflow: hidden;
}

.text-with-image {
  display: flex;
  flex-direction: column;
  width: min(900px, 100%);
  height: min(760px, 100%);
  min-height: 0;
}

.text {
  box-sizing: border-box;
  flex: 0 0 auto;
  min-height: 84px;
  max-height: 42vh;
  overflow-y: auto;
  padding: 14px 18px;
  color: #172333;
  background: #fff;
  border: 3px solid #8e9aa8;
  border-radius: 12px 12px 0 0;
  font: 20px/1.45 Arial, Helvetica, sans-serif;
  text-align: left;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.texts {
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  justify-content: center;
  overflow: hidden;
  background: #000;
  border: 6px solid #000;
  border-radius: 0 0 12px 12px;
}

.imagetoto {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: contain;
  image-rendering: auto;
}

@media (max-width: 920px) {
  .dialogue-shell {
    padding: 10px 10px calc(118px + env(safe-area-inset-bottom));
  }
  .text {
    min-height: 76px;
    padding: 10px 12px;
    font-size: 16px;
    line-height: 1.4;
  }
}

@media (max-height: 480px) and (orientation: landscape) {
  .dialogue-shell { padding: 10px 118px 10px 10px; }
}
.portrait-atlas { image-rendering:auto; width: 100%; max-width: 190px; aspect-ratio: 1; background-repeat: no-repeat; }
</style>
