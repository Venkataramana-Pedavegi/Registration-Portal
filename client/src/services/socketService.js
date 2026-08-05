import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const initSocketClient = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to Socket.IO real-time server');
    });

    socket.on('disconnect', () => {
      console.log('⚡ Disconnected from Socket.IO server');
    });
  }
  return socket;
};

export const subscribeToUserNotifications = (userId, callback) => {
  const socketInstance = initSocketClient();
  if (userId) {
    socketInstance.emit('join_room', `user_${userId}`);
  }
  socketInstance.on('notification', callback);
  return () => {
    socketInstance.off('notification', callback);
  };
};

export default initSocketClient;
