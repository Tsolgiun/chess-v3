/**
 * Script to test the API documentation server
 * 
 * This script starts the server and opens the API documentation in a browser.
 * It's useful for quickly testing that the Swagger UI is working correctly.
 */

const { exec } = require('child_process');
const path = require('path');
const serverPath = path.join(__dirname, '../server.js');

console.log('Starting server to test API documentation...');

// Start the server
const server = exec(`node ${serverPath}`, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error starting server: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`Server stderr: ${stderr}`);
        return;
    }
    console.log(`Server stdout: ${stdout}`);
});

// Give the server some time to start
setTimeout(() => {
    console.log('Opening API documentation in browser...');
    
    // Open the API documentation in the default browser
    // This command works on Windows, macOS, and Linux
    const openCommand = process.platform === 'win32' ? 'start' : 
                        process.platform === 'darwin' ? 'open' : 'xdg-open';
    
    exec(`${openCommand} http://localhost:3001/api-docs`);
    
    console.log('API documentation should now be open in your browser.');
    console.log('Press Ctrl+C to stop the server.');
}, 3000);

// Handle process termination
process.on('SIGINT', () => {
    console.log('Stopping server...');
    server.kill();
    process.exit();
});
