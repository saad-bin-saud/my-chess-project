import $ from 'jquery';
window.$ = $;
window.jQuery = $;
import './chessboard-1.0.0.css';
import { Chess } from 'chess.js';

const game = new Chess();

function initBoard() {
  const board = window.Chessboard('board', {
    draggable: true,
    position: game.fen(),
    pieceTheme: 'image/{piece}.png',
    width: 400,
    onDragStart(source, piece) {
      console.log('onDragStart', { source, piece, turn: game.turn() });
      // Prevent dragging opponent pieces or dragging after game over
      if (!piece) return false;
      const turn = game.turn();
      if ((turn === 'w' && piece.charAt(0) === 'b') || (turn === 'b' && piece.charAt(0) === 'w')) {
        console.log('blocked drag: wrong color');
        return false;
      }
      if (game.game_over()) {
        console.log('blocked drag: game over');
        return false;
      }
      return true;
    },
    onDrop(source, target) {
      console.log('onDrop', { source, target });
      const move = game.move({ from: source, to: target, promotion: 'q' });
      console.log('move result', move);
      if (move === null) {
        console.log('snapback (illegal)');
        return 'snapback';
      }
    },
    onSnapEnd() {
      console.log('onSnapEnd syncing board to', game.fen());
      board.position(game.fen());
    },
  });
  window.chessBoard = board;
  window.chessGame = game;
}

window.addEventListener('DOMContentLoaded', () => {
  if (typeof window.Chessboard === 'undefined') {
    const s = document.createElement('script');
    s.src = '/chessboard-1.0.0.min.js';
    s.async = false;
    s.onload = initBoard;
    s.onerror = () => console.error('Failed to load chessboard script');
    document.head.appendChild(s);
  } else {
    initBoard();
  }
});
