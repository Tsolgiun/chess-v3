/**
 * Utility functions for game management
 */

/**
 * Generate a random game ID
 * @returns {string} A random 6-character alphanumeric game ID
 */
function generateGameId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Check if a game is over based on chess.js game state
 * @param {Object} chess - chess.js instance
 * @returns {Object|null} Game over result or null if game is not over
 */
function checkGameOver(chess) {
    if (!chess.isGameOver()) {
        return null;
    }
    
    let result;
    let winner = null;
    
    if (chess.isCheckmate()) {
        // The player who just moved is the winner
        winner = chess.turn() === 'w' ? 'black' : 'white';
        result = `Checkmate! ${winner === 'white' ? 'White' : 'Black'} wins!`;
    } else if (chess.isDraw()) {
        winner = 'draw';
        if (chess.isStalemate()) {
            result = 'Draw by stalemate!';
        } else if (chess.isThreefoldRepetition()) {
            result = 'Draw by threefold repetition!';
        } else if (chess.isInsufficientMaterial()) {
            result = 'Draw by insufficient material!';
        } else {
            result = 'Draw!';
        }
    }
    
    return { result, winner };
}

/**
 * Get the current player's color based on chess.js turn
 * @param {Object} chess - chess.js instance
 * @returns {string} 'white' or 'black'
 */
function getCurrentPlayerColor(chess) {
    return chess.turn() === 'w' ? 'white' : 'black';
}

/**
 * Check if it's a player's turn
 * @param {Object} chess - chess.js instance
 * @param {string} playerColor - 'white' or 'black'
 * @returns {boolean} True if it's the player's turn
 */
function isPlayerTurn(chess, playerColor) {
    const turn = chess.turn();
    return (turn === 'w' && playerColor === 'white') || 
           (turn === 'b' && playerColor === 'black');
}

module.exports = {
    generateGameId,
    checkGameOver,
    getCurrentPlayerColor,
    isPlayerTurn
};
