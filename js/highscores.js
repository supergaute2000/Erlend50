// High score API endpoint
const API_URL = 'http://localhost:3000/scores';

// Save a high score to the server
export async function saveHighScore(playerName, score) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: playerName,
                score: score
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save high score');
        }

        const data = await response.json();
        console.log('High score saved successfully:', data);
        return data.highScores;
    } catch (error) {
        console.error('Error saving high score:', error);
        return null;
    }
}

// Get high scores from the server
export async function getHighScores() {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error('Failed to get high scores');
        }

        const data = await response.json();
        console.log('High scores retrieved successfully:', data);
        return data;
    } catch (error) {
        console.error('Error getting high scores:', error);
        return null;
    }
} 