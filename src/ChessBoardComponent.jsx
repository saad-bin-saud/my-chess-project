import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import io from 'socket.io-client'

export default function ChessBoardComponent() {
  const socketRef = useRef(null)
  const [fen, setFen] = useState('start')
  const [roomId] = useState('room1')
  const chessRef = useRef(new Chess())
  const [promotion, setPromotion] = useState(null)
  const [lastMove, setLastMove] = useState(null)
  const [currentTurn, setCurrentTurn] = useState('w')

  useEffect(() => {
    socketRef.current = io('http://localhost:3000')
    socketRef.current.on('connect', () => console.log('connected to server'))
    socketRef.current.emit('join', roomId)
    socketRef.current.on('state', (data) => {
      if (data && data.fen) {
        chessRef.current.load(data.fen)
        setFen(data.fen)
        setCurrentTurn(chessRef.current.turn())
      }
    })
    socketRef.current.on('move_result', (data) => {
      if (data && data.ok && data.fen) {
        chessRef.current.load(data.fen)
        setFen(data.fen)
        setCurrentTurn(chessRef.current.turn())
        if (data.move) setLastMove({ from: data.move.from, to: data.move.to })
      }
    })

    return () => socketRef.current.disconnect()
  }, [roomId])

  // Called when a piece is dropped on a square (drag or click-to-move)
  const onPieceDrop = useCallback((sourceSquare, targetSquare) => {
    // detect pawn promotion situation
    const piece = chessRef.current.get(sourceSquare)
    const isPawn = piece && piece.type === 'p'
    const targetRank = targetSquare[1]
    if (isPawn && ((piece.color === 'w' && targetRank === '8') || (piece.color === 'b' && targetRank === '1'))) {
      // show promotion picker and don't perform the move until choice
      setPromotion({ from: sourceSquare, to: targetSquare, color: piece.color })
      return false
    }

    // Normal move (no promotion) - try locally and emit to server
    return sendMove(sourceSquare, targetSquare)
  }, [roomId])

  // sendMove returns true if move applied locally
  const sendMove = useCallback((from, to, promotionChoice) => {
    const movePayload = promotionChoice ? { from, to, promotion: promotionChoice } : { from, to }
    const move = chessRef.current.move(movePayload)
    if (move === null) {
      return false
    }
    setFen(chessRef.current.fen())
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('move', { roomId, ...movePayload })
    }
    return true
  }, [roomId])

  return (
    <div>
      <div style={{ width: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 12, background: '#fff', border: currentTurn === 'w' ? '3px solid #4CAF50' : '1px solid #888' }} />
            <div style={{ fontSize: 14 }}>White</div>
          </div>
          <div style={{ fontSize: 14, color: '#666' }}>to move</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 14 }}>Black</div>
            <div style={{ width: 12, height: 12, borderRadius: 12, background: '#000', border: currentTurn === 'b' ? '3px solid #4CAF50' : '1px solid #888' }} />
          </div>
        </div>
        <Chessboard
          position={fen}
          onPieceDrop={onPieceDrop}
          boardWidth={480}
          customSquareStyles={(() => {
            const styles = {}
            if (lastMove) {
              styles[lastMove.from] = { background: 'rgba(255,149,0,0.6)' }
              styles[lastMove.to] = { background: 'rgba(255,149,0,0.9)' }
            }
            return styles
          })()}
        />
      </div>
      {promotion && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(0,0,0,0.6)', padding: 20, borderRadius: 8 }}>
            <div style={{ color: '#fff', marginBottom: 8 }}>Choose promotion:</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['q', 'r', 'b', 'n'].map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    sendMove(promotion.from, promotion.to, p)
                    setPromotion(null)
                  }}
                  style={{ padding: '8px 12px', fontSize: 16 }}
                >
                  {p.toUpperCase()}
                </button>
              ))}
              <button
                onClick={() => setPromotion(null)}
                style={{ padding: '8px 12px', fontSize: 16, background: '#444', color: '#fff' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ marginTop: 12, textAlign: 'center' }}>
        <div style={{ marginTop: 8 }}>FEN: {fen}</div>
      </div>
    </div>
  )
}
