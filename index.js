// Import dependencies
import $ from 'jquery';
window.$ = $;
window.jQuery = $;
import './chessboard-1.0.0.css';
import { Chess } from 'chess.js';

// Helper to load a non-ESM script at runtime and return a Promise
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = false; // preserve execution order
    s.onload = () => resolve();
    s.onerror = (e) => reject(new Error('Failed to load ' + src));
    document.head.appendChild(s);
  });
}

// Initialize a new chess game
const game = new Chess();

// Wait until DOM is ready (vanilla JS for Vite compatibility)
window.addEventListener('DOMContentLoaded', async () => {
  // Ensure chessboard library (which expects global jQuery) is loaded
  try {
    if (typeof window.Chessboard === 'undefined') {
      await loadScript('/chessboard-1.0.0.min.js');
    }
  } catch (err) {
    console.error(err);
    return;
  }

  const board = window.Chessboard('board', {
    draggable: true,
    position: 'start',
    pieceTheme: 'image/{piece}.png',
    width: 400,

    onDrop: function (source, target) {
      console.log('Trying move:', source, '→', target);

      // Try the move in chess.js
      let move = game.move({
        from: source,
        to: target,
        promotion: 'q', // always promote to queen
      });

      // Illegal move? snap back
      if (move === null) {
        console.log('Illegal move!');
        return 'snapback';
      }
    },

    onSnapEnd: function () {
      // Sync board with game state
      board.position(game.fen());
    },
  });
});
