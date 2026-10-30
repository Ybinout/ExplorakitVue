import { io } from 'socket.io-client';

const socketOrigin = process.env.VUE_APP_SOCKET_URL
  || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

export function bindSessionReplacement(socket, onReplaced) {
  let replaced = false;
  const stop = () => {
    if (replaced) return;
    replaced = true;
    socket.disconnect();
    // Tabs share localStorage: clearing it here would log out the new tab too.
    onReplaced();
  };
  socket.on('session:replaced', stop);
  socket.on('drift:replaced', stop);
}

export function createGameSocket(token, { mirrorRift = false, adventureOpening = false } = {}) {
  return io(socketOrigin, {
    path: `${process.env.BASE_URL || '/'}socket.io`,
    auth: { token, rewardPlayback:true, ...(mirrorRift ? { mirrorRift:true } : {}), ...(adventureOpening ? { adventureOpening:true } : {}) },
    // v4.7 does not try the next transport after a blocked WebSocket handshake.
    // Establish HTTP first, then let Engine.IO upgrade when WebSocket is usable.
    transports: ['polling', 'websocket']
  });
}

export function createDriftSocket(token) {
  return io(`${socketOrigin.replace(/\/$/, '')}/drift`, {
    path: `${process.env.BASE_URL || '/'}socket.io`,
    auth: { token, rewardPlayback:true }, autoConnect: false, transports: ['polling', 'websocket']
  });
}

export function isSessionConnectionFailure(error) {
  return ['Authentification requise.', 'Session invalide ou expirée.'].includes(
    typeof error?.message === 'string' ? error.message.trim() : ''
  );
}

export function getDriftConnectionFailure(error) {
  const message = typeof error?.message === 'string' ? error.message.trim() : '';
  if (isSessionConnectionFailure(error)) {
    return {
      kind: 'session',
      message: 'Ta session de compte est invalide ou a expiré. Reconnecte-toi pour rejoindre le camp.'
    };
  }
  if (message === 'Invalid namespace') {
    return {
      kind: 'server',
      message: 'Le serveur lancé ne dispose pas encore du mode Drift. Mets-le à jour ou redémarre-le, puis réessaie.'
    };
  }
  return {
    kind: 'network',
    message: 'Le serveur ne répond pas. Vérifie qu’il est lancé et que ta connexion fonctionne, puis réessaie.'
  };
}
