const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Chess } = require('chess.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

// Simple in-memory games map: roomId -> { game }
const games = new Map();

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('join', (roomId) => {
    socket.join(roomId);
    if (!games.has(roomId)) {
      games.set(roomId, { game: new Chess() });
    }
    const state = games.get(roomId).game.fen();
    socket.emit('state', { fen: state });
  });

  socket.on('move', ({ roomId, from, to, promotion }) => {
    const entry = games.get(roomId);
    if (!entry) return socket.emit('error', 'no such room');
    const game = entry.game;
    const move = game.move({ from, to, promotion: promotion || 'q' });
    if (move === null) {
      socket.emit('move_result', { ok: false });
    } else {
      // broadcast new position to room
      io.to(roomId).emit('move_result', { ok: true, move, fen: game.fen() });
    }
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id);
  });
});

app.get('/', (req, res) => res.send('Socket.IO chess server'));

server.listen(PORT, () => console.log('Server listening on', PORT));
