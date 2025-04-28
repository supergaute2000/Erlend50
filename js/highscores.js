// High score API endpoint - using relative URL for compatibility with both local and deployed environments
const API_URL = '/scores';

// Local storage keys
const LOCAL_STORAGE_KEY = 'bror50_highscores';

// Debug flag - set to true to see detailed logs
const DEBUG = true;

// Save a high score to the server with localStorage fallback
export async function saveHighScore(playerName, score) {
    if (DEBUG) console.log(`Attempting to save high score: ${playerName} - ${score}`);
    
    // Always save to localStorage first as a backup
    const localResult = saveToLocalStorage(playerName, score);
    if (DEBUG) console.log('Saved to localStorage:', localResult);
    
    try {
        // Try to save to server
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: playerName,
                score: score,
                date: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to save high score using server: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (DEBUG) console.log('High score saved successfully to server:', data);
        
        // Return the high scores array from the response
        return data.highScores || localResult;
    } catch (error) {
        console.error('Error saving high score to server:', error);
        console.log('Using localStorage fallback instead');
        // Return the localStorage result
        return localResult;
    }
}

// Get high scores from the server with localStorage fallback
export async function getHighScores() {
    if (DEBUG) console.log('Attempting to get high scores');
    
    // Get from localStorage first as a backup
    const localScores = getFromLocalStorage();
    if (DEBUG) console.log('Retrieved from localStorage:', localScores);
    
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`Failed to get high scores from server: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (DEBUG) console.log('High scores retrieved successfully from server:', data);
        // Return the high scores array from the response
        return data.highScores || localScores;
    } catch (error) {
        console.error('Error getting high scores from server:', error);
        console.log('Using localStorage fallback instead');
        // Return the localStorage result
        return localScores;
    }
}

// Helper function to save to localStorage
function saveToLocalStorage(playerName, score) {
    try {
        if (DEBUG) console.log(`Saving to localStorage: ${playerName} - ${score}`);
        
        // Get existing scores from localStorage
        let highScores = getFromLocalStorage();
        
        // Add new score
        highScores.push({
            name: playerName,
            score: score,
            date: new Date().toISOString()
        });
        
        // Sort by score (highest first)
        highScores.sort((a, b) => b.score - a.score);
        
        // Keep only top 10
        highScores = highScores.slice(0, 10);
        
        // Save back to localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(highScores));
        
        if (DEBUG) console.log('High score saved to localStorage:', highScores);
        return highScores;
    } catch (error) {
        console.error('Error saving high score to localStorage:', error);
        // Try to recover by creating a new array with just this score
        try {
            const newScore = [{
                name: playerName,
                score: score,
                date: new Date().toISOString()
            }];
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newScore));
            return newScore;
        } catch (e) {
            console.error('Failed to save even a single score to localStorage:', e);
            return [];
        }
    }
}

// Helper function to get from localStorage
function getFromLocalStorage() {
    try {
        if (DEBUG) console.log('Reading from localStorage');
        
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!storedData) {
            if (DEBUG) console.log('No data found in localStorage');
            return [];
        }
        
        const parsedData = JSON.parse(storedData);
        if (DEBUG) console.log('Data retrieved from localStorage:', parsedData);
        return parsedData;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        // Try to clear corrupted data
        try {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            console.log('Cleared corrupted localStorage data');
        } catch (e) {
            console.error('Failed to clear localStorage:', e);
        }
        return [];
    }
} 