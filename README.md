# Chess Application with WASM Stockfish Engine

This project is a chess application with a WASM-based Stockfish engine implementation. The architecture uses a frontend-only WASM implementation with a backend that makes API calls to the frontend engine service.

## Architecture

The application uses a unique architecture to leverage WebAssembly (WASM) in a cross-platform way:

1. **Frontend Engine API**: A small Express server running in the frontend that exposes the Stockfish WASM engine via HTTP endpoints.
2. **Backend API**: The main backend server that makes HTTP requests to the Frontend Engine API instead of running Stockfish directly.

This approach provides several benefits:
- Cross-platform compatibility (works on Windows, Linux, macOS)
- No need for platform-specific binaries
- Simplified backend implementation
- Centralized engine management

## Directory Structure

- `/frontend`: React frontend application
  - `/src/engineApi`: Express server that exposes the Stockfish WASM engine
  - `/src/lib/engine`: Stockfish WASM implementation
- `/backend`: Node.js backend server
  - `/controllers/StockfishWasmController.js`: Controller that makes API calls to the frontend engine
- `/start-servers.js`: Script to start both the frontend engine API and backend server

## Setup and Installation

1. Install dependencies for all components:
   ```
   npm run install:all
   ```

2. Start the application:
   ```
   npm run start:all
   ```

This will start both the frontend engine API server and the backend server.

## API Endpoints

### Frontend Engine API (port 3002)

- `GET /health`: Check if the engine is ready
- `POST /bestmove`: Get the best move for a position
  - Body: `{ "fen": "FEN string", "depth": 16, "skillLevel": 20 }`
- `POST /analyze`: Analyze a position
  - Body: `{ "fen": "FEN string", "depth": 20, "multiPv": 3 }`
- `POST /stop`: Stop the current analysis

### Backend API (port 3001)

The backend exposes its own API endpoints that internally call the Frontend Engine API. The complete API documentation is available via Swagger UI when the server is running.

#### API Documentation

The backend API is documented using OpenAPI 3.0 specification and Swagger UI. When the server is running, you can access the interactive API documentation at:

```
http://localhost:3001/api-docs
```

To quickly view the API documentation:

```bash
cd backend
npm run api-docs
```

This will start the server and open the API documentation in your default browser.

## Development

- Start only the backend: `npm run start:backend`
- Start only the frontend: `npm run start:frontend`
- Start only the engine API: `npm run start:engine-api`

## Notes

- The Frontend Engine API runs on port 3002 by default
- The Backend API runs on port 3001 by default
- These ports can be configured using environment variables:
  - `ENGINE_API_PORT`: Port for the Frontend Engine API
  - `PORT`: Port for the Backend API

## Security

This project uses environment variables for sensitive configuration:

- **Backend**: Firebase Admin SDK credentials are stored in `.env` (see `backend/SECURITY_FIX.md`)
- **Frontend**: Firebase Web SDK configuration is stored in `.env.local` (see `frontend/SECURITY_FIX.md`)

When setting up the project, you'll need to create these environment files with your own Firebase credentials. Example files are provided for reference.
