// Script to generate favicon sizes from icon-512.png
// Run: node generate-icons.js

const fs = require('fs');
const path = require('path');

// Check if sharp is available, if not use canvas or provide instructions
async function generateIcons() {
    const sourceIcon = path.join(__dirname, 'public', 'icon-512.png');
    
    if (!fs.existsSync(sourceIcon)) {
        console.error('Error: icon-512.png not found in public folder');
        process.exit(1);
    }

    try {
        // Try using sharp
        const sharp = require('sharp');
        
        const sizes = [
            { name: 'icon-192.png', size: 192 },
            { name: 'apple-touch-icon.png', size: 180 },
            { name: 'favicon-32x32.png', size: 32 },
            { name: 'favicon-16x16.png', size: 16 }
        ];

        for (const { name, size } of sizes) {
            await sharp(sourceIcon)
                .resize(size, size)
                .png()
                .toFile(path.join(__dirname, 'public', name));
            console.log(`Generated ${name} (${size}x${size})`);
        }

        console.log('\nAll icons generated successfully!');
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            console.log('Sharp not installed. Installing...');
            const { execSync } = require('child_process');
            execSync('npm install sharp --save-dev', { stdio: 'inherit' });
            console.log('Sharp installed. Please run this script again.');
        } else {
            throw err;
        }
    }
}

generateIcons();
