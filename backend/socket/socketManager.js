/**
 * Socket.IO connection manager
 */
const { initializeGameHandlers } = require('./gameHandlers');
const { initializeChatHandlers } = require('./chatHandlers');

/**
 * Initialize Socket.IO connection handling
 * @param {Object} io - Socket.IO server instance
 */
function initializeSocketConnections(io) {
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);
        
        // Store platform information
        socket.on('setPlatform', (data) => {
            socket.data.platform = data.platform;
            console.log(`Client ${socket.id} is using ${data.platform} platform`);
        });
        
        // Initialize game handlers
        initializeGameHandlers(socket, io);
        
        // Initialize chat handlers
        initializeChatHandlers(socket, io);
    });
}

module.exports = {
    initializeSocketConnections
};
