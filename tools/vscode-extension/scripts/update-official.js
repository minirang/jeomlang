#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Vendored copy of jeomlang core/ + stdlib/ for standalone extension installs.
// See official/README.md and ABSORPTION.md.
const OFFICIAL_DIR = path.join(__dirname, '..', 'official');
const VERSION_FILE = path.join(OFFICIAL_DIR, '.version');

const FILES = [
    { name: 'cli.js', localPath: path.join(__dirname, '..', '..', '..', 'core', 'cli.js'), url: 'https://jeomlang.vercel.app/core/cli.js' },
    { name: 'engine.js', localPath: path.join(__dirname, '..', '..', '..', 'core', 'engine.js'), url: 'https://jeomlang.vercel.app/core/engine.js' },
    { name: 'std.jeom', localPath: path.join(__dirname, '..', '..', '..', 'stdlib', 'std.jeom'), url: 'https://jeomlang.vercel.app/stdlib/std.jeom' }
];

function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
                return;
            }

            const file = fs.createWriteStream(filepath);
            res.pipe(file);

            file.on('finish', () => {
                file.close();
                resolve();
            });

            file.on('error', (err) => {
                fs.unlink(filepath, () => { });
                reject(err);
            });
        }).on('error', reject);
    });
}

async function updateOfficialFiles() {
    if (!fs.existsSync(OFFICIAL_DIR)) {
        fs.mkdirSync(OFFICIAL_DIR, { recursive: true });
    }

    console.log('📥 점랭 공식 파일 업데이트 시작...\n');

    for (const file of FILES) {
        const filepath = path.join(OFFICIAL_DIR, file.name);
        // 우선 로컬 core/ 또는 stdlib/에서 복사 시도
        let copied = false;
        if (file.localPath && fs.existsSync(file.localPath)) {
            fs.copyFileSync(file.localPath, filepath);
            console.log(`📁 ${file.name} 복사 완료 (로컬): ${file.localPath}`);
            copied = true;
        }
        if (copied) continue;

        // 로컬에 없으면 원격에서 다운로드
        try {
            console.log(`⬇️  ${file.name} 다운로드 중...`);
            await downloadFile(file.url, filepath);
            console.log(`✅ ${file.name} 완료\n`);
        } catch (err) {
            console.error(`❌ ${file.name} 실패: ${err.message}\n`);
            process.exit(1);
        }
    }

    const timestamp = new Date().toISOString();
    fs.writeFileSync(VERSION_FILE, timestamp);

    console.log(`✨ 모든 파일이 성공적으로 업데이트되었습니다!`);
    console.log(`📅 업데이트 시간: ${timestamp}`);
}

updateOfficialFiles().catch((err) => {
    console.error('오류:', err);
    process.exit(1);
});
