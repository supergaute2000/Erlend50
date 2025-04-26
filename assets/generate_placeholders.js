// Script to generate placeholder images for the game
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Ensure assets directory exists
const assetsDir = path.join(__dirname);
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// Function to create placeholder images
function createPlaceholderImage(width, height, color, filename) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Fill background
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    
    // Add text
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(filename, width/2, height/2);
    
    // Save the image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(assetsDir, filename), buffer);
}

// Function to create empty sound files
function createEmptySound(filename) {
    const emptyBuffer = Buffer.alloc(44); // WAV header size
    fs.writeFileSync(path.join(assetsDir, filename), emptyBuffer);
}

// Generate placeholder images
console.log('Generating placeholder images...');

// Player sprites
createPlaceholderImage(32, 32, '#00ff00', 'player.png');
createPlaceholderImage(32, 32, '#0000ff', 'player-shield.png');

// Enemy sprites
createPlaceholderImage(32, 32, '#ff0000', 'enemy1.png');
createPlaceholderImage(32, 32, '#ff00ff', 'enemy2.png');
createPlaceholderImage(32, 32, '#ffff00', 'enemy3.png');

// Boss sprites
createPlaceholderImage(64, 64, '#ff0000', 'boss1.png');
createPlaceholderImage(64, 64, '#ff00ff', 'boss2.png');
createPlaceholderImage(64, 64, '#ffff00', 'boss3.png');
createPlaceholderImage(64, 64, '#00ffff', 'boss4.png');

// Power-ups
createPlaceholderImage(16, 16, '#00ff00', 'powerup-health.png');
createPlaceholderImage(16, 16, '#0000ff', 'powerup-shield.png');
createPlaceholderImage(16, 16, '#ffff00', 'powerup-speed.png');

// Backgrounds
createPlaceholderImage(800, 600, '#000066', 'background1.png');
createPlaceholderImage(800, 600, '#660066', 'background2.png');
createPlaceholderImage(800, 600, '#666600', 'background3.png');
createPlaceholderImage(800, 600, '#006666', 'background4.png');

// Generate empty sound files
console.log('Generating placeholder sounds...');

// Sound effects
createEmptySound('shoot.wav');
createEmptySound('explosion.wav');
createEmptySound('powerup.wav');
createEmptySound('gameover.wav');
createEmptySound('levelup.wav');

// Background music
createEmptySound('music1.wav');
createEmptySound('music2.wav');
createEmptySound('music3.wav');
createEmptySound('music4.wav');

console.log('All placeholder assets generated successfully!'); 