import { io } from 'socket.io-client';

const socketOrigin = process.env.VUE_APP_SOCKET_URL
  || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

export function createGameSocket(token) {
  return io(socketOrigin, {
    path: `${process.env.BASE_URL || '/'}socket.io`,
    auth: { token },
    transports: ['websocket', 'polling']
  });
}

export function createDriftSocket(token) {
  return io(`${socketOrigin.replace(/\/$/, '')}/drift`, {
    path: `${process.env.BASE_URL || '/'}socket.io`,
    auth: { token }, autoConnect: false, transports: ['websocket', 'polling']
  });
}

export function getDriftConnectionFailure(error) {
  const message = typeof error?.message === 'string' ? error.message.trim() : '';
  if (message === 'Authentification requise.' || message === 'Session invalide ou expirée.') {
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
