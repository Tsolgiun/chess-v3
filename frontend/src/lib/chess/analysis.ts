import { Chess, Square } from "chess.js";

import { EvaluatedPosition } from "./types/Position";
import Report from "./types/Report";

import {
    Classification, 
    centipawnClassifications, 
    classificationValues, 
    getEvaluationLossThreshold 
} from "./classification";
import { InfluencingPiece, getAttackers, isPieceHanging, pieceValues, promotions } from "./board";

/**
 * Main analysis function that processes positions and generates a report
 * @param positions Array of evaluated positions
 * @returns Analysis report with classifications and accuracies
 */
async function analyse(positions: EvaluatedPosition[]): Promise<Report> {
    
    // Process each position and classify moves
    processPositions(positions);
    
    // Generate SAN moves from all engine lines
    generateSANMoves(positions);
    
    // Apply book moves for cloud evaluations and named positions
    applyBookMoves(positions);
    
    // Calculate computer accuracy percentages
    const { accuracies, classifications } = calculateAccuracies(positions);

    // Return complete report
    return {
        accuracies,
        classifications,
        positions: positions
    };
}

/**
 * Process each position and classify moves
 * @param positions Array of evaluated positions
 */
function processPositions(positions: EvaluatedPosition[]): void {
    let positionIndex = 0;
    for (let position of positions.slice(1)) {
        positionIndex++;

        let board = new Chess(position.fen);
        let lastPosition = positions[positionIndex - 1];

        let topMove = lastPosition.topLines.find(line => line.id == 1);
        let secondTopMove = lastPosition.topLines.find(line => line.id == 2);
        
        // Debug logging for topLines
        console.log(`Position ${positionIndex} topLines:`, lastPosition.topLines);
        console.log(`Position ${positionIndex} has topMove:`, !!topMove, "secondTopMove:", !!secondTopMove);
        
        if (!topMove) continue;

        let previousEvaluation = topMove.evaluation;
        let evaluation = position.topLines.find(line => line.id == 1)?.evaluation;
        if (!previousEvaluation) continue;

        let moveColour = position.fen.includes(" b ") ? "white" : "black";

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

        // Calculate evaluation loss
        const evalLoss = calculateEvaluationLoss(position, lastPosition, moveColour, previousEvaluation, evaluation);

        // If this move was the only legal one, apply forced
        if (!secondTopMove) {
            position.classification = Classification.FORCED;
            continue;
        }

        // Classify the move
        classifyMove(position, lastPosition, topMove, secondTopMove, moveColour, previousEvaluation, evaluation, evalLoss);
    }
}

/**
 * Calculate evaluation loss for a move
 * @param position Current position
 * @param lastPosition Previous position
 * @param moveColour Color that made the move
 * @param previousEvaluation Evaluation of the previous position
 * @param evaluation Evaluation of the current position
 * @returns Evaluation loss
 */
function calculateEvaluationLoss(
    position: EvaluatedPosition, 
    lastPosition: EvaluatedPosition, 
    moveColour: string, 
    previousEvaluation: any, 
    evaluation: any
): number {
    let evalLoss = Infinity;
    let cutoffEvalLoss = Infinity;
    let lastLineEvalLoss = Infinity;

    let matchingTopLine = lastPosition.topLines.find(line => line.moveUCI == position.move.uci);
    if (matchingTopLine) {
        if (moveColour == "white") {
            lastLineEvalLoss = previousEvaluation.value - matchingTopLine.evaluation.value;
        } else {
            lastLineEvalLoss = matchingTopLine.evaluation.value - previousEvaluation.value;
        }
    }

    if (lastPosition.cutoffEvaluation) {
        if (moveColour == "white") {
            cutoffEvalLoss = lastPosition.cutoffEvaluation.value - evaluation.value;
        } else {
            cutoffEvalLoss = evaluation.value - lastPosition.cutoffEvaluation.value;
        }   
    }

    if (moveColour == "white") {
        evalLoss = previousEvaluation.value - evaluation.value;
    } else {
        evalLoss = evaluation.value - previousEvaluation.value;
    }

    return Math.min(evalLoss, cutoffEvalLoss, lastLineEvalLoss);
}

/**
 * Classify a move based on evaluation and other factors
 * @param position Current position
 * @param lastPosition Previous position
 * @param topMove Top move from the previous position
 * @param secondTopMove Second top move from the previous position
 * @param moveColour Color that made the move
 * @param previousEvaluation Evaluation of the previous position
 * @param evaluation Evaluation of the current position
 * @param evalLoss Evaluation loss
 */
function classifyMove(
    position: EvaluatedPosition, 
    lastPosition: EvaluatedPosition, 
    topMove: any, 
    secondTopMove: any, 
    moveColour: string, 
    previousEvaluation: any, 
    evaluation: any, 
    evalLoss: number
): void {
    let absoluteEvaluation = evaluation.value * (moveColour == "white" ? 1 : -1);
    let previousAbsoluteEvaluation = previousEvaluation.value * (moveColour == "white" ? 1 : -1);
    let absoluteSecondEvaluation = (secondTopMove?.evaluation.value ?? 0) * (moveColour == "white" ? 1 : -1);
    
    let noMate = previousEvaluation.type == "cp" && evaluation.type == "cp";

    // If it is the top line, disregard other detections and give best
    if (topMove.moveUCI == position.move.uci) {
        position.classification = Classification.BEST;
    } else {
        // If no mate on the board last move and still no mate
        if (noMate) {
            for (let classif of centipawnClassifications) {
                if (evalLoss <= getEvaluationLossThreshold(classif, previousEvaluation.value)) {
                    position.classification = classif;
                    break;
                }
            }
        } else {
            // Handle mate score evaluations
            handleMateScores(position, previousEvaluation, evaluation, absoluteEvaluation, previousAbsoluteEvaluation);
        }
    }

    // Check for brilliant move
    if (position.classification == Classification.BEST) {
        checkForBrilliantMove(position, lastPosition, absoluteEvaluation, absoluteSecondEvaluation, topMove, moveColour);
    }

    // Check for great move
    if (position.classification == Classification.BEST) {
        checkForGreatMove(position, lastPosition, noMate, topMove, secondTopMove);
    }

    // Apply post-classification adjustments
    applyPostClassificationAdjustments(position, absoluteEvaluation, previousAbsoluteEvaluation, previousEvaluation, evaluation);
}

/**
 * Handle mate score evaluations
 * @param position Current position
 * @param previousEvaluation Evaluation of the previous position
 * @param evaluation Evaluation of the current position
 * @param absoluteEvaluation Absolute evaluation of the current position
 * @param previousAbsoluteEvaluation Absolute evaluation of the previous position
 */
function handleMateScores(
    position: EvaluatedPosition, 
    previousEvaluation: any, 
    evaluation: any, 
    absoluteEvaluation: number, 
    previousAbsoluteEvaluation: number
): void {
    // If no mate last move but you blundered a mate
    if (previousEvaluation.type == "cp" && evaluation.type == "mate") {
        if (absoluteEvaluation > 0) {
            position.classification = Classification.BEST;
        } else if (absoluteEvaluation >= -2) {
            position.classification = Classification.BLUNDER;
        } else if (absoluteEvaluation >= -5) {
            position.classification = Classification.MISTAKE;
        } else {
            position.classification = Classification.INACCURACY;
        }
    }

    // If mate last move and there is no longer a mate
    else if (previousEvaluation.type == "mate" && evaluation.type == "cp") {
        if (previousAbsoluteEvaluation < 0 && absoluteEvaluation < 0) {
            position.classification = Classification.BEST;
        } else if (absoluteEvaluation >= 400) {
            position.classification = Classification.GOOD;
        } else if (absoluteEvaluation >= 150) {
            position.classification = Classification.INACCURACY;
        } else if (absoluteEvaluation >= -100) {
            position.classification = Classification.MISTAKE;
        } else {
            position.classification = Classification.BLUNDER;
        }
    }

    // If mate last move and forced mate still exists
    else if (previousEvaluation.type == "mate" && evaluation.type == "mate") {
        if (previousAbsoluteEvaluation > 0) {
            if (absoluteEvaluation <= -4) {
                position.classification = Classification.MISTAKE;
            } else if (absoluteEvaluation < 0) {
                position.classification = Classification.BLUNDER
            } else if (absoluteEvaluation < previousAbsoluteEvaluation) {
                position.classification = Classification.BEST;
            } else if (absoluteEvaluation <= previousAbsoluteEvaluation + 2) {
                position.classification = Classification.EXCELLENT;
            } else {
                position.classification = Classification.GOOD;
            }
        } else {
            if (absoluteEvaluation == previousAbsoluteEvaluation) {
                position.classification = Classification.BEST;
            } else {
                position.classification = Classification.GOOD;
            }
        }
    }
}

/**
 * Check if a move is brilliant
 * @param position Current position
 * @param lastPosition Previous position
 * @param absoluteEvaluation Absolute evaluation of the current position
 * @param absoluteSecondEvaluation Absolute evaluation of the second best move
 * @param topMove Top move from the previous position
 * @param moveColour Color that made the move
 */
function checkForBrilliantMove(
    position: EvaluatedPosition, 
    lastPosition: EvaluatedPosition, 
    absoluteEvaluation: number, 
    absoluteSecondEvaluation: number, 
    topMove: any, 
    moveColour: string
): void {
    // Test for brilliant move classification
    // Must be winning for the side that played the brilliancy
    let winningAnyways = (
        absoluteSecondEvaluation >= 700 && topMove.evaluation.type == "cp"
        || (topMove.evaluation.type == "mate" && topMove.evaluation.type == "mate")
    );

    if (absoluteEvaluation >= 0 && !winningAnyways && !position.move.san.includes("=")) {
        let lastBoard = new Chess(lastPosition.fen);
        let currentBoard = new Chess(position.fen);
        if (lastBoard.isCheck()) return;

        let lastPiece = lastBoard.get(position.move.uci.slice(2, 4) as Square) || { type: "m" };

        let sacrificedPieces: InfluencingPiece[] = [];
        for (let row of currentBoard.board()) {
            for (let piece of row) {
                if (!piece) continue;
                if (piece.color != moveColour.charAt(0)) continue;
                if (piece.type == "k" || piece.type == "p") continue;

                // If the piece just captured is of higher or equal value than the candidate
                // hanging piece, not hanging, better trade happening somewhere else
                if (pieceValues[lastPiece.type] >= pieceValues[piece.type]) {
                    continue;
                }

                // If the piece is otherwise hanging, brilliant
                if (isPieceHanging(lastPosition.fen, position.fen, piece.square)) {
                    position.classification = Classification.BRILLIANT;
                    sacrificedPieces.push(piece);
                }
            }
        }

        // If all captures of all of your hanging pieces would result in an enemy piece
        // of greater or equal value also being hanging OR mate in 1, not brilliant
        let anyPieceViablyCapturable = false;
        let captureTestBoard = new Chess(position.fen);

        for (let piece of sacrificedPieces) {
            let attackers = getAttackers(position.fen, piece.square);

            for (let attacker of attackers) {
                for (let promotion of promotions) {
                    try {
                        captureTestBoard.move({
                            from: attacker.square,
                            to: piece.square,
                            promotion: promotion
                        });

                        // If the capture of the piece with the current attacker leads to
                        // a piece of greater or equal value being hung (if attacker is pinned)
                        let attackerPinned = false;
                        for (let row of captureTestBoard.board()) {
                            for (let enemyPiece of row) {
                                if (!enemyPiece) continue;
                                if (enemyPiece.color == captureTestBoard.turn()) continue;
                                if (enemyPiece.type == "k" || enemyPiece.type == "p") continue;
        
                                if (
                                    isPieceHanging(position.fen, captureTestBoard.fen(), enemyPiece.square)
                                    && pieceValues[enemyPiece.type] >= Math.max(...sacrificedPieces.map(sack => pieceValues[sack.type]))
                                ) {
                                    attackerPinned = true;
                                    break;
                                }
                            }
                            if (attackerPinned) break;
                        }
                        
                        // If the sacked piece is a rook or more in value, given brilliant
                        // regardless of taking it leading to mate in 1. If it less than a
                        // rook, only give brilliant if its capture cannot lead to mate in 1
                        if (pieceValues[piece.type] >= 5) {
                            if (!attackerPinned) {
                                anyPieceViablyCapturable = true;
                                break;
                            }
                        } else if (
                            !attackerPinned
                            && !captureTestBoard.moves().some(move => move.endsWith("#"))
                        ) {
                            anyPieceViablyCapturable = true;
                            break;
                        }

                        captureTestBoard.undo();
                    } catch {}
                }

                if (anyPieceViablyCapturable) break;
            }

            if (anyPieceViablyCapturable) break;
        }

        if (!anyPieceViablyCapturable) {
            position.classification = Classification.BEST;
        }
    }
}

/**
 * Check if a move is great
 * @param position Current position
 * @param lastPosition Previous position
 * @param noMate True if there is no mate on the board
 * @param topMove Top move from the previous position
 * @param secondTopMove Second top move from the previous position
 */
function checkForGreatMove(
    position: EvaluatedPosition, 
    lastPosition: EvaluatedPosition, 
    noMate: boolean, 
    topMove: any, 
    secondTopMove: any
): void {
    try {
        if (
            noMate
            && position.classification != Classification.BRILLIANT
            && lastPosition.classification == Classification.BLUNDER
            && Math.abs(topMove.evaluation.value - secondTopMove.evaluation.value) >= 150
            && !isPieceHanging(lastPosition.fen, position.fen, position.move.uci.slice(2, 4) as Square)
        ) {
            position.classification = Classification.GREAT;
        }
    } catch {}
}

/**
 * Apply post-classification adjustments
 * @param position Current position
 * @param absoluteEvaluation Absolute evaluation of the current position
 * @param previousAbsoluteEvaluation Absolute evaluation of the previous position
 * @param previousEvaluation Evaluation of the previous position
 * @param evaluation Evaluation of the current position
 */
function applyPostClassificationAdjustments(
    position: EvaluatedPosition, 
    absoluteEvaluation: number, 
    previousAbsoluteEvaluation: number, 
    previousEvaluation: any, 
    evaluation: any
): void {
    // Do not allow blunder if move still completely winning
    if (position.classification == Classification.BLUNDER && absoluteEvaluation >= 600) {
        position.classification = Classification.GOOD;
    }

    // Do not allow blunder if you were already in a completely lost position
    if (
        position.classification == Classification.BLUNDER 
        && previousAbsoluteEvaluation <= -600
        && previousEvaluation.type == "cp"
        && evaluation.type == "cp"
    ) {
        position.classification = Classification.GOOD;
    }

    position.classification ??= Classification.BOOK;
}

/**
 * Generate SAN moves from all engine lines
 * @param positions Array of evaluated positions
 */
function generateSANMoves(positions: EvaluatedPosition[]): void {
    for (let position of positions) {
        for (let line of position.topLines) {
            if (line.evaluation.type == "mate" && line.evaluation.value == 0) continue;

            let board = new Chess(position.fen);

            try {
                line.moveSAN = board.move({
                    from: line.moveUCI.slice(0, 2) as Square,
                    to: line.moveUCI.slice(2, 4) as Square,
                    promotion: line.moveUCI.slice(4) || undefined
                }).san;
            } catch {
                line.moveSAN = "";
            }
        }
    }
}

/**
 * Apply book moves for cloud evaluations and named positions
 * @param positions Array of evaluated positions
 */
function applyBookMoves(positions: EvaluatedPosition[]): void {
    // Apply book moves for cloud evaluations and named positions
    let positiveClassifs = Object.keys(classificationValues).slice(4, 8);
    for (let position of positions.slice(1)) {
        if (
            (position.worker == "cloud" && positiveClassifs.includes(position.classification!))
            || position.opening
        ) {
            position.classification = Classification.BOOK;
        } else {
            break;
        }
    }
}

/**
 * Calculate accuracy percentages
 * @param positions Array of evaluated positions
 * @returns Accuracies and classifications
 */
function calculateAccuracies(positions: EvaluatedPosition[]): { 
    accuracies: { white: number; black: number; }, 
    classifications: { white: any; black: any; } 
} {
    let accuracies = {
        white: {
            current: 0,
            maximum: 0
        },
        black: {
            current: 0,
            maximum: 0
        }
    };
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

    for (let position of positions.slice(1)) {
        const moveColour = position.fen.includes(" b ") ? "white" : "black";

        accuracies[moveColour].current += classificationValues[position.classification!];
        accuracies[moveColour].maximum++;

        classifications[moveColour][position.classification!] += 1;
    }

    return {
        accuracies: {
            white: accuracies.white.current / accuracies.white.maximum * 100,
            black: accuracies.black.current / accuracies.black.maximum * 100
        },
        classifications
    };
}

export default analyse;
