/**
 * Interface for chess opening data
 */
interface Opening {
  name: string;
  moves: string[];
  eco: string;
}

/**
 * Interface for opening information returned by getOpeningInfo
 */
interface OpeningInfo {
  name: string;
  eco: string;
}

/**
 * Type for a chess move, which can be a string or an object with a san property
 */
type ChessMove = string | { san: string } | null;

/**
 * A simple database of common chess openings
 * This is a simplified version and can be expanded with more openings
 */
const openingDatabase: Opening[] = [
    {
        name: "Ruy Lopez (Spanish Opening)",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"],
        eco: "C60-C99"
    },
    {
        name: "Italian Game",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"],
        eco: "C50-C59"
    },
    {
        name: "Sicilian Defense",
        moves: ["e4", "c5"],
        eco: "B20-B99"
    },
    {
        name: "French Defense",
        moves: ["e4", "e6"],
        eco: "C00-C19"
    },
    {
        name: "Caro-Kann Defense",
        moves: ["e4", "c6"],
        eco: "B10-B19"
    },
    {
        name: "Pirc Defense",
        moves: ["e4", "d6"],
        eco: "B07-B09"
    },
    {
        name: "Queen's Gambit",
        moves: ["d4", "d5", "c4"],
        eco: "D06-D69"
    },
    {
        name: "Queen's Gambit Accepted",
        moves: ["d4", "d5", "c4", "dxc4"],
        eco: "D20-D29"
    },
    {
        name: "Queen's Gambit Declined",
        moves: ["d4", "d5", "c4", "e6"],
        eco: "D30-D69"
    },
    {
        name: "King's Indian Defense",
        moves: ["d4", "Nf6", "c4", "g6"],
        eco: "E60-E99"
    },
    {
        name: "Nimzo-Indian Defense",
        moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"],
        eco: "E20-E59"
    },
    {
        name: "English Opening",
        moves: ["c4"],
        eco: "A10-A39"
    },
    {
        name: "Réti Opening",
        moves: ["Nf3", "d5", "c4"],
        eco: "A09"
    },
    {
        name: "King's Gambit",
        moves: ["e4", "e5", "f4"],
        eco: "C30-C39"
    },
    {
        name: "Vienna Game",
        moves: ["e4", "e5", "Nc3"],
        eco: "C25-C29"
    },
    {
        name: "Scotch Game",
        moves: ["e4", "e5", "Nf3", "Nc6", "d4"],
        eco: "C45"
    },
    {
        name: "Four Knights Game",
        moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"],
        eco: "C46-C49"
    },
    {
        name: "Giuoco Piano",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"],
        eco: "C50-C54"
    },
    {
        name: "Two Knights Defense",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"],
        eco: "C55-C59"
    },
    {
        name: "Scandinavian Defense",
        moves: ["e4", "d5"],
        eco: "B01"
    }
];

/**
 * Convert a move in SAN notation to a simplified form for opening detection
 * @param {string} san - The move in Standard Algebraic Notation
 * @returns {string} - Simplified move notation
 */
const simplifyMove = (san: string): string => {
    // Remove check and checkmate symbols
    let simplified = san.replace(/[+#]/g, '');
    
    // Remove capture symbol
    simplified = simplified.replace('x', '');
    
    // Remove disambiguation for pieces (like Nbd7 -> Nd7)
    if (/^[RNBQK][a-h1-8]?[a-h][1-8]$/.test(simplified)) {
        simplified = simplified.charAt(0) + simplified.slice(-2);
    }
    
    // Handle castling
    if (simplified === 'O-O') return 'e1g1'; // Kingside castling
    if (simplified === 'O-O-O') return 'e1c1'; // Queenside castling
    
    return simplified;
};

/**
 * Detect the opening from a sequence of moves
 * @param {Array<ChessMove>} moves - Array of moves in SAN notation
 * @returns {Opening|null} - The detected opening or null if not found
 */
export const detectOpening = (moves: ChessMove[]): Opening | null => {
    if (!moves || moves.length === 0) return null;
    
    // Convert moves to simplified notation for matching
    const simplifiedMoves = moves.map(move => {
        if (typeof move === 'string') {
            return simplifyMove(move);
        } else if (move && typeof move === 'object' && 'san' in move) {
            return simplifyMove(move.san);
        }
        return '';
    });
    
    // Find the longest matching opening
    let bestMatch: Opening | null = null;
    let maxMatchLength = 0;
    
    for (const opening of openingDatabase) {
        let matchLength = 0;
        
        for (let i = 0; i < Math.min(opening.moves.length, simplifiedMoves.length); i++) {
            if (opening.moves[i].toLowerCase() === simplifiedMoves[i].toLowerCase()) {
                matchLength++;
            } else {
                break;
            }
        }
        
        if (matchLength > 0 && matchLength >= maxMatchLength) {
            maxMatchLength = matchLength;
            bestMatch = opening;
        }
    }
    
    return bestMatch;
};

/**
 * Get the ECO code and opening name for a sequence of moves
 * @param {Array<ChessMove>} moves - Array of moves in SAN notation
 * @returns {OpeningInfo} - Object with name and eco properties
 */
export const getOpeningInfo = (moves: ChessMove[]): OpeningInfo => {
    const opening = detectOpening(moves);
    
    if (opening) {
        return {
            name: opening.name,
            eco: opening.eco
        };
    }
    
    return {
        name: "Unknown Opening",
        eco: ""
    };
};
