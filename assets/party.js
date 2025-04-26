// This script generates a party background image for the final level
// Run this in a browser to generate the image, then save it as party.png

document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 800, 600);
    
    // Draw balloons
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * 800;
        const y = Math.random() * 400;
        const size = 20 + Math.random() * 20;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Balloon
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // String
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + size);
        ctx.lineTo(x, y + size + 50 + Math.random() * 50);
        ctx.stroke();
    }
    
    // Draw streamers
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * 800;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(
            x + 100 - Math.random() * 200, 100,
            x + 100 - Math.random() * 200, 500,
            x + 100 - Math.random() * 200, 600
        );
        ctx.stroke();
    }
    
    // Draw birthday cake
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(350, 450, 100, 50);
    
    // Cake top
    ctx.fillStyle = '#ff69b4';
    ctx.fillRect(350, 430, 100, 20);
    
    // Candles
    ctx.fillStyle = '#ffff00';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(370 + i * 15, 420, 2, 10);
        // Flame
        ctx.fillStyle = '#ff4500';
        ctx.beginPath();
        ctx.arc(371 + i * 15, 415, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffff00';
    }
    
    // Add text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Happy 50th Birthday, Bror!', 400, 550);
    
    // Instructions
    console.log('Right-click on the canvas and select "Save Image As..." to save as party.png');
}); 