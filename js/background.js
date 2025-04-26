export class BackgroundManager {
    constructor(scene) {
        this.scene = scene;
        this.layers = [];
        this.scrollSpeeds = [0.2, 0.5, 1.0]; // Different scroll speeds for each layer
        this.initialize();
    }

    initialize() {
        const gameWidth = this.scene.scale.width;
        const gameHeight = this.scene.scale.height;

        // Create three background layers
        for (let i = 0; i < 3; i++) {
            // Create a single tilesprite for each layer that covers the entire game area
            const layer = this.scene.add.tileSprite(
                0,              // x position (left edge)
                0,              // y position (top edge)
                gameWidth,      // width matches game width
                gameHeight,     // height matches game height
                `layer${i + 1}` // texture key
            );
            
            // Set origin to top-left corner
            layer.setOrigin(0, 0);
            
            // Set depth to ensure layers are behind everything else
            layer.setDepth(-3 + i);
            
            // Scale the layer to ensure it fills the screen
            layer.setScale(1.2);
            
            // Store the layer with its scroll speed
            this.layers.push({
                sprite: layer,
                speed: this.scrollSpeeds[i],
                offset: 0 // Track scrolling offset
            });
        }

        // Set base scroll speed
        this.baseScrollSpeed = -1;
    }

    update() {
        // Update each layer
        this.layers.forEach(layer => {
            // Update the tilePosition for smooth scrolling
            layer.offset += layer.speed * this.baseScrollSpeed;
            
            // Reset the offset when it gets too large to prevent floating point issues
            if (Math.abs(layer.offset) > 10000) {
                layer.offset = 0;
            }
            
            layer.sprite.tilePositionY = layer.offset;
        });
    }

    // Method to adjust scroll speed (can be called when difficulty changes)
    setScrollSpeed(speed) {
        this.baseScrollSpeed = -Math.abs(speed); // Ensure negative for correct direction
    }

    // Method to reset background position (can be called between levels)
    reset() {
        this.layers.forEach(layer => {
            layer.offset = 0;
            layer.sprite.tilePositionY = 0;
        });
    }
} 