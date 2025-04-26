// Quiz System class to handle quizzes between levels
export class QuizSystem {
    constructor(scene) {
        this.scene = scene;
        this.questions = {};
        this.currentQuestion = null;
        this.questionIndex = 0;
        this.score = 0;
        this.isActive = false;
        
        // Import quiz questions
        this.importQuestions();
    }
    
    // Import quiz questions from levels.js
    importQuestions() {
        // This will be populated from levels.js
        this.questions = {
            1: [
                {
                    question: "What was Bror's favorite childhood game?",
                    options: ["Commodore 64", "Nintendo", "Atari", "Sega"],
                    correct: 0
                },
                {
                    question: "What was Bror's nickname as a kid?",
                    options: ["Potetgullhår", "Rødtopp", "Blondie", "Gaming"],
                    correct: 0
                }
            ],
            2: [
                {
                    question: "Which company did Bror work for in London?",
                    options: ["Reuters", "BBC", "CNN", "Sky News"],
                    correct: 0
                },
                {
                    question: "What was Bror's role at Reuters?",
                    options: ["Financial Journalist", "Sports Reporter", "Weather Forecaster", "Political Analyst"],
                    correct: 0
                }
            ],
            3: [
                {
                    question: "What is Bror's favorite winter activity?",
                    options: ["Holmenkollmarsjen", "Skiing", "Snowboarding", "Ice Fishing"],
                    correct: 0
                },
                {
                    question: "How many times has Bror completed Holmenkollmarsjen?",
                    options: ["5", "10", "15", "20"],
                    correct: 2
                }
            ],
            4: [
                {
                    question: "What type of boat does Bror own?",
                    options: ["Nimbus", "Bavaria", "Beneteau", "Jeanneau"],
                    correct: 0
                },
                {
                    question: "What car does Bror drive?",
                    options: ["Toyota Land Cruiser", "Jeep", "Land Rover", "Range Rover"],
                    correct: 0
                }
            ],
            5: [
                {
                    question: "How old is Bror turning?",
                    options: ["40", "45", "50", "55"],
                    correct: 2
                },
                {
                    question: "What is Bror's wife's name?",
                    options: ["Eva", "Anna", "Maria", "Sofia"],
                    correct: 0
                }
            ]
        };
    }
    
    // Start a quiz for a specific level
    startQuiz(level) {
        // Set active state
        this.isActive = true;
        
        // Pause the game
        this.scene.physics.pause();
        
        // Reset quiz state
        this.questionIndex = 0;
        this.score = 0;
        
        // Get questions for this level
        const levelQuestions = this.questions[level] || [];
        
        // Shuffle questions
        this.shuffleQuestions(levelQuestions);
        
        // Show first question
        this.showQuestion(levelQuestions);
    }
    
    // Shuffle questions array
    shuffleQuestions(questions) {
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
        }
    }
    
    // Show a question
    showQuestion(questions) {
        // Get current question
        this.currentQuestion = questions[this.questionIndex];
        
        // Show quiz UI
        this.scene.uiManager.showQuiz(
            this.currentQuestion.question,
            this.currentQuestion.options,
            this.score
        );
        
        // Listen for answer selection
        this.scene.events.once('quizAnswer', this.handleAnswer, this);
    }
    
    // Handle answer selection
    handleAnswer(selectedIndex) {
        // Check if answer is correct
        const isCorrect = selectedIndex === this.currentQuestion.correct;
        
        // Update score
        if (isCorrect) {
            this.score += 100;
            this.scene.soundManager.playSound('quizCorrect');
        } else {
            this.scene.soundManager.playSound('quizWrong');
        }
        
        // Move to next question or end quiz
        this.questionIndex++;
        
        if (this.questionIndex < this.questions[this.scene.currentLevel].length) {
            // Show next question
            this.showQuestion(this.questions[this.scene.currentLevel]);
        } else {
            // End quiz
            this.endQuiz();
        }
    }
    
    // End the quiz
    endQuiz() {
        // Hide quiz UI
        this.scene.uiManager.hideQuiz();
        
        // Resume the game
        this.scene.physics.resume();
        
        // Set inactive state
        this.isActive = false;
        
        // Add bonus score to game score
        this.scene.score += this.score;
        this.scene.updateScore();
        
        // Show bonus score message
        const bonusText = this.scene.add.text(400, 300, 'Quiz Bonus: +' + this.score, { 
            fontSize: '48px', 
            fill: '#ffff00' 
        });
        bonusText.setOrigin(0.5);
        
        // Hide after delay
        this.scene.time.delayedCall(2000, () => {
            bonusText.destroy();
        });
    }
} 