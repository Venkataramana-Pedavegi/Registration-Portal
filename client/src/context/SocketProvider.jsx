import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Real-time Socket.IO connected: ', socketInstance.id);
      
      // Join standard rooms
      socketInstance.emit('join_room', `user_${user.id}`);
      if (user.role === 'Admin' || ['Admin', 'Super Admin', 'Event Coordinator', 'Faculty Coordinator'].includes(user.role)) {
        socketInstance.emit('join_room', 'admin-dashboard');
      } else {
        socketInstance.emit('join_room', 'students');
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('⚡ Real-time Socket.IO disconnected:', reason);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
