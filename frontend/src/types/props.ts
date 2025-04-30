import { ReactNode } from 'react';
import { Game, User, Blog, AnalysisLine } from './interfaces';
import { PlayerColor } from './enums';

export interface BoardProps {
  demoMode?: boolean;
  analysisMode?: boolean;
  position?: any; // chess.js instance
  boardFlipped?: boolean;
  onBoardFlip?: (flipped: boolean) => void;
  evaluation?: number | null; // Evaluation value in centipawns or mate
  evaluationType?: 'cp' | 'mate' | null; // Type of evaluation
  showEvaluationBar?: boolean; // Whether to show the evaluation bar
  moveClassifications?: Record<string, string>; // Map of square to classification type
}

export interface CapturedPiecesProps {
  position: string;
}

export interface GameInfoProps {
  white: User | string | null;
  black: User | string | null;
  result?: string;
  timeControl?: { initial: number; increment: number };
}

export interface GameResultModalProps {
  show: boolean;
  result: string | null;
  onNewGame: () => void;
  onReview: () => void;
}

export interface GameSetupProps {
  onStartGame: (options: {
    color: PlayerColor;
    timeControl: { initial: number; increment: number };
    againstAI: boolean;
    aiLevel: number;
  }) => void;
}

export interface MoveHistoryProps {
  moves: string[];
  selectedMoveIndex?: number;
  onMoveClick?: (index: number) => void;
  onFirstMove?: () => void;
  onPreviousMove?: () => void;
  onNextMove?: () => void;
  onLastMove?: () => void;
}

export interface NavBarProps {
  transparent?: boolean;
}

export interface TimerProps {
  whiteTime: number;
  blackTime: number;
  isWhiteTurn: boolean;
  isGameActive: boolean;
  initialTime?: number;
}

export interface PrivateRouteProps {
  children: ReactNode;
}

export interface PublicRouteProps {
  children: ReactNode;
}

export interface BlogPostProps {
  post: Blog;
  isPreview?: boolean;
}

export interface AnalysisInfoProps {
  evaluation: number;
  depth: number;
  winChance: number;
  lines: AnalysisLine[];
}
