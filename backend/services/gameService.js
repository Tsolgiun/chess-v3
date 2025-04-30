/**
 * Game service for managing chess games
 */
const { Chess } = require('chess.js');
const Game = require('../models/Game');
const { generateGameId } = require('../utils/gameUtils');
const timerService = require('./timerService');

// In-memory cache for active games
const games = {};

/**
 * Create a new game
 * @param {string} socketId - The socket ID of the player creating the game
 * @param {Object} options - Game options (color, timeControl, etc.)
 * @param {string} platform - The platform of the player
 * @returns {Promise<Object>} The created game
 */
async function createGame(socketId, options = {}, platform = 'unknown') {
    const gameId = generateGameId();
    const chess = new Chess();
    
    // Get time control settings (or use defaults)
    const timeControl = options.timeControl || {};
    const initialTime = timeControl.initial || 600; // 10 minutes in seconds
    const increment = timeControl.increment || 0;
    
    // Determine player color (default to white if not specified)
    let playerColor = 'white';
    if (options.color === 'black') {
        playerColor = 'black';
    }
    
    // Create game in database
    const game = await Game.create({
        gameId,
        fen: chess.fen(),
        players: [{ 
            socketId, 
            color: playerColor,
            platform
        }],
        status: 'waiting',
        timeControl: {
            initialTime,
            increment
        },
        timeRemaining: {
            white: initialTime,
            black: initialTime
        }
    });
    
    // Cache game in memory
    games[gameId] = {
        chess,
        players: {
            white: playerColor === 'white' ? socketId : null,
            black: playerColor === 'black' ? socketId : null
        }
    };
    
    return {
        gameId,
        color: playerColor,
        platform,
        timeControl: {
            initialTime,
            increment
        },
        timeRemaining: {
            white: initialTime,
            black: initialTime
        }
    };
}

/**
 * Join an existing game
 * @param {string} gameId - The game ID
 * @param {string} socketId - The socket ID of the player joining
 * @param {string} platform - The platform of the player
 * @param {Object} io - Socket.IO instance
 * @returns {Promise<Object|null>} The joined game or null if error
 */
async function joinGame(gameId, socketId, platform = 'unknown', io) {
    try {
        let dbGame = await Game.findOne({ gameId });
        
        if (!dbGame) {
            return { error: 'Game not found' };
        }
        
        if (dbGame.players.length >= 2) {
            return { error: 'Game is full' };
        }
        
        // Initialize game in memory if not exists
        if (!games[gameId]) {
            const chess = new Chess(dbGame.fen);
            games[gameId] = {
                chess,
                players: {
                    white: dbGame.players.find(p => p.color === 'white')?.socketId,
                    black: null
                }
            };
        }
        
        // Determine the color for the joining player
        // If the creator chose black, the joiner gets white
        const existingPlayer = dbGame.players[0];
        const joinerColor = existingPlayer.color === 'white' ? 'black' : 'white';
        
        // Update database
        dbGame.players.push({ 
            socketId, 
            color: joinerColor,
            platform
        });
        dbGame.status = 'active';
        await dbGame.save();
        
        // Update memory
        games[gameId].players[joinerColor] = socketId;
        
        // Get opponent's platform
        const opponent = dbGame.players.find(p => p.socketId !== socketId);
        
        // Get time control information
        const timeControl = dbGame.timeControl;
        const timeRemaining = dbGame.timeRemaining;
        
        // Get move history if available
        let moveHistory = [];
        try {
            // Create a temporary game to get the move history
            const tempGame = new Chess();
            const currentFen = games[gameId].chess.fen();
            
            // Try to reconstruct the move history
            // This is a simplified approach and may not work for all positions
            // Ideally, we would store the move history in the database
            const pgn = games[gameId].chess.pgn();
            if (pgn) {
                tempGame.loadPgn(pgn);
                moveHistory = tempGame.history();
            }
        } catch (error) {
            console.error('Failed to get move history:', error);
        }
        
        // Start the game timer
        timerService.startGameTimer(gameId, io, games);
        
        return {
            gameId,
            color: joinerColor,
            fen: games[gameId].chess.fen(),
            opponentPlatform: opponent?.platform || 'unknown',
            timeControl,
            timeRemaining,
            moveHistory
        };
    } catch (error) {
        console.error('Join game error:', error);
        return { error: 'Failed to join game' };
    }
}

/**
 * Make a move in a game
 * @param {string} gameId - The game ID
 * @param {string} socketId - The socket ID of the player making the move
 * @param {Object} moveData - The move data (from, to, promotion)
 * @param {Object} io - Socket.IO instance
 * @returns {Promise<Object|null>} The move result or null if error
 */
async function makeMove(gameId, socketId, moveData, io) {
    if (!games[gameId]) {
        return { error: 'Game not found' };
    }
    
    const game = games[gameId].chess;
    const dbGame = await Game.findOne({ gameId });
    
    if (!dbGame) {
        return { error: 'Game not found in database' };
    }
    
    // Determine player color
    let playerColor;
    if (games[gameId].players.white === socketId) {
        playerColor = 'white';
    } else if (games[gameId].players.black === socketId) {
        playerColor = 'black';
    } else {
        return { error: 'Player not in this game' };
    }
    
    const turn = game.turn();
    
    if ((turn === 'w' && playerColor !== 'white') || 
        (turn === 'b' && playerColor !== 'black')) {
        return { error: 'Not your turn' };
    }
    
    try {
        const move = game.move({
            from: moveData.from,
            to: moveData.to,
            promotion: moveData.promotion
        });

        if (move) {
            // Handle time increment if applicable
            const increment = dbGame.timeControl.increment || 0;
            const playerTimeField = `timeRemaining.${playerColor}`;
            let updateFields = {
                fen: game.fen(),
                lastActivity: new Date(),
                lastMoveTime: new Date()
            };
            
            // Add increment to player's time if increment is set
            let updatedTimeRemaining = { ...dbGame.timeRemaining };
            if (increment > 0) {
                updatedTimeRemaining = await timerService.addIncrement(gameId, playerColor, increment);
                if (!updatedTimeRemaining) {
                    updatedTimeRemaining = dbGame.timeRemaining;
                }
            }
            
            // Update database with new position
            await Game.findOneAndUpdate(
                { gameId },
                { $set: updateFields }
            );
            
            // Get the move in SAN format
            const moveNotation = move.san;
            
            // Check for game over conditions
            let gameOverResult = null;
            if (game.isGameOver()) {
                let result;
                let winner = null;
                
                if (game.isCheckmate()) {
                    winner = playerColor;
                    result = `Checkmate! ${playerColor === 'white' ? 'White' : 'Black'} wins!`;
                } else if (game.isDraw()) {
                    winner = 'draw';
                    if (game.isStalemate()) {
                        result = 'Draw by stalemate!';
                    } else if (game.isThreefoldRepetition()) {
                        result = 'Draw by threefold repetition!';
                    } else if (game.isInsufficientMaterial()) {
                        result = 'Draw by insufficient material!';
                    } else {
                        result = 'Draw!';
                    }
                }

                // Update game status in database
                await Game.findOneAndUpdate(
                    { gameId },
                    { 
                        $set: { 
                            status: 'completed',
                            winner
                        }
                    }
                );
                
                // Stop the timer
                timerService.stopGameTimer(gameId);
                
                gameOverResult = { result };
            }
            
            return {
                from: moveData.from,
                to: moveData.to,
                promotion: moveData.promotion,
                fen: game.fen(),
                timeRemaining: updatedTimeRemaining,
                moveNotation,
                gameOver: gameOverResult
            };
        } else {
            return { error: 'Invalid move' };
        }
    } catch (error) {
        console.error('Move error:', error);
        return { error: 'Invalid move' };
    }
}

/**
 * Resign a game
 * @param {string} gameId - The game ID
 * @param {string} socketId - The socket ID of the player resigning
 * @returns {Promise<Object|null>} The resign result or null if error
 */
async function resignGame(gameId, socketId) {
    if (!gameId || !games[gameId]) {
        return { error: 'Game not found' };
    }
    
    // Determine player color
    let playerColor;
    if (games[gameId].players.white === socketId) {
        playerColor = 'white';
    } else if (games[gameId].players.black === socketId) {
        playerColor = 'black';
    } else {
        return { error: 'Player not in this game' };
    }

    try {
        // Update game status in database
        await Game.findOneAndUpdate(
            { gameId },
            { 
                $set: { 
                    status: 'completed',
                    winner: playerColor === 'white' ? 'black' : 'white'
                }
            }
        );

        // Stop the timer
        timerService.stopGameTimer(gameId);

        const result = `Game Over - ${playerColor === 'white' ? 'Black' : 'White'} wins by resignation`;
        return { result };
    } catch (error) {
        console.error('Resign error:', error);
        return { error: 'Failed to resign game' };
    }
}

/**
 * Handle player disconnect
 * @param {string} socketId - The socket ID of the disconnected player
 * @param {string} gameId - The game ID
 * @returns {Promise<void>}
 */
async function handleDisconnect(socketId, gameId) {
    if (gameId && games[gameId]) {
        try {
            // Update player's connection status in database
            await Game.findOneAndUpdate(
                { gameId },
                { 
                    $pull: { players: { socketId } },
                    lastActivity: new Date()
                }
            );
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    }
}

/**
 * Clean up abandoned game
 * @param {string} gameId - The game ID
 * @returns {Promise<void>}
 */
async function cleanupGame(gameId) {
    if (games[gameId]) {
        delete games[gameId];
        
        try {
            // Update game status in database
            await Game.findOneAndUpdate(
                { gameId },
                { status: 'abandoned' }
            );
            
            console.log(`Game removed: ${gameId}`);
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }
}

/**
 * Accept a draw offer
 * @param {string} gameId - The game ID
 * @returns {Promise<Object|null>} The draw result or null if error
 */
async function acceptDraw(gameId) {
    if (!gameId || !games[gameId]) {
        return { error: 'Game not found' };
    }

    try {
        // Update game status in database
        await Game.findOneAndUpdate(
            { gameId },
            { 
                $set: { 
                    status: 'completed',
                    winner: 'draw'
                }
            }
        );

        // Stop the timer
        timerService.stopGameTimer(gameId);

        return { result: 'Game Over - Draw by agreement' };
    } catch (error) {
        console.error('Draw acceptance error:', error);
        return { error: 'Failed to process draw acceptance' };
    }
}

// Export the games object and functions
module.exports = {
    games,
    createGame,
    joinGame,
    makeMove,
    resignGame,
    handleDisconnect,
    cleanupGame,
    acceptDraw
};
