<template>
  <div style="background-color: black;">
    <canvas ref="monCanvas"></canvas>
  </div>
</template>

<script>
import { io } from "socket.io-client";

export default {
  data() {
    return {
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
      currentPlayer: { x: 512, y: 288, targetX: 512, targetY: 288 } // Ajout de targetX et targetY
    };
  },
  methods: {
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
      if (this.currentPlayer) {
        this.currentPlayer.x += (this.currentPlayer.targetX - this.currentPlayer.x) * 0.1;
        this.currentPlayer.y += (this.currentPlayer.targetY - this.currentPlayer.y) * 0.1;

        this.drawPlayer();
      }
      window.requestAnimationFrame(this.animate);
    },
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
    drawPlayer() {
      const canvas = this.$refs.monCanvas;
      const c = canvas.getContext('2d');

      c.clearRect(0, 0, canvas.width, canvas.height);
      c.fillStyle = 'white';
      c.fillRect(0, 0, canvas.width, canvas.height);

      if (this.currentPlayer) {
        c.beginPath();
        c.arc(this.currentPlayer.x, this.currentPlayer.y, 20, 0, Math.PI * 2, false);
        c.fillStyle = 'red';
        c.fill();
        c.closePath();
      }
    }
  },
  mounted() {
    const userId = "USER_ID_HERE";

    this.socket = io("http://localhost:3000", {
      query: { userId: userId }
    });

    this.socket.on("connect", () => {
      console.log(`Connecté au serveur en tant qu'utilisateur ${userId}`);
    });

    this.socket.on("connect_error", (error) => {
      console.log("Erreur de connexion au serveur:", error);
    });

    window.addEventListener('keydown', this.handleKeydown);
    window.addEventListener('keyup', this.handleKeyup);

    this.socket.on('update', (data) => {
      // Mettez à jour uniquement targetX et targetY à partir des données du serveur
      this.currentPlayer.targetX = data.player.x;
      this.currentPlayer.targetY = data.player.y;
    });

    const canvas = this.$refs.monCanvas;
    canvas.width = 1024;
    canvas.height = 576;

    this.animate();  // Démarrez la boucle d'animation
    setInterval(this.updatePlayerPosition, 100);
  },
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
</style>