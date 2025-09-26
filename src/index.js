// Import dependencies
import $ from 'jquery';
import { Chess } from 'chess.js';
import Chessboard from '@chrisoakman/chessboardjs';
import '@chrisoakman/chessboardjs/dist/chessboard-1.0.0.min.css';

// Initialize a new chess game
const game = new Chess();

// Wait until DOM is ready
$(document).ready(function () {
  // Initialize the board inside #board element
  const board = Chessboard('board', {
    draggable: true,
    position: 'start',
    pieceTheme:
      'https://unpkg.com/@chrisoakman/chessboardjs/img/chesspieces/wikipedia/{piece}.png',

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
