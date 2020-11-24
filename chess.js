var cloneDeep = require('lodash.clonedeep')
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
})

const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const empty = ' '

let whitesTurn = true
let board = [
  ['R', 'N', 'B', 'K', 'Q', 'B', 'N', 'R'],
  ['P', 'P', 'P', ' ', ' ', 'P', 'P', 'P'],
  [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
  [' ', ' ', ' ', 'P', ' ', ' ', ' ', ' '],
  [' ', ' ', ' ', ' ', ' ', ' ', ' ', 'q'],
  [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  ['r', 'n', 'b', 'k', 'q', 'b', 'n', 'r'],
] // White lowercase

function userMove(move) {
  try {
    // Check the input is of a valid form
    if (!/^((([RNBQK])[a-h1-8]?x?)|([a-h1-8]x))?(([a-h])[1-8])$/.test(move)) {
      throw new Error('Invalid input')
    }

    const to = alphaToDec(move.slice(-2))
    const piece = /[RNBQK]/.test(move[0]) ? move[0] : 'P'
    // Find the positions of the pieces that can make the specified move
    let from = findPositions(piece).filter((from) =>
      moveInMoves(getMoves(from[0], from[1]), to)
    )

    // If there are no pieces can make that move, complain
    if (!from || from.length === 0) {
      throw new Error('Invalid move')
    }

    // If there are multiple pieces that can make the move figure out which they mean
    if (from.length > 1) {
      let identifier
      // If it's an ambiguous pawn move is has to be an attack, so the identifier will be the first character
      if (piece === 'P') {
        identifier = move[0]
        // Otherwise if it's a piece move, ensure the form of Naxb3 or Nab3
      } else if (move.length === 5 || (move.length === 4 && move[1] !== 'x')) {
        identifier = move[1]
        // If there's no identifier, complain
      } else {
        throw new Error('Please identify the piece')
      }

      // If the identifier is a letter, filter the pieces by file
      if (/[a-h]/.test(identifier)) {
        from = from.filter((from) => from[1] === letters.indexOf(identifier))
        // If the identifier is a number, filter the pieces by rank
      } else if (/[1-8]/.test(identifier)) {
        from = from.filter((from) => from[0] === 8 - Number(identifier))
      }

      // Check the identifier correctly identified the piece
      if (from.length === 1) {
        from = from[0]
        // Othwerwise complain
      } else {
        throw new Error('Please use an unambiguous identifier')
      }
    } else {
      from = from[0]
    }

    checkMove(from, to)
  } catch (error) {
    // console.log(error)
    console.log(error.message)
  }
  main()
}

// Get all positions of one type of piece
function findPositions(piece) {
  const positions = []
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (board[y][x] === (whitesTurn ? piece.toLowerCase() : piece)) {
        positions.push([y, x])
      }
    }
  }
  return positions
}

// Convert a human position into a computer index
function alphaToDec(alpha) {
  return [8 - Number(alpha[1]), letters.indexOf(alpha[0])]
}

// Convert a computer index into a human position
function decToAlpha(dec) {
  return [letters[dec[1]], 8 - dec[0]]
}

// Test if a list of moves contains a specific one
function moveInMoves(moves, test) {
  return moves.find((move) => move[0] === test[0] && move[1] === test[1])
}

// Check if a move is allowed and move it on the board if so
function checkMove([fromy, fromx], [toy, tox]) {
  // printMoves(getMoves(fromy, fromx))
  // If you can control the piece get the correct moves
  if (
    !isEnemy(board[fromy][fromx]) &&
    board[fromy][fromx] !== empty &&
    moveInMoves(getMoves(fromy, fromx), [toy, tox]) &&
    !moveCausesCheck([fromy, fromx], [toy, tox])
  ) {
    movePiece([fromy, fromx], [toy, tox])
    whitesTurn = !whitesTurn
    // TODO: Check for checkmate
  } else {
    console.log('Illegal move')
  }
}

// Check if a move is allowed and move it on the board if so
function movePiece([fromy, fromx], [toy, tox]) {
  const piece = board[fromy][fromx]
  board[fromy][fromx] = empty
  board[toy][tox] = piece
}

// Get an array of legal moves for a piece
function getMoves(y, x, white = whitesTurn) {
  if (withinBounds(y, x)) {
    const diagonalDeltas = [
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ]
    const horizontalDeltas = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]
    const bothDeltas = [...horizontalDeltas, ...diagonalDeltas]
    const piece = board[y][x]

    switch (piece.toLowerCase()) {
      case 'p':
        return getPawnMoves(y, x, white)
      case 'n':
        return getKnightMoves(y, x, white)
      case 'b':
        return getDirectionalMoves(y, x, diagonalDeltas, white)
      case 'r':
        return getDirectionalMoves(y, x, horizontalDeltas, white)
      case 'q':
        return getDirectionalMoves(y, x, bothDeltas, white)
      case 'k':
        return getDirectionalMoves(y, x, bothDeltas, white, 1)
      // TODO: Handle castling
    }
  }
  return []
}

function moveCausesCheck([fromy, fromx], [toy, tox], white = whitesTurn) {
  const oldBoard = cloneDeep(board)
  movePiece([fromy, fromx], [toy, tox])

  let kingPos
  // Find the position of the king to test for check
  for (var i = 0; i < board.length; i++) {
    const index = board[i].indexOf(white ? 'k' : 'K')
    if (index > 0) kingPos = [i, index]
  }

  // For every position on the board
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      let moves = []
      const piece = board[y][x]
      // Get their available moves
      if (/[rnbkq]/.test(piece.toLowerCase())) {
        moves = getMoves(y, x, /[rnbkq]/.test(piece))
      } else if (/[pP]/.test(piece)) {
        moves = getPawnAttacks(y, x, piece === 'p')
      }

      // And see if any of their moves attacks the king
      if (moveInMoves(moves, kingPos)) {
        console.log('Move causes check')
        board = oldBoard
        return true
      }
    }
  }
  board = oldBoard
  return false
}

// Check if a piece is white
function isWhite(piece) {
  return /[a-z]/.test(piece)
}

// Check if a piece is an enemy
function isEnemy(piece, white = whitesTurn) {
  return isWhite(piece) !== white
}

// Get an array of legal pawn moves
function getPawnMoves(y, x) {
  const moves = []
  const modifier = whitesTurn ? 1 : -1
  const upOne = y - modifier
  const upTwo = y - modifier * 2
  const upOneEmpty = board[upOne][x] === empty

  // Check the forward square is empty
  if (upOneEmpty) moves.push([upOne, x])

  // Check the next two squares are empty and the piece is on it's starting rank
  if (y === whitesTurn ? 5 : 1 && upOneEmpty && board[upTwo][x] === empty) {
    moves.push([upTwo, x])
  }

  moves.push(...getPawnAttacks(y, x))
  // TODO: en passant

  return moves
}

function getPawnAttacks(y, x, white = whitesTurn) {
  const moves = []
  const modifier = white ? 1 : -1

  // For each diagonal move
  const sides = [1, -1]
  sides.forEach((side) => {
    const [toy, tox] = [y - modifier, x + side]
    // Check it's on the board
    if (withinBounds(toy, tox)) {
      const dest = board[toy][tox]
      // And contains an enemy piece
      if (isEnemy(dest, white) && dest !== empty) moves.push([toy, tox])
    }
  })

  return moves
}

// Get an array of legal knight moves
function getKnightMoves(y, x, white = whitesTurn) {
  const moves = [
    [-1, -2],
    [1, -2],
    [-1, 2],
    [1, 2],
    [-2, -1],
    [2, -1],
    [-2, 1],
    [2, 1],
  ]

  // For each move delta
  return moves
    .filter((move) => {
      // If the destination is on the board
      if (withinBounds(y + move[0], x + move[1])) {
        const dest = board[y + move[0]][x + move[1]]
        // Test the destination is empty or holds an an enemy piece
        return dest === empty || isEnemy(dest, white)
      }
    })
    .map((move) => [y + move[0], x + move[1]])
}

function getDirectionalMoves(y, x, deltas, white = whitesTurn, max = 8) {
  const moves = []

  // For each combiination of x-y deltas
  deltas.forEach(([dy, dx]) => {
    // Check up to the max distance
    for (let n = 1; n <= max; n++) {
      // Destination is n times x/y direction
      const [toy, tox] = [y + n * dy, x + n * dx]
      // Check it's not off the board
      if (withinBounds(toy, tox)) {
        const dest = board[toy][tox]
        if (dest === empty) {
          // If it's empty add it to the list of moves and continue
          moves.push([toy, tox])
          continue
        } else if (isEnemy(dest, white)) {
          // If it's an enemy add it to the list of moves
          moves.push([toy, tox])
        }
      }
      // If it was anything other than empty, stop checking that direction
      break
    }
  })

  return moves
}

// Check a decimal position is on the board
function withinBounds(y, x) {
  const isWithin = (n) => n >= 0 && n < 8
  return isWithin(x) && isWithin(y)
}

// Log the board to the console with alpha numeric indexes
function printBoard() {
  console.log('  +-------------------------------+')
  for (let x = 0; x < 8; x++) {
    console.log(`${8 - x} |`, board[x].join(' | '), '|')
    console.log('  +---+---+---+---+---+---+---+---+')
  }
  console.log('   ', letters.join('   '))
}

// Print out a list of computer moves in a human readable format
function printMoves(moves) {
  console.log(
    moves.map((move) => decToAlpha(move).join('')),
    'moves'
  )
}

// Main loop, userMove calls this function
function main() {
  printBoard()
  readline.question(
    `What's ${whitesTurn ? "white's" : "black's"} move? `,
    userMove
  )
}

main()
