// Level configurations
const LEVELS = {
    1: {
        name: "Erlend 50 år!",
        background: "skærgård",
        enemies: [
            {
                type: "allergy",
                color: 0xff0000,
                speed: 100,
                health: 1,
                points: 10,
                pattern: "zigzag"
            },
            {
                type: "potetgullhår",
                color: 0xffa500,
                speed: 80,
                health: 2,
                points: 20,
                pattern: "chase"
            },
            {
                type: "c64",
                color: 0x00ff00,
                speed: 120,
                health: 1,
                points: 15,
                pattern: "straight"
            }
        ],
        powerUps: [
            {
                type: "shield",
                color: 0x0000ff,
                duration: 5000
            },
            {
                type: "doubleShot",
                color: 0xffff00,
                duration: 10000
            }
        ],
        boss: {
            type: "potetgullhår",
            health: 10,
            patterns: ["spiral", "wave"],
            color: 0xffa500
        }
    },
    2: {
        name: "Business & International",
        background: "cityscape",
        enemies: [
            {
                type: "stockChart",
                color: 0x00ff00,
                speed: 90,
                health: 1,
                points: 15,
                pattern: "falling"
            },
            {
                type: "tickerTape",
                color: 0xffffff,
                speed: 110,
                health: 1,
                points: 10,
                pattern: "horizontal"
            },
            {
                type: "deadline",
                color: 0xff0000,
                speed: 130,
                health: 2,
                points: 20,
                pattern: "chase"
            }
        ],
        powerUps: [
            {
                type: "speedBoost",
                color: 0xff00ff,
                duration: 5000
            },
            {
                type: "tripleShot",
                color: 0x00ffff,
                duration: 8000
            }
        ],
        boss: {
            type: "towerBridge",
            health: 15,
            patterns: ["bridge", "tower"],
            color: 0x808080
        }
    },
    3: {
        name: "Health & Fitness",
        background: "gym",
        enemies: [
            {
                type: "unhealthyFood",
                color: 0xff0000,
                speed: 85,
                health: 1,
                points: 10,
                pattern: "zigzag"
            },
            {
                type: "steepHill",
                color: 0x8b4513,
                speed: 95,
                health: 2,
                points: 15,
                pattern: "falling"
            },
            {
                type: "snowflake",
                color: 0xffffff,
                speed: 105,
                health: 1,
                points: 20,
                pattern: "horizontal"
            }
        ],
        powerUps: [
            {
                type: "healthRegen",
                color: 0x00ff00,
                duration: 8000
            },
            {
                type: "shield",
                color: 0x0000ff,
                duration: 5000
            }
        ],
        boss: {
            type: "holmenkollen",
            health: 20,
            patterns: ["ski", "jump"],
            color: 0xffffff
        }
    },
    4: {
        name: "Maritime & Automotive",
        background: "ocean",
        enemies: [
            {
                type: "stormCloud",
                color: 0x808080,
                speed: 90,
                health: 2,
                points: 15,
                pattern: "zigzag"
            },
            {
                type: "trafficJam",
                color: 0xff0000,
                speed: 70,
                health: 3,
                points: 20,
                pattern: "horizontal"
            },
            {
                type: "carPart",
                color: 0xffff00,
                speed: 110,
                health: 1,
                points: 10,
                pattern: "straight"
            }
        ],
        powerUps: [
            {
                type: "nimbusBoat",
                color: 0x00ffff,
                duration: 10000
            },
            {
                type: "landCruiser",
                color: 0xffa500,
                duration: 8000
            }
        ],
        boss: {
            type: "storm",
            health: 25,
            patterns: ["lightning", "tornado"],
            color: 0x0000ff
        }
    },
    5: {
        name: "Birthday Party",
        background: "party",
        enemies: [
            {
                type: "timeChallenge",
                color: 0xff00ff,
                speed: 100,
                health: 2,
                points: 20,
                pattern: "countdown"
            },
            {
                type: "partyObstacle",
                color: 0x00ffff,
                speed: 80,
                health: 3,
                points: 25,
                pattern: "zigzag"
            },
            {
                type: "birthdaySurprise",
                color: 0xffff00,
                speed: 120,
                health: 1,
                points: 30,
                pattern: "surprise"
            }
        ],
        powerUps: [
            {
                type: "evasSupport",
                color: 0xff69b4,
                duration: 8000
            },
            {
                type: "kidsEnergy",
                color: 0x00ff00,
                duration: 10000
            },
            {
                type: "cakeSlice",
                color: 0xff0000,
                duration: 0
            }
        ],
        boss: {
            type: "birthdayChallenge",
            health: 30,
            patterns: ["celebration", "balance"],
            color: 0xffd700
        }
    }
};

// Enemy movement patterns
const PATTERNS = {
    zigzag: (enemy, time) => {
        enemy.x += Math.sin(time * 0.003) * 2;
        enemy.y += enemy.speed * 0.016;
    },
    chase: (enemy, time, player) => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const angle = Math.atan2(dy, dx);
        enemy.x += Math.cos(angle) * enemy.speed * 0.016;
        enemy.y += Math.sin(angle) * enemy.speed * 0.016;
    },
    straight: (enemy, time) => {
        enemy.y += enemy.speed * 0.016;
    },
    falling: (enemy, time) => {
        enemy.y += enemy.speed * 0.016;
        enemy.rotation += 0.02;
    },
    horizontal: (enemy, time) => {
        enemy.x += Math.sin(time * 0.002) * 3;
        enemy.y += enemy.speed * 0.016;
    },
    countdown: (enemy, time) => {
        enemy.y += enemy.speed * 0.016;
        enemy.scale = 1 + Math.sin(time * 0.005) * 0.2;
    },
    surprise: (enemy, time) => {
        if (time % 2000 < 1000) {
            enemy.y += enemy.speed * 0.016;
        } else {
            enemy.y += enemy.speed * 0.032;
        }
    }
};

// Boss patterns
const BOSS_PATTERNS = {
    spiral: (boss, time) => {
        const angle = time * 0.003;
        const radius = 100 + Math.sin(time * 0.002) * 50;
        boss.x = 400 + Math.cos(angle) * radius;
        boss.y = 300 + Math.sin(angle) * radius;
    },
    wave: (boss, time) => {
        boss.x = 400 + Math.sin(time * 0.002) * 200;
        boss.y = 300 + Math.sin(time * 0.004) * 50;
    },
    bridge: (boss, time) => {
        boss.x = 400 + Math.sin(time * 0.001) * 300;
        boss.y = 300;
    },
    tower: (boss, time) => {
        boss.x = 400;
        boss.y = 300 + Math.sin(time * 0.002) * 100;
    },
    ski: (boss, time) => {
        boss.x = 400 + Math.sin(time * 0.002) * 300;
        boss.y = 300 + Math.sin(time * 0.004) * 30;
    },
    jump: (boss, time) => {
        boss.x = 400;
        boss.y = 300 + Math.sin(time * 0.003) * 150;
    },
    lightning: (boss, time) => {
        boss.x = 400 + Math.sin(time * 0.001) * 200;
        boss.y = 300 + Math.sin(time * 0.005) * 100;
    },
    tornado: (boss, time) => {
        const angle = time * 0.004;
        const radius = 150 + Math.sin(time * 0.003) * 50;
        boss.x = 400 + Math.cos(angle) * radius;
        boss.y = 300 + Math.sin(angle) * radius;
    },
    celebration: (boss, time) => {
        boss.x = 400 + Math.sin(time * 0.002) * 200;
        boss.y = 300 + Math.sin(time * 0.003) * 100;
        boss.rotation = Math.sin(time * 0.005) * 0.2;
    },
    balance: (boss, time) => {
        const angle = time * 0.002;
        const radius = 150 + Math.sin(time * 0.003) * 50;
        boss.x = 400 + Math.cos(angle) * radius;
        boss.y = 300 + Math.sin(angle) * radius;
        boss.scale = 1 + Math.sin(time * 0.004) * 0.2;
    }
};

// Create enemy graphics
function createEnemyGraphics(scene, type, color) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    
    switch (type) {
        case "allergy":
            graphics.lineStyle(2, color);
            graphics.fillStyle(0x000000);
            graphics.fillCircle(10, 10, 10);
            graphics.strokeCircle(10, 10, 10);
            break;
        case "potetgullhår":
            graphics.lineStyle(2, color);
            graphics.fillStyle(0x000000);
            graphics.fillTriangle(0, 0, 20, 10, 0, 20);
            graphics.strokeTriangle(0, 0, 20, 10, 0, 20);
            break;
        case "c64":
            graphics.lineStyle(2, color);
            graphics.fillStyle(0x000000);
            graphics.fillRect(0, 0, 20, 20);
            graphics.strokeRect(0, 0, 20, 20);
            break;
        case "stockChart":
            graphics.lineStyle(2, color);
            graphics.fillStyle(0x000000);
            graphics.beginPath();
            graphics.moveTo(0, 20);
            graphics.lineTo(5, 15);
            graphics.lineTo(10, 5);
            graphics.lineTo(15, 10);
            graphics.lineTo(20, 0);
            graphics.strokePath();
            break;
        case "tickerTape":
            graphics.lineStyle(2, color);
            graphics.fillStyle(0x000000);
            graphics.fillRect(0, 5, 20, 10);
            graphics.strokeRect(0, 5, 20, 10);
            break;
        case "deadline":
            graphics.lineStyle(2, color);
            graphics.fillStyle(0x000000);
            graphics.fillCircle(10, 10, 10);
            graphics.strokeCircle(10, 10, 10);
            graphics.fillStyle(color);
            graphics.fillCircle(10, 10, 5);
            break;
        case "unhealthyFood":
            graphics.lineStyle(2, color);
            graphics.fillStyle(0x000000);
            graphics.fillCircle(10, 10, 10);
            graphics.strokeCircle(10, 10, 10);
            graphics.fillStyle(color);
            graphics.fillCircle(10, 10, 5);
            break;
        case "steepHill":
            graphics.lineStyle(2, color);
            graphics.fillStyle(0x000000);
            graphics.fillTriangle(0, 20, 20, 0, 20, 20);
            graphics.strokeTriangle(0, 20, 20, 0, 20, 20);
            break;
        case "snowflake":
            graphics.lineStyle(2, color);
            graphics.fillStyle(0x000000);
            graphics.fillCircle(10, 10, 10);
            graphics.strokeCircle(10, 10, 10);
            graphics.fillStyle(color);
            graphics.fillCircle(10, 10, 5);
            break;
        case "stormCloud":
            graphics.lineStyle(2, color);
            graphics.fillStyle(0x000000);
            graphics.fillCircle(10, 10, 10);
            graphics.strokeCircle(10, 10, 10);
            break;
        case "trafficJam":
            graphics.lineStyle(2, color);
            graphics.fillStyle(0x000000);
            graphics.fillRect(0, 5, 20, 10);
            graphics.strokeRect(0, 5, 20, 10);
            break;
        case "carPart":
            graphics.lineStyle(2, color);
            graphics.fillStyle(0x000000);
            graphics.fillCircle(10, 10, 10);
            graphics.strokeCircle(10, 10, 10);
            graphics.fillStyle(color);
            graphics.fillCircle(10, 10, 5);
            break;
        case "timeChallenge":
            graphics.lineStyle(2, color);
            graphics.fillStyle(0x000000);
            graphics.fillRect(0, 0, 20, 20);
            graphics.strokeRect(0, 0, 20, 20);
            graphics.fillStyle(color);
            graphics.fillRect(5, 5, 10, 10);
            break;
        case "partyObstacle":
            graphics.lineStyle(2, color);
            graphics.fillStyle(0x000000);
            graphics.fillTriangle(0, 0, 20, 10, 0, 20);
            graphics.strokeTriangle(0, 0, 20, 10, 0, 20);
            break;
        case "birthdaySurprise":
            graphics.lineStyle(2, color);
            graphics.fillStyle(0x000000);
            graphics.fillCircle(10, 10, 10);
            graphics.strokeCircle(10, 10, 10);
            graphics.fillStyle(color);
            graphics.fillCircle(10, 10, 5);
            break;
    }
    
    return graphics.generateTexture(type, 20, 20);
}

// Create boss graphics
function createBossGraphics(scene, type, color) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    
    switch (type) {
        case "potetgullhår":
            graphics.lineStyle(3, color);
            graphics.fillStyle(0x000000);
            graphics.fillTriangle(0, 0, 40, 20, 0, 40);
            graphics.strokeTriangle(0, 0, 40, 20, 0, 40);
            break;
        case "towerBridge":
            graphics.lineStyle(3, color);
            graphics.fillStyle(0x000000);
            graphics.fillRect(0, 0, 40, 40);
            graphics.strokeRect(0, 0, 40, 40);
            graphics.fillStyle(color);
            graphics.fillRect(15, 0, 10, 40);
            break;
        case "holmenkollen":
            graphics.lineStyle(3, color);
            graphics.fillStyle(0x000000);
            graphics.fillTriangle(0, 40, 20, 0, 40, 40);
            graphics.strokeTriangle(0, 40, 20, 0, 40, 40);
            break;
        case "storm":
            graphics.lineStyle(3, color);
            graphics.fillStyle(0x000000);
            graphics.fillCircle(20, 20, 20);
            graphics.strokeCircle(20, 20, 20);
            graphics.fillStyle(color);
            graphics.fillCircle(20, 20, 10);
            break;
        case "birthdayChallenge":
            graphics.lineStyle(3, color);
            graphics.fillStyle(0x000000);
            graphics.fillCircle(20, 20, 20);
            graphics.strokeCircle(20, 20, 20);
            graphics.fillStyle(color);
            graphics.fillCircle(20, 20, 10);
            graphics.lineStyle(2, 0xffffff);
            graphics.strokeCircle(20, 20, 15);
            break;
    }
    
    return graphics.generateTexture(type + "Boss", 40, 40);
}

// Quiz questions for each level
const QUIZ_QUESTIONS = {
    1: [
        {
            question: "What was Bror's favorite childhood game console?",
            options: ["Commodore 64", "Atari", "Nintendo", "Sega"],
            correct: 0
        },
        {
            question: "What was Bror's childhood nickname?",
            options: ["Potetgullhår", "Bror", "Bror-Bror", "Brorito"],
            correct: 0
        }
    ],
    2: [
        {
            question: "Where did Bror study business?",
            options: ["NMH", "BI", "NHH", "UiO"],
            correct: 0
        },
        {
            question: "Which city did Bror live in during his international career?",
            options: ["London", "Paris", "New York", "Tokyo"],
            correct: 0
        }
    ],
    3: [
        {
            question: "What is Bror's favorite winter sport?",
            options: ["Cross-country skiing", "Downhill skiing", "Snowboarding", "Ice hockey"],
            correct: 0
        },
        {
            question: "Which famous skier is Bror friends with?",
            options: ["Martin Johnsrud Sundby", "Petter Northug", "Therese Johaug", "Johannes Høsflot Klæbo"],
            correct: 0
        }
    ],
    4: [
        {
            question: "What type of boat does Bror own?",
            options: ["Nimbus", "Jaguar", "Both", "Neither"],
            correct: 2
        },
        {
            question: "What is Bror's favorite car?",
            options: ["Toyota Land Cruiser", "BMW", "Mercedes", "Audi"],
            correct: 0
        }
    ],
    5: [
        {
            question: "How old is Bror turning?",
            options: ["50", "40", "60", "45"],
            correct: 0
        },
        {
            question: "What is the name of Bror's wife?",
            options: ["Eva", "Anna", "Maria", "Sofia"],
            correct: 0
        }
    ]
};

// Export everything in a single export statement
export {
    LEVELS,
    PATTERNS,
    BOSS_PATTERNS,
    QUIZ_QUESTIONS,
    createEnemyGraphics,
    createBossGraphics
}; 