import $ from 'jquery';
import { Chess } from 'chess.js';
import Chessboard from '@chrisoakman/chessboardjs';
import '@chrisoakman/chessboardjs/dist/chessboard-1.0.0.min.css';

// create a chess game
const game = new Chess();

// create the board
const board = Chessboard('board', {
  draggable: true,
  position: 'start',
  pieceTheme: 'https://unpkg.com/@chrisoakman/chessboardjs/img/chesspieces/wikipedia/{piece}.png',

  onDrop: function (source, target) {
    console.log("Trying move:", source, "→", target);

    // attempt move in chess.js
    let move = game.move({
      from: source,
      to: target,
      promotion: 'q'
    });

    if (move === null) {
      console.log("Illegal move!");
      return 'snapback';
    }
  },

  onSnapEnd: function () {
    // sync board with game state
    board.position(game.fen());
  }
});