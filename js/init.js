// Game configuration
import { LEVELS } from './levels.js';
import { spawnEnemy, spawnPowerUp, playerHitEnemy } from './game.js';
import { SoundManager } from './sound.js';

// Game variables
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
export let currentBoss = null;
export let bossHealth = 0;
export let bossHealthText;
export let bossPatternIndex = 0;
export let bossPatternTimer = 0;
export let bossPatternDuration = 5000; // 5 seconds per pattern
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
export let gameState = 'playing'; // 'playing', 'levelTransition', 'gameOver', 'quiz'
export let lastFired = 0;
export let levelComplete = false;
export let levelText;
export let levelTransition = false;
export let levelTransitionTimer = 0;
export let levelTransitionDuration = 3000; // 3 seconds

// Game scene class
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Load the avatar image with error handling
        this.load.image('avatar', `assets/images/avatar.png?t=${new Date().getTime()}`);
        
        // Add loading error handler
        this.load.on('loaderror', (fileObj) => {
            console.error('Error loading asset:', fileObj.key, fileObj);
            if (fileObj.key === 'avatar') {
                console.log('Avatar failed to load, using fallback rectangle');
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
        
        // Initialize game state in window object for global access
        window.gameState = {
            health: health,
            score: score,
            currentLevel: currentLevel,
            isGameOver: isGameOver,
            isInvincible: false,
            scene: this  // Store the scene reference
        };
        
        // Setup collisions
        this.physics.add.overlap(player, enemies, (player, enemy) => playerHitEnemy(player, enemy, this), null, this);
        this.physics.add.collider(bullets, enemies, bulletHitEnemy, null, this);
        this.physics.add.collider(player, powerUps, collectPowerUp, null, this);
        
        // Create level text
        levelText = this.add.text(200, 300, '', {
            fontSize: '32px',
            fill: '#fff'
        });
        levelText.setOrigin(0.5);
        levelText.setVisible(false);
        
        // Initialize sound manager
        soundManager = new SoundManager(this);
        
        // Start first level
        startLevel(this, 1);
    }

    update() {
        if (window.gameState.isGameOver) return;
        
        // Handle player movement
        handlePlayerMovement(this);
        
        // Handle continuous firing
        if (isMobile) {
            if (this.isFiring) {
                const time = this.time.now;
                if (time > this.lastFired) {
                    fireBullet(this);
                    this.lastFired = time + this.fireRate;
                }
            }
        } else {
            // Handle keyboard firing
            if (Phaser.Input.Keyboard.JustDown(fireButton)) {
                fireBullet(this);
            }
        }
        
        // Update enemies
        updateEnemies(this);
        
        // Check for collisions
        this.physics.overlap(bullets, enemies, bulletHitEnemy, null, this);
        this.physics.overlap(player, powerUps, collectPowerUp, null, this);
    }
}

// Game configuration
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        width: 400,
        height: 600,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        autoRound: true,
        expandParent: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: GameScene
};

// Initialize game
export const game = new Phaser.Game(config);

// Helper functions
function setupMobileControls(scene) {
    // Make player draggable
    player.setInteractive({ draggable: true });
    
    // Track if we're currently dragging
    let isDragging = false;
    let dragPointer = null;
    
    // Handle player drag
    scene.input.on('dragstart', (pointer, gameObject) => {
        if (gameObject === player) {
            isDragging = true;
            dragPointer = pointer;
        }
    });

    scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        if (gameObject === player) {
            // Keep player within bounds
            const minX = player.width / 2;
            const maxX = scene.scale.width - player.width / 2;
            const minY = player.height / 2;
            const maxY = scene.scale.height - player.height / 2;
            
            player.x = Phaser.Math.Clamp(dragX, minX, maxX);
            player.y = Phaser.Math.Clamp(dragY, minY, maxY);
        }
    });

    scene.input.on('dragend', (pointer, gameObject) => {
        if (gameObject === player) {
            isDragging = false;
            dragPointer = null;
            // Stop player movement when drag ends
            player.body.setVelocity(0, 0);
        }
    });

    // Handle touch for firing
    scene.input.on('pointerdown', (pointer) => {
        // If this is not the dragging pointer, fire
        if (!isDragging || pointer !== dragPointer) {
            fireBullet(scene);
            scene.isFiring = true;
        }
    });

    scene.input.on('pointerup', (pointer) => {
        // If this was not the dragging pointer, stop firing
        if (!isDragging || pointer !== dragPointer) {
            scene.isFiring = false;
        }
    });

    // Store firing state
    scene.isFiring = false;
    scene.lastFired = 0;
    scene.fireRate = 200; // Time between shots in milliseconds
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

function fireBullet(scene) {
    // Check if double shot is active
    if (scene.isDoubleShot) {
        // Create two bullets side by side
        const bulletSpacing = 20; // Space between bullets
        
        // Left bullet
        const bullet1 = scene.add.rectangle(player.x - bulletSpacing/2, player.y, 8, 16, 0xffff00);
        bullets.add(bullet1);
        scene.physics.add.existing(bullet1);
        bullet1.body.setVelocityY(-400);
        
        // Right bullet
        const bullet2 = scene.add.rectangle(player.x + bulletSpacing/2, player.y, 8, 16, 0xffff00);
        bullets.add(bullet2);
        scene.physics.add.existing(bullet2);
        bullet2.body.setVelocityY(-400);
        
        console.log('Double shot fired!');
    } else {
        // Create a single bullet
        const bullet = scene.add.rectangle(player.x, player.y, 8, 16, 0xffff00);
        bullets.add(bullet);
        scene.physics.add.existing(bullet);
        bullet.body.setVelocityY(-400);
    }
    
    // Skip playing sound for now
    // scene.sound.play('shoot');
}

function bulletHitEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.health -= 10;
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

export function startLevel(scene, level) {
    // Clear existing enemies and power-ups
    enemies.clear(true, true);
    powerUps.clear(true, true);
    if (currentBoss) {
        currentBoss.destroy();
        currentBoss = null;
    }
    
    // Reset player position
    player.setPosition(400, 500); // Center player horizontally
    
    // Update window.gameState.currentLevel
    window.gameState.currentLevel = level;
    
    // Check if LEVELS is defined and has the current level
    if (!LEVELS || !LEVELS[level]) {
        console.error('LEVELS not defined or level not found:', level);
        return;
    }
    
    // Set current level configurations
    currentEnemyTypes = LEVELS[level].enemies;
    currentPowerUpTypes = LEVELS[level].powerUps;
    
    // Set background
    if (backgroundImage) {
        backgroundImage.destroy();
    }
    // Create a simple background rectangle instead of using an image
    backgroundImage = scene.add.rectangle(400, 300, 800, 600, 0x000033);
    backgroundImage.setDepth(-1); // Place it behind other objects
    
    // Display level text
    levelText.setText(LEVELS[level].name);
    levelText.setVisible(true);
    
    // Hide level text after delay
    scene.time.delayedCall(2000, () => {
        levelText.setVisible(false);
    });
    
    // DEBUG MODE: Continuously spawn enemies
    console.log('DEBUG MODE: Continuous enemy spawning enabled');
    
    // Spawn enemies every 2 seconds
    scene.time.addEvent({
        delay: 2000,
        callback: () => {
            if (!window.gameState.isGameOver) {
                spawnEnemy(scene);
                console.log('DEBUG: Enemy spawned');
            }
        },
        loop: true
    });
    
    // Spawn power-ups every 10 seconds
    scene.time.addEvent({
        delay: 10000,
        callback: () => {
            if (!window.gameState.isGameOver) {
                spawnPowerUp(scene);
                console.log('DEBUG: Power-up spawned');
            }
        },
        loop: true
    });
    
    // Skip playing music for now
    // soundManager.playMusic(level);
}

// Update enemies
export function updateEnemies(scene) {
    // This function is just a wrapper that calls the actual implementation in game.js
    // The actual implementation is imported from game.js
}