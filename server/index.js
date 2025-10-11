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

const { createGameEngine } = require('./gameEngine')

// initialize engine
const engine = createGameEngine(io)

// expose internal state for debugging (optional)
io.engineState = { games: engine.games, queue: engine.matchQueue }

app.get('/', (req, res) => res.send('Socket.IO chess server'));

server.listen(PORT, () => console.log('Server listening on', PORT));
