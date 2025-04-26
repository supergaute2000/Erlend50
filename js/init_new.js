// Game configuration
export const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

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

// Initialize game
export const game = new Phaser.Game(config);

// Preload game assets
function preload() {
    // Load images
    this.load.image('player', 'assets/player.png');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.image('background', 'assets/background.png');
    this.load.image('party', 'assets/party.png');
    
    // Load sound effects
    this.load.audio('shoot', 'assets/sounds/shoot.mp3');
    this.load.audio('explosion', 'assets/sounds/explosion.mp3');
    this.load.audio('powerup', 'assets/sounds/powerup.mp3');
    this.load.audio('gameover', 'assets/sounds/gameover.mp3');
    this.load.audio('levelup', 'assets/sounds/levelup.mp3');
    
    // Load background music
    this.load.audio('bgm', 'assets/sounds/bgm.mp3');
}

// Create game objects
function create() {
    // Initialize game objects
    bullets = this.add.group();
    enemies = this.add.group();
    powerUps = this.add.group();
    
    // Create player
    player = this.physics.add.sprite(400, 300, 'player');
    player.setCollideWorldBounds(true);
    
    // Setup controls
    cursors = this.input.keyboard.createCursorKeys();
    fireButton = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Setup mobile controls if needed
    if (isMobile) {
        setupMobileControls(this);
    }
    
    // Setup collisions
    this.physics.add.collider(player, enemies);
    this.physics.add.collider(bullets, enemies, bulletHitEnemy, null, this);
    this.physics.add.collider(player, powerUps, collectPowerUp, null, this);
    
    // Start first level
    startLevel(this, 1);
}

// Update game state
function update() {
    if (isGameOver) return;
    
    // Handle player movement
    handlePlayerMovement();
    
    // Handle shooting
    if (Phaser.Input.Keyboard.JustDown(fireButton)) {
        fireBullet(this);
    }
    
    // Update enemies
    updateEnemies(this);
}

// Helper functions
function setupMobileControls(scene) {
    const joystick = scene.plugins.get('rexVirtualJoystick').add(scene, {
        x: 100,
        y: 500,
        radius: 50,
        base: scene.add.circle(0, 0, 50, 0x888888, 0.5),
        thumb: scene.add.circle(0, 0, 25, 0xcccccc, 0.8),
    });
    
    const fireZone = scene.add.zone(700, 500, 100, 100);
    fireZone.setInteractive();
    fireZone.on('pointerdown', () => {
        fireBullet(scene);
    });
}

function handlePlayerMovement() {
    const speed = 200;
    
    if (isMobile) {
        const joystick = this.plugins.get('rexVirtualJoystick');
        if (joystick.forceX !== 0 || joystick.forceY !== 0) {
            player.setVelocity(joystick.forceX * speed, joystick.forceY * speed);
        } else {
            player.setVelocity(0, 0);
        }
    } else {
        if (cursors.left.isDown) {
            player.setVelocityX(-speed);
        } else if (cursors.right.isDown) {
            player.setVelocityX(speed);
        } else {
            player.setVelocityX(0);
        }
        
        if (cursors.up.isDown) {
            player.setVelocityY(-speed);
        } else if (cursors.down.isDown) {
            player.setVelocityY(speed);
        } else {
            player.setVelocityY(0);
        }
    }
}

function fireBullet(scene) {
    const bullet = bullets.create(player.x, player.y, 'bullet');
    bullet.setVelocityY(-400);
    scene.sound.play('shoot');
}

function bulletHitEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.health -= 10;
    if (enemy.health <= 0) {
        enemy.destroy();
        score += enemy.points;
        updateScore();
    }
}

function collectPowerUp(player, powerUp) {
    powerUp.destroy();
    scene.sound.play('powerup');
    activatePowerUp(powerUp.type);
}

function updateScore() {
    const scoreText = document.getElementById('score-container');
    scoreText.textContent = `Score: ${score}`;
}

// Power-up related functions
export function activatePowerUp(type) {
    switch(type) {
        case 'shield':
            this.isInvincible = true;
            this.shieldTimer = this.time.addEvent({
                delay: 5000,
                callback: () => {
                    this.isInvincible = false;
                    this.deactivatePowerUp('shield');
                }
            });
            break;
        case 'doubleShot':
            this.isDoubleShot = true;
            this.doubleShotTimer = this.time.addEvent({
                delay: 10000,
                callback: () => {
                    this.isDoubleShot = false;
                    this.deactivatePowerUp('doubleShot');
                }
            });
            break;
        case 'tripleShot':
            this.isTripleShot = true;
            this.tripleShotTimer = this.time.addEvent({
                delay: 8000,
                callback: () => {
                    this.isTripleShot = false;
                    this.deactivatePowerUp('tripleShot');
                }
            });
            break;
        case 'speedBoost':
            this.playerSpeed = 400;
            this.speedBoostTimer = this.time.addEvent({
                delay: 5000,
                callback: () => {
                    this.playerSpeed = 200;
                    this.deactivatePowerUp('speedBoost');
                }
            });
            break;
        case 'evasSupport':
            this.isInvincible = true;
            this.evasSupportTimer = this.time.addEvent({
                delay: 7000,
                callback: () => {
                    this.isInvincible = false;
                    this.deactivatePowerUp('evasSupport');
                }
            });
            break;
        case 'kidsEnergy':
            this.playerSpeed = 350;
            this.fireRate = 150;
            this.kidsEnergyTimer = this.time.addEvent({
                delay: 6000,
                callback: () => {
                    this.playerSpeed = 200;
                    this.fireRate = 250;
                    this.deactivatePowerUp('kidsEnergy');
                }
            });
            break;
        case 'cakeSlice':
            this.playerHealth = 100;
            this.updateHealth();
            break;
    }
    this.uiManager.showPowerUp(type, 2000);
    this.soundManager.playSound('powerup');
}

export function deactivatePowerUp(type) {
    switch(type) {
        case 'shield':
            this.shieldTimer = null;
            break;
        case 'doubleShot':
            this.doubleShotTimer = null;
            break;
        case 'tripleShot':
            this.tripleShotTimer = null;
            break;
        case 'speedBoost':
            this.speedBoostTimer = null;
            break;
        case 'evasSupport':
            this.evasSupportTimer = null;
            break;
        case 'kidsEnergy':
            this.kidsEnergyTimer = null;
            break;
    }
}

// Update enemies
export function updateEnemies(scene) {
    // Update enemy positions and behaviors
    enemies.getChildren().forEach(enemy => {
        // Apply enemy movement pattern
        if (enemy.pattern) {
            const pattern = PATTERNS[enemy.pattern];
            if (pattern) {
                pattern(enemy, scene);
            }
        }
        
        // Check if enemy is out of bounds
        if (enemy.y > 650) {
            enemy.destroy();
        }
    });
    
    // Update boss if present
    if (currentBoss) {
        updateBoss(scene);
    }
}

// Update boss
function updateBoss(scene) {
    // Update boss pattern timer
    bossPatternTimer += scene.game.loop.delta;
    
    // Change pattern if timer exceeds duration
    if (bossPatternTimer >= bossPatternDuration) {
        bossPatternTimer = 0;
        bossPatternIndex = (bossPatternIndex + 1) % BOSS_PATTERNS[currentBoss.pattern].length;
    }
    
    // Apply current boss pattern
    const pattern = BOSS_PATTERNS[currentBoss.pattern][bossPatternIndex];
    if (pattern) {
        pattern(currentBoss, scene);
    }
} 