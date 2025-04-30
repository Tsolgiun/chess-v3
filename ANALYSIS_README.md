# Chess Analysis System Documentation

## Overview

The Chess Analysis System is a comprehensive solution for analyzing chess games, providing detailed insights into move quality, tactical opportunities, and player accuracy. The system evaluates chess positions using the Stockfish engine, classifies moves based on their quality, detects tactical motifs, and calculates player accuracy scores.

### Key Features

- **Move Classification**: Categorizes moves as brilliant, great, best, excellent, good, inaccuracy, mistake, blunder, book, or forced
- **Accuracy Calculation**: Computes player accuracy scores based on move quality
- **Tactical Motif Detection**: Identifies tactical patterns such as forks, pins, discovered attacks, and more
- **Win Percentage Calculation**: Converts engine evaluations to win percentages
- **Visual Analysis**: Displays analysis results with an intuitive UI

### System Architecture

The analysis system consists of several interconnected modules:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  UI Components  │◄────┤  Core Analysis  │◄────┤  Chess Engine   │
│                 │     │     Modules     │     │  (Stockfish)    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Core Analysis Modules

### analysis.ts

The main orchestrator of the analysis process. It takes a series of evaluated positions and produces a comprehensive analysis report.

```typescript
import { Chess } from "chess.js";
import { Classification } from "./classification";
import { EvaluatedPosition, Report } from "./types";
import { classifyMoves } from "./moveClassification";
import { updateReportWithAccuracy } from "./accuracy";
import { addTacticalMotifs } from "./tacticalMotifs";

/**
 * Analyzes a series of chess positions and returns a detailed report
 * @param positions Array of evaluated positions
 * @returns Analysis report with move classifications and accuracy scores
 */
export async function analyze(positions: EvaluatedPosition[]): Promise<Report> {
    // Extract FENs from positions for move classification
    const fens = positions.map(position => position.fen);
    
    // Classify moves
    const classifiedPositions = classifyMoves(positions, fens);
    
    // Generate SAN moves from all engine lines
    for (let position of classifiedPositions) {
        for (let line of position.topLines) {
            if (line.evaluation.type === "mate" && line.evaluation.value === 0) continue;

            let board = new Chess(position.fen);

            try {
                line.moveSAN = board.move({
                    from: line.moveUCI.slice(0, 2),
                    to: line.moveUCI.slice(2, 4),
                    promotion: line.moveUCI.slice(4) || undefined
                }).san;
            } catch {
                line.moveSAN = "";
            }
        }
    }

    // Add tactical motifs to positions
    const positionsWithMotifs = addTacticalMotifs(classifiedPositions);
    
    // Calculate classification counts
    const classifications = {
        white: {
            brilliant: 0,
            great: 0,
            best: 0,
            excellent: 0,
            good: 0,
            inaccuracy: 0,
            mistake: 0,
            blunder: 0,
            book: 0,
            forced: 0,
        },
        black: {
            brilliant: 0,
            great: 0,
            best: 0,
            excellent: 0,
            good: 0,
            inaccuracy: 0,
            mistake: 0,
            blunder: 0,
            book: 0,
            forced: 0,
        }
    };

    // Count classifications for each player
    for (let position of classifiedPositions.slice(1)) {
        if (!position.classification) continue;
        
        const moveColour = position.fen.includes(" b ") ? "white" : "black";
        classifications[moveColour][position.classification.toLowerCase() as keyof typeof classifications.white] += 1;
    }

    // Create initial report
    const report: Report = {
        accuracies: {
            white: 0,
            black: 0
        },
        classifications: classifications as any,
        positions: classifiedPositions
    };

    // Update report with accuracy values
    const finalReport = updateReportWithAccuracy(report);
    
    // Add tactical motifs information to the report
    finalReport.positions = positionsWithMotifs;
    
    return finalReport;
}
```

### accuracy.ts

Calculates player accuracy scores based on move quality and win percentage differences.

```typescript
import { EvaluatedPosition, Report } from "./types";
import { getPositionWinPercentage } from "./winPercentage";

/**
 * Computes the accuracy for both players
 * @param positions Array of evaluated positions
 * @returns Object with white and black accuracy values
 */
export function computeAccuracy(positions: EvaluatedPosition[]): { white: number; black: number } {
    // Calculate win percentage for each position
    const positionsWinPercentage = positions.map(getPositionWinPercentage);

    // Calculate weights for each move
    const weights = getAccuracyWeights(positionsWinPercentage);

    // Calculate accuracy for each move
    const movesAccuracy = getMovesAccuracy(positionsWinPercentage);

    // Calculate accuracy for each player
    const whiteAccuracy = getPlayerAccuracy(movesAccuracy, weights, "white");
    const blackAccuracy = getPlayerAccuracy(movesAccuracy, weights, "black");

    return {
        white: whiteAccuracy,
        black: blackAccuracy
    };
}

/**
 * Updates a report with accuracy values
 * @param report Report object to update
 * @returns Updated report with accuracy values
 */
export function updateReportWithAccuracy(report: Report): Report {
    const accuracies = computeAccuracy(report.positions);
    
    return {
        ...report,
        accuracies
    };
}
```

### moveClassification.ts

Classifies chess moves based on their quality, using engine evaluations and win percentage differences.

```typescript
import { Chess, Square } from "chess.js";
import { Classification } from "./classification";
import { EvaluatedPosition, EngineLine, Evaluation } from "./types";
import { getPositionWinPercentage, getLineWinPercentage } from "./winPercentage";
import { getAttackers, isPieceHanging, pieceValues } from "./board";

/**
 * Classifies moves in a game
 * @param positions Array of evaluated positions
 * @param fens Array of FEN strings
 * @returns Array of evaluated positions with classifications
 */
export function classifyMoves(
    positions: EvaluatedPosition[],
    fens: string[]
): EvaluatedPosition[] {
    // Track current opening throughout analysis
    let currentOpening: string | undefined = undefined;
    
    // Generate classifications for each position
    let positionIndex = 0;
    for (let position of positions.slice(1)) {
        positionIndex++;

        let board = new Chess(position.fen);
        let lastPosition = positions[positionIndex - 1];

        // Check for opening moves
        let opening = openings.find(opening => position.fen.includes(opening.fen));
        if (opening) {
            currentOpening = opening.name;
            position.opening = opening.name;
            position.classification = Classification.BOOK;
            continue;
        }
        
        // If we have a current opening, carry it forward
        if (currentOpening) {
            position.opening = currentOpening;
        }

        // Get the top move and second top move from the last position
        let topMove = lastPosition.topLines.find(line => line.id === 1);
        let secondTopMove = lastPosition.topLines.find(line => line.id === 2);
        if (!topMove) continue;

        // Get the evaluation of the previous position and current position
        let previousEvaluation = topMove.evaluation;
        let evaluation = position.topLines.find(line => line.id === 1)?.evaluation;
        if (!previousEvaluation) continue;

        // Determine if it's white's or black's move
        let moveColour = position.fen.includes(" b ") ? "white" : "black";
        let isWhiteMove = moveColour === "white";

        // If there are no legal moves in this position, game is in terminal state
        if (!evaluation) {
            evaluation = { type: board.isCheckmate() ? "mate" : "cp", value: 0 };
            position.topLines.push({
                id: 1,
                depth: 0,
                evaluation: evaluation,
                moveUCI: ""
            });
        }

        // Calculate win percentages
        const lastPositionWinPercentage = getLineWinPercentage(topMove);
        const positionWinPercentage = getPositionWinPercentage(position);
        
        // Get alternative line win percentage if available
        let lastPositionAlternativeLineWinPercentage: number | undefined;
        if (secondTopMove) {
            lastPositionAlternativeLineWinPercentage = getLineWinPercentage(secondTopMove);
        }

        // If this move was the only legal one, apply forced
        if (!secondTopMove) {
            position.classification = Classification.FORCED;
            continue;
        }

        // Get the played move
        const playedMove = position.move.uci;
        
        // Get the best move from the previous position
        const bestMove = topMove.moveUCI;
        
        // Get the best line to play after the move
        const bestLinePvToPlay = position.topLines[0]?.moveUCI ? [position.topLines[0].moveUCI] : [];
        
        // Check if the move is brilliant
        if (isBrilliantMove(
                lastPositionWinPercentage,
                positionWinPercentage,
                isWhiteMove,
                playedMove,
                bestLinePvToPlay,
                lastPosition.fen,
                lastPositionAlternativeLineWinPercentage
            )) {
            position.classification = Classification.BRILLIANT;
            continue;
        }

        // Check if the move is great
        const fenTwoMovesAgo = positionIndex > 1 ? positions[positionIndex - 2].fen : null;
        const uciNextTwoMoves: [string, string] | null =
            positionIndex > 1 ? [positions[positionIndex - 2].move.uci, positions[positionIndex - 1].move.uci] : null;
        
        if (isGreatMove(
                lastPositionWinPercentage,
                positionWinPercentage,
                isWhiteMove,
                lastPositionAlternativeLineWinPercentage,
                fenTwoMovesAgo,
                uciNextTwoMoves
            )) {
            position.classification = Classification.GREAT;
            continue;
        }

        // If it is the top line, it's the best move
        if (playedMove === bestMove) {
            position.classification = Classification.BEST;
            continue;
        }

        // Otherwise, classify based on win percentage difference
        position.classification = getMoveBasicClassification(
            lastPositionWinPercentage,
            positionWinPercentage,
            isWhiteMove
        );

        // Do not allow blunder if move still completely winning
        if (
            position.classification === Classification.BLUNDER && 
            (isWhiteMove ? positionWinPercentage > 90 : positionWinPercentage < 10)
        ) {
            position.classification = Classification.GOOD;
        }

        // Do not allow blunder if you were already in a completely lost position
        if (
            position.classification === Classification.BLUNDER &&
            (isWhiteMove ? lastPositionWinPercentage < 10 : lastPositionWinPercentage > 90)
        ) {
            position.classification = Classification.GOOD;
        }

        position.classification ??= Classification.BOOK;
    }

    return positions;
}
```

### tacticalMotifs.ts

Detects tactical patterns in chess positions, such as forks, pins, discovered attacks, and more.

```typescript
import { Chess, Square } from "chess.js";
import { EvaluatedPosition } from "./types";
import { getAttackers, isPieceHanging, pieceValues } from "./board";

/**
 * Types of tactical motifs that can be detected
 */
export enum TacticalMotif {
    FORK = "fork",
    PIN = "pin",
    SKEWER = "skewer",
    DISCOVERED_ATTACK = "discovered_attack",
    DOUBLE_ATTACK = "double_attack",
    HANGING_PIECE = "hanging_piece",
    OVERLOADED_PIECE = "overloaded_piece",
    ZUGZWANG = "zugzwang",
    MATE_THREAT = "mate_threat",
    NONE = "none"
}

/**
 * Detects tactical motifs in a position
 * @param prevFen FEN string of the position before the move
 * @param fen FEN string of the position after the move
 * @param moveUci UCI string of the move
 * @returns Array of detected tactical motifs
 */
export function detectTacticalMotifs(prevFen: string, fen: string, moveUci: string): DetectedMotif[] {
    const motifs: DetectedMotif[] = [];
    
    // Check for various tactical motifs
    const fork = detectFork(fen, moveUci);
    if (fork) motifs.push(fork);
    
    const pin = detectPin(fen, moveUci);
    if (pin) motifs.push(pin);
    
    const discoveredAttack = detectDiscoveredAttack(prevFen, fen, moveUci);
    if (discoveredAttack) motifs.push(discoveredAttack);
    
    const hangingPiece = detectHangingPiece(fen);
    if (hangingPiece) motifs.push(hangingPiece);
    
    const mateThreat = detectMateThreat(fen);
    if (mateThreat) motifs.push(mateThreat);
    
    return motifs;
}

/**
 * Adds tactical motif information to evaluated positions
 * @param positions Array of evaluated positions
 * @returns Array of evaluated positions with tactical motif information
 */
export function addTacticalMotifs(positions: EvaluatedPosition[]): EvaluatedPosition[] {
    // Skip the first position (initial position)
    for (let i = 1; i < positions.length; i++) {
        const prevPosition = positions[i - 1];
        const position = positions[i];
        
        // Detect tactical motifs
        const motifs = detectTacticalMotifs(prevPosition.fen, position.fen, position.move.uci);
        
        // Add motifs to the position
        if (motifs.length > 0) {
            position.tacticalMotifs = motifs;
        }
    }
    
    return positions;
}
```

### winPercentage.ts

Converts engine evaluations (centipawns or mate) to win percentages.

```typescript
import { Evaluation, EngineLine, EvaluatedPosition } from "./types";

/**
 * Converts a centipawn evaluation to a win percentage (0-100)
 * Using the same formula as Freechess for consistency
 * @param cp Centipawn evaluation
 * @returns Win percentage for white (0-100)
 */
export function getWinPercentageFromCp(cp: number): number {
    const cpCeiled = Math.max(-1000, Math.min(1000, cp));
    const MULTIPLIER = -0.00368208;
    const winChances = 2 / (1 + Math.exp(MULTIPLIER * cpCeiled)) - 1;
    return 50 + 50 * winChances;
}

/**
 * Converts a mate evaluation to a win percentage (0-100)
 * @param mate Mate evaluation (positive for white winning, negative for black winning)
 * @returns Win percentage for white (0-100)
 */
export function getWinPercentageFromMate(mate: number): number {
    // Use a very large centipawn value to represent mate
    const mateInf = mate * 10000;
    return getWinPercentageFromCp(mateInf);
}

/**
 * Gets the win percentage from an evaluation
 * @param evaluation Evaluation object with type and value
 * @returns Win percentage for white (0-100)
 */
export function getWinPercentageFromEvaluation(evaluation: Evaluation): number {
    if (evaluation.type === "cp") {
        // In our implementation, CP values are stored as decimals (e.g., 0.2)
        // We need to convert them to centipawns (e.g., 20) for the win percentage calculation
        return getWinPercentageFromCp(evaluation.value * 100);
    } else {
        return getWinPercentageFromMate(evaluation.value);
    }
}

/**
 * Gets the win percentage from an engine line
 * @param line Engine line with evaluation
 * @returns Win percentage for white (0-100)
 */
export function getLineWinPercentage(line: EngineLine): number {
    return getWinPercentageFromEvaluation(line.evaluation);
}

/**
 * Gets the win percentage from a position
 * @param position Evaluated position with top lines
 * @returns Win percentage for white (0-100)
 */
export function getPositionWinPercentage(position: EvaluatedPosition): number {
    if (position.topLines.length === 0) {
        return 50; // Default to 50% if no evaluation is available
    }
    return getLineWinPercentage(position.topLines[0]);
}
```

### board.ts

Provides utility functions for working with chess board states, such as finding attackers and defenders of pieces.

```typescript
import { Chess, Square } from "chess.js";

export interface InfluencingPiece {
    square: Square,
    color: string,
    type: string
}

export const pieceValues: { [key: string]: number } = {
    "p": 1,
    "n": 3,
    "b": 3,
    "r": 5,
    "q": 9,
    "k": Infinity,
    "m": 0
};

/**
 * Gets all pieces attacking a square
 * @param fen FEN string of the position
 * @param square Square to check for attackers
 * @returns Array of attacking pieces
 */
export function getAttackers(fen: string, square: Square): InfluencingPiece[] {
    let attackers: InfluencingPiece[] = [];

    let board = new Chess(fen);
    let piece = board.get(square);
    
    if (!piece) return attackers;

    // Set colour to move to opposite of attacked piece
    board.load(fen
        .replace(/(?<= )(?:w|b)(?= )/g, piece.color == "w" ? "b" : "w")
        .replace(/ [a-h][1-8] /g, " - ")
    );

    // Find each legal move that captures attacked piece
    let legalMoves = board.moves({ verbose: true });

    for (let move of legalMoves) {
        if (move.to == square) {
            attackers.push({
                square: move.from,
                color: move.color,
                type: move.piece
            });
        }
    }

    // Handle special case for kings
    // [Implementation details omitted for brevity]

    return attackers;
}

/**
 * Gets all pieces defending a square
 * @param fen FEN string of the position
 * @param square Square to check for defenders
 * @returns Array of defending pieces
 */
export function getDefenders(fen: string, square: Square) {
    // [Implementation details omitted for brevity]
    // Uses similar logic to getAttackers but for defenders
}

/**
 * Checks if a piece is hanging (can be captured without immediate consequence)
 * @param lastFen FEN string of the position before the move
 * @param fen FEN string of the position after the move
 * @param square Square to check
 * @returns True if the piece is hanging
 */
export function isPieceHanging(lastFen: string, fen: string, square: Square) {
    // [Implementation details omitted for brevity]
    // Analyzes attackers and defenders to determine if a piece is hanging
}
```

### classification.ts

Defines the classification types and thresholds for move quality.

```typescript
export enum Classification {
    BRILLIANT = "brilliant",
    GREAT = "great",
    BEST = "best",
    EXCELLENT = "excellent",
    GOOD = "good",
    INACCURACY = "inaccuracy",
    MISTAKE = "mistake",
    BLUNDER = "blunder",
    BOOK = "book",
    FORCED = "forced"
}

export const classificationValues = {
    "blunder": 0,
    "mistake": 0.2,
    "inaccuracy": 0.4,
    "good": 0.65,
    "excellent": 0.9,
    "best": 1,
    "great": 1,
    "brilliant": 1,
    "book": 1,
    "forced": 1
}

// Classification types with no special rules
export const centipawnClassifications = [
    Classification.BEST,
    Classification.EXCELLENT,
    Classification.GOOD,
    Classification.INACCURACY,
    Classification.MISTAKE,
    Classification.BLUNDER
];

// Get the maximum evaluation loss for a classification to be applied
// Evaluation loss threshold for excellent in a previously equal position is 30
export function getEvaluationLossThreshold(classif: Classification, prevEval: number) {
    prevEval = Math.abs(prevEval);
    let threshold = 0;

    switch (classif) {
        case Classification.BEST:
            threshold = 0.0001 * Math.pow(prevEval, 2) + (0.0236 * prevEval) - 3.7143;
            break;
        case Classification.EXCELLENT:
            threshold = 0.0002 * Math.pow(prevEval, 2) + (0.1231 * prevEval) + 27.5455;
            break;
        case Classification.GOOD:
            threshold = 0.0002 * Math.pow(prevEval, 2) + (0.2643 * prevEval) + 60.5455;
            break;
        case Classification.INACCURACY:
            threshold = 0.0002 * Math.pow(prevEval, 2) + (0.3624 * prevEval) + 108.0909;
            break;
        case Classification.MISTAKE:
            threshold = 0.0003 * Math.pow(prevEval, 2) + (0.4027 * prevEval) + 225.8182;
            break;
        default:
            threshold = Infinity;
    }

    return Math.max(threshold, 0);
}
```

### types.ts

Defines the data structures used throughout the analysis system.

```typescript
import { Classification } from "./classification";

export interface Evaluation {
    type: "cp" | "mate";
    value: number;
}

export interface EngineLine {
    id: number;
    depth: number;
    evaluation: Evaluation;
    moveUCI: string;
    moveSAN?: string;
}

export interface Move {
    san: string;
    uci: string;
}

export interface Position {
    fen: string;
    move?: Move;
}

export interface EvaluatedPosition extends Position {
    move: Move;
    topLines: EngineLine[];
    cutoffEvaluation?: Evaluation;
    classification?: Classification;
    opening?: string;
    worker: string;
    tacticalMotifs?: DetectedMotif[];
}

export interface DetectedMotif {
    type: string;
    description: string;
    fromSquare?: string;
    toSquare?: string;
    targetSquares?: string[];
}

export interface Report {
    accuracies: {
        white: number;
        black: number;
    };
    classifications: {
        white: Record<Classification, number>;
        black: Record<Classification, number>;
    };
    positions: EvaluatedPosition[];
}
```

## Engine Integration

### stockfish17.ts

Integrates with the Stockfish chess engine to evaluate positions.

```typescript
/**
 * Interface for Stockfish 17 engine
 */

export interface PositionEvaluationLine {
  depth: number;
  cp?: number;
  mate?: number;
  pv: string[];
}

export interface PositionEvaluation {
  lines: PositionEvaluationLine[];
}

export interface EvaluatePositionOptions {
  fen: string;
  depth: number;
  multiPv: number;
  setPartialEval: (positionEval: PositionEvaluation) => void;
}

export interface Stockfish17Engine {
  evaluatePositionWithUpdate: (options: EvaluatePositionOptions) => Promise<void>;
  getEngineNextMove: (fen: string, skillLevel: number, depth: number) => Promise<string | null>;
  stopSearch: () => void;
  shutdown: () => void;
}

export class Stockfish17 {
  /**
   * Create a new instance of the Stockfish 17 engine
   * @param lite Whether to use the lite version of the engine
   * @returns A promise that resolves to a Stockfish17Engine instance
   */
  static async create(lite: boolean): Promise<Stockfish17Engine> {
    // Implementation details omitted for brevity
    // Creates a Web Worker that communicates with the Stockfish WASM engine
  }
}
```

## UI Components

### Analysis.tsx

The main UI component for displaying analysis results.

```typescript
import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { Chess } from 'chess.js';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../types/interfaces';
import { Stockfish17, PositionEvaluation } from '../../lib/engine/stockfish17';
import analyze from '../../lib/chess/analysis';
import { Classification } from '../../lib/chess/classification';
import { EvaluatedPosition, EngineLine, Evaluation, Move, Report, DetectedMotif } from '../../lib/chess/types';
import PgnImport from '../PgnImport/PgnImport';
import DepthControl from '../DepthControl/DepthControl';
import AnalysisLoadingScreen from './AnalysisLoadingScreen';

interface AnalysisProps {
  position: Chess;
  moveHistory: string[];
  currentMoveIndex: number;
  onPositionChange?: (position: Chess, moveHistory: string[], currentMoveIndex: number) => void;
  onEvaluationChange?: (value: number | null, type: 'cp' | 'mate' | null) => void;
  onMoveClassificationsChange?: (classifications: Record<string, string>) => void;
}

const Analysis: React.FC<AnalysisProps> = ({ position, moveHistory, currentMoveIndex, onPositionChange, onEvaluationChange, onMoveClassificationsChange }) => {
  const theme = useTheme();
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [engine, setEngine] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<PositionEvaluation | null>(null);
  const [positions, setPositions] = useState<EvaluatedPosition[]>([]);
  const [currentClassification, setCurrentClassification] = useState<Classification | null>(null);
  const [moveClassifications, setMoveClassifications] = useState<Record<string, string>>({});
  const [report, setReport] = useState<Report | null>(null);
  const [analysisDepth, setAnalysisDepth] = useState<number>(10);
  const [error, setError] = useState<string | null>(null);
  const [totalPositions, setTotalPositions] = useState<number>(0);
  const [currentPosition, setCurrentPosition] = useState<number>(0);
  
  // Initialize the engine
  useEffect(() => {
    const initEngine = async () => {
      try {
        const stockfish = await Stockfish17.create(false);
        setEngine(stockfish);
      } catch (error) {
        console.error('Failed to initialize Stockfish engine:', error);
      }
    };

    initEngine();

    return () => {
      if (engine) {
        engine.shutdown();
      }
    };
  }, []);
  
  // Start analysis
  const startAnalysis = async () => {
    console.log("Starting analysis...");
    setIsAnalyzing(true);
    setError(null); // Reset any previous errors
    
    try {
      // Create positions array from move history
      const newPositions: EvaluatedPosition[] = [];
      const tempChess = new Chess();
      
      // Add initial position
      newPositions.push({
        fen: tempChess.fen(),
        move: { san: '', uci: '' },
        topLines: [],
        worker: 'local'
      });
      
      // Add positions for each move
      for (let i = 0; i < moveHistory.length; i++) {
        const move = tempChess.move(moveHistory[i]);
        if (move) {
          newPositions.push({
            fen: tempChess.fen(),
            move: {
              san: move.san,
              uci: `${move.from}${move.to}${move.promotion || ''}`,
            },
            topLines: [],
            worker: 'local'
          });
        }
      }
      
      // Set total positions for progress tracking
      const positionsCount = newPositions.length;
      setTotalPositions(positionsCount);
      setCurrentPosition(0);
      
      // Set positions once initially
      setPositions(newPositions);
      
      // Create a working copy of positions that we'll update during analysis
      const workingPositions = [...newPositions];
      
      // Filter positions to analyze (every 2nd position + first and last)
      const positionsToAnalyze = workingPositions.filter((pos, idx) => {
        // Always analyze first and last positions
        if (idx === 0 || idx === workingPositions.length - 1) return true;
        
        // Analyze every 2nd position
        return idx % 2 === 0;
      });
      
      // Analyze each position
      if (engine) {
        for (let i = 0; i < positionsToAnalyze.length; i++) {
          // Get the actual index in the workingPositions array
          const posIndex = workingPositions.findIndex(p => p.fen === positionsToAnalyze[i].fen);
          
          // Update current position for progress display
          setCurrentPosition(i + 1);
          
          const pos = positionsToAnalyze[i];
          
          // Evaluate the position
          await engine.evaluatePositionWithUpdate({
            fen: pos.fen,
            depth: analysisDepth,
            multiPv: 2,
            setPartialEval: (evaluation: PositionEvaluation) => {
              // Convert evaluation to EngineLine format
              const lines = convertToEngineLine(evaluation);
              
              // Update the working position with the evaluation
              if (posIndex !== -1) {
                workingPositions[posIndex] = {
                  ...workingPositions[posIndex],
                  topLines: lines
                };
              }
            }
          });
        }
      }
      
      // After all positions are analyzed, generate the report
      const analysisReport = await analyze(workingPositions);
      
      // Update state with final results
      setReport(analysisReport);
      setPositions(analysisReport.positions);
      
      // Update current classification
      if (currentMoveIndex >= 0 && currentMoveIndex < analysisReport.positions.length - 1) {
        const classification = analysisReport.positions[currentMoveIndex + 1]?.classification;
        setCurrentClassification(classification || null);
      }
    } catch (error) {
      console.error("Error in analysis process:", error);
      setError(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
}
```

### AnalysisLoadingScreen.tsx

A component that displays a loading screen during analysis.

```typescript
import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../types/interfaces';

interface AnalysisLoadingScreenProps {
  progress: number;
  totalPositions: number;
  currentPosition: number;
}

interface ContainerProps {
  theme: { colors: ThemeColors };
}

const Container = styled.div<ContainerProps>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${({ theme }) => theme.colors.secondary}ee;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
  border-radius: 12px;
`;

const Title = styled.h3<ContainerProps>`
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 20px;
`;

const ProgressBarContainer = styled.div`
  width: 80%;
  height: 20px;
  background: #2a2a2a;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
`;

interface ProgressBarProps {
  progress: number;
}

const ProgressBar = styled.div<ProgressBarProps>`
  height: 100%;
  width: ${props => Math.min(Math.max(props.progress * 100, 0), 100)}%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 10px;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div<ContainerProps>`
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.9rem;
`;

const AnalysisLoadingScreen: React.FC<AnalysisLoadingScreenProps> = ({ 
  progress, 
  totalPositions,
  currentPosition
}) => {
  const theme = useTheme();
  
  return (
    <Container theme={theme}>
      <Title theme={theme}>Analyzing Chess Positions</Title>
      <ProgressBarContainer>
        <ProgressBar progress={progress} />
      </ProgressBarContainer>
      <ProgressText theme={theme}>
        Analyzing position {currentPosition} of {totalPositions} ({Math.round(progress * 100)}%)
      </ProgressText>
    </Container>
  );
};

export default AnalysisLoadingScreen;
```

## Usage Examples

### Basic Analysis Usage

Here's how to use the analysis system to analyze a chess game:

```typescript
import { Chess } from 'chess.js';
import { Stockfish17 } from './lib/engine/stockfish17';
import analyze from './lib/chess/analysis';
import { EvaluatedPosition } from './lib/chess/types';

async function analyzeGame() {
  // Initialize the chess engine
  const engine = await Stockfish17.create(false);
  
  // Create a new chess game
  const chess = new Chess();
  
  // Make some moves
  chess.move('e4');
  chess.move('e5');
  chess.move('Nf3');
  chess.move('Nc6');
  
  // Create positions array
  const positions: EvaluatedPosition[] = [];
  
  // Add initial position
  positions.push({
    fen: chess.fen(),
    move: { san: '', uci: '' },
    topLines: [],
    worker: 'local'
  });
  
  // Analyze each position
  for (let i = 0; i < positions.length; i++) {
    const position = positions[i];
    
    await engine.evaluatePositionWithUpdate({
      fen: position.fen,
      depth: 16,
      multiPv: 2,
      setPartialEval: (evaluation) => {
        // Convert evaluation to EngineLine format
        position.topLines = evaluation.lines.map((line, idx) => ({
          id: idx + 1,
          depth: line.depth,
          evaluation: {
            type: line.mate !== undefined ? "mate" : "cp",
            value: line.mate !== undefined ? line.mate : (line.cp || 0) / 100
          },
          moveUCI: line.pv[0] || '',
        }));
      }
    });
  }
  
  // Generate analysis report
  const report = await analyze(positions);
  
  // Display results
  console.log('White accuracy:', report.accuracies.white.toFixed(1) + '%');
  console.log('Black accuracy:', report.accuracies.black.toFixed(1) + '%');
  
  // Display move classifications
  report.positions.slice(1).forEach((position, index) => {
    console.log(`Move ${index + 1}: ${position.move.san} - ${position.classification}`);
    
    // Display tactical motifs if any
    if (position.tacticalMotifs && position.tacticalMotifs.length > 0) {
      console.log('Tactical motifs:');
      position.tacticalMotifs.forEach(motif => {
        console.log(`- ${motif.type}: ${motif.description}`);
      });
    }
  });
  
  // Shutdown the engine
  engine.shutdown();
}
```

### Using the Analysis Component

Here's how to use the Analysis component in a React application:

```tsx
import React, { useState } from 'react';
import { Chess } from 'chess.js';
import Analysis from './components/Analysis/Analysis';

const ChessAnalysisPage: React.FC = () => {
  const [position, setPosition] = useState<Chess>(new Chess());
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(-1);
  
  const handlePositionChange = (
    newPosition: Chess, 
    newMoveHistory: string[], 
    newMoveIndex: number
  ) => {
    setPosition(newPosition);
    setMoveHistory(newMoveHistory);
    setCurrentMoveIndex(newMoveIndex);
  };
  
  const handleEvaluationChange = (
    value: number | null, 
    type: 'cp' | 'mate' | null
  ) => {
    // Handle evaluation change
    console.log(`Evaluation: ${type === 'mate' ? 'M' + value : value}`);
  };
  
  const handleMoveClassificationsChange = (
    classifications: Record<string, string>
  ) => {
    // Handle move classifications change
    console.log('Move classifications:', classifications);
  };
  
  return (
    <div>
      <h1>Chess Analysis</h1>
      
      {/* Render chess board here */}
      
      <Analysis
        position={position}
        moveHistory={moveHistory}
        currentMoveIndex={currentMoveIndex}
        onPositionChange={handlePositionChange}
        onEvaluationChange={handleEvaluationChange}
        onMoveClassificationsChange={handleMoveClassificationsChange}
      />
    </div>
  );
};

export default ChessAnalysisPage;
```

## Conclusion

The Chess Analysis System provides a comprehensive solution for analyzing chess games. It combines the power of the Stockfish chess engine with sophisticated algorithms for move classification, accuracy calculation, and tactical motif detection. The system is designed to be modular and extensible, making it easy to add new features or improve existing ones.

Key strengths of the system include:

1. **Accurate Move Classification**: The system uses a sophisticated algorithm to classify moves based on their quality, taking into account factors such as win percentage differences, tactical opportunities, and position complexity.

2. **Detailed Tactical Analysis**: The system can detect various tactical motifs such as forks, pins, discovered attacks, and more, providing valuable insights into the game.

3. **Player Accuracy Calculation**: The system calculates player accuracy scores based on move quality, providing a quantitative measure of player performance.

4. **Intuitive UI**: The system includes a user-friendly UI for displaying analysis results, making it easy for players to understand and learn from their games.

5. **Extensibility**: The modular design of the system makes it easy to add new features or improve existing ones.
