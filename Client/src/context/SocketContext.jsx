/*
 * Scope note: this only supports what config/socket.js on the backend
 * actually implements as of Phase 5 — joining/leaving an issue:{id} room,
 * and receiving unscoped global broadcasts (like the admin dashboard's
 * newIssue counter). There is NO authenticated user:{id} personal room
 * yet; that pairs with the Phase 10 notification-bell work, where the
 * socket connection itself will need to prove which user it belongs to.
// Don't build anything here that assumes a user-scoped event exists.
*/

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl, { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinIssueRoom = (issueId) => socketRef.current?.emit('joinIssueRoom', issueId);
  const leaveIssueRoom = (issueId) => socketRef.current?.emit('leaveIssueRoom', issueId);

  const value = { socket: socketRef.current, connected, joinIssueRoom, leaveIssueRoom };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
