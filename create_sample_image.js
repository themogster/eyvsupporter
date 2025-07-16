// Create a sample base64 image for testing thumbnails
const canvas = document.createElement('canvas');
canvas.width = 400;
canvas.height = 400;
const ctx = canvas.getContext('2d');

// Create a circular profile picture with EYV branding
ctx.fillStyle = '#502185'; // EYV purple
ctx.beginPath();
ctx.arc(200, 200, 180, 0, 2 * Math.PI);
ctx.fill();

// Add inner circle
ctx.fillStyle = '#ffffff';
ctx.beginPath();
ctx.arc(200, 200, 160, 0, 2 * Math.PI);
ctx.fill();

// Add EYV text
ctx.fillStyle = '#502185';
ctx.font = 'bold 24px Arial';
ctx.textAlign = 'center';
ctx.fillText('EYV', 200, 210);

// Add supporting text
ctx.font = '14px Arial';
ctx.fillText('SUPPORTING', 200, 240);

// Convert to base64
const base64 = canvas.toDataURL('image/png');
console.log(base64);