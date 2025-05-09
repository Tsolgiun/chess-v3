// CORS configuration for Express and Socket.IO

// Allowed origins for CORS
const allowedOrigins = [
    // Production domains
    'https://chessmn.netlify.app',   // Frontend on Netlify
    'https://chessmn-backend.onrender.com', // Backend on Render

    // Development origins
    'http://localhost:3000',         // Web app local
    'http://100.65.144.222:3000',    // Web app from other devices
    'http://100.65.144.222:3001',    // For mobile devices
    'http://192.168.56.1:3000',      // Backup IP for web app
    'http://192.168.56.1:3001',      // Backup IP for mobile devices
    'http://10.0.2.2:3001',          // Android emulator
    'http://localhost:3001'          // Additional local testing
];

// Express CORS middleware
const corsMiddleware = (req, res, next) => {
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
};

// Socket.IO CORS options
const socketCorsOptions = {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
};

module.exports = {
    allowedOrigins,
    corsMiddleware,
    socketCorsOptions
};
