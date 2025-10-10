import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import io from 'socket.io-client'

// Small helpers
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

  // chat state
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const messagesRef = useRef(null)
  const CHAT_HEIGHT = 220

  // responsive board width (max 520px, otherwise relative to viewport)
  const calcWidth = () => {
    if (typeof window === 'undefined') return 520
    return Math.min(520, Math.floor(window.innerWidth * 0.92))
  }
  const [boardWidth, setBoardWidth] = useState(() => calcWidth())
  useEffect(() => {
    const onResize = () => setBoardWidth(calcWidth())
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

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
    // chat listener
    socketRef.current.on('chat', (msg) => {
      setChatMessages((s) => [...s, msg])
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
    // clear selection UI after sending
    setSelectedSquare(null)
    setLegalMoves([])
    return true
  }, [roomId])

  // send chat message
  const sendChat = (e) => {
    e && e.preventDefault()
    if (!chatInput || !socketRef.current || !socketRef.current.connected) return
    const payload = { roomId, from: 'Me', message: chatInput }
    socketRef.current.emit('chat', payload)
    setChatInput('')
  }

  // auto-scroll chat when messages change
  useEffect(() => {
    if (messagesRef.current) {
      // With column-reverse layout the visual bottom is the scrollTop 0
      messagesRef.current.scrollTop = 0
    }
  }, [chatMessages])

  // custom pieces using public/image assets
  const customPieces = {
    wK: ({ squareWidth }) => {
      const size = Math.floor(squareWidth * 0.78)
      const margin = Math.floor((squareWidth - size) / 2)
      return <img src="/image/wK.png" alt="wK" draggable={false} style={{ width: size, height: size, objectFit: 'contain', pointerEvents: 'none', display: 'block', margin: `${margin}px auto` }} />
    },
    wQ: ({ squareWidth }) => {
      const size = Math.floor(squareWidth * 0.78)
      const margin = Math.floor((squareWidth - size) / 2)
      return <img src="/image/wQ.png" alt="wQ" draggable={false} style={{ width: size, height: size, objectFit: 'contain', pointerEvents: 'none', display: 'block', margin: `${margin}px auto` }} />
    },
    wR: ({ squareWidth }) => {
      const size = Math.floor(squareWidth * 0.78)
      const margin = Math.floor((squareWidth - size) / 2)
      return <img src="/image/wR.png" alt="wR" draggable={false} style={{ width: size, height: size, objectFit: 'contain', pointerEvents: 'none', display: 'block', margin: `${margin}px auto` }} />
    },
    wB: ({ squareWidth }) => {
      const size = Math.floor(squareWidth * 0.78)
      const margin = Math.floor((squareWidth - size) / 2)
      return <img src="/image/wB.png" alt="wB" draggable={false} style={{ width: size, height: size, objectFit: 'contain', pointerEvents: 'none', display: 'block', margin: `${margin}px auto` }} />
    },
    wN: ({ squareWidth }) => {
      const size = Math.floor(squareWidth * 0.78)
      const margin = Math.floor((squareWidth - size) / 2)
      return <img src="/image/wN.png" alt="wN" draggable={false} style={{ width: size, height: size, objectFit: 'contain', pointerEvents: 'none', display: 'block', margin: `${margin}px auto` }} />
    },
    wP: ({ squareWidth }) => {
      const size = Math.floor(squareWidth * 0.78)
      const margin = Math.floor((squareWidth - size) / 2)
      return <img src="/image/wP.png" alt="wP" draggable={false} style={{ width: size, height: size, objectFit: 'contain', pointerEvents: 'none', display: 'block', margin: `${margin}px auto` }} />
    },
    bK: ({ squareWidth }) => {
      const size = Math.floor(squareWidth * 0.78)
      const margin = Math.floor((squareWidth - size) / 2)
      return <img src="/image/bK.png" alt="bK" draggable={false} style={{ width: size, height: size, objectFit: 'contain', pointerEvents: 'none', display: 'block', margin: `${margin}px auto` }} />
    },
    bQ: ({ squareWidth }) => {
      const size = Math.floor(squareWidth * 0.78)
      const margin = Math.floor((squareWidth - size) / 2)
      return <img src="/image/bQ.png" alt="bQ" draggable={false} style={{ width: size, height: size, objectFit: 'contain', pointerEvents: 'none', display: 'block', margin: `${margin}px auto` }} />
    },
    bR: ({ squareWidth }) => {
      const size = Math.floor(squareWidth * 0.78)
      const margin = Math.floor((squareWidth - size) / 2)
      return <img src="/image/bR.png" alt="bR" draggable={false} style={{ width: size, height: size, objectFit: 'contain', pointerEvents: 'none', display: 'block', margin: `${margin}px auto` }} />
    },
    bB: ({ squareWidth }) => {
      const size = Math.floor(squareWidth * 0.78)
      const margin = Math.floor((squareWidth - size) / 2)
      return <img src="/image/bB.png" alt="bB" draggable={false} style={{ width: size, height: size, objectFit: 'contain', pointerEvents: 'none', display: 'block', margin: `${margin}px auto` }} />
    },
    bN: ({ squareWidth }) => {
      const size = Math.floor(squareWidth * 0.78)
      const margin = Math.floor((squareWidth - size) / 2)
      return <img src="/image/bN.png" alt="bN" draggable={false} style={{ width: size, height: size, objectFit: 'contain', pointerEvents: 'none', display: 'block', margin: `${margin}px auto` }} />
    },
    bP: ({ squareWidth }) => {
      const size = Math.floor(squareWidth * 0.78)
      const margin = Math.floor((squareWidth - size) / 2)
      return <img src="/image/bP.png" alt="bP" draggable={false} style={{ width: size, height: size, objectFit: 'contain', pointerEvents: 'none', display: 'block', margin: `${margin}px auto` }} />
    },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ width: boardWidth, maxWidth: '92vw', marginTop: 24, position: 'relative', zIndex: 3 }}>

        <Chessboard
          position={fen}
          onPieceDrop={onPieceDrop}
          customPieces={customPieces}
          customBoardStyle={{ borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
          customLightSquareStyle={{ backgroundColor: '#fbfbfb' }}
          customDarkSquareStyle={{ backgroundColor: '#2f2f2f' }}
          onSquareClick={(sq) => {
            if (selectedSquare && selectedSquare !== sq) {
              const moveObj = legalMoves.find(m => m.to === sq)
              if (moveObj) {
                if (moveObj.promotion) {
                  setPromotion({ from: selectedSquare, to: sq, color: chessRef.current.get(selectedSquare).color })
                } else {
                  sendMove(selectedSquare, sq)
                }
                setSelectedSquare(null)
                setLegalMoves([])
                return
              }
            }
            if (selectedSquare === sq) {
              setSelectedSquare(null)
              setLegalMoves([])
              return
            }
            setSelectedSquare(sq)
            const moves = chessRef.current.moves({ square: sq, verbose: true }) || []
            setLegalMoves(moves)
          }}
          boardWidth={boardWidth}
          customSquareStyles={(() => {
            const styles = {}
            if (lastMove) {
              styles[lastMove.from] = { boxShadow: 'inset 0 0 6px 3px rgba(255,149,0,0.6)', borderRadius: '6px' }
              styles[lastMove.to] = { boxShadow: 'inset 0 0 6px 3px rgba(255,149,0,0.9)', borderRadius: '6px' }
            }
            if (selectedSquare && legalMoves.length > 0) {
              styles[selectedSquare] = { boxShadow: 'inset 0 0 0 3px rgba(0,122,255,0.6)', borderRadius: '6px' }
              legalMoves.forEach(m => {
                const to = m.to
                if (!to) return
                if (m.captured) {
                  styles[to] = {
                    ...styles[to],
                    backgroundColor: 'rgba(255,149,0,0.12)',
                    boxShadow: 'inset 0 0 6px 3px #ff9500',
                    borderRadius: '6px',
                    backgroundImage: 'radial-gradient(circle at 50% 45%, #ff9500 18%, transparent 19%)',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: '50% 45%',
                    backgroundSize: '18% 18%'
                  }
                } else {
                  styles[to] = {
                    ...styles[to],
                    backgroundImage: 'radial-gradient(circle at 50% 42%, rgba(255,255,255,0.95) 0%, rgba(0,122,255,0.98) 42%, rgba(0,122,255,0.7) 56%, rgba(0,122,255,0.0) 72%)',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: '50% 42%',
                    backgroundSize: '40% 40%',
                    boxShadow: '0 6px 16px rgba(0,122,255,0.12)',
                    borderRadius: '8px',
                  }
                }
              })
            }
            return styles
          })()}
        />
      </div>

      {/* Promotion modal */}
      {promotion && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.35)',
            zIndex: 2147483647,
            pointerEvents: 'auto'
          }}
        >
          <div style={{ background: '#ffffff', padding: 20, borderRadius: 12, boxShadow: '0 12px 30px rgba(0,0,0,0.18)', zIndex: 2147483648 }}>
            <div style={{ color: '#111', marginBottom: 8, fontWeight: 600 }}>Choose promotion</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {['q', 'r', 'b', 'n'].map((p) => {
                const colorPrefix = promotion && promotion.color === 'b' ? 'b' : 'w'
                const fileMap = { q: 'Q', r: 'R', b: 'B', n: 'N' }
                const imgName = `${colorPrefix}${fileMap[p]}.png`
                return (
                  <button
                    key={p}
                    onClick={() => {
                      sendMove(promotion.from, promotion.to, p)
                      setPromotion(null)
                    }}
                    aria-label={`Promote to ${fileMap[p]}`}
                    style={{
                      padding: 6,
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer'
                    }}
                  >
                    <img src={`/image/${imgName}`} alt={fileMap[p]} style={{ width: 56, height: 56, objectFit: 'contain', display: 'block', background: 'transparent' }} />
                  </button>
                )
              })}
              <button
                onClick={() => setPromotion(null)}
                style={{ padding: '8px 12px', fontSize: 16, background: '#444', color: '#fff', borderRadius: 8 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed chat at bottom - centered behind the board and stretches to the top */}
      <div className="chat-fixed" style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', top: 0, bottom: 0, width: boardWidth, maxWidth: '92vw', background: '#ffffff', boxShadow: '0 -8px 24px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', padding: 12, zIndex: 1 }}>
        <div ref={messagesRef} style={{ flex: 1, overflowY: 'auto', padding: '10px 8px', display: 'flex', flexDirection: 'column-reverse', gap: 12, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}>
          {chatMessages.length === 0 && <div style={{ color: '#8e8e93', fontSize: 14 }}>No messages yet</div>}
          {[...chatMessages].slice().reverse().map((m, i) => (
            <div key={i} style={{ alignSelf: m.from === 'Me' ? 'flex-end' : 'flex-start', maxWidth: '85%', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 12, color: '#6e6e73', marginBottom: 2 }}>{m.from}</div>
              <div style={{
                background: m.from === 'Me' ? 'linear-gradient(180deg,#007aff22,#007aff11)' : '#f5f5f7',
                padding: '10px 14px',
                borderRadius: 14,
                boxShadow: m.from === 'Me' ? '0 6px 20px rgba(0,122,255,0.08)' : '0 6px 18px rgba(0,0,0,0.04)',
                fontSize: 15,
                color: '#111',
                lineHeight: '1.25',
                wordBreak: 'break-word'
              }}>{m.message}</div>
            </div>
          ))}
        </div>
        <div style={{ position: 'sticky', bottom: 12, display: 'flex', gap: 8 }}>
          <form onSubmit={sendChat} style={{ display: 'flex', gap: 8, width: '100%' }}>
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message" style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: '1px solid #e6e6e6', fontSize: 16 }} />
            <button type="submit" style={{ padding: '12px 16px', borderRadius: 12, background: '#007aff', color: '#fff', border: 'none', fontSize: 16 }}>Send</button>
          </form>
        </div>
      </div>
    </div>
  )
}
