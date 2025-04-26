// Create a canvas element
const canvas = document.createElement('canvas');
canvas.width = 400;
canvas.height = 600;
const ctx = canvas.getContext('2d');

// Fill background
ctx.fillStyle = '#1a1a2e';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Add some placeholder text
ctx.fillStyle = '#ffffff';
ctx.font = '48px Arial';
ctx.textAlign = 'center';
ctx.fillText('Placeholder Image', canvas.width/2, canvas.height/2);

// Convert to data URL
const dataURL = canvas.toDataURL('image/png');
console.log('Placeholder image data URL:', dataURL); 