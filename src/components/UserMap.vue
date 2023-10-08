<template>
  <div style="background-color: black;">
    <!-- <navBar></navBar> -->
    <div>
      <div v-if="battle" class="battle"></div>
      <canvas class="test" ref="monCanvas"></canvas>
    </div>

    <!-- <button @click="toto()">TEST</button> -->
  </div>
</template>

<script>
import { io } from "socket.io-client";
// import navBar from "./NavBar.vue"
/* eslint-disable */

export default {
  components: {
    // navBar
  },
  data() {
    return {
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
      map: "pk1",
      players: {},
      currentPlayer: { x: 512, y: 288, targetX: 512, targetY: 288 } // Ajout de targetX et targetY
    };
  },
  methods: {
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
    // toto() {
    //   console.log(this.players);
    // },
    handleKeydown(e) {
      if (Object.prototype.hasOwnProperty.call(this.keysPressed, e.key)) {
        this.keysPressed[e.key] = true;
      }
    },
    handleKeyup(e) {
      if (Object.prototype.hasOwnProperty.call(this.keysPressed, e.key)) {
        this.keysPressed[e.key] = false;
      }
    },
    animate() {
      const now = Date.now();

      for (const playerId in this.players) {
        const player = this.players[playerId];

        if (player.startTime && player.endTime) {
          const t = (now - player.startTime) / (player.endTime - player.startTime);

          if (t < 1) {  // Si le mouvement n'est pas terminé
            player.x = player.startX + t * (player.targetX - player.startX);
            player.y = player.startY + t * (player.targetY - player.startY);
          } else {
            player.x = player.targetX;
            player.y = player.targetY;
            // Réinitialisez les propriétés de l'interpolation pour éviter des calculs inutiles.
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

      if (action) {
        this.socket.emit('playerAction', action);
      }
    },
    drawPlayers() {
      const canvas = this.$refs.monCanvas;
      const c = canvas.getContext('2d');

      // Clear the canvas for the new render
      c.clearRect(0, 0, canvas.width, canvas.height);

      // Fill the canvas with white
      if (this.mapImage) {
        c.drawImage(this.mapImage, 0, 0, canvas.width, canvas.height);
      }

      // Loop through all the players and draw them
      for (const playerId in this.players) {

        let player = this.players[playerId];
        c.beginPath();
        c.arc(player.x, player.y, 13, 0, Math.PI * 2, false);
        c.fillStyle = (playerId === this.currentPlayerId) ? 'red' : 'blue';  // Different color for the current player
        if (this.keysPressed.z != false)
          c.fillStyle = 'red';
        else if (this.keysPressed.q != false)
          c.fillStyle = 'purple';
        else if (this.keysPressed.d != false)
          c.fillStyle = 'cyan';
        else if (this.keysPressed.s != false)
          c.fillStyle = 'green';
        c.fill();
        c.closePath();
      }
      if (this.foregroundImage) {
        c.drawImage(this.foregroundImage, 0, 0, canvas.width, canvas.height);
      }
    }


  },
  mounted() {
    this.loadMapImage();
    this.loadForegroundImage();
    const userId = "USER_ID_HERE";
    const moveDelay = 180;

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

    this.socket.on('newPlayer', ({ id, player }) => {
      this.$set(this.players, id, player);
      console.log('new player tsurement');
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


    this.socket.on('requestAction', (dataFromServer) => {
      console.log(dataFromServer.message);
      // // Vous pouvez maintenant permettre à l'utilisateur de répondre à l'action
      // // Par exemple, à l'aide d'un formulaire ou d'une interface utilisateur
      // // Lorsque l'utilisateur prend une action, vous pouvez émettre une réponse au serveur
      // const userResponse = {
      //   action: 'attack', // Remplacez par l'action choisie par l'utilisateur
      //   // ... autres données liées à l'action
      // };
      // // Émettez la réponse au serveur
      // socket.emit('userResponse', userResponse);
    });
    this.socket.on('introAnimation', (data) => {
      // Ici, data contiendra les données envoyées par le serveur
      const player = data.player;
      const wildPokemon = data.wildPokemon;

      // Faites quelque chose avec les données récupérées
      console.log('Données reçues :', player, wildPokemon);

      // Vous pouvez maintenant utiliser player et wildPokemon comme bon vous semble dans votre application cliente.
    });



    window.addEventListener('keydown', this.handleKeydown);
    window.addEventListener('keyup', this.handleKeyup);

    const canvas = this.$refs.monCanvas;
    canvas.width = 28 * 16 * 2;
    canvas.height = 20 * 16 * 2;

    this.animate();  // Démarrez la boucle d'animation
    setInterval(this.updatePlayerPosition, 20);
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