require('dotenv').config();
const express = require('express');
const http = require('http');
const connectDB = require('./config/database');
const { corsMiddleware } = require('./config/cors');
const { initializeSocketIO } = require('./config/socket');
const { initializeSocketConnections } = require('./socket/socketManager');
const { setupCleanupInterval } = require('./services/timerService');
const { setupSwagger } = require('./config/swagger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');
const gameRoutes = require('./routes/gameRoutes');

async function startServer() {
    try {
        // Connect to MongoDB
        await connectDB();

        // Initialize Express
        const app = express();

        // Apply CORS middleware
        app.use(corsMiddleware);

        // Add JSON body parser
        app.use(express.json());
        
        // Set up Swagger UI
        setupSwagger(app);

        // Create HTTP server
        const server = http.createServer(app);

        // Initialize Socket.IO
        const io = initializeSocketIO(server);

        // Set up Socket.IO connections
        initializeSocketConnections(io);

        // Set up routes
        app.use('/api/auth', authRoutes);
        app.use('/api/blog', blogRoutes);
        app.use('/api/game', gameRoutes);

        // Set up cleanup interval for abandoned games
        setupCleanupInterval();

        // Start the server
        const PORT = process.env.PORT || 3001;
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
        
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

// Cleanup on server shutdown
process.on('SIGINT', () => {
    process.exit();
});

process.on('SIGTERM', () => {
    process.exit();
});
