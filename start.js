const { execSync } = require('child_process');
const path = require('path');

console.log('Starting Bror 50 Game setup...');

try {
    // Install dependencies
    console.log('Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });

    // Generate placeholder assets
    console.log('Generating placeholder assets...');
    require('./assets/generate_placeholders.js');

    // Start the server
    console.log('Starting game server...');
    require('./server.js');
} catch (error) {
    console.error('Error during setup:', error.message);
    process.exit(1);
} 