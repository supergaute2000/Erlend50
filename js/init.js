// Game configuration
import { LEVELS } from './levels.js';
import { spawnEnemy, spawnPowerUp, playerHitEnemy, createBullet, fireBullet } from './game.js';
import { SoundManager } from './sound.js';
import { BackgroundManager } from './background.js';
import './debug.js'; // Import debug module for automatic debug detection

// Game variables - individual exports
export let player;
export let cursors;
export let fireButton;
export let bullets;
export let enemies;
export let powerUps;
export let score = 0;
export let health = 100;
export let currentLevel = 1;
export let isGameOver = false;
export let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
export let backgroundManager;
export let game;

// Simple debug mode detection - REPLACED BY debug.js module
// export let debugMode = (window.location.pathname.indexOf('debug.html') !== -1);
// console.log('Debug mode:', debugMode ? 'ENABLED (via debug.html)' : 'DISABLED');

// The debugMode variable is now defined in debug.js and available globally
export let debugMode = window.debugMode || false;

// Game state variables
export let currentBoss = null;
export let bossHealth = 0;
export let bossHealthText;
export let bossPatternIndex = 0;
export let bossPatternTimer = 0;
export let bossPatternDuration = 5000;
export let currentEnemyTypes = [];
export let currentPowerUpTypes = [];
export let backgroundImage;
export let backgroundTween;
export let powerUpActive = false;
export let powerUpTimer = 0;
export let powerUpDuration = 0;
export let powerUpType = '';
export let powerUpText;
export let gameComplete = false;
export let soundManager;
export let uiManager;
export let gameState = 'playing';
export let lastFired = 0;
export let levelComplete = false;
export let levelText;
export let levelTransition = false;
export let levelTransitionTimer = 0;
export let levelTransitionDuration = 3000;

// Game scene class
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Load background layers
        this.load.image('layer1', 'assets/images/layer1.png');
        this.load.image('layer2', 'assets/images/layer2.png');
        this.load.image('layer3', 'assets/images/layer3.png');
        
        // Load the avatar image with error handling
        this.load.image('avatar', `assets/images/avatar.png?t=${new Date().getTime()}`);
        // Load Eva's image for health power-up
        this.load.image('eva', `assets/images/eva.png?t=${new Date().getTime()}`);
        // Load chips.gif as a static image
        this.load.image('chips', 'assets/images/chips.gif');
        // Load the new trimmed chips1.png image with cache busting
        this.load.image('chips1', `assets/images/chips1.png?t=${new Date().getTime()}`);
        
        // Add loading error handler
        this.load.on('loaderror', (fileObj) => {
            console.error('Error loading asset:', fileObj.key, fileObj);
            if (fileObj.key === 'avatar') {
                console.log('Avatar failed to load, using fallback rectangle');
            }
            if (fileObj.key === 'chips1') {
                console.log('Chips1 image failed to load, falling back to original chips.gif');
            }
        });

        // Add load complete handler
        this.load.on('complete', () => {
            console.log('All assets loaded successfully');
            const texture = this.textures.get('avatar');
            console.log('Avatar texture details:', {
                exists: this.textures.exists('avatar'),
                key: texture.key,
                width: texture.width,
                height: texture.height
            });
            
            // Log chips texture details
            const chipsTexture = this.textures.get('chips');
            console.log('Chips texture details:', {
                exists: this.textures.exists('chips'),
                key: chipsTexture.key,
                width: chipsTexture.width,
                height: chipsTexture.height
            });
            
            // Log chips1 texture details
            if (this.textures.exists('chips1')) {
                const chips1Texture = this.textures.get('chips1');
                console.log('Chips1 texture details:', {
                    exists: true,
                    key: chips1Texture.key,
                    width: chips1Texture.width,
                    height: chips1Texture.height
                });
            } else {
                console.error('Chips1 texture does not exist after loading');
            }
        });

        // Add file load success handler
        this.load.on('filecomplete-image-avatar', (key, type, data) => {
            console.log('Avatar loaded successfully:', {
                key: key,
                type: type,
                data: data
            });
        });
    }

    create() {
        console.log('Create function started');
        
        // Initialize background manager
        backgroundManager = new BackgroundManager(this);
        
        // Initialize game objects
        bullets = this.add.group();
        enemies = this.add.group();
        powerUps = this.add.group();
        
        // Create player using the avatar sprite with fallback
        try {
            if (this.textures.exists('avatar')) {
                console.log('Creating player sprite with avatar texture');
                player = this.add.sprite(200, 500, 'avatar');
                player.setDisplaySize(128, 128); // Set size to 128x128 (4x larger than original 32x32)
                console.log('Player sprite created with dimensions:', {
                    width: player.width,
                    height: player.height,
                    displayWidth: player.displayWidth,
                    displayHeight: player.displayHeight
                });
            } else {
                console.log('Avatar texture not found, using fallback rectangle');
                player = this.add.rectangle(200, 500, 128, 128, 0x00ff00);
            }
        } catch (error) {
            console.error('Error creating player sprite:', error);
            player = this.add.rectangle(200, 500, 128, 128, 0x00ff00);
        }
        
        this.physics.add.existing(player);
        player.body.setCollideWorldBounds(true);
        
        // Setup controls
        cursors = this.input.keyboard.createCursorKeys();
        fireButton = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Setup mobile controls if needed
        if (isMobile) {
            setupMobileControls(this);
        }
        
        // Setup physics colliders with proper context binding
        this.physics.add.overlap(bullets, enemies, bulletHitEnemy, null, this);
        this.physics.add.overlap(player, enemies, (player, enemy) => playerHitEnemy(player, enemy, this), null, this);
        this.physics.add.overlap(player, powerUps, collectPowerUp, null, this);
        
        // Initialize game state in window object for global access
        window.gameState = {
            health: health,
            score: score,
            currentLevel: currentLevel,
            isGameOver: isGameOver,
            isInvincible: false,
            scene: this,
            shootingCooldown: 150 // Reduced from 250 to 150 for faster shooting
        };
        
        // Create level text
        levelText = this.add.text(200, 300, '', {
            fontSize: '32px',
            fill: '#fff'
        });
        levelText.setOrigin(0.5);
        levelText.setVisible(false);
        
        // Add debug mode indicator if debug mode is enabled
        if (debugMode) {
            const debugText = this.add.text(10, 10, '🐞 DEBUG MODE', {
                fontSize: '16px',
                fill: '#ffffff',
                backgroundColor: '#007700',
                padding: { x: 5, y: 5 }
            });
            debugText.setDepth(1000);
            debugText.setScrollFactor(0);
        }
        
        // Initialize sound manager
        soundManager = new SoundManager(this);
        
        // Start first level
        startLevel(this, 1);
    }

    update() {
        if (window.gameState.isGameOver) return;
        
        // Update background
        backgroundManager.update();
        
        // Handle player movement
        handlePlayerMovement(this);
        
        // Auto-fire on mobile
        if (isMobile) {
            const time = this.time.now;
            if (time > lastFired) {
                fireBullet(this);
                lastFired = time + 250; // 3x faster fire rate (was 750)
            }
        } else {
            // Handle keyboard firing
            if (Phaser.Input.Keyboard.JustDown(fireButton)) {
                fireBullet(this);
            }
        }
        
        // Update enemies
        updateEnemies(this);
    }

    createCoolBullet(x, y) {
        const bulletSize = 16;
        
        try {
            // Create a container for our bullet parts
            const bullet = this.add.container(x, y);
            
            // Create the main bullet body (elongated hexagon)
            const bulletBody = this.add.polygon(0, 0, [
                -bulletSize/4, 0,          // Left middle
                -bulletSize/8, -bulletSize/2,  // Left top
                bulletSize/8, -bulletSize/2,   // Right top
                bulletSize/4, 0,           // Right middle
                bulletSize/8, bulletSize/2,    // Right bottom
                -bulletSize/8, bulletSize/2    // Left bottom
            ], 0xffff00);
            
            // Add a glowing effect
            const glow = this.add.circle(0, 0, bulletSize/3, 0xffff00, 0.5);
            
            // Add trail effect (smaller rectangles that fade out)
            const trail1 = this.add.rectangle(0, bulletSize/2, bulletSize/4, bulletSize/4, 0xffff00, 0.7);
            const trail2 = this.add.rectangle(0, bulletSize, bulletSize/6, bulletSize/4, 0xffff00, 0.4);
            
            // Add all parts to the container
            bullet.add([trail2, trail1, glow, bulletBody]);
            
            // Add physics to the container
            this.physics.world.enable(bullet);
            bullet.body.setSize(bulletSize/2, bulletSize);
            
            // Set velocity
            bullet.body.setVelocityY(-400);
            bullet.body.setBounce(0);
            bullet.body.setCollideWorldBounds(false);
            
            // Add update function for the trail animation
            bullet.update = function() {
                trail1.y += 0.5;
                trail2.y += 1;
                if (trail1.y > bulletSize) trail1.y = bulletSize/2;
                if (trail2.y > bulletSize*1.5) trail2.y = bulletSize;
            };
            
            return bullet;
        } catch (error) {
            console.error('Error creating bullet:', error);
            return null;
        }
    }

    fireBullet() {
        if (!this) {
            console.error('No scene provided to fireBullet');
            return;
        }

        try {
            // Check if double shot is active
            if (this.isDoubleShot) {
                // Create two bullets side by side
                const bulletSpacing = 20; // Space between bullets
                
                // Left bullet
                const bullet1 = createBullet(this, player.x - bulletSpacing/2, player.y);
                if (bullet1) bullets.add(bullet1);
                
                // Right bullet
                const bullet2 = createBullet(this, player.x + bulletSpacing/2, player.y);
                if (bullet2) bullets.add(bullet2);
                
                console.log('Double shot fired!');
            } else {
                // Create a single bullet
                const bullet = createBullet(this, player.x, player.y);
                if (bullet) bullets.add(bullet);
            }
        } catch (error) {
            console.error('Error in fireBullet:', error);
        }
    }
}

// Game configuration
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 600,
    height: 1040, // Increased from 800 to 1040 (30% taller)
    backgroundColor: 0x000033,
    transparent: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: debugMode // Set physics debug based on debug.html detection
        }
    },
    render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false,
        transparent: true
    },
    // Reduce logging to minimize cross-origin issues
    banner: false,
    scene: GameScene
};

// Initialize game with module isolation and error handling
try {
    // Start with a clean console
    console.clear();
    console.log('Starting game with automatic debug detection...');
    
    // Set crossOrigin on all images loaded via Phaser
    config.loader = {
        ...config.loader,
        crossOrigin: 'anonymous'
    };
    
    // Create the game instance
    game = new Phaser.Game(config);
    
    // Only create module wrapping and debug UI in debug mode
    if (debugMode) {
        console.log('Debug mode active - enabling error tracking and diagnostics');
        
        // Create module wrapper to help identify where errors occur
        window.moduleWrap = function(moduleName, fn) {
            return function() {
                try {
                    return fn.apply(this, arguments);
                } catch (error) {
                    console.error(`Error in module: ${moduleName}`, error);
                    // Try to display in-game error
                    if (game && game.scene && game.scene.scenes.length > 0) {
                        const scene = game.scene.scenes[0];
                        scene.add.text(10, 40, `ERROR in ${moduleName}: ${error.message}`, {
                            fontSize: '14px',
                            fill: '#ff0000',
                            backgroundColor: '#000000',
                            padding: { x: 5, y: 5 }
                        }).setDepth(1000).setScrollFactor(0);
                    }
                    throw error; // Re-throw to preserve original stack trace
                }
            };
        };
        
        // Wrap key functions for error isolation
        const originalFireBullet = fireBullet;
        fireBullet = moduleWrap('fireBullet', originalFireBullet);
        
        const originalBulletHitEnemy = bulletHitEnemy;
        bulletHitEnemy = moduleWrap('bulletHitEnemy', originalBulletHitEnemy);
        
        // Force debug visuals for all physics bodies
        game.events.on('ready', function() {
            if (game.scene && game.scene.scenes.length > 0) {
                const scene = game.scene.scenes[0];
                scene.events.on('create', function() {
                    console.log('Setting up debug visuals for all physics bodies');
                    scene.physics.world.drawDebug = true;
                });
            }
        });
    }
    
    // Add restart button always visible in top-right corner
    if (game.scene && game.scene.scenes.length > 0) {
        const scene = game.scene.scenes[0];
        scene.events.once('create', function() {
            const restartButton = scene.add.text(
                scene.cameras.main.width - 110, 
                10, 
                '🔄 RESTART', 
                {
                    fontSize: '16px',
                    fill: '#ffffff',
                    backgroundColor: '#222222',
                    padding: { x: 8, y: 5 }
                }
            ).setInteractive();
            
            restartButton.on('pointerdown', () => {
                window.location.reload();
            });
            
            restartButton.setDepth(1000);
            restartButton.setScrollFactor(0);
        });
    }
    
    console.log('Game created successfully', debugMode ? 'with debug features' : 'in normal mode');
} catch (startupError) {
    console.error('ERROR DURING GAME STARTUP:', startupError);
    alert('Game failed to start: ' + startupError.message);
}

// More robust global error handling
window.onerror = function(message, source, lineno, colno, error) {
    // Create a detailed error report
    const errorDetails = {
        message: message,
        source: source || 'unknown source',
        line: lineno || 'unknown line',
        column: colno || 'unknown column',
        stack: error ? error.stack : 'No stack trace',
        time: new Date().toISOString(),
        gameState: game ? {
            isRunning: game.isRunning,
            sceneCount: game.scene ? game.scene.scenes.length : 'unknown'
        } : 'Game not initialized',
        browserInfo: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform
        }
    };
    
    // Log the detailed report
    console.error('✖️ DETAILED GAME ERROR:', errorDetails);
    
    // Try to display error in game
    try {
        if (game && game.scene && game.scene.scenes && game.scene.scenes.length > 0) {
            const activeScene = game.scene.scenes[0];
            const errorText = activeScene.add.text(10, 40, 'ERROR: ' + message, {
                fontSize: '14px',
                fill: '#ff0000',
                backgroundColor: '#000000',
                padding: { x: 5, y: 5 }
            });
            errorText.setDepth(1000);
            errorText.setScrollFactor(0);
            
            // Add a restart button
            const restartButton = activeScene.add.text(10, 70, '🔄 RESTART GAME', {
                fontSize: '16px', 
                fill: '#ffffff',
                backgroundColor: '#aa0000',
                padding: { x: 10, y: 8 }
            }).setInteractive();
            
            restartButton.on('pointerdown', () => {
                console.log('Manual game restart requested');
                window.location.reload();
            });
            
            restartButton.setDepth(1000);
            restartButton.setScrollFactor(0);
        }
    } catch (displayError) {
        console.error('Failed to display error message:', displayError);
    }
    
    // If this is a CORS "Script error", suggest solutions
    if (message === 'Script error.' && !source && !lineno) {
        console.warn('This appears to be a cross-origin error. Possible solutions:');
        console.warn('1. Add crossorigin="anonymous" to script tags');
        console.warn('2. Ensure CORS headers are set properly on your server');
        console.warn('3. Use a local development server instead of file:// URLs');
    }
    
    return true; // Prevents the default browser error handling
};

// Enhanced promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled Promise Rejection:', event.reason);
    console.error('Promise rejection stack:', event.reason ? event.reason.stack : 'No stack trace');
});

// Helper functions
function setupMobileControls(scene) {
    console.log('Setting up mobile controls');
    
    // Make player draggable and interactive
    player.setInteractive();
    scene.input.setDraggable(player);
    
    // Track if we're currently dragging
    let isDragging = false;
    let dragPointer = null;
    
    // Handle player drag
    scene.input.on('dragstart', (pointer, gameObject) => {
        if (gameObject === player) {
            console.log('Drag started');
            isDragging = true;
            dragPointer = pointer;
            // Set player depth to ensure it's above other game objects while dragging
            player.setDepth(1000);
        }
    });

    scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        if (gameObject === player) {
            // Calculate bounds considering the player's new size
            const halfWidth = player.displayWidth / 2;
            const halfHeight = player.displayHeight / 2;
            const minX = halfWidth;
            const maxX = scene.scale.width - halfWidth;
            const minY = halfHeight;
            const maxY = scene.scale.height - halfHeight;
            
            // Update player position with bounds checking
            player.x = Phaser.Math.Clamp(dragX, minX, maxX);
            player.y = Phaser.Math.Clamp(dragY, minY, maxY);
            
            // Update physics body
            player.body.reset(player.x, player.y);
        }
    });

    scene.input.on('dragend', (pointer, gameObject) => {
        if (gameObject === player) {
            console.log('Drag ended');
            isDragging = false;
            dragPointer = null;
            // Reset depth
            player.setDepth(0);
            // Stop any momentum
            player.body.setVelocity(0, 0);
        }
    });

    // Handle touch for firing
    scene.input.on('pointerdown', (pointer) => {
        // Only fire if this isn't the drag pointer
        if (!isDragging || pointer !== dragPointer) {
            fireBullet(scene);
            scene.isFiring = true;
        }
    });

    scene.input.on('pointerup', (pointer) => {
        // Stop firing if this isn't the drag pointer
        if (!isDragging || pointer !== dragPointer) {
            scene.isFiring = false;
        }
    });

    // Store firing state
    scene.isFiring = false;
    scene.lastFired = 0;
    scene.fireRate = 200; // Time between shots in milliseconds

    console.log('Mobile controls setup complete');
}

function handlePlayerMovement(scene) {
    // For non-mobile, keep keyboard controls
    if (!isMobile) {
        const speed = scene.playerSpeed || 200;
        
        if (cursors.left.isDown) {
            player.body.setVelocityX(-speed);
        } else if (cursors.right.isDown) {
            player.body.setVelocityX(speed);
        } else {
            player.body.setVelocityX(0);
        }
        
        if (cursors.up.isDown) {
            player.body.setVelocityY(-speed);
        } else if (cursors.down.isDown) {
            player.body.setVelocityY(speed);
        } else {
            player.body.setVelocityY(0);
        }
    }
}

function bulletHitEnemy(bullet, enemy) {
    // Log collision for debugging
    console.log('Bullet hit enemy:', {
        bulletPos: { x: bullet.x, y: bullet.y },
        enemyPos: { x: enemy.x, y: enemy.y }
    });
    
    // Store scene reference before destroying bullet
    const scene = bullet.scene;
    
    bullet.destroy();
    enemy.health -= 10;
    
    // Visual feedback
    const hitEffect = scene.add.circle(enemy.x, enemy.y, 20, 0xffff00, 0.5);
    scene.tweens.add({
        targets: hitEffect,
        scale: 2,
        alpha: 0,
        duration: 200,
        onComplete: () => hitEffect.destroy()
    });
    
    if (enemy.health <= 0) {
        enemy.destroy();
        score += enemy.points;
        updateScore();
        // Skip playing sound for now
        // this.sound.play('explosion');
    }
}

function collectPowerUp(player, powerUp) {
    console.log(`Power-up collected: ${powerUp.type}`);
    
    // Special handling for health power-up
    if (powerUp.type === 'health') {
        // Log current health
        console.log(`Health BEFORE collecting health power-up: ${window.gameState.health}`);
        
        // Directly increase health
        const oldHealth = window.gameState.health || 0;
        window.gameState.health = Math.min(100, oldHealth + 30);
        const healthGained = window.gameState.health - oldHealth;
        
        console.log(`Health restored: +${healthGained} (from ${oldHealth} to ${window.gameState.health})`);
        
        // Create visual effect
        const healthEffect = this.add.circle(player.x, player.y, 40, 0x00ff00, 0.5);
        this.tweens.add({
            targets: healthEffect,
            scale: 2,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                healthEffect.destroy();
            }
        });
        
        // Update health display
        updateHealth();
    } else {
        // For other power-ups, use the normal activation
        activatePowerUp(powerUp.type, this);
    }
    
    // Destroy the power-up
    powerUp.destroy();
}

function updateScore() {
    const scoreText = document.getElementById('score-container');
    if (scoreText) {
        scoreText.textContent = `Score: ${score}`;
    } else {
        console.log(`Score: ${score}`);
    }
}

// Add the missing updateHealth function
function updateHealth() {
    const healthText = document.getElementById('health-container');
    if (healthText) {
        healthText.textContent = `Health: ${window.gameState.health}`;
    } else {
        console.log(`Health: ${window.gameState.health}`);
    }
}

// Power-up related functions
export function activatePowerUp(type, scene) {
    console.log(`Activating power-up: ${type}`);
    
    // Ensure gameState exists
    if (!window.gameState) {
        console.error('window.gameState is not defined in activatePowerUp');
        window.gameState = { health: 100, score: 0, isGameOver: false, currentLevel: 1, isInvincible: false };
    }
    
    switch(type) {
        case 'shield':
            window.gameState.isInvincible = true;
            window.gameState.shieldHealth = 100;
            console.log('Shield activated - Player is now invincible');
            scene.shieldTimer = scene.time.addEvent({
                delay: 5000,
                callback: () => {
                    window.gameState.isInvincible = false;
                    window.gameState.shieldHealth = 0;
                    console.log('Shield deactivated - Player is no longer invincible');
                    deactivatePowerUp('shield', scene);
                }
            });
            break;
        case 'doubleShot':
            scene.isDoubleShot = true;
            console.log('Double shot activated');
            scene.doubleShotTimer = scene.time.addEvent({
                delay: 10000,
                callback: () => {
                    scene.isDoubleShot = false;
                    console.log('Double shot deactivated');
                    deactivatePowerUp('doubleShot', scene);
                }
            });
            break;
        case 'speedBoost':
            const originalSpeed = scene.playerSpeed || 200;
            scene.playerSpeed = originalSpeed * 2; // Double the speed
            console.log(`Speed boost activated - Speed increased from ${originalSpeed} to ${scene.playerSpeed}`);
            scene.speedBoostTimer = scene.time.addEvent({
                delay: 5000,
                callback: () => {
                    scene.playerSpeed = originalSpeed;
                    console.log(`Speed boost deactivated - Speed returned to ${originalSpeed}`);
                    deactivatePowerUp('speedBoost', scene);
                }
            });
            break;
        case 'health':
            // Health power-up is now handled directly in collectPowerUp
            console.log('Health power-up should be handled in collectPowerUp');
            break;
        case 'tripleShot':
            scene.isTripleShot = true;
            console.log('Triple shot activated');
            scene.tripleShotTimer = scene.time.addEvent({
                delay: 8000,
                callback: () => {
                    scene.isTripleShot = false;
                    console.log('Triple shot deactivated');
                    deactivatePowerUp('tripleShot', scene);
                }
            });
            break;
        case 'evasSupport':
            scene.isEvasSupport = true;
            console.log('Eva\'s support activated');
            scene.evasSupportTimer = scene.time.addEvent({
                delay: 15000,
                callback: () => {
                    scene.isEvasSupport = false;
                    console.log('Eva\'s support deactivated');
                    deactivatePowerUp('evasSupport', scene);
                }
            });
            break;
        case 'kidsEnergy':
            scene.isKidsEnergy = true;
            console.log('Kid\'s energy activated');
            scene.kidsEnergyTimer = scene.time.addEvent({
                delay: 12000,
                callback: () => {
                    scene.isKidsEnergy = false;
                    console.log('Kid\'s energy deactivated');
                    deactivatePowerUp('kidsEnergy', scene);
                }
            });
            break;
    }
    
    // Update health display
    updateHealth();
}

export function deactivatePowerUp(type, scene) {
    switch(type) {
        case 'shield':
            scene.shieldTimer = null;
            break;
        case 'doubleShot':
            scene.doubleShotTimer = null;
            break;
        case 'tripleShot':
            scene.tripleShotTimer = null;
            break;
        case 'speedBoost':
            scene.speedBoostTimer = null;
            break;
        case 'evasSupport':
            scene.evasSupportTimer = null;
            break;
        case 'kidsEnergy':
            scene.kidsEnergyTimer = null;
            break;
    }
    
    // Show power-up deactivation text
    if (scene.uiManager) {
        scene.uiManager.showPowerUp(`${type} power-up deactivated`, 2000);
    }
}

// Export function to start a level
export function startLevel(scene, level) {
    console.log('Starting level:', level);
    
    // Clear existing enemies and power-ups
    enemies.clear(true, true);
    powerUps.clear(true, true);
    if (currentBoss) {
        currentBoss.destroy();
        currentBoss = null;
    }
    
    // Reset player position
    player.setPosition(300, 700);
    
    // Update window.gameState.currentLevel
    window.gameState.currentLevel = level;
    
    // Check if LEVELS is defined and has the current level
    if (!LEVELS || !LEVELS[level]) {
        console.error('LEVELS not defined or level not found:', level);
        return;
    }
    
    // Initialize background layers
    const levelConfig = LEVELS[level];
    console.log('Level config:', levelConfig);
    
    if (levelConfig.background && levelConfig.background.layers) {
        console.log('Creating background layers:', levelConfig.background.layers);
        backgroundManager.createLayers(levelConfig.background.layers);
        backgroundManager.setScrollSpeed(levelConfig.background.scrollSpeed || -1);
    }
    
    // Set current level configurations
    currentEnemyTypes = levelConfig.enemies;
    currentPowerUpTypes = levelConfig.powerUps;
    
    // Display level text
    levelText.setText(levelConfig.name);
    levelText.setVisible(true);
    
    // Hide level text after delay
    scene.time.delayedCall(2000, () => {
        levelText.setVisible(false);
    });
    
    // Spawn enemies more frequently
    scene.time.addEvent({
        delay: 800, // Increased from 400 to 800 (50% slower spawn rate)
        callback: () => {
            if (!window.gameState.isGameOver) {
                // Increase spawn count on mobile
                let spawnCount;
                if (isMobile) {
                    spawnCount = 2 + Math.floor(level / 2); // More enemies on mobile
                } else {
                    spawnCount = 1 + Math.floor(level / 2); // Fewer on desktop
                }
                
                for (let i = 0; i < spawnCount; i++) {
                    spawnEnemy(scene);
                }
            }
        },
        loop: true
    });
    
    // Spawn power-ups
    scene.time.addEvent({
        delay: 8000,
        callback: () => {
            if (!window.gameState.isGameOver) {
                spawnPowerUp(scene);
            }
        },
        loop: true
    });
    
    console.log('Level started successfully');
}

// Update enemies
export function updateEnemies(scene) {
    // This function is just a wrapper that calls the actual implementation in game.js
    // The actual implementation is imported from game.js
}