import { Chess } from 'chess.js';
import { Stockfish17, Stockfish17Engine, PositionEvaluation } from '../lib/engine/stockfish17';
import { EngineEvaluation, AnalysisLine } from '../types/interfaces';

type AnalysisCallback = (line: AnalysisLine) => void;
type EvaluationCallback = (evaluation: EngineEvaluation) => void;

class ChessAPIService {
    private isAnalyzing: boolean;
    private currentFen: string;
    private onLineCallback: AnalysisCallback | null;
    private onEvaluationCallback: EvaluationCallback | null;
    private depth: number;
    private variants: number;
    private maxThinkingTime: number;
    private engine: Stockfish17Engine | null;
    private engineReady: boolean;

    constructor() {
        this.isAnalyzing = false;
        this.currentFen = '';
        this.onLineCallback = null;
        this.onEvaluationCallback = null;
        this.depth = 12;
        this.variants = 3;
        this.maxThinkingTime = 50;
        this.engine = null;
        this.engineReady = false;
    }

    async init(): Promise<void> {
        try {
            // Initialize the Stockfish 17 Lite engine
            this.engine = await Stockfish17.create(true); // true for lite version
            this.engineReady = true;
            console.log('Stockfish engine initialized successfully');
            return Promise.resolve();
        } catch (error) {
            console.error('Failed to initialize Stockfish engine:', error);
            return Promise.reject(error);
        }
    }

    setAnalysisCallback(callback: AnalysisCallback): void {
        this.onLineCallback = callback;
    }

    setEvaluationCallback(callback: EvaluationCallback): void {
        this.onEvaluationCallback = callback;
    }

    setDepth(depth: number): void {
        this.depth = Math.min(Math.max(depth, 1), 18);
    }

    setVariants(variants: number): void {
        this.variants = Math.min(Math.max(variants, 1), 5);
    }

    setMaxThinkingTime(time: number): void {
        this.maxThinkingTime = Math.min(Math.max(time, 10), 100);
    }

    getPositionInfo(evaluation: number): string {
        if (evaluation >= 3) return "Winning advantage";
        if (evaluation >= 1.5) return "Clear advantage";
        if (evaluation >= 0.5) return "Slight advantage";
        if (evaluation > -0.5) return "Equal position";
        if (evaluation > -1.5) return "Slight disadvantage";
        if (evaluation > -3) return "Clear disadvantage";
        return "Lost position";
    }

    formatPV(moves: string[]): string[] {
        const chess = new Chess(this.currentFen);
        return moves.map(move => {
            try {
                // Try to make the move directly
                const result = chess.move(move);
                return result ? result.san : move;
            } catch {
                // If direct move fails, try to parse it as a UCI move (e.g., "e2e4")
                try {
                    if (move.length >= 4) {
                        const from = move.substring(0, 2);
                        const to = move.substring(2, 4);
                        const promotion = move.length > 4 ? move.substring(4, 5) : undefined;
                        
                        const result = chess.move({ from, to, promotion });
                        return result ? result.san : move;
                    }
                    return move;
                } catch {
                    return move;
                }
            }
        });
    }

    async startAnalysis(fen: string): Promise<boolean> {
        if (!this.engineReady || !this.engine) {
            console.error('Engine not ready');
            return false;
        }

        this.currentFen = fen;
        this.isAnalyzing = true;

        try {
            // Start analysis with the engine
            await this.engine.evaluatePositionWithUpdate({
                fen,
                depth: this.depth,
                multiPv: this.variants,
                setPartialEval: (positionEval: PositionEvaluation) => {
                    // Process evaluation updates
                    if (positionEval.lines && positionEval.lines.length > 0) {
                        // Update evaluation
                        if (this.onEvaluationCallback) {
                            const mainLine = positionEval.lines[0];
                            const isMate = mainLine.mate !== undefined;
                            const evaluation = mainLine.cp !== undefined ? mainLine.cp : 
                                (isMate && mainLine.mate !== undefined ? (mainLine.mate > 0 ? 999 : -999) : 0);
                            
                            console.log('Engine evaluation data:', {
                                positionEval,
                                mainLine,
                                evaluation,
                                isMate
                            });
                            
                            // Calculate win chance using the improved formula
                            const winChance = this.calculateWinChance(evaluation, isMate);
                            console.log('Calculated win chance:', winChance);
                            
                            this.onEvaluationCallback({
                                evaluation,
                                depth: mainLine.depth,
                                winChance,
                                nodes: 0 // Not available in this implementation
                            });
                        }
                        
                        // Update analysis lines
                        if (this.onLineCallback) {
                            positionEval.lines.forEach((line, index) => {
                                const isMate = line.mate !== undefined;
                                const evaluation = line.cp !== undefined ? line.cp : 
                                    (isMate && line.mate !== undefined ? (line.mate > 0 ? 999 : -999) : 0);
                                
                                // Calculate win chance with improved formula
                                const winChance = this.calculateWinChance(evaluation, isMate);
                                
                                this.onLineCallback && this.onLineCallback({
                                    depth: line.depth,
                                    evaluation,
                                    moves: this.formatPV(line.pv),
                                    multipv: index + 1,
                                    info: this.getPositionInfo(evaluation),
                                    winChance,
                                    mate: line.mate
                                });
                            });
                        }
                    }
                }
            });
            
            this.isAnalyzing = false;
            return true;
        } catch (error) {
            console.error('Analysis failed:', error);
            this.isAnalyzing = false;
            return false;
        }
    }

    calculateWinChance(evaluation: number, isMate: boolean): number {
        // For mate scores, return 100% or 0% win chance
        if (isMate) {
            return evaluation > 0 ? 100 : 0;
        }
        
        // For regular evaluations, use the Freechess formula
        if (evaluation >= 10) return 100;
        if (evaluation <= -10) return 0;
        
        // Convert evaluation to percentage using Freechess formula
        const MULTIPLIER = -0.00368208;
        const cpCeiled = Math.max(-1000, Math.min(1000, evaluation * 100)); // Convert to centipawns and clamp
        const winChances = 2 / (1 + Math.exp(MULTIPLIER * cpCeiled)) - 1;
        return Math.round(50 + 50 * winChances);
    }

    stopAnalysis(): void {
        if (this.engine) {
            this.engine.stopSearch();
        }
        this.isAnalyzing = false;
    }

    terminate(): void {
        this.stopAnalysis();
        if (this.engine) {
            this.engine.shutdown();
            this.engine = null;
            this.engineReady = false;
        }
    }

    // Method to get a move recommendation (for AI play)
    async getMove(fen: string): Promise<string | null> {
        if (!this.engineReady || !this.engine) {
            console.error('Engine not ready');
            return null;
        }

        try {
            // Use a moderate skill level (10 out of 20)
            const move = await this.engine.getEngineNextMove(fen, 10, this.depth);
            return move || null;
        } catch (error) {
            console.error('Failed to get move recommendation:', error);
            return null;
        }
    }
}

const chessAPI = new ChessAPIService();
export default chessAPI;
