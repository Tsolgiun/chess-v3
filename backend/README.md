# Chess Game Backend

This backend server provides the API and Socket.IO functionality for a chess game application.

## Architecture

The backend follows a modular architecture with separation of concerns:

### Core Components

- **Server Configuration**: Express app and HTTP server setup in `server.js`
- **Database Connection**: MongoDB connection in `config/database.js`
- **CORS Configuration**: CORS settings in `config/cors.js`
- **Socket.IO Setup**: Socket.IO initialization in `config/socket.js`

### API Routes

- **Auth Routes**: User authentication in `routes/authRoutes.js`
- **Blog Routes**: Blog management in `routes/blogRoutes.js`
- **Game Routes**: Game-related API endpoints in `routes/gameRoutes.js`

### Services

- **Game Service**: Game logic and state management in `services/gameService.js`
- **Timer Service**: Game timer management in `services/timerService.js`

### Socket Handlers

- **Socket Manager**: Socket.IO connection handling in `socket/socketManager.js`
- **Game Handlers**: Game-related socket events in `socket/gameHandlers.js`
- **Chat Handlers**: Chat-related socket events in `socket/chatHandlers.js`

### Utilities

- **Game Utils**: Helper functions for games in `utils/gameUtils.js`

## Directory Structure

```
backend/
├── server.js                  # Main entry point
├── config/
│   ├── database.js            # Database connection
│   ├── cors.js                # CORS configuration
│   └── socket.js              # Socket.IO configuration
├── middleware/
│   └── auth.js                # Authentication middleware
├── controllers/
│   ├── AuthController.js      # Authentication controller
│   ├── BlogController.js      # Blog controller
│   └── GameController.js      # Game controller (if needed)
├── routes/
│   ├── authRoutes.js          # Auth route definitions
│   ├── blogRoutes.js          # Blog route definitions
│   └── gameRoutes.js          # Game route definitions
├── services/
│   ├── gameService.js         # Game logic and state management
│   └── timerService.js        # Timer management
├── socket/
│   ├── socketManager.js       # Socket.IO connection handling
│   ├── gameHandlers.js        # Game-related socket events
│   └── chatHandlers.js        # Chat-related socket events
├── utils/
│   └── gameUtils.js           # Helper functions for games
└── models/
    ├── User.js                # User model
    ├── Game.js                # Game model
    └── Blog.js                # Blog model
```

## Running the Server

```bash
npm install
npm start
```

The server will start on port 3001 by default, or the port specified in the `.env` file.
