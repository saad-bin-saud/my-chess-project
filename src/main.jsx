import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import io from 'socket.io-client'
import AppleStyleGameMenu from './GameMenu'
import ChessBoardComponent from './ChessBoardComponent'
import './style.css'

function RootApp() {
  const socketRef = useRef(null)
  const [view, setView] = useState('menu') // 'menu' | 'game'
  const [queuePos, setQueuePos] = useState(-1)
  const [roomInfo, setRoomInfo] = useState(null)

  useEffect(() => {
  // Build socket URL from the current page host so clients on the LAN
  // (phone, other laptops) connect to this machine when opened by IP.
  // Use the same protocol as the page to avoid mixed-content warnings
  // (if the page is https, the socket will use wss/https automatically).
  const pageHost = window.location.hostname || 'localhost'
  const socketPort = process.env.SOCKET_SERVER_PORT || 3000
  const pageProtocol = window.location.protocol === 'https:' ? 'https' : 'http'
  const socketUrl = `${pageProtocol}://${pageHost}:${socketPort}`
  const s = io(socketUrl)
    socketRef.current = s
    s.on('connect', () => console.log('connected to server'))
    s.on('queue_update', (data) => {
      setQueuePos(data.position || -1)
    })
    s.on('match_found', ({ roomId, color }) => {
      // once match found, switch to game view and pass socket + roomId
      setRoomInfo({ roomId, color })
      setView('game')
    })

    return () => {
      s.disconnect()
    }
  }, [])

  function handleStart(mode) {
    if (!socketRef.current) return
    socketRef.current.emit('find_match', { mode })
  }
  function handleCancel() {
    if (!socketRef.current) return
    socketRef.current.emit('cancel_find')
    setQueuePos(-1)
  }

  return (
    <React.StrictMode>
      {view === 'menu' && (
        <AppleStyleGameMenu onStart={handleStart} queuePosition={queuePos} onCancel={handleCancel} />
      )}
      {view === 'game' && roomInfo && (
        <ChessBoardComponent socket={socketRef.current} roomId={roomInfo.roomId} myColor={roomInfo.color} />
      )}
    </React.StrictMode>
  )
}

createRoot(document.getElementById('root')).render(<RootApp />)
