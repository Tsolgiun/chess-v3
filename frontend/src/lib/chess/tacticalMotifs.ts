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
 * Interface for a detected tactical motif
 */
export interface DetectedMotif {
    type: TacticalMotif;
    description: string;
    fromSquare?: Square;
    toSquare?: Square;
    targetSquares?: Square[];
}

/**
 * Checks if a move creates a fork
 * A fork is when a single piece attacks two or more pieces simultaneously
 * @param fen FEN string of the position after the move
 * @param moveUci UCI string of the move
 * @returns DetectedMotif if a fork is found, null otherwise
 */
function detectFork(fen: string, moveUci: string): DetectedMotif | null {
    const game = new Chess(fen);
    const toSquare = moveUci.slice(2, 4) as Square;
    
    // Get the piece that just moved
    const piece = game.get(toSquare);
    if (!piece) return null;
    
    // Find all squares that this piece attacks
    const attackedSquares: Square[] = [];
    const board = game.board();
    
    // For knights, check all possible knight moves
    if (piece.type === 'n') {
        const knightMoves = [
            { x: 1, y: 2 }, { x: 2, y: 1 },
            { x: -1, y: 2 }, { x: -2, y: 1 },
            { x: 1, y: -2 }, { x: 2, y: -1 },
            { x: -1, y: -2 }, { x: -2, y: -1 }
        ];
        
        const file = toSquare.charCodeAt(0) - 'a'.charCodeAt(0);
        const rank = parseInt(toSquare[1]) - 1;
        
        for (const move of knightMoves) {
            const newFile = file + move.x;
            const newRank = rank + move.y;
            
            if (newFile >= 0 && newFile < 8 && newRank >= 0 && newRank < 8) {
                const square = String.fromCharCode('a'.charCodeAt(0) + newFile) + (newRank + 1) as Square;
                const targetPiece = game.get(square);
                
                if (targetPiece && targetPiece.color !== piece.color && targetPiece.type !== 'k') {
                    attackedSquares.push(square);
                }
            }
        }
    } else {
        // For other pieces, use chess.js moves to find attacked squares
        const moves = game.moves({ square: toSquare, verbose: true });
        
        for (const move of moves) {
            const targetPiece = game.get(move.to as Square);
            if (targetPiece && targetPiece.color !== piece.color && targetPiece.type !== 'k') {
                attackedSquares.push(move.to as Square);
            }
        }
    }
    
    // If the piece attacks two or more pieces, it's a fork
    if (attackedSquares.length >= 2) {
        // Calculate the total value of attacked pieces
        let totalValue = 0;
        for (const square of attackedSquares) {
            const targetPiece = game.get(square);
            if (targetPiece) {
                totalValue += pieceValues[targetPiece.type];
            }
        }
        
        // Only consider it a significant fork if the total value is at least 6 (e.g., rook + pawn)
        // or if it attacks at least 3 pieces
        if (totalValue >= 6 || attackedSquares.length >= 3) {
            return {
                type: TacticalMotif.FORK,
                description: `${piece.color === 'w' ? 'White' : 'Black'}'s ${getPieceName(piece.type)} forks ${attackedSquares.length} pieces`,
                fromSquare: moveUci.slice(0, 2) as Square,
                toSquare,
                targetSquares: attackedSquares
            };
        }
    }
    
    return null;
}

/**
 * Checks if a move creates a pin
 * A pin is when a piece cannot move because doing so would expose a more valuable piece to attack
 * @param fen FEN string of the position after the move
 * @param moveUci UCI string of the move
 * @returns DetectedMotif if a pin is found, null otherwise
 */
function detectPin(fen: string, moveUci: string): DetectedMotif | null {
    const game = new Chess(fen);
    const toSquare = moveUci.slice(2, 4) as Square;
    
    // Get the piece that just moved
    const piece = game.get(toSquare);
    if (!piece) return null;
    
    // Only long-range pieces can create pins (bishop, rook, queen)
    if (piece.type !== 'b' && piece.type !== 'r' && piece.type !== 'q') {
        return null;
    }
    
    // Check for pins along ranks, files, and diagonals
    const directions: [number, number][] = [];
    
    // Bishop and queen can pin along diagonals
    if (piece.type === 'b' || piece.type === 'q') {
        directions.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
    }
    
    // Rook and queen can pin along ranks and files
    if (piece.type === 'r' || piece.type === 'q') {
        directions.push([1, 0], [-1, 0], [0, 1], [0, -1]);
    }
    
    const file = toSquare.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = parseInt(toSquare[1]) - 1;
    
    for (const [dx, dy] of directions) {
        let x = file + dx;
        let y = rank + dy;
        let firstPiece: { square: Square; piece: any } | null = null;
        let secondPiece: { square: Square; piece: any } | null = null;
        
        // Look along the direction until we find two pieces or reach the edge of the board
        while (x >= 0 && x < 8 && y >= 0 && y < 8) {
            const square = String.fromCharCode('a'.charCodeAt(0) + x) + (y + 1) as Square;
            const targetPiece = game.get(square);
            
            if (targetPiece) {
                if (!firstPiece) {
                    firstPiece = { square, piece: targetPiece };
                } else {
                    secondPiece = { square, piece: targetPiece };
                    break;
                }
            }
            
            x += dx;
            y += dy;
        }
        
        // If we found two pieces and the first is an enemy piece and the second is a more valuable enemy piece
        if (firstPiece && secondPiece && 
            firstPiece.piece.color !== piece.color && 
            secondPiece.piece.color !== piece.color &&
            pieceValues[firstPiece.piece.type] < pieceValues[secondPiece.piece.type]) {
            
            return {
                type: TacticalMotif.PIN,
                description: `${piece.color === 'w' ? 'White' : 'Black'}'s ${getPieceName(piece.type)} pins ${getPieceName(firstPiece.piece.type)} to ${getPieceName(secondPiece.piece.type)}`,
                fromSquare: moveUci.slice(0, 2) as Square,
                toSquare,
                targetSquares: [firstPiece.square, secondPiece.square]
            };
        }
    }
    
    return null;
}

/**
 * Checks if a move creates a discovered attack
 * A discovered attack is when moving a piece reveals an attack by another piece
 * @param prevFen FEN string of the position before the move
 * @param fen FEN string of the position after the move
 * @param moveUci UCI string of the move
 * @returns DetectedMotif if a discovered attack is found, null otherwise
 */
function detectDiscoveredAttack(prevFen: string, fen: string, moveUci: string): DetectedMotif | null {
    const prevGame = new Chess(prevFen);
    const game = new Chess(fen);
    
    const fromSquare = moveUci.slice(0, 2) as Square;
    const toSquare = moveUci.slice(2, 4) as Square;
    
    // Get the piece that moved
    const movedPiece = prevGame.get(fromSquare);
    if (!movedPiece) return null;
    
    // Find pieces that could potentially be revealed by this move
    const file = fromSquare.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = parseInt(fromSquare[1]) - 1;
    
    // Check all 8 directions
    const directions: [number, number][] = [
        [1, 0], [-1, 0], [0, 1], [0, -1], // Rook directions
        [1, 1], [1, -1], [-1, 1], [-1, -1] // Bishop directions
    ];
    
    for (const [dx, dy] of directions) {
        let x = file - dx; // Look behind the moved piece
        let y = rank - dy;
        
        // Find the first piece behind the moved piece
        while (x >= 0 && x < 8 && y >= 0 && y < 8) {
            const square = String.fromCharCode('a'.charCodeAt(0) + x) + (y + 1) as Square;
            const piece = prevGame.get(square);
            
            if (piece) {
                // If it's a friendly piece that could attack along this direction
                if (piece.color === movedPiece.color) {
                    const canAttackAlongDirection = 
                        (piece.type === 'r' && (dx === 0 || dy === 0)) || // Rook along rank/file
                        (piece.type === 'b' && dx !== 0 && dy !== 0) || // Bishop along diagonal
                        (piece.type === 'q'); // Queen along any direction
                    
                    if (canAttackAlongDirection) {
                        // Now check if there's a target in the forward direction
                        let tx = file + dx;
                        let ty = rank + dy;
                        
                        while (tx >= 0 && tx < 8 && ty >= 0 && ty < 8) {
                            const targetSquare = String.fromCharCode('a'.charCodeAt(0) + tx) + (ty + 1) as Square;
                            const targetPiece = game.get(targetSquare);
                            
                            if (targetPiece) {
                                if (targetPiece.color !== piece.color && pieceValues[targetPiece.type] >= 3) {
                                    return {
                                        type: TacticalMotif.DISCOVERED_ATTACK,
                                        description: `${piece.color === 'w' ? 'White' : 'Black'}'s ${getPieceName(movedPiece.type)} reveals an attack on ${getPieceName(targetPiece.type)}`,
                                        fromSquare,
                                        toSquare,
                                        targetSquares: [square, targetSquare]
                                    };
                                }
                                break;
                            }
                            
                            tx += dx;
                            ty += dy;
                        }
                    }
                }
                break;
            }
            
            x -= dx;
            y -= dy;
        }
    }
    
    return null;
}

/**
 * Checks if a move creates a hanging piece
 * A hanging piece is a piece that can be captured without immediate consequence
 * @param fen FEN string of the position after the move
 * @returns DetectedMotif if a hanging piece is found, null otherwise
 */
function detectHangingPiece(fen: string): DetectedMotif | null {
    const game = new Chess(fen);
    
    // Check all squares for hanging pieces
    for (let file = 0; file < 8; file++) {
        for (let rank = 0; rank < 8; rank++) {
            const square = String.fromCharCode('a'.charCodeAt(0) + file) + (rank + 1) as Square;
            const piece = game.get(square);
            
            if (piece && pieceValues[piece.type] >= 3) { // Only consider valuable pieces
                const attackers = getAttackers(fen, square);
                const defenders = getAttackers(fen, square).filter(a => a.color === piece.color);
                
                // If the piece is attacked and not defended, or if it's attacked by a lesser piece
                if (attackers.length > 0 && 
                    (defenders.length === 0 || 
                     Math.min(...attackers.map(a => pieceValues[a.type])) < pieceValues[piece.type])) {
                    
                    return {
                        type: TacticalMotif.HANGING_PIECE,
                        description: `${piece.color === 'w' ? 'White' : 'Black'}'s ${getPieceName(piece.type)} is hanging`,
                        targetSquares: [square]
                    };
                }
            }
        }
    }
    
    return null;
}

/**
 * Checks if a move creates a mate threat
 * A mate threat is when a player can checkmate in the next move
 * @param fen FEN string of the position after the move
 * @returns DetectedMotif if a mate threat is found, null otherwise
 */
function detectMateThreat(fen: string): DetectedMotif | null {
    const game = new Chess(fen);
    
    // Get all legal moves
    const moves = game.moves({ verbose: true });
    
    // Check if any move leads to checkmate
    for (const move of moves) {
        const testGame = new Chess(fen);
        testGame.move(move);
        
        if (testGame.isCheckmate()) {
            return {
                type: TacticalMotif.MATE_THREAT,
                description: `${game.turn() === 'w' ? 'White' : 'Black'} has a checkmate in one`,
                fromSquare: move.from as Square,
                toSquare: move.to as Square
            };
        }
    }
    
    return null;
}

/**
 * Helper function to get the name of a piece
 * @param pieceType The type of the piece (p, n, b, r, q, k)
 * @returns The name of the piece
 */
function getPieceName(pieceType: string): string {
    switch (pieceType) {
        case 'p': return 'pawn';
        case 'n': return 'knight';
        case 'b': return 'bishop';
        case 'r': return 'rook';
        case 'q': return 'queen';
        case 'k': return 'king';
        default: return 'piece';
    }
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
