import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import AppleStyleGameMenu from './GameMenu'
import './style.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppleStyleGameMenu />
  </React.StrictMode>
)
