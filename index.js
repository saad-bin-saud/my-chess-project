import './chessboard-1.0.0.css';
import { Chess } from 'chess.js';

// NOTE: adapted example integrating chess.js + chessboard.js
var board = null;
var game = new Chess();
var whiteSquareGrey = '#a9a9a9';
var blackSquareGrey = '#696969';

function removeGreySquares() {
  // Remove any highlight/drag classes instead of inline styles
  $('#board .square-55d63').removeClass('highlight1-32417 highlight2-9c5d2 drag-over highlight-capture');
}

function greySquare(square) {
  var $square = $('#board .square-' + square);
  // Use the CSS highlight classes defined in chessboard-1.0.0.css
  if ($square.hasClass('black-3c85d')) {
    $square.addClass('highlight2-9c5d2');
  } else {
    $square.addClass('highlight1-32417');
  }
}

function isGameOver() {
  if (typeof game.game_over === 'function') return game.game_over();
  if (typeof game.is_game_over === 'function') return game.is_game_over();
  if (typeof game.isGameOver === 'function') return game.isGameOver();
  return false;
}

function onDragStart(source, piece) {
  // do not pick up pieces if the game is over
  if (isGameOver()) return false;

  // or if it's not that side's turn
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false;
  }
}

function onDrop(source, target) {
  removeGreySquares();

  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // always promote to a queen for simplicity
  });

  // illegal move
  if (move === null) return 'snapback';
}

function onMouseoverSquare(square, piece) {
  // get list of possible moves for this square
  var moves = game.moves({ square: square, verbose: true });

  // exit if there are no moves available for this square
  if (!moves || moves.length === 0) return;

  // highlight the square they moused over
  greySquare(square);

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    // if this move captures an enemy piece, show capture highlight color
    if (moves[i].captured) {
      $('#board .square-' + moves[i].to).addClass('highlight-capture');
    } else {
      greySquare(moves[i].to);
    }
  }
}

function onMouseoutSquare(square, piece) {
  removeGreySquares();
}

function onSnapEnd() {
  board.position(game.fen());
}

var config = {
  draggable: true,
  position: 'start',
  pieceTheme: '/image/{piece}.png',
  width: 400,
  onDragStart: onDragStart,
  onDrop: onDrop,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onSnapEnd: onSnapEnd
};

window.addEventListener('DOMContentLoaded', () => {
  if (typeof window.Chessboard === 'undefined') {
    const s = document.createElement('script');
    s.src = '/chessboard-1.0.0.min.js';
    s.async = false;
    s.onload = () => { board = Chessboard('board', config); window.chessBoard = board; window.chessGame = game; };
    s.onerror = () => console.error('Failed to load chessboard script');
    document.head.appendChild(s);
  } else {
    board = Chessboard('board', config);
    window.chessBoard = board;
    window.chessGame = game;
  }
});
// Track last move and highlight the previous move squares
var lastMove = null;
// When a capture happens, keep the capture highlight active until the opponent moves
var captureHighlightActive = false;
var captureHolder = null; // 'w' or 'b'
// Track last move per color (so white and black highlights persist independently)
var lastWhiteMove = null;
var lastBlackMove = null;

function removeLastMoveHighlight() {
  $('#board .square-55d63').removeClass('highlight-previous highlight-capture highlight-white highlight-black');
}

function highlightLastMove() {
  // Reapply stored per-color last moves so highlights persist after snap
  // Clear any generic previous highlights first
  removeLastMoveHighlight();
  if (lastWhiteMove) applyHighlight(lastWhiteMove, 'white');
  if (lastBlackMove) applyHighlight(lastBlackMove, 'black');
}

function removeHighlights(color) {
  // Remove highlights for a specific color (white or black)
  if (color === 'white') {
    $('#board .square-55d63').removeClass('highlight-white');
    // also remove capture highlights that were set by white
    $('#board .square-55d63').filter(function () { return $(this).data('highlight-by') === 'white'; }).removeClass('highlight-capture').removeData('highlight-by');
  } else if (color === 'black') {
    $('#board .square-55d63').removeClass('highlight-black');
    $('#board .square-55d63').filter(function () { return $(this).data('highlight-by') === 'black'; }).removeClass('highlight-capture').removeData('highlight-by');
  }
}

function applyHighlight(move, color) {
  if (!move) return;
  if (move.captured) {
    // mark capture highlight and remember which side set it
    $('#board .square-' + move.from).addClass('highlight-capture').data('highlight-by', color);
    $('#board .square-' + move.to).addClass('highlight-capture').data('highlight-by', color);
  } else {
    var cls = color === 'white' ? 'highlight-white' : 'highlight-black';
    $('#board .square-' + move.from).addClass(cls);
    $('#board .square-' + move.to).addClass(cls);
  }
}

// Enhance onDrop: when a move is made successfully, store it and highlight
// We'll update highlight after successful moves in onSnapEnd which syncs the board.
var originalOnDrop = config.onDrop;
config.onDrop = function (source, target) {
  var move = game.move({ from: source, to: target, promotion: 'q' });
  if (move === null) {
    return 'snapback';
  }
  // if there is an active capture highlight from a previous capture,
  // clear it only when the opposite side has just moved
  if (captureHighlightActive && move.color !== captureHolder) {
    removeLastMoveHighlight();
    captureHighlightActive = false;
    captureHolder = null;
  }

  // store last move with capture info
  lastMove = { from: move.from, to: move.to, captured: Boolean(move.captured) };
  if (move.color === 'w') {
    // remove white's previous highlights then apply new
    removeHighlights('white');
    lastWhiteMove = lastMove;
    applyHighlight(lastWhiteMove, 'white');
  } else {
    removeHighlights('black');
    lastBlackMove = lastMove;
    applyHighlight(lastBlackMove, 'black');
  }
  if (move.captured) {
    captureHighlightActive = true;
    captureHolder = move.color; // the side that performed the capture
  }
  return undefined;
};

var originalOnSnapEnd = config.onSnapEnd;
config.onSnapEnd = function () {
  // let the board sync first
  if (typeof originalOnSnapEnd === 'function') originalOnSnapEnd();
  highlightLastMove();
};
