import { ReactNode } from 'react';
import { User, ThemeColors, EngineEvaluation, AnalysisLine } from './interfaces';
import { PlayerColor } from './enums';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (username: string, email: string, password: string) => Promise<any>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<User>;
  loginWithGoogle: () => Promise<any>; // New method for Google authentication
}

export interface AuthProviderProps {
  children: ReactNode;
}

export interface GameContextType {
  game: any; // chess.js instance
  playerColor: PlayerColor;
  isGameActive: boolean;
  isWaitingForPlayer: boolean;
  isAIGame: boolean;
  isAIThinking: boolean;
  lastMove: { from: string; to: string } | null;
  makeMove: (move: { from: string; to: string; promotion?: string }) => boolean;
  resetGame: () => void;
  startNewGame: (options: GameOptions) => void;
  flipBoard: () => void;
  boardFlipped: boolean;
  timeControl: { white: number; black: number };
  updateTimeControl: (color: PlayerColor, time: number) => void;
  gameOver: boolean;
  gameResult: string | null;
  gameResultReason: string | null;
  capturedPieces: { white: string[]; black: string[] };
  moveHistory: string[];
  currentPosition: string;
  evaluation: EngineEvaluation | null;
  analysisLines: AnalysisLine[];
  startAnalysis: () => void;
  stopAnalysis: () => void;
  isAnalyzing: boolean;
  
  // Additional properties needed by Game.js
  status: string;
  socket: any; // Socket.io instance
  joinGame: (gameId: string) => void;
  gameId: string | null;
  setBoardFlipped: (flipped: boolean) => void;
  timeRemaining: { white: number; black: number };
  resetGameState: () => void;
  resignGame: () => void;
  cancelGame: () => void;
  offerDraw: () => void;
  acceptDraw: () => void;
  declineDraw: () => void;
  drawOffered: boolean;
  drawOfferFrom: string | null;
  setGameForReview: (game: any, moves: string[], reviewId: string) => boolean;
  opponentPlatform: string | null;
  
  // Game creation functions
  createGame: (options?: GameOptions) => void;
  startAIGame: (color: string, difficulty: number) => void;
}

export interface GameProviderProps {
  children: ReactNode;
}

export interface GameOptions {
  color?: PlayerColor;
  timeControl?: { initial: number; increment: number };
  againstAI?: boolean;
  aiLevel?: number;
  startPosition?: string;
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  colors: ThemeColors;
  boardColors: {
    lightSquare: string;
    darkSquare: string;
  };
  setBoardColors: (colors: { lightSquare?: string; darkSquare?: string }) => void;
}

export interface ThemeProviderProps {
  children: ReactNode;
}
