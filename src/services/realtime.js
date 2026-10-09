import { io } from 'socket.io-client';

const socketOrigin = process.env.VUE_APP_SOCKET_URL
  || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

export function createGameSocket(token) {
  return io(socketOrigin, {
    auth: { token },
    transports: ['websocket', 'polling']
  });
}
