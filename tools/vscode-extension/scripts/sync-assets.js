const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const sourceIcon = path.join(repoRoot, '..', '..', 'assets', 'img', 'icon.png');
const targetDir = path.join(repoRoot, 'assets');
const targetIcon = path.join(targetDir, 'icon.png');

if (!fs.existsSync(sourceIcon)) {
    console.error(`Source icon not found: ${sourceIcon}`);
    process.exit(1);
}

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

fs.copyFileSync(sourceIcon, targetIcon);
console.log(`Copied external asset to extension: ${targetIcon}`);
