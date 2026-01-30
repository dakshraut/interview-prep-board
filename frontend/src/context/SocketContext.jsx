import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Get tokens from localStorage
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!token || !refreshToken) {
      console.log('⚠️ No authentication tokens available for Socket.IO');
      return;
    }

    // Initialize socket connection with authentication
    const newSocket = io('http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: {
        token: token,
        refreshToken: refreshToken
      }
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ Socket.IO connected:', newSocket.id);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error.message);
      
      // If token expired, the API interceptor will handle refresh
      // and the socket will reconnect with new token on next attempt
    });

    newSocket.on('disconnect', (reason) => {
      console.log('⚠️ Socket.IO disconnected:', reason);
    });

    newSocket.on('error', (error) => {
      console.error('❌ Socket.IO error:', error);
    });

    // Listen for authentication errors and trigger re-auth
    newSocket.on('auth_error', (error) => {
      console.error('❌ Socket authentication error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
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