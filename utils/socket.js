import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

let socket = null;

// Initialize socket connection
export const initSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

// Get existing socket instance
export const getSocket = () => socket;

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Hook for using socket in components
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (!token) return;

    // Initialize socket
    socketRef.current = initSocket(token);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socketRef.current.on('connect', onConnect);
    socketRef.current.on('disconnect', onDisconnect);

    // Check initial connection state
    setIsConnected(socketRef.current.connected);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect', onConnect);
        socketRef.current.off('disconnect', onDisconnect);
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected
  };
};