/**
 * Socket.IO handlers for game functionality
 */
const gameService = require('../services/gameService');

/**
 * Initialize game handlers for a socket
 * @param {Object} socket - Socket.IO socket
 * @param {Object} io - Socket.IO server instance
 */
function initializeGameHandlers(socket, io) {
    // Create a new game
    socket.on('createGame', async (options = {}) => {
        try {
            const result = await gameService.createGame(
                socket.id, 
                options, 
                socket.data.platform || 'unknown'
            );
            
            socket.join(result.gameId);
            socket.data.color = result.color || 'white';
            socket.data.gameId = result.gameId;
            socket.emit('gameCreated', result);
        } catch (error) {
            console.error('Create game error:', error);
            socket.emit('error', { message: 'Failed to create game' });
        }
    });

    // Join an existing game
    socket.on('joinGame', async (data) => {
        try {
            const result = await gameService.joinGame(
                data.gameId, 
                socket.id, 
                socket.data.platform || 'unknown',
                io
            );
            
            if (result.error) {
                socket.emit('error', { message: result.error });
                return;
            }
            
            socket.join(data.gameId);
            socket.data.color = 'black';
            socket.data.gameId = data.gameId;
            
            socket.emit('gameJoined', result);
            
            socket.to(data.gameId).emit('opponentJoined', {
                platform: socket.data.platform || 'unknown'
            });
            
            // Send initial time update to both players
            io.to(data.gameId).emit('timeUpdate', result.timeRemaining);
        } catch (error) {
            console.error('Join game error:', error);
            socket.emit('error', { message: 'Failed to join game' });
        }
    });

    // Handle a move
    socket.on('move', async (data) => {
        const gameId = socket.data.gameId;
        
        if (!gameId) {
            socket.emit('error', { message: 'No active game' });
            return;
        }
        
        const result = await gameService.makeMove(gameId, socket.id, data, io);
        
        if (result.error) {
            socket.emit('error', { message: result.error });
            return;
        }
        
        // Broadcast the move
        io.to(gameId).emit('moveMade', {
            from: result.from,
            to: result.to,
            promotion: result.promotion,
            fen: result.fen,
            timeRemaining: result.timeRemaining,
            moveNotation: result.moveNotation
        });
        
        // Send time update
        io.to(gameId).emit('timeUpdate', result.timeRemaining);
        
        // Check for game over
        if (result.gameOver) {
            io.to(gameId).emit('gameOver', result.gameOver);
        }
    });

    // Handle resign
    socket.on('resign', async () => {
        const gameId = socket.data.gameId;
        
        if (!gameId) {
            socket.emit('error', { message: 'No active game' });
            return;
        }
        
        const result = await gameService.resignGame(gameId, socket.id);
        
        if (result.error) {
            socket.emit('error', { message: result.error });
            return;
        }
        
        io.to(gameId).emit('gameOver', { result: result.result });
    });

    // Handle draw offer
    socket.on('offerDraw', () => {
        const gameId = socket.data.gameId;
        const playerColor = socket.data.color;
        
        if (gameId) {
            socket.to(gameId).emit('drawOffered', { from: playerColor });
        }
    });

    // Handle draw acceptance
    socket.on('acceptDraw', async () => {
        const gameId = socket.data.gameId;
        
        if (!gameId) {
            socket.emit('error', { message: 'No active game' });
            return;
        }
        
        const result = await gameService.acceptDraw(gameId);
        
        if (result.error) {
            socket.emit('error', { message: result.error });
            return;
        }
        
        io.to(gameId).emit('gameOver', { result: result.result });
    });

    // Handle draw decline
    socket.on('declineDraw', () => {
        const gameId = socket.data.gameId;
        const playerColor = socket.data.color;
        
        if (gameId) {
            socket.to(gameId).emit('drawDeclined', { from: playerColor });
        }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
        const gameId = socket.data.gameId;
        
        if (gameId && gameService.games[gameId]) {
            socket.to(gameId).emit('opponentDisconnected');
            
            await gameService.handleDisconnect(socket.id, gameId);
            
            // Remove game from memory after delay if no one is connected
            setTimeout(async () => {
                if (gameService.games[gameId] && io.sockets.adapter.rooms.get(gameId)?.size === 0) {
                    await gameService.cleanupGame(gameId);
                }
            }, 60000); // 1 minute
        }
        
        console.log('Client disconnected:', socket.id);
    });
}

module.exports = {
    initializeGameHandlers
};
