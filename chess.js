const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

const letters = ['a','b','c','d','e','f','g','h']
const empty = ' '
let whitesTurn = true
const board = [
  ['R', 'N', 'B', 'K', 'Q', 'B', 'K', 'R'],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
  [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
  [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
  [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  ['r', 'n', 'b', 'k', 'q', 'b', 'k', 'r'],
] // White lowercase

function userMove(move) {
  // TODO: Handle shorthand
  if (/([a-h])[1-8]-([a-h])[1-8]/.test(move)) {
    const [from, to] = move.split('-')
    movePiece(alphaToDec(to), alphaToDec(from))
  } else {
    console.log('Invalid input')
  }
  main()
}

function alphaToDec(alpha)  { 
  return [8 - alpha[1], letters.indexOf(alpha[0])]
}

function decToAlpha(dec)  { 
  return [letters[dec[1]], 8 - dec[0]]
}

function movePiece([toy, tox], [fromy, fromx]) {
  console.log(toy, tox)
  if (getAllowedMoves(fromy, fromx).find(([y, x]) => y === toy && x === tox)) {
    const piece = board[fromy][fromx]q
    board[fromy][fromx] = empty
    board[toy][tox] = piece
    whitesTurn = !whitesTurn
  } else {
    console.log('Invalid move')
  }
}

function getAllowedMoves(y, x) {
  if (/[pP]/.test(board[y][x])) {
    return getPawnMoves(y, x)
  } else if (/[nN]/.test(board[y][x])) {
    return getKnightMoves(y, x)
  }
  return []
  // TODO: test for king in check
}

function isWhite(piece) {
  return /[a-z]/.test(piece)
}

function getPawnMoves(y, x) {
  const moves = []
  const modifier = whitesTurn ? 1 : -1
  const upOne =  y - modifier
  const upOneEmpty = board[upOne][x] === empty
  if (upOneEmpty) moves.push([upOne, x])
  
  const upTwo = y - modifier * 2
  if (y === whitesTurn ? 5 : 1 && upOneEmpty && board[upTwo][x] === empty) 
    moves.push([upTwo, x])

  const sides = [1, -1]
  sides.forEach(side => {
    const [toy, tox] = [y - modifier, x + side] 
    if (withinBounds(toy, tox)) {
      const left = board[toy][tox]
      if (whitesTurn !== isWhite(left) && left !== empty) moves.push([toy, tox])
    }
  })

  // TODO: en passant

  return moves
}

function getKnightMoves(y, x) {
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

  return moves.filter(move => {
    if (withinBounds(y + move[0], x + move[1])) {
      const dest = board[y + move[0]][x + move[1]]
      console.log(dest, isWhite(dest), whitesTurn)
      return (dest === empty || isWhite(dest) !== whitesTurn)
    }
  }).map(move => [y + move[0], x + move[1]])
}

function withinBounds(y, x) {
  const isWithin = n => n >=0 && n < 8
  return isWithin(x) && isWithin(y) 
}

function printBoard() {
  for (let x = 0; x < 8; x++) {
    console.log(`${8 - x}`, board[x])
  }
  console.log('    ', letters.join('    '))
}

function main() {
  printBoard()
  readline.question("What's your move? ", userMove)
}

main()