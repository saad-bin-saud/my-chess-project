const { Chess } = require('chess.js')

function createGameEngine(io) {
  // in-memory state
  const games = new Map()
  const matchQueue = []
  const socketToRoom = new Map()

  function tryMatchmake() {
    while (matchQueue.length >= 2) {
      const a = matchQueue.shift()
      const b = matchQueue.shift()
      const roomId = 'room_' + Math.random().toString(36).slice(2,9)
      const pick = Math.random() < 0.5
      const white = pick ? a : b
      const black = pick ? b : a
      const entry = { game: new Chess(), moves: [], chat: [], players: { white, black } }
      games.set(roomId, entry)
      const sockA = io.sockets.sockets.get(a)
      const sockB = io.sockets.sockets.get(b)
      if (sockA) { sockA.join(roomId); socketToRoom.set(a, roomId) }
      if (sockB) { sockB.join(roomId); socketToRoom.set(b, roomId) }
      if (sockA) sockA.emit('match_found', { roomId, color: white === a ? 'w' : 'b' })
      if (sockB) sockB.emit('match_found', { roomId, color: white === b ? 'w' : 'b' })
      io.to(roomId).emit('state', { fen: entry.game.fen(), players: entry.players })
    }
  }

  io.on('connection', (socket) => {
    console.log('socket connected', socket.id)

    socket.on('join', (roomId) => {
      if (!roomId) return
      socket.join(roomId)
      socketToRoom.set(socket.id, roomId)
      if (!games.has(roomId)) {
        games.set(roomId, { game: new Chess(), moves: [], chat: [], players: {} })
      }
      const entry = games.get(roomId)
      socket.emit('state', { fen: entry.game.fen(), players: entry.players || {} })
    })

    socket.on('find_match', () => {
      if (matchQueue.includes(socket.id)) return
      matchQueue.push(socket.id)
      socket.emit('queue_update', { position: matchQueue.indexOf(socket.id) + 1 })
      tryMatchmake()
    })

    socket.on('cancel_find', () => {
      const idx = matchQueue.indexOf(socket.id)
      if (idx >= 0) matchQueue.splice(idx, 1)
      socket.emit('queue_update', { position: -1 })
    })

    socket.on('move', ({ roomId, from, to, promotion }) => {
      const entry = games.get(roomId)
      if (!entry) return socket.emit('error', 'no such room')
      const game = entry.game
      const players = entry.players || {}
      const socketColor = players.white === socket.id ? 'w' : (players.black === socket.id ? 'b' : null)
      if (!socketColor) return socket.emit('move_result', { ok: false, error: 'not a player' })
      if (game.turn() !== socketColor) return socket.emit('move_result', { ok: false, error: 'not your turn' })
      const move = game.move({ from, to, promotion: promotion || undefined })
      if (move === null) {
        socket.emit('move_result', { ok: false, error: 'invalid move' })
      } else {
        entry.moves.push(move)
        io.to(roomId).emit('move_result', { ok: true, move, fen: game.fen() })
        io.to(roomId).emit('state', { fen: game.fen(), lastMove: move, players: entry.players })
      }
    })

    socket.on('chat', ({ roomId, from, message }) => {
      if (!roomId || !message) return
      const payload = { from: from || socket.id, message, ts: Date.now() }
      const entry = games.get(roomId)
      if (entry) entry.chat.push(payload)
      io.to(roomId).emit('chat', payload)
    })

    socket.on('disconnect', () => {
      console.log('socket disconnected', socket.id)
      const qidx = matchQueue.indexOf(socket.id)
      if (qidx >= 0) matchQueue.splice(qidx, 1)
      const roomId = socketToRoom.get(socket.id)
      if (roomId) {
        const entry = games.get(roomId)
        if (entry && entry.players) {
          const { white, black } = entry.players
          const otherId = white === socket.id ? black : (black === socket.id ? white : null)
          if (otherId) {
            const other = io.sockets.sockets.get(otherId)
            if (other) other.emit('player_left', { reason: 'opponent disconnected' })
          }
        }
        socketToRoom.delete(socket.id)
      }
    })
  })

  return { io, games, matchQueue, socketToRoom }
}

module.exports = { createGameEngine }
