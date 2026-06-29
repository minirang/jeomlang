// jeomlang npm 패키지를 Python에서 호출하기 위한 브릿지 스크립트

let JeomEngine;
try {
    JeomEngine = require('../core/engine.js');
} catch {
    JeomEngine = require('jeomlang');
}

const mode = process.argv[2]; // 'run' 또는 'check'
let code = ``;

process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
    code += chunk;
});

process.stdin.on('end', () => {
    try {
        if (mode === 'run') {
            const { JeomVM } = JeomEngine;
            const vm = new JeomVM({
                stdout: (s) => process.stdout.write(s),
                stderr: (s) => process.stderr.write(s),
            });
            vm.run(code)
                .then(() => process.exit(0))
                .catch((e) => {
                    if (e && e.exitCode !== undefined) process.exit(e.exitCode);
                    process.stderr.write(e.message || String(e));
                    process.exit(1);
                });

        } else if (mode === 'check') {
            const { tokenize, parse } = JeomEngine;
            const tokens = tokenize(code);
            const ast = parse(tokens);
            if (!ast.find(n => n.type === 'MAIN')) {
                process.stderr.write('main 블록(•·...⋮⋮)이 없습니다');
                process.exit(1);
            }
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
