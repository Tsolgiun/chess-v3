import { EvaluatedPosition, Report } from "./types";
import { getPositionWinPercentage } from "./winPercentage";

/**
 * Calculates the ceiling of a number within a specified range
 * @param num Number to ceiling
 * @param min Minimum value
 * @param max Maximum value
 * @returns Number clamped between min and max
 */
function clampNumber(num: number, min: number, max: number): number {
    if (num > max) return max;
    if (num < min) return min;
    return num;
}

/**
 * Calculates the harmonic mean of an array of numbers
 * @param array Array of numbers
 * @returns Harmonic mean
 */
function getHarmonicMean(array: number[]): number {
    const sum = array.reduce((acc, curr) => acc + 1 / curr, 0);
    return array.length / sum;
}

/**
 * Calculates the standard deviation of an array of numbers
 * @param array Array of numbers
 * @returns Standard deviation
 */
function getStandardDeviation(array: number[]): number {
    const n = array.length;
    const mean = array.reduce((a, b) => a + b) / n;
    return Math.sqrt(
        array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
    );
}

/**
 * Calculates the weighted mean of an array of numbers
 * @param array Array of numbers
 * @param weights Array of weights
 * @returns Weighted mean
 */
function getWeightedMean(array: number[], weights: number[]): number {
    if (array.length > weights.length) {
        throw new Error("Weights array is too short");
    }

    const weightedSum = array.reduce(
        (acc, curr, index) => acc + curr * weights[index],
        0
    );
    const weightSum = weights
        .slice(0, array.length)
        .reduce((acc, curr) => acc + curr, 0);

    return weightedSum / weightSum;
}

/**
 * Calculates the accuracy weights for each move
 * @param movesWinPercentage Array of win percentages for each position
 * @returns Array of weights
 */
function getAccuracyWeights(movesWinPercentage: number[]): number[] {
    // Calculate window size based on number of moves (min 2, max 8)
    const windowSize = clampNumber(
        Math.ceil(movesWinPercentage.length / 10),
        2,
        8
    );

    const windows: number[][] = [];
    const halfWindowSize = Math.round(windowSize / 2);

    // Create sliding windows of positions
    for (let i = 1; i < movesWinPercentage.length; i++) {
        const startIdx = i - halfWindowSize;
        const endIdx = i + halfWindowSize;

        if (startIdx < 0) {
            windows.push(movesWinPercentage.slice(0, windowSize));
            continue;
        }

        if (endIdx > movesWinPercentage.length) {
            windows.push(movesWinPercentage.slice(-windowSize));
            continue;
        }

        windows.push(movesWinPercentage.slice(startIdx, endIdx));
    }

    // Calculate standard deviation for each window (min 0.5, max 12)
    const weights = windows.map((window) => {
        const std = getStandardDeviation(window);
        return clampNumber(std, 0.5, 12);
    });

    return weights;
}

/**
 * Calculates the accuracy for each move
 * @param movesWinPercentage Array of win percentages for each position
 * @returns Array of accuracy values (0-100)
 */
function getMovesAccuracy(movesWinPercentage: number[]): number[] {
    return movesWinPercentage.slice(1).map((winPercent, index) => {
        const lastWinPercent = movesWinPercentage[index];
        const winDiff = Math.abs(lastWinPercent - winPercent);

        // Formula from Freechess for calculating accuracy based on win percentage difference
        const rawAccuracy =
            103.1668100711649 * Math.exp(-0.04354415386753951 * winDiff) -
            3.166924740191411;

        return Math.min(100, Math.max(0, rawAccuracy + 1));
    });
}

/**
 * Calculates the accuracy for a player
 * @param movesAccuracy Array of accuracy values for each move
 * @param weights Array of weights for each move
 * @param player Player color ("white" or "black")
 * @returns Accuracy value (0-100)
 */
function getPlayerAccuracy(
    movesAccuracy: number[],
    weights: number[],
    player: "white" | "black"
): number {
    const remainder = player === "white" ? 0 : 1;
    const playerAccuracies = movesAccuracy.filter(
        (_, index) => index % 2 === remainder
    );
    const playerWeights = weights.filter((_, index) => index % 2 === remainder);

    // If no moves were played, return 0
    if (playerAccuracies.length === 0) {
        return 0;
    }

    const weightedMean = getWeightedMean(playerAccuracies, playerWeights);
    const harmonicMean = getHarmonicMean(playerAccuracies);

    // Average of weighted mean and harmonic mean
    return (weightedMean + harmonicMean) / 2;
}

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
