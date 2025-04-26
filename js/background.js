export class BackgroundManager {
    constructor(scene) {
        this.scene = scene;
        this.layers = [];
        this.scrollSpeed = -1;
        // Get actual game height from scene config
        this.gameHeight = scene.scale.height;
        console.log('Background manager created with game height:', this.gameHeight);
    }

    createLayers(layerKeys) {
        console.log('Creating background layers:', layerKeys);
        
        // Clear existing layers
        this.layers.forEach(layer => layer.destroy());
        this.layers = [];

        // Create new layers
        layerKeys.forEach((key, index) => {
            // Create two instances of each layer for seamless scrolling
            for (let i = 0; i < 2; i++) {
                const layer = this.scene.add.tileSprite(
                    0,                          // x position
                    i === 0 ? 0 : -this.gameHeight,  // y position (second instance starts above)
                    this.scene.scale.width,     // width - use actual game width
                    this.gameHeight,            // height - use actual game height
                    key                         // texture key
                );
                
                // Configure layer properties
                layer.setOrigin(0, 0);
                layer.setDepth(index - 3);      // Ensure proper layer ordering
                layer.setScrollFactor(0);       // Fix to camera
                layer.alpha = 1;                // Ensure visibility
                
                // Add to layers array
                this.layers.push(layer);
                
                console.log(`Created layer ${key} instance ${i + 1}:`, {
                    x: layer.x,
                    y: layer.y,
                    width: layer.width,
                    height: layer.height,
                    depth: layer.depth,
                    alpha: layer.alpha
                });
            }
        });
    }

    update() {
        // Update each pair of layers
        for (let i = 0; i < this.layers.length; i += 2) {
            const layer1 = this.layers[i];
            const layer2 = this.layers[i + 1];
            
            // Move both layers down
            layer1.y += this.scrollSpeed;
            layer2.y += this.scrollSpeed;
            
            // Reset positions when a layer moves completely off screen
            // Use the actual game height for checking and repositioning
            if (layer1.y >= this.gameHeight) {
                layer1.y = layer2.y - this.gameHeight;
                console.log(`Reset layer ${i} position to ${layer1.y}`);
            }
            if (layer2.y >= this.gameHeight) {
                layer2.y = layer1.y - this.gameHeight;
                console.log(`Reset layer ${i + 1} position to ${layer2.y}`);
            }
        }
    }

    setScrollSpeed(speed) {
        this.scrollSpeed = speed;
        console.log('Background scroll speed set to:', speed);
    }

    destroy() {
        this.layers.forEach(layer => layer.destroy());
        this.layers = [];
        console.log('Background layers destroyed');
    }
} 