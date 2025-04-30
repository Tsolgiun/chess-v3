import { Chess, Square } from "chess.js";
import { Classification, centipawnClassifications, getEvaluationLossThreshold } from "./classification";
import { EvaluatedPosition } from "./types/Position";
import { EngineLine, Evaluation } from "./types/Engine";
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
    // Validate input parameters
    if (!positions || !Array.isArray(positions) || positions.length === 0) {
        console.error("Invalid positions array provided to classifyMoves");
        return [];
    }

    if (!fens || !Array.isArray(fens) || fens.length === 0) {
        console.error("Invalid FENs array provided to classifyMoves");
        return positions; // Return original positions without classification
    }

    // Ensure FENs and positions arrays have compatible lengths
    if (fens.length < positions.length) {
        console.warn(`FENs array (${fens.length}) is shorter than positions array (${positions.length})`);
    }

    // Track current opening throughout analysis
    let currentOpening: string | undefined = undefined;
    
    // Generate classifications for each position
    let positionIndex = 0;
    for (let position of positions.slice(1)) {
        positionIndex++;

        // Skip invalid positions
        if (!position || !position.fen) {
            console.warn(`Invalid position at index ${positionIndex}, skipping classification`);
            continue;
        }

        // Validate FEN
        let board;
        try {
            board = new Chess(position.fen);
        } catch (e) {
            console.error(`Invalid FEN at position ${positionIndex}: ${position.fen}`, e);
            continue;
        }

        // Ensure we have a valid previous position
        if (positionIndex >= positions.length || !positions[positionIndex - 1]) {
            console.warn(`Missing previous position at index ${positionIndex - 1}, skipping classification`);
            continue;
        }

        let lastPosition = positions[positionIndex - 1];

        // Check for opening
        const opening = detectOpening(position.fen);
        if (opening) {
            currentOpening = opening;
            position.opening = opening;
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

        // Check if this move was the only legal one
        const game = new Chess(lastPosition.fen);
        const legalMoves = game.moves({ verbose: true });
        
        if (legalMoves.length <= 1) {
            position.classification = Classification.FORCED;
            continue;
        }

        // Get the played move
        const playedMove = position.move.uci;
        
        // Get the best move from the previous position
        const bestMove = topMove.moveUCI;
        
        // Calculate absolute evaluations
        const absoluteEvaluation = evaluation.value * (isWhiteMove ? 1 : -1);
        const previousAbsoluteEvaluation = previousEvaluation.value * (isWhiteMove ? 1 : -1);
        
        // Check if this is the best move
        if (playedMove === bestMove) {
            position.classification = Classification.BEST;
            continue;
        }
        
        // Calculate evaluation loss
        let evalLoss = Infinity;
        if (isWhiteMove) {
            evalLoss = previousEvaluation.value - evaluation.value;
        } else {
            evalLoss = evaluation.value - previousEvaluation.value;
        }
        
        // Direct classification based on centipawn evaluation
        if (previousEvaluation.type === "cp" && evaluation.type === "cp") {
            // Use centipawn classifications directly from classification.ts
            for (let classif of centipawnClassifications) {
                if (evalLoss <= getEvaluationLossThreshold(classif, previousEvaluation.value)) {
                    position.classification = classif;
                    break;
                }
            }
        } else {
            // Handle mate scores
            position.classification = getMateScoreClassification(
                previousEvaluation,
                evaluation,
                absoluteEvaluation,
                previousAbsoluteEvaluation,
                isWhiteMove
            );
        }

        // Do not allow blunder if move still completely winning
        if (position.classification === Classification.BLUNDER && absoluteEvaluation >= 600) {
            position.classification = Classification.MISTAKE;
        }

        // Do not allow blunder if you were already in a completely lost position
        if (
            position.classification === Classification.BLUNDER && 
            previousAbsoluteEvaluation <= -600 &&
            previousEvaluation.type === "cp" &&
            evaluation.type === "cp"
        ) {
            position.classification = Classification.MISTAKE;
        }
        
        // Ensure a classification is set
        position.classification ??= Classification.BOOK;
    }

    return positions;
}

/**
 * Gets classification for positions with mate scores
 */
function getMateScoreClassification(
    previousEvaluation: Evaluation,
    evaluation: Evaluation,
    absoluteEvaluation: number,
    previousAbsoluteEvaluation: number,
    isWhiteMove: boolean
): Classification {
    // If no mate last move but you blundered a mate
    if (previousEvaluation.type === "cp" && evaluation.type === "mate") {
        if (absoluteEvaluation > 0) {
            return Classification.BEST;
        } else if (absoluteEvaluation >= -2) {
            return Classification.BLUNDER;
        } else if (absoluteEvaluation >= -5) {
            return Classification.MISTAKE;
        } else {
            return Classification.INACCURACY;
        }
    }

    // If mate last move and there is no longer a mate
    else if (previousEvaluation.type === "mate" && evaluation.type === "cp") {
        if (previousAbsoluteEvaluation < 0 && absoluteEvaluation < 0) {
            return Classification.BEST;
        } else if (absoluteEvaluation >= 400) {
            return Classification.GOOD;
        } else if (absoluteEvaluation >= 150) {
            return Classification.INACCURACY;
        } else if (absoluteEvaluation >= -100) {
            return Classification.MISTAKE;
        } else {
            return Classification.BLUNDER;
        }
    }

    // If mate last move and forced mate still exists
    else if (previousEvaluation.type === "mate" && evaluation.type === "mate") {
        if (previousAbsoluteEvaluation > 0) {
            if (absoluteEvaluation <= -4) {
                return Classification.MISTAKE;
            } else if (absoluteEvaluation < 0) {
                return Classification.BLUNDER;
            } else if (absoluteEvaluation < previousAbsoluteEvaluation) {
                return Classification.BEST;
            } else if (absoluteEvaluation <= previousAbsoluteEvaluation + 2) {
                return Classification.EXCELLENT;
            } else {
                return Classification.GOOD;
            }
        } else {
            if (absoluteEvaluation === previousAbsoluteEvaluation) {
                return Classification.BEST;
            } else {
                return Classification.GOOD;
            }
        }
    }
    
    return Classification.BOOK;
}

/**
 * Detects openings in a position
 */
function detectOpening(fen: string): string | undefined {
    // Common openings database
    const openings = [
        // King's Pawn Openings
        { fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b", name: "King's Pawn Opening" },
        { fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w", name: "Open Game" },
        { fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b", name: "King's Knight Opening" },
        { fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w", name: "Ruy Lopez Setup" },
        { fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b", name: "Italian Game" },
        
        // Queen's Pawn Openings
        { fen: "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b", name: "Queen's Pawn Opening" },
        { fen: "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w", name: "Closed Game" },
        { fen: "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b", name: "Queen's Gambit" },
        
        // Other Common Defenses
        { fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w", name: "Sicilian Defense" },
        { fen: "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w", name: "Scandinavian Defense" }
    ];
    
    return openings.find(opening => fen.includes(opening.fen))?.name;
}
