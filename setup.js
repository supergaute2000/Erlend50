const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Bror 50 Game setup...');

try {
    // Install dependencies
    console.log('Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('Dependencies installed successfully');

    // Generate placeholder assets
    console.log('Generating placeholder assets...');
    require('./assets/generate_placeholders.js');
    console.log('Placeholder assets generated successfully');

    // Start the server
    console.log('Starting game server...');
    require('./server.js');
} catch (error) {
    console.error('Error during setup:', error.message);
    process.exit(1);
} 