import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import io from 'socket.io-client'

// Helpers for arrow highlights
function squareToCoords(square) {
  if (!square || square.length !== 2) return null
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0)
  const rank = parseInt(square[1], 10) - 1
  return { file, rank }
}

function arrowDataURL(angleDeg, color = 'rgba(0,122,255,0.6)') {
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'>
      <g transform='translate(30,30) rotate(${angleDeg})'>
        <path d='M-14 0 L10 0 L6 -6 L6 6 Z' fill='${color}' />
      </g>
    </svg>`
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`
}

function getArrowStyles(from, to, color = 'rgba(0,122,255,0.6)') {
  if (!from || !to) return null
  const f = squareToCoords(from)
  const t = squareToCoords(to)
  if (!f || !t) return null
  const dx = t.file - f.file
  const dy = t.rank - f.rank
  const angleRad = Math.atan2(dy, dx)
  const angleDeg = (angleRad * 180) / Math.PI
  return {
    backgroundImage: arrowDataURL(angleDeg, color),
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: '40% 40%',
    backgroundColor: 'rgba(0,122,255,0.06)',
    borderRadius: '6px',
  }
}

export default function ChessBoardComponent() {
  const socketRef = useRef(null)
  const [fen, setFen] = useState('start')
  const [roomId] = useState('room1')
  const chessRef = useRef(new Chess())
  const [promotion, setPromotion] = useState(null)
  const [lastMove, setLastMove] = useState(null)
  const [currentTurn, setCurrentTurn] = useState('w')
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [legalMoves, setLegalMoves] = useState([])

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

  // custom pieces using public/image assets
  const customPieces = {
    wK: () => <img src="/image/wK.png" alt="wK" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />,
    wQ: () => <img src="/image/wQ.png" alt="wQ" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />,
    wR: () => <img src="/image/wR.png" alt="wR" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />,
    wB: () => <img src="/image/wB.png" alt="wB" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />,
    wN: () => <img src="/image/wN.png" alt="wN" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />,
    wP: () => <img src="/image/wP.png" alt="wP" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />,
    bK: () => <img src="/image/bK.png" alt="bK" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />,
    bQ: () => <img src="/image/bQ.png" alt="bQ" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />,
    bR: () => <img src="/image/bR.png" alt="bR" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />,
    bB: () => <img src="/image/bB.png" alt="bB" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />,
    bN: () => <img src="/image/bN.png" alt="bN" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />,
    bP: () => <img src="/image/bP.png" alt="bP" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />,
  }

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
          customPieces={customPieces}
          onSquareClick={(sq) => {
            // toggle select
            if (selectedSquare === sq) {
              setSelectedSquare(null)
              setLegalMoves([])
              return
            }
            setSelectedSquare(sq)
            // compute legal moves from this square
            const moves = chessRef.current.moves({ square: sq, verbose: true }) || []
            setLegalMoves(moves.map(m => m.to))
          }}
          boardWidth={480}
          customSquareStyles={(() => {
            const styles = {}
            // last move highlight (keep previous orange style)
            if (lastMove) {
              styles[lastMove.from] = { background: 'rgba(255,149,0,0.6)' }
              styles[lastMove.to] = { background: 'rgba(255,149,0,0.9)' }
            }
            // if a square is selected, show arrow indicators for each legal move
            if (selectedSquare && legalMoves.length > 0) {
              // highlight the origin
              styles[selectedSquare] = { boxShadow: 'inset 0 0 0 3px rgba(0,122,255,0.6)', borderRadius: '6px' }
              // add arrow styles for each target
              legalMoves.forEach(to => {
                const arrowStyle = getArrowStyles(selectedSquare, to, 'rgba(0,122,255,0.6)')
                if (arrowStyle) styles[to] = { ...styles[to], ...arrowStyle }
              })
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
