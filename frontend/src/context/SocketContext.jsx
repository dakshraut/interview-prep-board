import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ Socket.IO connected:', newSocket.id);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('⚠️ Socket.IO disconnected:', reason);
    });

    newSocket.on('error', (error) => {
      console.error('❌ Socket.IO error:', error);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
        console.log('Socket disconnected');
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};