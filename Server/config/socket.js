// Socket.io setup: two room types —
// issue:{id} (anyone viewing that issue's detail page) and user:{id}
// (a specific user's personal notification channel). This module exports
// an `init(httpServer)` called once from server.js, plus small emit
// helpers controllers can import directly without touching the `io`
// instance or worrying about whether sockets are even connected.
//
// NOT built yet, deliberately: joining user:{id} rooms requires the client
// to authenticate the socket connection (e.g. passing the JWT on connect)
// and the server to verify it — that pairs naturally with the Phase 10
// notification bell work, where user-room events are actually consumed.
// For now, only the issue:{id} room and unauthenticated global broadcasts
// are wired, since those are what this phase's features need.

let io = null;

const init = (httpServer) => {
  const socketIo = require('socket.io');
  io = new socketIo.Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // A client explicitly asks to join the room for the issue detail page
    // it currently has open — the server never assigns this automatically.
    socket.on('joinIssueRoom', (issueId) => {
      if (typeof issueId === 'string') {
        socket.join(`issue:${issueId}`);
      }
    });

    socket.on('leaveIssueRoom', (issueId) => {
      if (typeof issueId === 'string') {
        socket.leave(`issue:${issueId}`);
      }
    });
  });

  return io;
};

// Emits to everyone currently viewing one specific issue's detail page.
// Safe to call even if Socket.io hasn't been initialized (e.g. in a unit
// test that imports the controller without booting the full server) —
// it just silently no-ops instead of throwing.
const emitToIssueRoom = (issueId, event, payload) => {
  if (!io) return;
  io.to(`issue:${issueId}`).emit(event, payload);
};

// Emits to every connected client — used for the admin dashboard's live
// new-issue counter, since no dedicated admin room exists yet.
const emitGlobal = (event, payload) => {
  if (!io) return;
  io.emit(event, payload);
};

module.exports = { init, emitToIssueRoom, emitGlobal };
