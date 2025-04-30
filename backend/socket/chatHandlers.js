/**
 * Socket.IO handlers for chat functionality
 */

/**
 * Initialize chat handlers for a socket
 * @param {Object} socket - Socket.IO socket
 * @param {Object} io - Socket.IO server instance
 */
function initializeChatHandlers(socket, io) {
    // Handle chat messages
    socket.on('sendMessage', (data) => {
        const gameId = socket.data.gameId;
        const playerColor = socket.data.color;
        
        if (gameId) {
            io.to(gameId).emit('message', {
                sender: playerColor,
                text: data.text
            });
        }
    });
}

module.exports = {
    initializeChatHandlers
};
