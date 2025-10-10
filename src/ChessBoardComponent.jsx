import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import io from 'socket.io-client'
import './style.css'

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
    <div className="app-root">
      <div className="app-board-wrap" style={{ width: boardWidth, maxWidth: '92vw' }}>

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
        <div className="app-modal-overlay" role="dialog" aria-modal="true">
          <div className="app-modal">
            <div className="title">Choose promotion</div>
            <div className="promotion-row">
              {['q', 'r', 'b', 'n'].map((p) => {
                const colorPrefix = promotion && promotion.color === 'b' ? 'b' : 'w'
                const fileMap = { q: 'Q', r: 'R', b: 'B', n: 'N' }
                const imgName = `${colorPrefix}${fileMap[p]}.png`
                return (
                  <button key={p} onClick={() => { sendMove(promotion.from, promotion.to, p); setPromotion(null) }} aria-label={`Promote to ${fileMap[p]}`} className="promotion-btn">
                    <img src={`/image/${imgName}`} alt={fileMap[p]} style={{ width: 56, height: 56, objectFit: 'contain', display: 'block', background: 'transparent' }} />
                  </button>
                )
              })}
              <button onClick={() => setPromotion(null)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed chat at bottom - centered behind the board and stretches to the top */}
      <div className="app-chat-fixed" style={{ width: boardWidth, maxWidth: '92vw' }}>
        <div className="app-chat-messages" ref={messagesRef}>
          {chatMessages.length === 0 && <div className="app-chat-empty">No messages yet</div>}
          {[...chatMessages].slice().reverse().map((m, i) => (
            <div key={i} className={`app-message ${m.from === 'Me' ? 'app-message--mine' : 'app-message--their'}`} style={{ alignSelf: m.from === 'Me' ? 'flex-end' : 'flex-start' }}>
              <div className="meta">{m.from}</div>
              <div className="bubble">{m.message}</div>
            </div>
          ))}
        </div>
        <div className="app-chat-input-wrapper">
          <form onSubmit={sendChat} className="app-chat-form">
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message" className="app-chat-input" />
            <button type="submit" className="app-chat-send">Send</button>
          </form>
        </div>
      </div>
    </div>
  )
}
