import { GameStatus, GameResult, PlayerColor } from './enums';

export interface User {
  _id: string;
  username: string;
  email: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  createdAt: string;
  updatedAt: string;
  boardLightSquare?: string; // Custom light square color
  boardDarkSquare?: string;  // Custom dark square color
}

export interface Game {
  _id: string;
  fen: string;
  pgn: string;
  status: GameStatus;
  result: GameResult;
  white: string | User;
  black: string | User;
  moves: Move[];
  timeControl: TimeControl;
  createdAt: string;
  updatedAt: string;
}

export interface Move {
  from: string;
  to: string;
  promotion?: string;
  san?: string;
  timestamp?: number;
  timeLeft?: number;
}

export interface TimeControl {
  initial: number;
  increment: number;
}

export interface Position {
  fen: string;
  board: string[][];
  turn: PlayerColor;
  castling: {
    whiteKingSide: boolean;
    whiteQueenSide: boolean;
    blackKingSide: boolean;
    blackQueenSide: boolean;
  };
  enPassant: string | null;
  halfMoves: number;
  fullMoves: number;
}

export interface EngineEvaluation {
  evaluation: number;
  depth: number;
  winChance: number;
  nodes?: number;
}

export interface AnalysisLine {
  depth: number;
  evaluation: number;
  moves: string[];
  multipv: number;
  info: string;
  winChance: number;
  mate?: number;
}

export interface Blog {
  _id: string;
  title: string;
  content: string;
  author: string | User;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
  border: string;
  moveHighlight: string;
  error: string;
  success: string;
  highlight: string;
}
