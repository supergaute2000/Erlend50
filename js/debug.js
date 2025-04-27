/**
 * Debug Mode Detection and Configuration
 * 
 * This module automatically detects if the game should run in debug mode based on:
 * 1. URL parameters (?debug=true)
 * 2. localStorage setting (debugMode=true)
 * 3. Development environment detection
 */

// Debug mode detection and utilities
// This file should be imported before any other game logic

function isDevelopmentEnvironment() {
    // No longer using development environment detection
    return false;
}

function checkDebugUrlParam() {
    // Now only check for debug.html in pathname
    return window.location.pathname.indexOf('debug.html') !== -1;
}

// Initialize debugMode
const initDebugMode = () => {
    try {
        // Check for debug mode from multiple sources
        const fromDebugHtml = checkDebugUrlParam();
        const fromLocalStorage = localStorage.getItem('debugMode') === 'true';
        
        // Set debugMode based on debug.html or localStorage only
        window.debugMode = fromDebugHtml || fromLocalStorage;
        
        // Determine debug source
        let debugSource = '';
        if (fromDebugHtml) debugSource = 'debug.html';
        else if (fromLocalStorage) debugSource = 'localStorage';
        
        // Log debug mode status with simpler syntax
        if (window.debugMode) {
            console.log('Debug mode: ENABLED (via ' + debugSource + ')');
        } else {
            console.log('Debug mode: DISABLED');
        }
        
        // Create debug overlay if debug mode is enabled
        if (window.debugMode) {
            setupDebugTools();
        }
    } catch (error) {
        console.error('Error initializing debug mode:', error);
    }
};

// Setup debug tools and UI
function setupDebugTools() {
    try {
        // Create debug info element if it doesn't exist
        if (!document.getElementById('debugInfo')) {
            const debugInfo = document.createElement('div');
            debugInfo.id = 'debugInfo';
            debugInfo.style.position = 'absolute';
            debugInfo.style.top = '10px';
            debugInfo.style.left = '10px';
            debugInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            debugInfo.style.color = 'white';
            debugInfo.style.padding = '10px';
            debugInfo.style.fontFamily = 'monospace';
            debugInfo.style.fontSize = '12px';
            debugInfo.style.zIndex = '1000';
            debugInfo.style.pointerEvents = 'none';
            document.body.appendChild(debugInfo);
        }
    } catch (error) {
        console.error('Error setting up debug tools:', error);
    }
}

// Call initialization
document.addEventListener('DOMContentLoaded', () => {
    try {
        initDebugMode();
    } catch (error) {
        console.error('Error in debug.js initialization:', error);
    }
});

// Update debug info (should be called in the game loop)
window.updateDebugInfo = (gameState) => {
    if (!window.debugMode) return;
    
    try {
        const debugInfo = document.getElementById('debugInfo');
        if (!debugInfo) return;
        
        // Example debug info - update with actual game state
        debugInfo.innerHTML = `
            FPS: ${Math.round(gameState?.time?.fps || 0)}<br>
            Player Position: (${Math.round(gameState?.player?.x || 0)}, ${Math.round(gameState?.player?.y || 0)})<br>
            Enemies: ${gameState?.enemies?.length || 0}<br>
            Level: ${gameState?.currentLevel || 0}<br>
        `;
    } catch (error) {
        console.error('Error updating debug info:', error);
    }
};

// Expose debug functions for console use
window.debug = {
    toggleDebugMode: () => {
        try {
            window.debugMode = !window.debugMode;
            localStorage.setItem('debugMode', window.debugMode);
            console.log('Debug mode toggled to:', window.debugMode ? 'ENABLED' : 'DISABLED');
        } catch (error) {
            console.error('Error toggling debug mode:', error);
        }
    },
    
    inspectGameState: () => {
        try {
            if (window.game) {
                console.log('Game state:', window.game);
            } else {
                console.warn('Game object not available');
            }
        } catch (error) {
            console.error('Error inspecting game state:', error);
        }
    },
    
    skipToLevel: (level) => {
        try {
            if (window.debugMode && window.startLevel) {
                window.startLevel(level);
                console.log(`Skipped to level ${level}`);
            } else {
                console.warn('Cannot skip level. Debug mode disabled or startLevel function not available.');
            }
        } catch (error) {
            console.error('Error skipping to level:', error);
        }
    }
};

// Add window-level debug tools if in debug mode
if (window.debugMode) {
    window.debugTools = {
        togglePhysicsDebug: function() {
            try {
                if (game && game.scene && game.scene.scenes.length > 0) {
                    const scene = game.scene.scenes[0];
                    scene.physics.world.drawDebug = !scene.physics.world.drawDebug;
                    console.log('Physics debug visualization:', scene.physics.world.drawDebug ? 'ON' : 'OFF');
                }
            } catch (error) {
                console.error('Error toggling physics debug:', error);
            }
        },
        
        showGameInfo: function() {
            try {
                if (game) {
                    console.log('Game configuration:', game.config);
                    console.log('Current scenes:', game.scene.scenes);
                } else {
                    console.warn('Game not initialized yet');
                }
            } catch (error) {
                console.error('Error showing game info:', error);
            }
        },
        
        inspectObject: function(obj) {
            try {
                console.log('Object inspection:', obj);
                return obj;
            } catch (error) {
                console.error('Error inspecting object:', error);
                return null;
            }
        }
    };
    
    console.log('Debug tools available in console: window.debugTools');
} 