<template>
  <div style="background-color: black;">
    <!-- <navBar></navBar> -->
    <div>



      <div v-if="battle" class="battle">
        <img style="margin-top: 60px;left: 65%;position: absolute;z-index: 999;"
          :src="require(`@/assets/dp2/${datawildPokemon.data.id}.png`)" alt="">
        <img style="top: 45%;left: 5%;position: absolute;z-index: 999;width: 200px;"
          :src="require(`@/assets/back/${dataplayer.equipe.pokemons[0].data.id}.png`)" alt="">
        <div style="position: absolute;">
          <img src="../assets/back.png" style="width: 100%;" alt="">
        </div>
        <div
          style="border-top: 2px solid black;border-top-right-radius: 20px;border-bottom-right-radius: 10px ;position: absolute;left: 0;width: 290px;background-color: rgb(223, 223, 223);height: 80px;top: 50px; display: flex;flex-direction: column;box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;">
          <div style="width: 100%;display: flex;">
            <div style="width: 100%;">{{ datawildPokemon.truename }}</div>
            <div style="width: 100%;">lv.{{ datawildPokemon.level }} </div>
            <div style="width: 100%;">tier :{{ datawildPokemon.k }}</div>
          </div>
          <div>
            <health-bar :current-hp="datawildPokemon.currentHp" :hp-max="datawildPokemon.maxHp"></health-bar>
          </div>
        </div>

        <div
          style="border-top: 2px solid black;border-top-left-radius: 20px;border-bottom-left-radius: 10px ;position: absolute;right: 0;width: 290px;background-color: rgb(233, 233, 233);height: 80px;top: 50px; display: flex;flex-direction: column;top: 55%;box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;">
          <div style="width: 100%;display: flex;">
            <div style="width: 100%;">{{ dataplayer.equipe.pokemons[0].name }}</div>
            <div style="width: 100%;">lv.{{ dataplayer.equipe.pokemons[0].level }}</div>
            <div style="width: 100%;">tier :{{ dataplayer.equipe.pokemons[0].k }}</div>
          </div>
          <div>
            <health-bar :current-hp="dataplayer.equipe.pokemons[0]?.currentHp"
              :hp-max="dataplayer.equipe.pokemons[0]?.maxHp"></health-bar>
          </div>
        </div>

        <div style="display: flex; z-index: 999;" class="bar">
          <div style="width: 62%;height: 100%;display: flex;justify-content: center;align-items: center;">
            <div
              style="background-color: rgb(175, 175, 175);border-radius: 10px;width: 62%;height: 100%;position: absolute;z-index: 99;"
              v-if="actionplayer.patient">
              {{ actionplayer.text }}
            </div>
            <div style="background-color: rgb(175, 175, 175);border-radius: 10px;" v-if="actionplayer.atkchoose">
              <button @click="attaque(0)" class="btnbaratk">{{ dataplayer.equipe.pokemons[0]?.abilities[0] }}aa</button>
              <button @click="attaque(1)" class="btnbaratk">{{ dataplayer.equipe.pokemons[0]?.abilities[1] }}bb</button>
              <button @click="attaque(2)" class="btnbaratk">{{ dataplayer.equipe.pokemons[0]?.abilities[2] }}cc</button>
              <button @click="attaque(3)" class="btnbaratk">{{ dataplayer.equipe.pokemons[0]?.abilities[3] }}dd</button>
            </div>
            <div style="background-color: rgb(175, 175, 175);border-radius: 10px;" v-if="actionplayer.pkmnlist">
              <button class="btnbarpkmn">{{ dataplayer.equipe.pokemons[0]?.name }}</button>
              <button class="btnbarpkmn">{{ dataplayer.equipe.pokemons[1]?.name }}</button>
              <button class="btnbarpkmn">{{ dataplayer.equipe.pokemons[2]?.name }}</button>
              <button class="btnbarpkmn">{{ dataplayer.equipe.pokemons[3]?.name }}</button>
              <button class="btnbarpkmn">{{ dataplayer.equipe.pokemons[4]?.name }}</button>
              <button class="btnbarpkmn">{{ dataplayer.equipe.pokemons[5]?.name }}</button>
            </div>
          </div>
          <div style="width: 38%;height: 100%;">
            <button style="background: rgb(255, 110, 110);"
              @click="actionplayer.atkchoose = true; actionplayer.pkmnlist = false" class="btnbar">Attaque</button>
            <button style="background: rgb(255, 228, 110);" class="btnbar">Sac</button>
            <button style="background: rgb(110, 255, 146);"
              @click="actionplayer.pkmnlist = true; actionplayer.atkchoose = false" class="btnbar">Pokemon</button>
            <button @click="fuite()" id="fleeButton" style="background: rgb(110, 178, 255);"
              class="btnbar">Fuite</button>
          </div>
        </div>
      </div>
      <canvas class="test" ref="monCanvas"></canvas>
      <div v-if="textImageSequence.length > 0" style="width: 100%;height: 100%; filter: blur(4px) !important; position: absolute; top: 0; left: 0; background: rgb(0 0 0 / 74%); "></div>
      <TextWithImage v-if="textImageSequence.length > 0" :sequence="textImageSequence" @sequence-end="clearSequence" />
    </div>

    <!-- <button @click="toto()">TEST</button> -->
  </div>
</template>

<script>
import { io } from "socket.io-client";
import HealthBar from "./HealthBar.vue";
import TextWithImage from './TextWithImage.vue';
// import navBar from "./NavBar.vue"
/* eslint-disable */

export default {
  components: {
    // navBar
    TextWithImage,
    HealthBar
  },
  data() {
    return {
      textImageSequence: [],
      socket: null,
      storedCallback: null,
      lock: false,
      actionplayer: {
        displayatk: false,
        patient: false,
        atkchoose: false,
        pkmnlist: false,
        text: "pas d'information",
        player: {
          atk1: null,
          atk2: null,
          atk3: null,
          atk4: null,
          pkmn1: null,
          pkmn2: null,
          pkmn3: null,
          pkmn4: null,
          pkmn5: null,
          pkmn6: null,
        }
      },
      datawildPokemon: null,
      dataplayer: null,

      battle: false,
      user: {
        nom: '',
        mdp: ''
      },
      keysPressed: {
        z: false,
        q: false,
        s: false,
        d: false
      },
      foregroundImage: null,
      mapImage: null,
      map: "start",
      players: {},
      currentPlayer: { x: 512, y: 288, targetX: 512, targetY: 288 }, // Ajout de targetX et targetY,


      spriteSheet: null,
      // spriteWidth: 32,  // Change ces valeurs selon la taille de tes sprites
      // spriteHeight: 32,
      spriteAnimations: {
        down: [
          { x: 0, y: 0 },
          { x: 64, y: 0 },
          { x: 128, y: 0 },
          { x: 192, y: 0 }
        ],
        left: [
          { x: 0, y: 64 },
          { x: 64, y: 64 },
          { x: 128, y: 64 },
          { x: 192, y: 64 }
        ],
        right: [
          { x: 0, y: 128 },
          { x: 64, y: 128 },
          { x: 128, y: 128 },
          { x: 192, y: 128 }
        ],
        up: [
          { x: 0, y: 192 },
          { x: 64, y: 192 },
          { x: 128, y: 192 },
          { x: 192, y: 192 }
        ]
      },

      spriteWidth: 64,  // Largeur réelle de chaque sprite
      spriteHeight: 64,



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
    updateTextImageSequence(sentences) {
      const images = this.importAllImages(require.context('@/assets/image', false, /\.(png|jpe?g|svg)$/));

      // Mettre à jour `textImageSequence` avec les sentences reçues du serveur
      this.textImageSequence = sentences.map(sentence => {
        return { text: sentence.text, image: images[sentence.imageName] };
      });
    },
    clearSequence() {
      // Remet à zéro la séquence, ce qui cache le composant enfant
      this.textImageSequence = [];
    },


    espace() {
      console.log('espace');
      if (this.textImageSequence.length <= 0) {
        this.socket.emit('Space', { action: 'Space' });
      }

    },


    attaque(x) {
      if (this.storedCallback) {
        this.socket.emit('actionResponse', { action: 'attack', number: x });
        this.storedCallback = null
      }
    },

    fuite() {
      if (this.storedCallback) {
        console.log('la fuite');
        this.socket.emit('actionResponse', { action: 'flee' });
        this.storedCallback = null
      }
    },

    loadMapImage() {
      this.mapImage = new Image();

      // Gestionnaire d'erreurs pour le chargement de l'image
      this.mapImage.onerror = (err) => {
        console.error('Error loading the image:', err);
      };

      // Une fois l'image chargée, vous pouvez redessiner le canvas (optionnel)
      this.mapImage.onload = () => {
        this.drawPlayers();
      };

      // Définir la source de l'image, ce qui déclenchera le téléchargement de l'image
      this.mapImage.src = require('@/assets/' + this.map + '.png');

    },
    loadForegroundImage() {
      this.foregroundImage = new Image();

      // Gestionnaire d'erreurs pour le chargement de l'image
      this.foregroundImage.onerror = (err) => {
        console.error('Error loading the foreground image:', err);
      };

      // Définir la source de l'image
      this.foregroundImage.src = require('@/assets/' + this.map + '_f.png');
    },
    toto() {
      console.log(this.dataplayer);
    },
    handleKeydown(e) {
      if (Object.prototype.hasOwnProperty.call(this.keysPressed, e.key)) {
        this.keysPressed[e.key] = true;
      }
      if (e.code === 'Space') {
        this.espace();
      }
    },
    handleKeyup(e) {
      if (Object.prototype.hasOwnProperty.call(this.keysPressed, e.key)) {
        this.keysPressed[e.key] = false;

        const player = this.players[this.socket.id];
        if (!this.keysPressed.z && !this.keysPressed.q && !this.keysPressed.s && !this.keysPressed.d) {
          player.isMoving = false;  // Arrête l'animation
          player.animationFrame = 0;  // Remet l'animation à la première image
        }
      }
    },
    animate() {
      const now = Date.now();

      for (const playerId in this.players) {
        const player = this.players[playerId];

        if (player.startTime && player.endTime) {
          const t = (now - player.startTime) / (player.endTime - player.startTime);

          if (t < 1) {
            player.x = player.startX + t * (player.targetX - player.startX);
            player.y = player.startY + t * (player.targetY - player.startY);
            player.animationFrame += 0.03;  // Ajuste la vitesse d'animation
          } else {
            player.x = player.targetX;
            player.y = player.targetY;
            delete player.startX;
            delete player.startY;
            delete player.startTime;
            delete player.endTime;
          }
        }
      }

      this.drawPlayers();
      window.requestAnimationFrame(this.animate.bind(this));
    }

    ,
    clearAllPlayers() {
      const currentPlayerId = this.socket.id;
      for (const id in this.players) {
        if (id !== currentPlayerId) {
          this.$delete(this.players, id);
        }
      }
    }
    ,
    updatePlayerPosition() {
      let action = null;
      if (this.keysPressed.z) action = 'move_z';
      if (this.keysPressed.q) action = 'move_q';
      if (this.keysPressed.s) action = 'move_s';
      if (this.keysPressed.d) action = 'move_d';

      if (action && !this.lock) {
        this.socket.emit('playerAction', action);

        const player = this.players[this.socket.id];
        player.direction = this.getDirectionFromAction(action);  // Une fonction pour déterminer la direction
        player.isMoving = true;
      }
    },
    getDirectionFromAction(action) {
      switch (action) {
        case 'move_z': return 'up';
        case 'move_q': return 'left';
        case 'move_s': return 'down';
        case 'move_d': return 'right';
      }
    },
    drawPlayers() {
      const canvas = this.$refs.monCanvas;
      const c = canvas.getContext('2d');

      // Clear the canvas for the new render
      c.clearRect(0, 0, canvas.width, canvas.height);

      // Fill the canvas with the map image
      if (this.mapImage) {
        c.drawImage(this.mapImage, 0, 0, canvas.width, canvas.height);
      }

      // Loop through all the players and draw them
      for (const playerId in this.players) {
        const player = this.players[playerId];

        // Définit une direction par défaut si la direction actuelle est indéfinie
        if (!player.direction) {
          player.direction = 'down';  // Définit la direction par défaut
        }

        const animation = this.spriteAnimations[player.direction];

        // Vérifie si l'animation est valide
        if (animation) {
          // Vérifie que player.animationFrame est un nombre
          if (typeof player.animationFrame !== 'number') {
            console.error(`Invalid animationFrame for player: ${player.animationFrame}`);
            player.animationFrame = 0;  // Remet à zéro si ce n'est pas un nombre
          }

          // Vérifie que animation.length est un nombre valide
          if (typeof animation.length !== 'number' || animation.length <= 0) {
            console.error(`Invalid animation length for direction: ${player.direction}`);
            continue;  // Ignore ce joueur si l'animation est invalide
          }

          const currentFrame = Math.floor(player.animationFrame) % animation.length;
          const sprite = animation[currentFrame];

          // Assure-toi que le sprite existe avant d'essayer de dessiner
          if (sprite) {
            c.drawImage(
              this.spriteSheet,
              sprite.x, sprite.y, this.spriteWidth, this.spriteHeight,
              player.x - 32, player.y - 42, this.spriteWidth, this.spriteHeight  // Décale la position Y de 32 pixels
            );
          } else {
            console.error(`Invalid sprite frame: ${currentFrame}`);
          }
        } else {
          console.error(`Invalid direction: ${player.direction}`);
        }
      }

      // Dessiner les éléments de premier plan si nécessaire
      if (this.foregroundImage) {
        c.drawImage(this.foregroundImage, 0, 0, canvas.width, canvas.height);
      }
    },








  },
  mounted() {



    this.loadMapImage();
    this.loadForegroundImage();
    // const userId = 1;
    const moveDelay = 180;
    const user = localStorage.getItem('user');
    const parsedUser = JSON.parse(user);
    const userId = parsedUser.id;

    this.socket = io("http://localhost:3000", {
      query: { userId: userId }
    });

    this.socket.on("connect", () => {
      console.log(`Connecté au serveur en tant qu'utilisateur ${userId}`);
    });

    this.socket.on('playersList', (allPlayers) => {
      console.log('Mise à jour de la liste des joueurs:', allPlayers);
      this.players = allPlayers;
    });

    this.socket.on('playerLeft', (id) => {
      console.log('le player qui leave', id);

      delete this.players[id]
      // this.drawPlayers();
    });

    this.socket.on('dialogue', (sentences) => {
      if (sentences && sentences.length > 0) {
        this.updateTextImageSequence(sentences);
      } else {
        this.textImageSequence = []; // Réinitialiser si rien n'est reçu
      }
    });

    this.socket.on('newPlayer', ({ id, player }) => {
      this.$set(this.players, id, player);
      console.log('new player tsurement');
    });



    this.socket.on('endbattle', (data) => {
      console.log('Fin ???');
      this.battle = false;
      this.lock = false;
      console.log('endbattle');
      // console.log('la liste des joueurs:', this.players);
    });

    this.socket.on('playerMoved', ({ id, player }) => {
      console.log('il mouve uwu');
      if (this.players[id]) {
        this.players[id].startX = this.players[id].x;
        this.players[id].startY = this.players[id].y;
        this.players[id].targetX = player.x;
        this.players[id].targetY = player.y;
        this.players[id].startTime = Date.now();
        this.players[id].endTime = this.players[id].startTime + moveDelay;
      }
      // console.log('le player qui bouge :', this.players[id]);
    });

    this.socket.on('newmap', ({ mapname, playersList }) => {
      this.clearAllPlayers();
      this.players = playersList
      // console.log( playersList,'laplayerlist..');
      this.$set(this.players, this.socket.id, {
        x: this.currentX,
        y: this.currentY,
      });

      this.map = mapname;
      this.loadMapImage();
      this.loadForegroundImage();
      this.drawPlayers();
    });

    this.socket.on('playerDisconnected', ({ id }) => {
      this.$delete(this.players, id);
    });

    this.socket.on('playerJoined', (data) => {
      this.players[data.id] = data.player;
      // console.log('la liste des joueurs:', this.players);
    });

    this.socket.on("connect_error", (error) => {
      console.log("Erreur de connexion au serveur:", error);
    });


    this.socket.on('battletrigger', (data) => {
      console.log(data.message);  // Affichera "Vous avez déclenché la condition!"
      // Vous pouvez effectuer d'autres actions ici, comme afficher une alerte, mettre à jour l'interface utilisateur, etc.
      // alert(data.message);
      this.battle = true;
    });

    this.socket.on('update', (data) => {
      this.currentPlayer.targetX = data.player.x;
      this.currentPlayer.targetY = data.player.y;
    });


    this.socket.on('requestAction', (data) => {
      console.log(data.message);
      this.storedCallback = 1
      
      // socket.emit('actionResponse', { action: 'attack' });
    });


    this.socket.on('introAnimation', (data) => {
      // Ici, data contiendra les données envoyées par le serveur
      const player = data.player;
      const wildPokemon = data.wildPokemon;

      // Faites quelque chose avec les données récupérées
      // console.log('Données reçues :', player, wildPokemon);
      this.lock = true;
      this.dataplayer = player;
      this.datawildPokemon = wildPokemon
      // Vous pouvez maintenant utiliser player et wildPokemon comme bon vous semble dans votre application cliente.
    });




    window.addEventListener('keydown', this.handleKeydown);
    window.addEventListener('keyup', this.handleKeyup);

    const canvas = this.$refs.monCanvas;
    canvas.width = 28 * 16 * 2;
    canvas.height = 20 * 16 * 2;

    this.animate();  // Démarrez la boucle d'animation
    setInterval(this.updatePlayerPosition, 20);






    this.spriteSheet = new Image();
    this.spriteSheet.src = require('@/assets/sprite.png');  // Remplace par le bon chemin

    this.spriteSheet.onload = () => {
      console.log('SpriteSheet loaded!');
      this.animate();  // Démarrez la boucle d'animation après le chargement des sprites
    };




  }
  ,
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleKeydown);
    window.removeEventListener('keyup', this.handleKeyup);
    if (this.socket) {
      this.socket.disconnect();
    }
  }
};
</script>


<style>
.btnbar {
  border-radius: 8px;
  width: 155px;
  height: 50px;
  margin: 5px;
}

body {
  overflow: hidden;
}

.btnbaratk {
  border-radius: 8px;
  width: 260px;
  height: 50px;
  margin: 5px;
}

.btnbarpkmn {
  border-radius: 8px;
  width: 80px;
  height: 100px;
  margin: 5px;
}

.bar {
  width: 100%px;
  height: 120px;
  background-color: rgb(190, 190, 190);
  top: 70%;
  position: relative;
  border-radius: 10px;
}

* {
  font-family: 'Press Start 2P', cursive;
  box-sizing: border-box;
}

body {
  background-color: black;
}

h1 {
  margin: 0;
}

button {
  border: 0;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #ddd;
}

.test {
  margin-top: 10%;
}

.battle {
  background-color: black;
  width: 896px;
  height: 670px;
  position: absolute;
  margin-top: 9.5%;
  left: 50%;
  transform: translate(-50%);
  -webkit-animation: flicker-in-1 2s linear both;
  animation: flicker-in-1 2s linear both;
}

@-webkit-keyframes flicker-in-1 {
  0% {
    opacity: 0;
  }

  10% {
    opacity: 0;
  }

  10.1% {
    opacity: 1;
  }

  10.2% {
    opacity: 0;
  }

  20% {
    opacity: 0;
  }

  20.1% {
    opacity: 1;
  }

  20.6% {
    opacity: 0;
  }

  30% {
    opacity: 0;
  }

  30.1% {
    opacity: 1;
  }

  30.5% {
    opacity: 1;
  }

  30.6% {
    opacity: 0;
  }

  45% {
    opacity: 0;
  }

  45.1% {
    opacity: 1;
  }

  50% {
    opacity: 1;
  }

  55% {
    opacity: 1;
  }

  55.1% {
    opacity: 0;
  }

  57% {
    opacity: 0;
  }

  57.1% {
    opacity: 1;
  }

  60% {
    opacity: 1;
  }

  60.1% {
    opacity: 0;
  }

  65% {
    opacity: 0;
  }

  65.1% {
    opacity: 1;
  }

  75% {
    opacity: 1;
  }

  75.1% {
    opacity: 0;
  }

  77% {
    opacity: 0;
  }

  77.1% {
    opacity: 1;
  }

  85% {
    opacity: 1;
  }

  85.1% {
    opacity: 0;
  }

  86% {
    opacity: 0;
  }

  86.1% {
    opacity: 1;
  }

  100% {
    opacity: 1;
  }
}

@keyframes flicker-in-1 {
  0% {
    opacity: 0;
  }

  10% {
    opacity: 0;
  }

  10.1% {
    opacity: 1;
  }

  10.2% {
    opacity: 0;
  }

  20% {
    opacity: 0;
  }

  20.1% {
    opacity: 1;
  }

  20.6% {
    opacity: 0;
  }

  30% {
    opacity: 0;
  }

  30.1% {
    opacity: 1;
  }

  30.5% {
    opacity: 1;
  }

  30.6% {
    opacity: 0;
  }

  45% {
    opacity: 0;
  }

  45.1% {
    opacity: 1;
  }

  50% {
    opacity: 1;
  }

  55% {
    opacity: 1;
  }

  55.1% {
    opacity: 0;
  }

  57% {
    opacity: 0;
  }

  57.1% {
    opacity: 1;
  }

  60% {
    opacity: 1;
  }

  60.1% {
    opacity: 0;
  }

  65% {
    opacity: 0;
  }

  65.1% {
    opacity: 1;
  }

  75% {
    opacity: 1;
  }

  75.1% {
    opacity: 0;
  }

  77% {
    opacity: 0;
  }

  77.1% {
    opacity: 1;
  }

  85% {
    opacity: 1;
  }

  85.1% {
    opacity: 0;
  }

  86% {
    opacity: 0;
  }

  86.1% {
    opacity: 1;
  }

  100% {
    opacity: 1;
  }
}
</style>