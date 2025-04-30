import { Chess } from 'chess.js';

export interface ReviewGameOptions {
  moveHistory: string[];
  playerColor?: 'white' | 'black';
  isAIGame?: boolean;
}

export class ReviewService {
  static prepareGameForReview(options: ReviewGameOptions) {
    const { moveHistory, playerColor, isAIGame } = options;
    
    // Create a new chess instance
    const chess = new Chess();
    const moveResults = this.applyMoves(chess, moveHistory);
    
    // Generate PGN with appropriate headers
    const pgnHeaders = this.generatePgnHeaders(chess, playerColor, isAIGame);
    Object.entries(pgnHeaders).forEach(([key, value]) => {
      chess.header(key, value);
    });
    
    return {
      pgn: chess.pgn(),
      moveResults,
      success: moveResults.failedMoves === 0
    };
  }
  
  private static applyMoves(chess: Chess, moveHistory: string[]) {
    let successfulMoves = 0;
    let failedMoves = 0;
    
    for (const move of moveHistory) {
      try {
        // Try standard notation first
        if (chess.move(move)) {
          successfulMoves++;
          continue;
        }
        
        // Try UCI format if standard fails
        if (move.length >= 4) {
          const from = move.substring(0, 2);
          const to = move.substring(2, 4);
          const promotion = move.length > 4 ? move.substring(4, 5) : undefined;
          
          if (chess.move({ from, to, promotion })) {
            successfulMoves++;
            continue;
          }
        }
        
        // If we get here, the move failed
        failedMoves++;
        console.warn(`Failed to apply move: ${move}`);
        
        // Log legal moves for debugging
        const legalMoves = chess.moves({ verbose: true });
        console.log(`Legal moves at this position:`, 
          legalMoves.map(m => `${m.from}-${m.to}${m.promotion ? '=' + m.promotion : ''}`));
      } catch (error) {
        failedMoves++;
        console.error(`Error applying move ${move}:`, error);
      }
    }
    
    console.log(`Move application summary: ${successfulMoves} successful, ${failedMoves} failed`);
    return { successfulMoves, failedMoves };
  }
  
  private static generatePgnHeaders(chess: Chess, playerColor?: 'white' | 'black', isAIGame?: boolean) {
    return {
      Event: isAIGame ? "AI Game" : "Online Game",
      Site: "Chess App",
      Date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      Round: "1",
      White: playerColor === 'white' ? "Player" : "Opponent",
      Black: playerColor === 'black' ? "Player" : (isAIGame ? "AI" : "Opponent"),
      Result: chess.isCheckmate() ? (chess.turn() === 'w' ? "0-1" : "1-0") : 
              chess.isDraw() ? "1/2-1/2" : "*"
    };
  }
}
