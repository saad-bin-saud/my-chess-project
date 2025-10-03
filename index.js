// Import dependencies
import $ from 'jquery';
window.$ = $;
window.jQuery = $;
import './chessboard-1.0.0.min.js';
import './chessboard-1.0.0.css';
import { Chess } from 'chess.js';

// Initialize a new chess game
const game = new Chess();

// Wait until DOM is ready (vanilla JS for Vite compatibility)
window.addEventListener('DOMContentLoaded', () => {
  const board = Chessboard('board', {
    draggable: true,
    position: 'start',
    pieceTheme:
      'image/{piece}.png',

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
