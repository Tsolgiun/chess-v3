/**
 * Timer service for managing game timers
 */
const Game = require('../models/Game');

// Timer update interval (milliseconds)
const TIMER_UPDATE_INTERVAL = 1000;

// Store active timer intervals
const timerIntervals = {};

/**
 * Start a timer for a game
 * @param {string} gameId - The game ID
 * @param {Object} io - Socket.IO instance
 * @param {Object} games - In-memory games cache
 */
function startGameTimer(gameId, io, games) {
    // Clear any existing interval
    if (timerIntervals[gameId]) {
        clearInterval(timerIntervals[gameId]);
    }
    
    timerIntervals[gameId] = setInterval(async () => {
        try {
            // Get the game from database
            const dbGame = await Game.findOne({ gameId });
            if (!dbGame || dbGame.status !== 'active') {
                clearInterval(timerIntervals[gameId]);
                delete timerIntervals[gameId];
                return;
            }
            
            // Get the current turn
            const currentTurn = games[gameId]?.chess.turn();
            if (!currentTurn) return;
            
            const colorToUpdate = currentTurn === 'w' ? 'white' : 'black';
            
            // Update time remaining
            const timeRemaining = dbGame.timeRemaining[colorToUpdate] - 1;
            
            // Check for timeout
            if (timeRemaining <= 0) {
                // Game over by timeout
                clearInterval(timerIntervals[gameId]);
                delete timerIntervals[gameId];
                
                const winner = colorToUpdate === 'white' ? 'black' : 'white';
                await Game.findOneAndUpdate(
                    { gameId },
                    { 
                        $set: { 
                            status: 'completed',
                            winner,
                            [`timeRemaining.${colorToUpdate}`]: 0
                        }
                    }
                );
                
                io.to(gameId).emit('gameOver', { 
                    result: `Game Over - ${winner === 'white' ? 'White' : 'Black'} wins on time`
                });
                
                return;
            }
            
            // Update time in database
            await Game.findOneAndUpdate(
                { gameId },
                { $set: { [`timeRemaining.${colorToUpdate}`]: timeRemaining } }
            );
            
            // Broadcast time update
            io.to(gameId).emit('timeUpdate', {
                white: colorToUpdate === 'white' ? timeRemaining : dbGame.timeRemaining.white,
                black: colorToUpdate === 'black' ? timeRemaining : dbGame.timeRemaining.black
            });
            
        } catch (error) {
            console.error('Timer update error:', error);
        }
    }, TIMER_UPDATE_INTERVAL);
}

/**
 * Stop a game timer
 * @param {string} gameId - The game ID
 */
function stopGameTimer(gameId) {
    if (timerIntervals[gameId]) {
        clearInterval(timerIntervals[gameId]);
        delete timerIntervals[gameId];
    }
}

/**
 * Add increment to a player's time
 * @param {string} gameId - The game ID
 * @param {string} color - The player's color ('white' or 'black')
 * @param {number} increment - The time increment in seconds
 * @returns {Promise<Object>} Updated time remaining
 */
async function addIncrement(gameId, color, increment) {
    if (!increment || increment <= 0) {
        return null;
    }
    
    try {
        const dbGame = await Game.findOne({ gameId });
        if (!dbGame) {
            return null;
        }
        
        const timeField = `timeRemaining.${color}`;
        const updatedTime = dbGame.timeRemaining[color] + increment;
        
        await Game.findOneAndUpdate(
            { gameId },
            { $set: { [timeField]: updatedTime } }
        );
        
        const updatedGame = await Game.findOne({ gameId });
        return updatedGame.timeRemaining;
    } catch (error) {
        console.error('Add increment error:', error);
        return null;
    }
}

/**
 * Clean up abandoned games
 */
function setupCleanupInterval() {
    // Cleanup old games periodically (every hour)
    setInterval(async () => {
        try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            await Game.updateMany(
                { lastActivity: { $lt: oneHourAgo }, status: 'active' },
                { $set: { status: 'abandoned' } }
            );
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }, 60 * 60 * 1000); // Every hour
}

module.exports = {
    startGameTimer,
    stopGameTimer,
    addIncrement,
    setupCleanupInterval
};
