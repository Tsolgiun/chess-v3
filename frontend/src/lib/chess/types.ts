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
