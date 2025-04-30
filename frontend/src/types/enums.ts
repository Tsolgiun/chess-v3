export enum EngineName {
  STOCKFISH = 'stockfish',
  STOCKFISH_17 = 'stockfish17'
}

export enum GameStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed'
}

export enum GameResult {
  WHITE_WIN = 'white_win',
  BLACK_WIN = 'black_win',
  DRAW = 'draw',
  ONGOING = 'ongoing'
}

export enum PieceType {
  PAWN = 'pawn',
  KNIGHT = 'knight',
  BISHOP = 'bishop',
  ROOK = 'rook',
  QUEEN = 'queen',
  KING = 'king'
}

export enum PlayerColor {
  WHITE = 'white',
  BLACK = 'black'
}
