// Import variables and functions from init.js
import {
    player, cursors, fireButton, bullets, enemies, powerUps,
    score, health, currentLevel, isGameOver, isMobile,
    game, debugMode
} from './init.js';

// Import level configurations
import { LEVELS, PATTERNS, BOSS_PATTERNS, createEnemyGraphics, createBossGraphics } from './levels.js';

// Import quiz system
import { QuizSystem } from './quiz.js';

// Import sound manager
import { SoundManager } from './sound.js';

// Import UI manager
import { UIManager } from './ui.js';

// Import high score functions
import { saveHighScore, getHighScores } from './highscores.js';

// Game state variables
let currentBoss = null;
let bossHealth = 0;
let bossHealthText;
let bossPatternIndex = 0;
let bossPatternTimer = 0;
let bossPatternDuration = 5000; // 5 seconds per pattern
let currentEnemyTypes = [];
let currentPowerUpTypes = [];
let quizSystem;
let backgroundImage;
let backgroundTween;
let powerUpActive = false;
let powerUpTimer = 0;
let powerUpDuration = 0;
let powerUpType = '';
let powerUpText;
let gameComplete = false;
let soundManager;
let uiManager;
let gameState = 'playing'; // 'playing', 'levelTransition', 'gameOver', 'quiz'
let lastFired = 0;
let levelComplete = false;
let levelText;
let levelTransition = false;
let levelTransitionTimer = 0;
let levelTransitionDuration = 3000; // 3 seconds

// Game states
const GAME_STATE = {
    PLAYING: 'playing',
    LEVEL_TRANSITION: 'levelTransition',
    GAME_OVER: 'gameOver',
    QUIZ: 'quiz'
};

let currentGameState = GAME_STATE.PLAYING;

// High score API endpoint
const API_URL = 'http://localhost:3000/scores';

// Initialize managers
export function initializeManagers(scene) {
    soundManager = new SoundManager(scene);
    uiManager = new UIManager(scene);
    quizSystem = new QuizSystem(scene);
}

// Helper function to create a cool-looking bullet
function createBullet(scene, x, y) {
    const bulletSize = 16;
    
    try {
        // Create a container for our bullet parts
        const bullet = scene.add.container(x, y);
        
        // Create the main bullet body (elongated hexagon)
        const bulletBody = scene.add.polygon(0, 0, [
            -bulletSize/4, 0,          // Left middle
            -bulletSize/8, -bulletSize/2,  // Left top
            bulletSize/8, -bulletSize/2,   // Right top
            bulletSize/4, 0,           // Right middle
            bulletSize/8, bulletSize/2,    // Right bottom
            -bulletSize/8, bulletSize/2    // Left bottom
        ], 0xffff00);
        
        // Add a glowing effect
        const glow = scene.add.circle(0, 0, bulletSize/3, 0xffff00, 0.5);
        
        // Add trail effect (smaller rectangles that fade out)
        const trail1 = scene.add.rectangle(0, bulletSize/2, bulletSize/4, bulletSize/4, 0xffff00, 0.7);
        const trail2 = scene.add.rectangle(0, bulletSize, bulletSize/6, bulletSize/4, 0xffff00, 0.4);
        
        // Add all parts to the container
        bullet.add([trail2, trail1, glow, bulletBody]);
        
        // Add physics to the container
        scene.physics.world.enable(bullet);
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

// Function to fire bullets
function fireBullet(scene) {
    if (!scene) {
        console.error('No scene provided to fireBullet');
        return;
    }

    try {
        // Check if double shot is active
        if (scene.isDoubleShot) {
            // Create two bullets side by side
            const bulletSpacing = 20; // Space between bullets
            
            // Left bullet
            const bullet1 = createBullet(scene, player.x - bulletSpacing/2, player.y);
            if (bullet1) bullets.add(bullet1);
            
            // Right bullet
            const bullet2 = createBullet(scene, player.x + bulletSpacing/2, player.y);
            if (bullet2) bullets.add(bullet2);
            
            console.log('Double shot fired!');
        } else {
            // Create a single bullet
            const bullet = createBullet(scene, player.x, player.y);
            if (bullet) bullets.add(bullet);
        }
    } catch (error) {
        console.error('Error in fireBullet:', error);
    }
}

// Spawn an enemy
export function spawnEnemy(scene) {
    if (!scene || window.gameState.isGameOver) {
        return;
    }
    
    // Check if LEVELS is defined and has the current level
    if (!LEVELS || !LEVELS[window.gameState.currentLevel]) {
        console.error('LEVELS not defined or current level not found:', window.gameState.currentLevel);
        return;
    }
    
    const levelConfig = LEVELS[window.gameState.currentLevel];
    
    // Check if enemies array exists and has elements
    if (!levelConfig.enemies || levelConfig.enemies.length === 0) {
        console.error('No enemies defined for level:', window.gameState.currentLevel);
        return;
    }
    
    const enemyConfig = levelConfig.enemies[Phaser.Math.Between(0, levelConfig.enemies.length - 1)];
    
    // Randomly choose a spawn position (only top and sides, not bottom)
    const side = Math.floor(Math.random() * 3); // 0: top, 1: right, 2: left
    let x, y;
    
    // Enemy size adjusted to match player size
    const enemySize = 64; // Reduced from 128 to 64 for smaller enemies
    
    switch(side) {
        case 0: // top
            x = Math.random() * (scene.game.config.width - enemySize) + enemySize/2;
            y = -enemySize;
            break;
        case 1: // right
            x = scene.game.config.width + enemySize;
            y = Math.random() * (scene.game.config.height/2); // Only top half
            break;
        case 2: // left
            x = -enemySize;
            y = Math.random() * (scene.game.config.height/2); // Only top half
            break;
    }
    
    // Create enemy sprite
    let enemy;
    if (scene.textures.exists('chips1')) {
        enemy = scene.add.sprite(x, y, 'chips1');
    } else {
        enemy = scene.add.sprite(x, y, 'chips');
    }
    
    enemy.setDisplaySize(enemySize, enemySize);
    enemy.setOrigin(0.5, 0.5);
    enemy.setDepth(10);
    
    scene.physics.add.existing(enemy);
    enemy.body.reset(x, y);
    enemy.body.setCollideWorldBounds(false);
    
    if (debugMode) {
        enemy.body.debugShowBody = true;
        enemy.body.debugBodyColor = 0xff00ff;
    }
    
    enemy.health = enemyConfig.health || 10;
    enemy.speed = enemyConfig.speed || 300;
    enemy.points = enemyConfig.points || 10;
    
    const angle = Phaser.Math.Angle.Between(x, y, player.x, player.y);
    enemy.body.setVelocity(
        Math.cos(angle) * enemy.speed,
        Math.sin(angle) * enemy.speed
    );
    
    enemies.add(enemy);
    
    enemy.update = function() {
        const margin = enemySize * 2;
        if (this.x < -margin || this.x > scene.game.config.width + margin ||
            this.y < -margin || this.y > scene.game.config.height + margin) {
            this.destroy();
        }
    };
}

// Spawn a power-up
export function spawnPowerUp(scene) {
    console.log('Attempting to spawn power-up');
    
    if (!scene || !scene.add) {
        console.error('Invalid scene context in spawnPowerUp');
        return;
    }

    // Define power-up types with improved visuals
    const powerUpTypes = [
        { 
            type: 'shield', 
            color: 0x00ff00
        },
        { 
            type: 'doubleShot', 
            color: 0xff00ff
        },
        { 
            type: 'speedBoost', 
            color: 0xffff00
        },
        { 
            type: 'health', 
            color: 0xff0000, 
            useEvaSprite: true 
        }
    ];
    
    // Randomly select a power-up type
    const powerUpConfig = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    // Position power-up in the top portion of the screen
    const x = Phaser.Math.Between(50, scene.game.config.width - 50);
    const y = -50; // Start above the screen
    
    let powerUp;
    try {
        if (powerUpConfig.useEvaSprite) {
            // Create Eva sprite for health power-up
            powerUp = scene.add.sprite(x, y, 'eva');
            
            // Set display size FIRST
            if (isMobile) {
                powerUp.setDisplaySize(192, 192);
            } else {
                powerUp.setDisplaySize(128, 128);
            }
            
            // Add physics body WITHOUT any customization
            scene.physics.world.enable(powerUp);
            
            // Do NOT set size or offset - let Phaser handle it
            
            // Debug visualization only
            if (debugMode) {
                powerUp.body.debugShowBody = true;
                powerUp.body.debugBodyColor = 0xff00ff;
            }
        } else {
            // Create a rectangle with a glowing effect for other power-ups
            powerUp = scene.add.rectangle(x, y, 48, 48, powerUpConfig.color);
            
            // Add a pulsing effect
            scene.tweens.add({
                targets: powerUp,
                alpha: 0.6,
                duration: 1000,
                yoyo: true,
                repeat: -1
            });
            
            // Add an outline glow
            const glow = scene.add.rectangle(x, y, 56, 56, powerUpConfig.color, 0.3);
            glow.setDepth(powerUp.depth - 1);
            
            // Make the glow follow the power-up
            powerUp.glow = glow;
            powerUp.update = function() {
                if (this.glow) {
                    this.glow.x = this.x;
                    this.glow.y = this.y;
                }
                // Destroy if off screen
                if (this.y > scene.game.config.height + 100) {
                    if (this.glow) this.glow.destroy();
                    this.destroy();
                }
            };
            
            // Add physics to regular power-up
            scene.physics.world.enable(powerUp);
            powerUp.body.setSize(48, 48);
            powerUp.body.setOffset(0, 0);
        }
        
        // Set vertical velocity for downward movement
        powerUp.body.setVelocityY(150);
        
        // Set power-up properties
        powerUp.type = powerUpConfig.type;
        powerUp.setDepth(5); // Ensure power-ups are visible above background
        
        // Add to power-ups group
        powerUps.add(powerUp);
        
        console.log(`Power-up spawned: ${powerUpConfig.type} at (${x}, ${y})`);
        
    } catch (error) {
        console.error('Error creating power-up:', error);
    }
}

// Helper function to get color based on power-up type
function getPowerUpColor(type) {
    switch(type) {
        case 'shield':
            return 0x0000ff; // Blue for shield
        case 'doubleShot':
            return 0xff00ff; // Purple for double shot
        case 'tripleShot':
            return 0xff0000; // Red for triple shot
        case 'speedBoost':
            return 0xffff00; // Yellow for speed boost
        case 'evasSupport':
            return 0x00ffff; // Cyan for Eva's support
        case 'kidsEnergy':
            return 0xff8800; // Orange for kid's energy
        case 'cakeSlice':
            return 0xff69b4; // Pink for cake slice (health)
        default:
            return 0xffff00; // Default yellow
    }
}

// Spawn a boss
export function spawnBoss(scene) {
    const bossConfig = LEVELS[currentLevel].boss;
    currentBoss = scene.add.sprite(400, 100, bossConfig.type + "Boss");
    currentBoss.setScale(2);
    
    // Add boss properties
    currentBoss.health = bossConfig.health;
    bossHealth = bossConfig.health;
    bossPatternIndex = 0;
    bossPatternTimer = 0;
    
    // Add physics to boss
    scene.physics.add.existing(currentBoss);
    
    // Update boss health display
    bossHealthText.setText('Boss Health: ' + bossHealth);
    bossHealthText.setVisible(true);

    // Play boss appear sound
    soundManager.playSound('bossAppear');
}

// Handle bullet hitting an enemy
export function bulletHitEnemy(bullet, enemy) {
    // Destroy the bullet
    bullet.destroy();
    
    // Reduce enemy health
    enemy.health -= 10;
    
    // Check if enemy is destroyed
    if (enemy.health <= 0) {
        // Create explosion effect
        const explosion = this.add.circle(enemy.x, enemy.y, 20, 0xff5500);
        this.tweens.add({
            targets: explosion,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // Add score and log it
        window.gameState.score += enemy.points || 10;
        console.log(`Enemy destroyed! Score updated to: ${window.gameState.score}`);
        updateScore();
        
        // Destroy the enemy
        enemy.destroy();
    } else {
        // Flash the enemy to indicate damage
        const originalColor = enemy.fillColor;
        enemy.setFillStyle(0xffffff);
        this.time.delayedCall(100, () => {
            enemy.setFillStyle(originalColor);
        });
    }
}

// Handle bullet hitting a boss
export function bulletHitBoss(bullet, boss) {
    bullet.destroy();
    bossHealth--;
    bossHealthText.setText('Boss Health: ' + bossHealth);
    
    if (bossHealth <= 0) {
        boss.destroy();
        bossHealthText.setVisible(false);
        completeLevel(this);
    }
}

// Handle player hitting enemy
function playerHitEnemy(player, enemy, scene) {
    // Only process if both objects are active
    if (!player.active || !enemy.active) return;
    
    // Only take damage if not invincible
    if (!window.gameState.isInvincible) {
        // Take damage
        window.gameState.health = Math.max(0, window.gameState.health - 10);
        console.log(`Player hit enemy! Health reduced to: ${window.gameState.health}`);
        updateHealth();
        
        // Check for game over
        if (window.gameState.health <= 0) {
            console.log('Health reached 0 - Game Over');
            window.gameState.isGameOver = true;
            showGameOver(scene);
            return;
        }
        
        // Flash the player to indicate damage
        player.setTint(0xff0000);
        scene.time.delayedCall(200, () => {
            player.clearTint();
        });
    } else {
        console.log('Player hit enemy but is invincible!');
    }
    
    // Create explosion effect
    const explosion = scene.add.circle(enemy.x, enemy.y, 20, 0xff5500);
    scene.tweens.add({
        targets: explosion,
        scale: 2,
        alpha: 0,
        duration: 300,
        onComplete: () => {
            explosion.destroy();
        }
    });
    
    // Destroy the enemy
    enemy.destroy();
}

// Collect a power-up
export function collectPowerUp(player, powerUp) {
    console.log(`Power-up collected: ${powerUp.type}`);
    
    if (!powerUp || !powerUp.type) {
        console.error('Invalid power-up object in collectPowerUp');
        return;
    }
    
    // Show power-up collected text
    const powerUpText = this.add.text(player.x, player.y - 50, powerUp.type + ' collected!', {
        fontSize: '24px',
        fill: '#ffffff'
    });
    powerUpText.setOrigin(0.5);
    
    // Fade out and destroy the text after 2 seconds
    this.tweens.add({
        targets: powerUpText,
        alpha: 0,
        y: powerUpText.y - 30,
        duration: 2000,
        onComplete: () => {
            powerUpText.destroy();
        }
    });
    
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
        updateHealthDisplay();
    } else {
        // For other power-ups, use the normal activation
        activatePowerUp(powerUp.type, this);
    }
    
    // Destroy the power-up
    powerUp.destroy();
}

// New function to update health display
function updateHealthDisplay() {
    try {
        const healthText = document.getElementById('health-container');
        if (healthText && window.gameState) {
            let healthDisplay = `Health: ${window.gameState.health}`;
            if (window.gameState.isInvincible) {
                healthDisplay += ` | Shield: ${window.gameState.shieldHealth || 100}`;
            }
            healthText.textContent = healthDisplay;
            console.log(`Health display updated: ${healthDisplay}`);
            
            // Change color based on health level
            if (window.gameState.health > 70) {
                healthText.style.color = '#00ff00'; // Green
            } else if (window.gameState.health > 30) {
                healthText.style.color = '#ffff00'; // Yellow
            } else {
                healthText.style.color = '#ff0000'; // Red
            }
        }
    } catch (error) {
        console.error('Error updating health display:', error);
    }
}

// Complete a level
export function completeLevel(scene) {
    if (!scene || !levelText) {
        console.error('Invalid scene or levelText in completeLevel');
        return;
    }

    try {
        // Display level complete text
        levelText.setText(LEVELS[currentLevel].name + ' Complete!');
        levelText.setVisible(true);
        
        // Move to next level after delay
        scene.time.delayedCall(2000, () => {
            try {
                // Ensure quiz system exists
                if (!quizSystem) {
                    console.error('Quiz system not initialized');
                    quizSystem = new QuizSystem(scene);
                }

                // Start quiz before moving to next level
                console.log('Starting quiz for level:', currentLevel);
                quizSystem.startQuiz(currentLevel);
                
                // After quiz, move to next level
                currentLevel++;
                levelComplete = false;
                
                // Check if game is complete
                if (currentLevel > 5) {
                    gameComplete = true;
                    showGameComplete(scene);
                } else {
                    startLevel(scene, currentLevel);
                }
            } catch (error) {
                console.error('Error in level completion callback:', error);
            }
        });
    } catch (error) {
        console.error('Error in completeLevel:', error);
    }
}

// Show game over screen
export function showGameOver(scene) {
    console.log('Showing game over screen');
    
    if (!scene || !scene.add) {
        console.error('Invalid scene context in showGameOver');
        return;
    }

    // Remove any existing game over elements
    const existingInput = document.getElementById('playerNameInput');
    if (existingInput) existingInput.remove();
    const existingLabel = document.querySelector('label[for="playerNameInput"]');
    if (existingLabel) existingLabel.remove();

    // Add semi-transparent black background (add directly to scene, not container)
    const bg = scene.add.rectangle(0, 0, scene.cameras.main.width, scene.cameras.main.height, 0x000000, 0.8)
        .setOrigin(0, 0)
        .setDepth(999);

    // Create container for game over screen (centered)
    const gameOverContainer = scene.add.container(scene.cameras.main.centerX, scene.cameras.main.centerY);
    gameOverContainer.setDepth(1000);

    // Add game over text
    const gameOverText = scene.add.text(0, -220, 'GAME OVER', {
        fontSize: '64px',
        fill: '#ff0000',
        fontFamily: 'Arial',
        fontWeight: 'bold',
        resolution: 2,
        antialias: true
    }).setOrigin(0.5);
    gameOverContainer.add(gameOverText);

    // Add final score text (only once)
    const finalScoreText = scene.add.text(0, -140, `Final Score: ${score}`, {
        fontSize: '32px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        resolution: 2,
        antialias: true
    }).setOrigin(0.5);
    gameOverContainer.add(finalScoreText);

    // Create player name label
    const nameLabel = scene.add.text(0, -60, 'Player Name:', {
        fontSize: '24px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        resolution: 2,
        antialias: true
    }).setOrigin(0.5);
    gameOverContainer.add(nameLabel);

    // Calculate absolute position for input based on label position
    //const labelWorldPos = nameLabel.getBottomCenter();
    const inputY = 0; //labelWorldPos.y - ; // Position 40px below the label

    // Create player name input
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'playerNameInput';
    nameInput.value = 'gaute';
    nameInput.style.position = 'absolute';
    nameInput.style.left = '50%';
    nameInput.style.top = '50%';
    nameInput.style.marginBottom = '60px';
    nameInput.style.transform = 'translateY(-50%)';
    nameInput.style.transform = 'translateX(-50%)'; // Only center horizontally
    nameInput.style.width = '160px';
    nameInput.style.padding = '5px';
    nameInput.style.fontSize = '16px';
    nameInput.style.textAlign = 'center';
    nameInput.style.backgroundColor = '#222';
    nameInput.style.color = '#fff';
    nameInput.style.border = '2px solid #888';
    nameInput.style.borderRadius = '2px';
    nameInput.style.zIndex = '1003';
    document.body.appendChild(nameInput);
    nameInput.focus();

    // Add window resize handler to maintain relative positioning
    const updateInputPosition = () => {
        const newLabelPos = nameLabel.getTopCenter();
        nameInput.style.top = `${newLabelPos.y + 40}px`;
    };
    window.addEventListener('resize', updateInputPosition);

    // Store resize handler for cleanup
    const cleanupInput = () => {
        window.removeEventListener('resize', updateInputPosition);
        nameInput.remove();
    };

    // Create button style object
    const buttonStyle = {
        fontSize: '24px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        backgroundColor: '#333333',
        padding: { x: 20, y: 10 },
        resolution: 2,
        antialias: true
    };

    // Add save score button (positioned relative to input)
    const saveScoreText = scene.add.text(0, 80, 'Save Score', buttonStyle).setOrigin(0.5);
    saveScoreText.setInteractive({ useHandCursor: true });
    gameOverContainer.add(saveScoreText);

    // Add view high scores button
    const viewHighScoresText = scene.add.text(0, 140, 'View High Scores', buttonStyle).setOrigin(0.5);
    viewHighScoresText.setInteractive({ useHandCursor: true });
    gameOverContainer.add(viewHighScoresText);

    // Add restart button
    const restartButton = scene.add.text(0, 200, 'Play Again', buttonStyle).setOrigin(0.5);
    restartButton.setInteractive({ useHandCursor: true });
    gameOverContainer.add(restartButton);

    // Save state
    let isSaving = false;
    let isScoreSaved = false;

    // Button handlers
    saveScoreText.on('pointerover', () => saveScoreText.setFill('#ffff00'));
    saveScoreText.on('pointerout', () => saveScoreText.setFill('#ffffff'));
    saveScoreText.on('pointerdown', async () => {
        if (isSaving || isScoreSaved) return;
        await handleSaveScore();
    });

    viewHighScoresText.on('pointerover', () => viewHighScoresText.setFill('#ffff00'));
    viewHighScoresText.on('pointerout', () => viewHighScoresText.setFill('#ffffff'));
    viewHighScoresText.on('pointerdown', async () => {
        try {
            const highScores = await getHighScores();
            
            // Create high scores overlay
            const scoresContainer = scene.add.container(0, 0);
            scoresContainer.setDepth(2000);
            
            // Add semi-transparent background
            const scoresBg = scene.add.rectangle(0, 0, scene.cameras.main.width, scene.cameras.main.height, 0x000000, 0.9);
            scoresBg.setOrigin(0, 0);
            scoresContainer.add(scoresBg);
            
            // Add title
            const title = scene.add.text(scene.cameras.main.centerX, 50, 'HIGH SCORES', {
                fontSize: '36px',
                fill: '#ffff00',
                fontFamily: 'Arial',
                fontWeight: 'bold'
            }).setOrigin(0.5);
            scoresContainer.add(title);
            
            // Add scores
            highScores.forEach((score, index) => {
                const scoreText = scene.add.text(
                    scene.cameras.main.centerX,
                    120 + (index * 40),
                    `${index + 1}. ${score.name} - ${score.score}`,
                    {
                        fontSize: '24px',
                        fill: '#ffffff',
                        fontFamily: 'Arial'
                    }
                ).setOrigin(0.5);
                scoresContainer.add(scoreText);
            });
            
            // Add close button
            const closeButton = scene.add.text(scene.cameras.main.centerX, 550, 'CLOSE', {
                fontSize: '24px',
                fill: '#00ff00',
                fontFamily: 'Arial',
                backgroundColor: '#333333',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5);
            closeButton.setInteractive({ useHandCursor: true });
            scoresContainer.add(closeButton);
            
            closeButton.on('pointerdown', () => {
                scoresContainer.destroy();
            });
        } catch (error) {
            console.error('Error showing high scores:', error);
        }
    });

    restartButton.on('pointerover', () => restartButton.setFill('#ffff00'));
    restartButton.on('pointerout', () => restartButton.setFill('#ffffff'));
    restartButton.on('pointerdown', () => {
        cleanupInput(); // Use the new cleanup function
        gameOverContainer.destroy();
        window.gameState = {
            health: 100,
            score: 0,
            isGameOver: false,
            currentLevel: 1,
            isInvincible: false,
            scene: scene
        };
        scene.scene.restart();
    });

    // Handle Enter key for saving score
    nameInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleSaveScore();
        }
    });

    async function handleSaveScore() {
        if (isSaving || isScoreSaved) return;
        
        isSaving = true;
        const playerName = nameInput.value.trim() || 'Anonymous';
        cleanupInput(); // Use the new cleanup function
        
        saveScoreText.setText('Saving...');
        saveScoreText.setFill('#ffff00');
        
        try {
            await saveHighScore(playerName, score);
            saveScoreText.setText('Score Saved!');
            saveScoreText.setFill('#00ff00');
            isScoreSaved = true;
        } catch (error) {
            console.error('Error saving score:', error);
            saveScoreText.setText('Error Saving Score');
            saveScoreText.setFill('#ff0000');
            isSaving = false;
        }
    }
}

// Show game complete screen
export function showGameComplete(scene) {
    gameState = GAME_STATE.GAME_OVER;
    
    // Display game complete text
    const gameCompleteText = scene.add.text(200, 200, 'Happy Birthday, Bror!', { 
        fontSize: '48px', 
        fill: '#ffff00' 
    });
    gameCompleteText.setOrigin(0.5);
    
    // Display final score
    const finalScoreText = scene.add.text(200, 300, 'Final Score: ' + score, { 
        fontSize: '36px', 
        fill: '#ffffff' 
    });
    finalScoreText.setOrigin(0.5);
    
    // Add birthday message
    const birthdayMessage = scene.add.text(200, 350, 'Congratulations on your 50th!', { 
        fontSize: '24px', 
        fill: '#ff69b4' 
    });
    birthdayMessage.setOrigin(0.5);
    
    // Save high score
    try {
        saveHighScore('Player', score).catch(error => {
            console.error('Error saving final score:', error);
        });
    } catch (error) {
        console.error('Error in saveHighScore call:', error);
    }
    
    // Add high scores button
    const highScoresButton = scene.add.text(200, 400, 'View High Scores', { 
        fontSize: '32px', 
        fill: '#00ff00' 
    });
    highScoresButton.setOrigin(0.5);
    highScoresButton.setInteractive();
    highScoresButton.on('pointerdown', async () => {
        // Display high scores
        await displayHighScores(scene);
    });
    
    // Add restart button
    const restartButton = scene.add.text(200, 450, 'Play Again', { 
        fontSize: '32px', 
        fill: '#00ff00' 
    });
    restartButton.setOrigin(0.5);
    restartButton.setInteractive();
    restartButton.on('pointerdown', () => {
        scene.scene.restart();
    });
}

// Update score display
export function updateScore() {
    const scoreText = document.getElementById('score-container');
    if (scoreText && window.gameState) {
        scoreText.textContent = `Score: ${window.gameState.score}`;
    } else {
        console.log(`Score: ${window.gameState ? window.gameState.score : 'unknown'}`);
    }
}

// Update health display
export function updateHealth() {
    try {
        const healthText = document.getElementById('health-container');
        if (healthText && window.gameState) {
            // Ensure health never goes below 0
            window.gameState.health = Math.max(0, window.gameState.health);
            
            let healthDisplay = `Health: ${window.gameState.health}`;
            if (window.gameState.isInvincible) {
                healthDisplay += ` | Shield: ${window.gameState.shieldHealth || 100}`;
            }
            healthText.textContent = healthDisplay;
            console.log(`Health display updated: ${healthDisplay}`);
            
            // Change color based on health level
            if (window.gameState.health > 70) {
                healthText.style.color = '#00ff00'; // Green
            } else if (window.gameState.health > 30) {
                healthText.style.color = '#ffff00'; // Yellow
            } else {
                healthText.style.color = '#ff0000'; // Red
            }

            // Check for game over
            if (window.gameState.health <= 0 && !window.gameState.isGameOver) {
                console.log('Health reached 0 - Game Over');
                window.gameState.isGameOver = true;
                if (window.gameState.scene) {
                    showGameOver(window.gameState.scene);
                }
            }
        } else {
            console.warn('Could not update health display: healthText or gameState is missing');
        }
    } catch (error) {
        console.error('Error updating health:', error);
    }
}

// Function to display high scores
export async function displayHighScores(scene) {
    try {
        // Get high scores (will use localStorage fallback if server fails)
        const highScores = await getHighScores();
        
        // Create a container for the high scores
        const container = scene.add.container(200, 300);
        container.setDepth(1000);
        
        // Add background
        const bg = scene.add.rectangle(0, 0, 400, 500, 0x000000, 0.8);
        bg.setOrigin(0.5);
        container.add(bg);
        
        // Add title
        const title = scene.add.text(0, -200, 'HIGH SCORES', {
            fontSize: '36px',
            fontFamily: 'Arial',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 6
        });
        title.setOrigin(0.5);
        container.add(title);
        
        // Add scores
        if (highScores && highScores.length > 0) {
            highScores.forEach((score, index) => {
                const y = -150 + (index * 40);
                
                // Rank
                const rank = scene.add.text(-150, y, `${index + 1}.`, {
                    fontSize: '24px',
                    fontFamily: 'Arial',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 4
                });
                rank.setOrigin(0, 0.5);
                container.add(rank);
                
                // Name
                const name = scene.add.text(-100, y, score.name, {
                    fontSize: '24px',
                    fontFamily: 'Arial',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 4
                });
                name.setOrigin(0, 0.5);
                container.add(name);
                
                // Score
                const scoreText = scene.add.text(100, y, score.score.toString(), {
                    fontSize: '24px',
                    fontFamily: 'Arial',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 4
                });
                scoreText.setOrigin(1, 0.5);
                container.add(scoreText);
            });
        } else {
            // No scores message
            const noScores = scene.add.text(0, 0, 'No high scores yet!', {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            });
            noScores.setOrigin(0.5);
            container.add(noScores);
        }
        
        // Add close button
        const closeButton = scene.add.rectangle(0, 200, 150, 50, 0x00ff00);
        closeButton.setOrigin(0.5);
        closeButton.setInteractive();
        container.add(closeButton);
        
        const closeText = scene.add.text(0, 200, 'CLOSE', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#000000'
        });
        closeText.setOrigin(0.5);
        container.add(closeText);
        
        // Add button interaction
        closeButton.on('pointerdown', () => {
            container.destroy();
        });
        
        return container;
    } catch (error) {
        console.error('Error displaying high scores:', error);
        return null;
    }
}

// Export all necessary functions
export {
    //spawnEnemy,
    //spawnPowerUp,
    playerHitEnemy,
    createBullet,
    fireBullet
};

// Game scene class
export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Initialize managers
        soundManager = new SoundManager(this);
        uiManager = new UIManager(this);
        quizSystem = new QuizSystem(this);

        // Initialize game objects
        bullets = this.add.group();
        enemies = this.add.group();
        powerUps = this.add.group();

        // Initialize background manager
        backgroundManager = new BackgroundManager(this);

        // Create player using the avatar sprite with fallback
        try {
            if (this.textures.exists('avatar')) {
                console.log('Creating player sprite with avatar texture');
                player = this.add.sprite(200, 500, 'avatar');
                player.setDisplaySize(128, 128);
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

        // Setup physics and controls
        this.physics.add.existing(player);
        player.body.setCollideWorldBounds(true);
        
        // Setup controls
        cursors = this.input.keyboard.createCursorKeys();
        fireButton = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Setup mobile controls if needed
        if (isMobile) {
            setupMobileControls(this);
        }
        
        // Setup physics colliders
        this.physics.add.overlap(bullets, enemies, bulletHitEnemy, null, this);
        this.physics.add.overlap(player, enemies, (player, enemy) => playerHitEnemy(player, enemy, this), null, this);
        this.physics.add.overlap(player, powerUps, collectPowerUp, null, this);
        
        // Initialize game state
        window.gameState = {
            health: health,
            score: score,
            currentLevel: currentLevel,
            isGameOver: isGameOver,
            isInvincible: false,
            scene: this,
            shootingCooldown: 150,
            debug: {
                enabled: debugMode
            }
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
        
        // Start first level
        startLevel(this, 1);
    }

    // ... rest of the GameScene class methods ...
}

function cleanupInput(nameInput) {
    nameInput.blur();
    nameInput.disabled = true;
    setTimeout(() => {
        nameInput.remove();
    }, 0); // Defer removal to next tick
}