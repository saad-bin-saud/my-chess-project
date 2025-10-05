import './chessboard-1.0.0.css';
import { Chess } from 'chess.js';


var board = null;
var $board = $('#board');
var game = new Chess();
var squareClass = 'square-55d63';

function removeHighlights(color) {
  if (!$board) $board = $('#board');
  $board.find('.' + squareClass).removeClass('highlight-' + color);
}

function onDragStart(source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over && game.game_over()) return false;

  // If pointer didn't move (a quick click), prevent drag so click-to-select works
  if (typeof pointerMoved !== 'undefined' && pointerMoved === false) {
    return false;
  }

  // only pick up pieces for the side to move
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) || (game.turn() === 'b' && piece.search(/^w/) !== -1)) return false;
}

function onDrop(source, target) {
  // handle move via chess.js
  var move = game.move({ from: source, to: target, promotion: 'q' });
  if (move === null) return 'snapback';

  // highlight the side that moved
  var color = move.color === 'w' ? 'white' : 'black';
  removeHighlights(color);
  if (!$board) $board = $('#board');
  $board.find('.square-' + source).addClass('highlight-' + color);
  $board.find('.square-' + target).addClass('highlight-' + color);

  // sync board to updated game state
  board.position(game.fen());
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
  onSnapEnd: onSnapEnd
};

window.addEventListener('DOMContentLoaded', function () {
  if (typeof window.Chessboard === 'undefined') {
    var s = document.createElement('script');
    s.src = '/chessboard-1.0.0.min.js';
    s.async = false;
    s.onload = function () { board = Chessboard('board', config); };
    s.onerror = function () { console.error('Failed to load chessboard script'); };
    document.head.appendChild(s);
  } else {
    board = Chessboard('board', config);
  }
});

// Click / tap-to-select support (works alongside drag/drop)
var selectedSquare = null;
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  // on touch devices, support tap-to-select
  $(document).on('click', '#board .square-55d63', function (e) {
    var sq = $(this).data('square');
    if (!sq) return;

    if (selectedSquare) {
      // attempt move
      var mv = game.move({ from: selectedSquare, to: sq, promotion: 'q' });
      if (mv === null) {
        // illegal: clear selection
        selectedSquare = null;
        $board.find('.selected').removeClass('selected');
        return;
      }
      // legal: update board and highlights
      var color = mv.color === 'w' ? 'white' : 'black';
      removeHighlights(color);
      $board.find('.square-' + selectedSquare).addClass('highlight-' + color);
      $board.find('.square-' + sq).addClass('highlight-' + color);
      board.position(game.fen());
      selectedSquare = null;
      $board.find('.selected').removeClass('selected');
    } else {
      // select source if piece exists and matches current turn
      var p = game.get(sq);
      if (p && p.color === game.turn()) {
        selectedSquare = sq;
        $board.find('.selected').removeClass('selected');
        $(this).addClass('selected');
      }
    }
  });
  // clear selection when tapping outside
  $(document).on('click', function (e) {
    if ($(e.target).closest('#board').length === 0) {
      selectedSquare = null;
      $board.find('.selected').removeClass('selected');
    }
  });
}
// Pointer movement tracking: when the user presses the mouse, track movement distance
var pointerMoved = false;
var pointerStart = null;
$(document).on('mousedown touchstart', '#board .square-55d63', function (e) {
  pointerMoved = false;
  pointerStart = { x: e.pageX || (e.originalEvent && e.originalEvent.touches && e.originalEvent.touches[0].pageX),
                   y: e.pageY || (e.originalEvent && e.originalEvent.touches && e.originalEvent.touches[0].pageY) };
});
$(document).on('mousemove touchmove', function (e) {
  if (!pointerStart) return;
  var x = e.pageX || (e.originalEvent && e.originalEvent.touches && e.originalEvent.touches[0].pageX);
  var y = e.pageY || (e.originalEvent && e.originalEvent.touches && e.originalEvent.touches[0].pageY);
  if (x === undefined || y === undefined) return;
  var dx = Math.abs(x - pointerStart.x);
  var dy = Math.abs(y - pointerStart.y);
  if (dx > 5 || dy > 5) pointerMoved = true;
});
$(document).on('mouseup touchend', function () { pointerStart = null; pointerMoved = false; });
