const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Path to the high scores file
const highScoresPath = path.join(__dirname, 'highscores.json');

// Initialize high scores file if it doesn't exist
if (!fs.existsSync(highScoresPath)) {
    fs.writeFileSync(highScoresPath, JSON.stringify([]));
}

// Get high scores
app.get('/scores', (req, res) => {
    try {
        const highScores = JSON.parse(fs.readFileSync(highScoresPath, 'utf8'));
        res.json(highScores);
    } catch (error) {
        console.error('Error reading high scores:', error);
        res.status(500).json({ error: 'Failed to read high scores' });
    }
});

// Save high score
app.post('/scores', (req, res) => {
    try {
        const { name, score } = req.body;
        
        if (!name || typeof score !== 'number') {
            return res.status(400).json({ error: 'Invalid input' });
        }
        
        // Read existing high scores
        const highScores = JSON.parse(fs.readFileSync(highScoresPath, 'utf8'));
        
        // Add new score
        highScores.push({
            name,
            score,
            date: new Date().toISOString()
        });
        
        // Sort by score (highest first)
        highScores.sort((a, b) => b.score - a.score);
        
        // Keep only top 10
        const topScores = highScores.slice(0, 10);
        
        // Save back to file
        fs.writeFileSync(highScoresPath, JSON.stringify(topScores, null, 2));
        
        res.json({ success: true, highScores: topScores });
    } catch (error) {
        console.error('Error saving high score:', error);
        res.status(500).json({ error: 'Failed to save high score' });
    }
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Game server running at http://localhost:${port}`);
    console.log('Press Ctrl+C to stop the server');
}); 