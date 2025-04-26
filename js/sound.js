// Sound Manager class to handle all game audio
export class SoundManager {
    constructor(scene) {
        this.scene = scene;
        this.sounds = {};
        this.music = null;
        this.isMuted = false;
        this.volume = 0.5;
        
        // Create volume control
        this.createVolumeControl();
    }
    
    // Preload all sound assets
    preload() {
        // We'll skip loading sound files for now
        // They will be loaded when needed
    }
    
    // Create volume control UI
    createVolumeControl() {
        // Create volume icon
        const volumeIcon = this.scene.add.rectangle(750, 30, 32, 32, 0xffffff);
        volumeIcon.setInteractive();
        
        // Create volume slider
        const volumeSlider = this.scene.add.graphics();
        volumeSlider.fillStyle(0xffffff, 0.5);
        volumeSlider.fillRect(770, 25, 100, 10);
        
        // Create volume level indicator
        const volumeLevel = this.scene.add.graphics();
        volumeLevel.fillStyle(0xffffff, 1);
        volumeLevel.fillRect(770, 25, 100 * this.volume, 10);
        
        // Add click handler to volume icon
        volumeIcon.on('pointerdown', () => {
            this.isMuted = !this.isMuted;
            if (this.isMuted) {
                this.muteAll();
                volumeIcon.setFillStyle(0x888888);
            } else {
                this.unmuteAll();
                volumeIcon.setFillStyle(0xffffff);
            }
        });
        
        // Add click handler to volume slider
        const sliderZone = this.scene.add.zone(770, 25, 100, 10);
        sliderZone.setInteractive();
        sliderZone.on('pointerdown', (pointer) => {
            const x = pointer.x - 770;
            this.volume = Math.max(0, Math.min(1, x / 100));
            this.updateVolume();
            volumeLevel.clear();
            volumeLevel.fillStyle(0xffffff, 1);
            volumeLevel.fillRect(770, 25, 100 * this.volume, 10);
        });
    }
    
    // Play a sound effect
    playSound(key) {
        if (this.isMuted) return;
        
        // Skip playing sounds for now
        console.log(`Sound effect ${key} would play here`);
    }
    
    // Play background music for a level
    playMusic(level) {
        // Skip playing music for now
        console.log(`Music for level ${level} would play here`);
    }
    
    // Stop all sounds
    stopAll() {
        this.scene.sound.stopAll();
    }
    
    // Mute all sounds
    muteAll() {
        this.scene.sound.setMute(true);
    }
    
    // Unmute all sounds
    unmuteAll() {
        this.scene.sound.setMute(false);
    }
    
    // Update volume for all sounds
    updateVolume() {
        this.scene.sound.volume = this.volume;
        if (this.music) {
            this.music.setVolume(this.volume * 0.7);
        }
    }
} 