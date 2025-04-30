const { spawn } = require('child_process');
const path = require('path');

// Configuration
const BACKEND_PORT = process.env.PORT || 3001;

// Start the backend server
console.log('Starting backend server...');
const backend = spawn('node', [
  path.join('backend', 'server.js')
], {
  env: {
    ...process.env,
    PORT: BACKEND_PORT.toString()
  },
  stdio: 'pipe'
});

backend.stdout.on('data', (data) => {
  console.log(`[Backend] ${data.toString().trim()}`);
});

backend.stderr.on('data', (data) => {
  console.error(`[Backend ERROR] ${data.toString().trim()}`);
});

backend.on('close', (code) => {
  console.log(`Backend server exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  backend.kill();
  process.exit();
});

console.log(`Backend server will run on port ${BACKEND_PORT}`);
console.log('Press Ctrl+C to stop the server');
