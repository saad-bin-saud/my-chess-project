import React, { useEffect, useRef, useState } from 'react'
import io from 'socket.io-client'
import { Chess } from 'chess.js'

export default function ChessBoardComponent() {
  const boardRef = useRef(null)
  const socketRef = useRef(null)
  const [fen, setFen] = useState('start')
  const [roomId] = useState('room1')
  const chessRef = useRef(new Chess())

  useEffect(() => {
    // init socket
    socketRef.current = io('http://localhost:3000')
    socketRef.current.on('connect', () => console.log('connected to server'))
    socketRef.current.emit('join', roomId)
    socketRef.current.on('state', (data) => {
      if (data && data.fen) {
        chessRef.current.load(data.fen)
        setFen(data.fen)
      }
    })
    socketRef.current.on('move_result', (data) => {
      if (data && data.ok && data.fen) {
        chessRef.current.load(data.fen)
        setFen(data.fen)
      }
    })

    return () => socketRef.current.disconnect()
  }, [roomId])

  // simple click move from/to using prompt (temporary UI)
  function makeMove() {
    const from = prompt('from (e.g. e2)')
    const to = prompt('to (e.g. e4)')
    if (!from || !to) return
    socketRef.current.emit('move', { roomId, from, to })
  }

  return (
    <div>
      <div id="board" ref={boardRef} style={{ width: 400 }} />
      <div style={{ marginTop: 12, textAlign: 'center' }}>
        <button onClick={makeMove}>Make move (prompt)</button>
        <div style={{ marginTop: 8 }}>FEN: {fen}</div>
      </div>
    </div>
  )
}
