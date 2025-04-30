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
