import { Classification } from "../classification";
import { EngineLine, Evaluation } from "./Engine";

interface Move {
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
