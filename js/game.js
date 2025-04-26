// Import variables and functions from init.js
import {
    player, cursors, fireButton, bullets, enemies, powerUps,
    score, health, currentLevel, isGameOver, isMobile,
    game
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
import { saveHighScore } from './highscores.js';

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

// Spawn an enemy
export function spawnEnemy(scene) {
    if (window.gameState.isGameOver) {
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
    const enemySize = 128; // Increased from 96 to 128 for better hit detection
    
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
    
    console.log('Spawning enemy at:', x, y);
    
    // Create enemy sprite using chips.gif
    const enemy = scene.add.sprite(x, y, 'chips');
    
    // Set the display size first
    enemy.setDisplaySize(enemySize, enemySize);
    enemy.setOrigin(0.5, 0.5);
    
    // Set depth to ensure enemy appears above background
    enemy.setDepth(10);
    
    // Add physics to enemy AFTER setting display size
    scene.physics.add.existing(enemy);
    
    // Make collision box MUCH LARGER (3.5x) for easier hitting
    const collisionSize = enemySize * 3.5;
    
    // Set the large size
    enemy.body.setSize(collisionSize, collisionSize);
    
    // EXTREME SHIFT: Moving hitboxes way down and right
    // Use negative values to move right and down relative to sprite center
    
    // Calculate how much the box extends beyond the sprite (on each side)
    const extraSize = (collisionSize - enemySize) / 2;
    
    // This would center the hitbox perfectly on the sprite:
    // enemy.body.offset.set(-extraSize, -extraSize);
    
    // EXTREME shift - 200% right and 150% down 
    // (this places the hitbox far to the right and below the sprite)
    const rightShift = extraSize * 2.0;   // Increased from 1.25 to 2.0
    const downShift = extraSize * 1.5;    // Increased from 1.0 to 1.5
    
    // Final offset: less negative means shifted right/down
    enemy.body.offset.set(-extraSize + rightShift, -extraSize + downShift);
    
    // Fixed offset adjustment in pixels (additional fine-tuning)
    // This adds a fixed pixel offset in addition to the percentage-based offset
    enemy.body.offset.x += 30; // Push 30 more pixels right
    enemy.body.offset.y += 20; // Push 20 more pixels down
    
    // Force-set the body position to match the sprite
    enemy.body.reset(x, y);
    
    // Don't collide with world bounds - we'll handle cleanup ourselves
    enemy.body.setCollideWorldBounds(false);
    
    // Enable debug to show the body
    enemy.body.debugShowBody = true;
    enemy.body.debugBodyColor = 0xff00ff;
    
    // Log the final hitbox position for debugging
    console.log('Enemy hitbox:', {
        spriteX: enemy.x,
        spriteY: enemy.y,
        boxX: enemy.body.x,
        boxY: enemy.body.y,
        boxWidth: enemy.body.width,
        boxHeight: enemy.body.height,
        offsetX: enemy.body.offset.x,
        offsetY: enemy.body.offset.y
    });
    
    // Store enemy properties
    enemy.health = enemyConfig.health || 10;
    enemy.speed = enemyConfig.speed || 300;
    enemy.points = enemyConfig.points || 10;
    
    // Calculate direction to player but only use for velocity, not rotation
    const angle = Phaser.Math.Angle.Between(x, y, player.x, player.y);
    enemy.body.setVelocity(
        Math.cos(angle) * enemy.speed,
        Math.sin(angle) * enemy.speed
    );
    
    // Add to the enemies group
    enemies.add(enemy);
    
    // Add update listener to destroy enemy if it goes too far off screen
    enemy.update = function() {
        const margin = enemySize * 2;
        if (this.x < -margin || this.x > scene.game.config.width + margin ||
            this.y < -margin || this.y > scene.game.config.height + margin) {
            this.destroy();
        }
    };
    
    console.log('Enemy created:', {
        position: { x, y },
        health: enemy.health,
        speed: enemy.speed,
        points: enemy.points,
        depth: enemy.depth,
        size: enemySize
    });
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
            powerUp.setDisplaySize(64, 64);
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
        }
        
        // Add physics to power-up
        scene.physics.world.enable(powerUp);
        powerUp.body.setSize(48, 48);
        powerUp.body.setOffset(8, 8);
        
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

// Handle player hitting an enemy
export function playerHitEnemy(player, enemy, scene) {
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
    // Display level complete text
    levelText.setText(LEVELS[currentLevel].name + ' Complete!');
    levelText.setVisible(true);
    
    // Move to next level after delay
    scene.time.delayedCall(2000, () => {
        // Start quiz before moving to next level
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
    });
}

// Show game over screen
export function showGameOver(scene) {
    console.log('Showing game over screen');
    
    if (!scene || !scene.add) {
        console.error('Invalid scene context in showGameOver');
        return;
    }

    // Create semi-transparent background
    const bg = scene.add.rectangle(0, 0, scene.cameras.main.width, scene.cameras.main.height, 0x000000, 0.8)
        .setOrigin(0)
        .setDepth(1000);

    // Create game over text
    const gameOverText = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY - 150, 'GAME OVER', {
        fontSize: '64px',
        fill: '#ff0000',
        fontFamily: 'Arial',
        fontWeight: 'bold'
    }).setOrigin(0.5).setDepth(1001);

    // Create final score text
    const finalScoreText = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY - 50, `Final Score: ${score}`, {
        fontSize: '32px',
        fill: '#ffffff',
        fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(1001);

    // Create "Save Score" text
    const saveScoreText = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY + 20, 'Save Score', {
        fontSize: '32px',
        fill: '#ffffff',
        fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(1001);

    // Create player name input
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = 'gaute'; // Default value
    nameInput.style.position = 'absolute';
    nameInput.style.left = '50%';
    nameInput.style.top = '55%';
    nameInput.style.transform = 'translate(-50%, -50%)';
    nameInput.style.width = '200px';
    nameInput.style.padding = '10px';
    nameInput.style.fontSize = '24px';
    nameInput.style.textAlign = 'center';
    nameInput.style.backgroundColor = '#000000';
    nameInput.style.color = '#ffffff';
    nameInput.style.border = '2px solid #333333';
    nameInput.style.borderRadius = '5px';
    nameInput.style.zIndex = '1002';
    document.body.appendChild(nameInput);

    // Create restart button
    const restartButton = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY + 150, 'Click to Restart', {
        fontSize: '32px',
        fill: '#ffffff',
        fontFamily: 'Arial'
    })
    .setOrigin(0.5)
    .setDepth(1001)
    .setInteractive({ useHandCursor: true });

    // Make save score text interactive
    saveScoreText.setInteractive({ useHandCursor: true });

    // Save score handler
    saveScoreText.on('pointerdown', async () => {
        const playerName = nameInput.value.trim() || 'Anonymous';
        const highScores = await saveHighScore(playerName, score);
        if (highScores) {
            // Show success message
            saveScoreText.setText('Score Saved!');
            saveScoreText.setFill('#00ff00');
            
            // Disable further saves
            saveScoreText.removeInteractive();
            
            // Remove input field
            nameInput.remove();
        }
    });

    // Restart button handler
    restartButton.on('pointerdown', () => {
        // Clean up UI elements
        nameInput.remove();
        
        // Reset game state
        window.gameState = {
            health: 100,
            score: 0,
            isGameOver: false,
            currentLevel: 1,
            isInvincible: false,
            scene: scene
        };
        
        // Restart the scene
        scene.scene.restart();
    });

    // Handle Enter key press in name input
    nameInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const playerName = nameInput.value.trim() || 'Anonymous';
            const highScores = await saveHighScore(playerName, score);
            if (highScores) {
                // Show success message
                saveScoreText.setText('Score Saved!');
                saveScoreText.setFill('#00ff00');
                
                // Disable further saves
                saveScoreText.removeInteractive();
                
                // Remove input field
                nameInput.remove();
            }
        }
    });

    // Pause the game
    scene.scene.pause();
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
    saveHighScore('Player', score);
    
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