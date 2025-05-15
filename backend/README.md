# Chess Game Backend

This backend server provides the API and Socket.IO functionality for a chess game application.

## Architecture

The backend follows a modular architecture with separation of concerns:

### Core Components

- **Server Configuration**: Express app and HTTP server setup in `server.js`
- **Database Connection**: MongoDB connection in `config/database.js`
- **CORS Configuration**: CORS settings in `config/cors.js`
- **Socket.IO Setup**: Socket.IO initialization in `config/socket.js`
- **API Documentation**: Swagger UI setup in `config/swagger.js`

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

### API Documentation

- **OpenAPI Specification**: API documentation in `docs/api/openapi.yaml`
- **Swagger UI**: Interactive API documentation available at `/api-docs` when the server is running

## Directory Structure

```
backend/
├── server.js                  # Main entry point
├── config/
│   ├── database.js            # Database connection
│   ├── cors.js                # CORS configuration
│   ├── socket.js              # Socket.IO configuration
│   └── swagger.js             # Swagger UI configuration
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
├── models/
│   ├── User.js                # User model
│   ├── Game.js                # Game model
│   └── Blog.js                # Blog model
├── docs/
│   └── api/
│       ├── openapi.yaml       # OpenAPI specification
│       └── README.md          # API documentation guide
└── scripts/
    └── test-api-docs.js       # Script to test API documentation
```

## Running the Server

```bash
npm install
npm start
```

The server will start on port 3001 by default, or the port specified in the `.env` file.

## API Documentation

The API is documented using OpenAPI 3.0 specification and Swagger UI. When the server is running, you can access the interactive API documentation at:

```
http://localhost:3001/api-docs
```

To quickly test the API documentation, you can run:

```bash
node scripts/test-api-docs.js
```

This will start the server and open the API documentation in your default browser.

For more information about the API documentation, see the [API Documentation Guide](docs/api/README.md).
