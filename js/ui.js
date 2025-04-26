// UI manager for the game
export class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.transitionOverlay = null;
        this.levelText = null;
        this.scoreText = null;
        this.healthText = null;
        this.powerUpText = null;
        this.bossHealthBar = null;
        this.bossHealthText = null;
        this.gameOverScreen = null;
        this.levelCompleteScreen = null;
        this.quizScreen = null;
    }
    
    create() {
        // Create transition overlay
        this.transitionOverlay = this.scene.add.rectangle(0, 0, 400, 600, 0x000000, 0);
        this.transitionOverlay.setOrigin(0, 0);
        this.transitionOverlay.setDepth(1000);
        
        // Create level text
        this.levelText = this.scene.add.text(200, 300, '', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.levelText.setOrigin(0.5);
        this.levelText.setDepth(1001);
        this.levelText.setVisible(false);
        
        // Create score text
        this.scoreText = this.scene.add.text(10, 10, 'Score: 0', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.scoreText.setDepth(100);
        
        // Create health text
        this.healthText = this.scene.add.text(10, 40, 'Health: 100', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.healthText.setDepth(100);
        
        // Create power-up text
        this.powerUpText = this.scene.add.text(200, 50, '', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.powerUpText.setOrigin(0.5);
        this.powerUpText.setDepth(100);
        this.powerUpText.setVisible(false);
        
        // Create boss health bar background
        const bossHealthBarBg = this.scene.add.rectangle(200, 80, 300, 20, 0x000000, 0.5);
        bossHealthBarBg.setOrigin(0.5);
        bossHealthBarBg.setDepth(100);
        bossHealthBarBg.setVisible(false);
        
        // Create boss health bar
        this.bossHealthBar = this.scene.add.rectangle(50, 80, 300, 20, 0xff0000);
        this.bossHealthBar.setOrigin(0, 0.5);
        this.bossHealthBar.setDepth(101);
        this.bossHealthBar.setVisible(false);
        
        // Create boss health text
        this.bossHealthText = this.scene.add.text(200, 80, 'Boss Health: 100%', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.bossHealthText.setOrigin(0.5);
        this.bossHealthText.setDepth(102);
        this.bossHealthText.setVisible(false);
        
        // Create game over screen
        this.createGameOverScreen();
        
        // Create level complete screen
        this.createLevelCompleteScreen();
        
        // Create quiz screen
        this.createQuizScreen();
    }
    
    updateScore(score) {
        this.scoreText.setText('Score: ' + score);
    }
    
    updateHealth(health) {
        this.healthText.setText('Health: ' + health);
    }
    
    showPowerUp(text, duration) {
        this.powerUpText.setText(text);
        this.powerUpText.setVisible(true);
        
        // Fade out after duration
        this.scene.time.delayedCall(duration, () => {
            this.scene.tweens.add({
                targets: this.powerUpText,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    this.powerUpText.setVisible(false);
                    this.powerUpText.setAlpha(1);
                }
            });
        });
    }
    
    updateBossHealth(health, maxHealth) {
        const percentage = (health / maxHealth) * 100;
        this.bossHealthBar.setScaleX(percentage / 100);
        this.bossHealthText.setText('Boss Health: ' + Math.round(percentage) + '%');
    }
    
    showBossHealth() {
        this.bossHealthBar.parentContainer.setVisible(true);
        this.bossHealthBar.setVisible(true);
        this.bossHealthText.setVisible(true);
    }
    
    hideBossHealth() {
        this.bossHealthBar.parentContainer.setVisible(false);
        this.bossHealthBar.setVisible(false);
        this.bossHealthText.setVisible(false);
    }
    
    showLevelTransition(levelName, callback) {
        // Fade in
        this.scene.tweens.add({
            targets: this.transitionOverlay,
            alpha: 1,
            duration: 500,
            onComplete: () => {
                // Show level text
                this.levelText.setText(levelName);
                this.levelText.setVisible(true);
                
                // Fade out after delay
                this.scene.time.delayedCall(2000, () => {
                    this.scene.tweens.add({
                        targets: [this.transitionOverlay, this.levelText],
                        alpha: 0,
                        duration: 500,
                        onComplete: () => {
                            this.levelText.setVisible(false);
                            if (callback) callback();
                        }
                    });
                });
            }
        });
    }
    
    createGameOverScreen() {
        this.gameOverScreen = this.scene.add.container(200, 300);
        this.gameOverScreen.setDepth(2000);
        this.gameOverScreen.setVisible(false);
        
        // Background
        const bg = this.scene.add.rectangle(0, 0, 300, 400, 0x000000, 0.8);
        bg.setOrigin(0.5);
        
        // Game Over text
        const gameOverText = this.scene.add.text(0, -100, 'GAME OVER', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 6
        });
        gameOverText.setOrigin(0.5);
        
        // Final score text
        const finalScoreText = this.scene.add.text(0, 0, 'Final Score: 0', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        finalScoreText.setOrigin(0.5);
        
        // Restart button
        const restartButton = this.scene.add.rectangle(0, 100, 150, 50, 0x00ff00);
        restartButton.setOrigin(0.5);
        restartButton.setInteractive();
        
        const restartText = this.scene.add.text(0, 100, 'RESTART', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#000000'
        });
        restartText.setOrigin(0.5);
        
        // Add elements to container
        this.gameOverScreen.add([bg, gameOverText, finalScoreText, restartButton, restartText]);
        
        // Add button interaction
        restartButton.on('pointerdown', () => {
            this.scene.scene.restart();
        });
        
        // Store reference to score text for updating
        this.finalScoreText = finalScoreText;
    }
    
    showGameOver(score) {
        this.finalScoreText.setText('Final Score: ' + score);
        this.gameOverScreen.setVisible(true);
    }
    
    createLevelCompleteScreen() {
        this.levelCompleteScreen = this.scene.add.container(200, 300);
        this.levelCompleteScreen.setDepth(2000);
        this.levelCompleteScreen.setVisible(false);
        
        // Background
        const bg = this.scene.add.rectangle(0, 0, 300, 400, 0x000000, 0.8);
        bg.setOrigin(0.5);
        
        // Level Complete text
        const levelCompleteText = this.scene.add.text(0, -100, 'LEVEL COMPLETE!', {
            fontSize: '36px',
            fontFamily: 'Arial',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 6
        });
        levelCompleteText.setOrigin(0.5);
        
        // Score text
        const scoreText = this.scene.add.text(0, 0, 'Score: 0', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        scoreText.setOrigin(0.5);
        
        // Continue button
        const continueButton = this.scene.add.rectangle(0, 100, 150, 50, 0x00ff00);
        continueButton.setOrigin(0.5);
        continueButton.setInteractive();
        
        const continueText = this.scene.add.text(0, 100, 'CONTINUE', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#000000'
        });
        continueText.setOrigin(0.5);
        
        // Add elements to container
        this.levelCompleteScreen.add([bg, levelCompleteText, scoreText, continueButton, continueText]);
        
        // Add button interaction
        continueButton.on('pointerdown', () => {
            this.levelCompleteScreen.setVisible(false);
            this.scene.events.emit('levelCompleteContinue');
        });
        
        // Store reference to score text for updating
        this.levelScoreText = scoreText;
    }
    
    showLevelComplete(score) {
        this.levelScoreText.setText('Score: ' + score);
        this.levelCompleteScreen.setVisible(true);
    }
    
    createQuizScreen() {
        this.quizScreen = this.scene.add.container(200, 300);
        this.quizScreen.setDepth(2000);
        this.quizScreen.setVisible(false);
        
        // Background
        const bg = this.scene.add.rectangle(0, 0, 350, 500, 0x000000, 0.8);
        bg.setOrigin(0.5);
        
        // Quiz title
        const quizTitle = this.scene.add.text(0, -200, 'QUIZ TIME!', {
            fontSize: '36px',
            fontFamily: 'Arial',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 6
        });
        quizTitle.setOrigin(0.5);
        
        // Question text
        const questionText = this.scene.add.text(0, -100, '', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center',
            wordWrap: { width: 300 }
        });
        questionText.setOrigin(0.5);
        
        // Options container
        const optionsContainer = this.scene.add.container(0, 50);
        
        // Add elements to container
        this.quizScreen.add([bg, quizTitle, questionText, optionsContainer]);
        
        // Store references for updating
        this.quizQuestionText = questionText;
        this.quizOptionsContainer = optionsContainer;
    }
    
    showQuiz(question, options, callback) {
        // Set question text
        this.quizQuestionText.setText(question);
        
        // Clear previous options
        this.quizOptionsContainer.removeAll(true);
        
        // Create option buttons
        options.forEach((option, index) => {
            const button = this.scene.add.rectangle(0, index * 60, 500, 50, 0x4444ff);
            button.setOrigin(0.5);
            button.setInteractive();
            
            const buttonText = this.scene.add.text(0, index * 60, option, {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            });
            buttonText.setOrigin(0.5);
            
            // Add button interaction
            button.on('pointerdown', () => {
                if (callback) callback(index);
            });
            
            // Add to options container
            this.quizOptionsContainer.add([button, buttonText]);
        });
        
        // Show quiz screen
        this.quizScreen.setVisible(true);
    }
    
    hideQuiz() {
        this.quizScreen.setVisible(false);
    }
} 