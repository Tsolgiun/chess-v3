// Socket.IO configuration
const socketIo = require('socket.io');
const { socketCorsOptions } = require('./cors');

/**
 * Initialize Socket.IO with the HTTP server
 * @param {Object} server - HTTP server instance
 * @returns {Object} Socket.IO instance
 */
function initializeSocketIO(server) {
    const io = socketIo(server, {
        cors: socketCorsOptions
    });
    
    return io;
}

module.exports = {
    initializeSocketIO
};
