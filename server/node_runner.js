// jeomlang npm 패키지를 Python에서 호출하기 위한 브릿지 스크립트
// 실제 패키지 API에 맞게 함수명을 수정해주세요

const jeomlang = require('jeomlang');

const mode = process.argv[2]; // 'run' 또는 'check'
let code = '';

process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
    code += chunk;
});

process.stdin.on('end', () => {
    try {
        if (mode === 'run') {
            // TODO: 실제 jeomlang API 함수명으로 교체
            const output = jeomlang.run(code);
            process.stdout.write(String(output ?? ''));
            process.exit(0);

        } else if (mode === 'check') {
            // TODO: 실제 jeomlang API 함수명으로 교체
            // parse만 하고 실행은 안 함
            jeomlang.parse(code);
            process.exit(0);

        } else {
            process.stderr.write(`알 수 없는 모드: ${mode}`);
            process.exit(1);
        }
    } catch (e) {
        process.stderr.write(e.message || String(e));
        process.exit(1);
    }
});
