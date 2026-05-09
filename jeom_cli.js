#!/usr/bin/env node

/**
 * jeom_cli.js — 점(Jeom) 언어 Node.js CLI
 *
 * 사용법:
 *   node jeom_cli.js run <file.jeom>
 *   node jeom_cli.js check <file.jeom>
 *   node jeom_cli.js encode "문자열"
 *   node jeom_cli.js encode-num <숫자>
 *   node jeom_cli.js decode <점코드>
 *   node jeom_cli.js tokens <file.jeom>
 *   node jeom_cli.js repl
 *   node jeom_cli.js new <file.jeom>
 *   node jeom_cli.js version
 *   node jeom_cli.js ops
 */

'use strict';

const fs = require('fs');
const path = require('path');
const rl = require('readline');

// jeom_engine.js 로드
const enginePath = path.join(__dirname, 'jeom_engine.js');
if (!fs.existsSync(enginePath)) {
    console.error('오류: jeom_engine.js 를 찾을 수 없습니다. 같은 디렉터리에 있어야 합니다.');
    process.exit(1);
}
const JeomEngine = require(enginePath);
const {
    encodeString,
    encodeNumber,
    decodeString,
    decodeNumber,
    tokenize,
    parse,
    JeomVM,
    JeomError,
    OP_TABLE,
    VERSION,
} = JeomEngine;

// ── 색상 ──────────────────────────────────────────────────────────────────────
const USE_COLOR = process.stdout.isTTY;
const clr = (t, c) => USE_COLOR ? `\x1b[${c}m${t}\x1b[0m` : t;
const bold = t => clr(t, '1');
const red = t => clr(t, '31');
const green = t => clr(t, '32');
const yellow = t => clr(t, '33');
const cyan = t => clr(t, '36');
const gray = t => clr(t, '90');
const magenta = t => clr(t, '35');

// ── VM 팩토리 (Node.js 환경) ──────────────────────────────────────────────────
function makeNodeVM(opts = {}) {
    const searchPaths = opts.searchPaths || ['.'];

    return new JeomVM({
        stdout: s => process.stdout.write(s),
        stderr: s => process.stderr.write(s),
        stdin: () => new Promise(resolve => {
            const iface = rl.createInterface({
                input: process.stdin,
                terminal: false
            });
            iface.once('line', line => {
                iface.close();
                resolve(line);
            });
            iface.once('close', () => resolve(''));
        }),
        readFile: async (filePath) => {
            for (const sp of searchPaths) {
                const full = path.isAbsolute(filePath) ?
                    filePath :
                    path.join(sp, filePath);
                if (fs.existsSync(full)) return fs.readFileSync(full, 'utf8');
            }
            throw new JeomError(`파일 없음: '${filePath}'`);
        },
        writeFile: async (filePath, content) => {
            fs.writeFileSync(filePath, content, 'utf8');
        },
        fileExists: async (filePath) => fs.existsSync(filePath),
        deleteFile: async (filePath) => fs.unlinkSync(filePath),
        listDir: async (dirPath) => fs.readdirSync(dirPath),
        makeDir: async (dirPath) => fs.mkdirSync(dirPath, {
            recursive: true
        }),
        execCmd: async (cmd) => {
            const {
                execSync
            } = require('child_process');
            try {
                return execSync(cmd, {
                    encoding: 'utf8',
                    stdio: ['pipe', 'pipe', 'pipe']
                });
            } catch (e) {
                return e.stdout || '';
            }
        },
        getEnv: key => process.env[key] || '',
        ...opts,
    });
}

// ── 실행 ──────────────────────────────────────────────────────────────────────
async function cmdRun(filePath, opts = {}) {
    if (!fs.existsSync(filePath)) {
        console.error(red(`파일 없음: ${filePath}`));
        process.exit(1);
    }
    const source = fs.readFileSync(filePath, 'utf8');
    const dir = path.dirname(path.resolve(filePath));
    const vm = makeNodeVM({
        searchPaths: [dir, '.', ...(opts.include || [])]
    });
    try {
        await vm.run(source);
    } catch (e) {
        if (e.exitCode !== undefined) process.exit(e.exitCode);
        console.error(red(`[런타임 오류] ${e.message}`));
        if (process.env.JEOM_DEBUG) console.error(e.stack);
        process.exit(1);
    }
}

// ── 문법 검사 ─────────────────────────────────────────────────────────────────
function cmdCheck(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(red(`파일 없음: ${filePath}`));
        process.exit(1);
    }
    const source = fs.readFileSync(filePath, 'utf8');
    try {
        const toks = tokenize(source);
        console.log(green('✓ 렉서 통과'));
        const ast = parse(toks);
        const fnCount = ast.filter(s => s.type === 'FUNCDEF').length;
        const mainNode = ast.find(s => s.type === 'MAIN');
        if (!mainNode) throw new JeomError('main 블록(•·...⋮⋮)이 없습니다');
        console.log(green('✓ 파서 통과'));
        console.log(`  ${gray('함수:')} ${fnCount}개  ${gray('main 문:')} ${mainNode.body.length}개`);
        console.log(`  ${gray('파일:')} ${filePath}`);
    } catch (e) {
        console.error(red(`✗ ${e.message}`));
        process.exit(1);
    }
}

// ── 토큰 목록 ─────────────────────────────────────────────────────────────────
function cmdTokens(filePath, limit = 200) {
    if (!fs.existsSync(filePath)) {
        console.error(red(`파일 없음: ${filePath}`));
        process.exit(1);
    }
    const source = fs.readFileSync(filePath, 'utf8');
    try {
        const toks = tokenize(source);
        console.log(bold(`토큰 목록: ${filePath}`));
        console.log(gray('─'.repeat(64)));
        toks.slice(0, limit).forEach((t, i) => {
            if (t.type === 'EOF') return;
            const opName = t.type === 'OP' ? (OP_TABLE[t.raw] || '(이름/변수)') : '';
            const rawShow = t.raw.length > 20 ? t.raw.slice(0, 20) + '…' : t.raw;
            console.log(
                `  ${gray(String(i).padStart(4))} ` +
                `${yellow(t.type.padEnd(8))} ` +
                `${cyan(JSON.stringify(rawShow)).padEnd(32)} ` +
                `${green(opName).padEnd(18)} ` +
                `${gray(`L${t.line}:C${t.col}`)}`
            );
        });
        if (toks.length > limit)
            console.log(gray(`  ... 총 ${toks.length}개 토큰 (처음 ${limit}개 표시)`));
    } catch (e) {
        console.error(red(`렉서 오류: ${e.message}`));
        process.exit(1);
    }
}

// ── AST 출력 ──────────────────────────────────────────────────────────────────
function cmdAst(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(red(`파일 없음: ${filePath}`));
        process.exit(1);
    }
    const source = fs.readFileSync(filePath, 'utf8');
    try {
        const ast = parse(tokenize(source));
        console.log(bold(`AST: ${filePath}`));
        console.log(gray('─'.repeat(64)));
        printNode(ast, 0);
    } catch (e) {
        console.error(red(`오류: ${e.message}`));
        process.exit(1);
    }
}

function printNode(node, depth) {
    const indent = '  '.repeat(depth);
    if (!node) {
        console.log(`${indent}${gray('null')}`);
        return;
    }
    if (Array.isArray(node)) {
        node.forEach(n => printNode(n, depth));
        return;
    }
    const t = node.type;
    if (t === 'NUM_LIT' || t === 'STR_LIT') {
        const v = t === 'STR_LIT' ? JSON.stringify(String(node.value).slice(0, 20)) : node.value;
        console.log(`${indent}${cyan(t)} ${green(String(v))}`);
    } else if (t === 'PUSH') {
        console.log(`${indent}${cyan('PUSH')}`);
        printNode(node.expr, depth + 1);
    } else if (t === 'VARSET') {
        console.log(`${indent}${cyan('VAR')} ${yellow(node.name)} =`);
        printNode(node.expr, depth + 1);
    } else if (t === 'GETVAR') {
        console.log(`${indent}${cyan('GET')} ${yellow(node.name)}`);
    } else if (t === 'FUNCDEF') {
        console.log(`${indent}${cyan('FUNC')} ${yellow(node.name)} ${gray(`(${node.args.join(', ')})`)}`);
    } else if (t === 'CALL') {
        console.log(`${indent}${cyan('CALL')} ${yellow(node.name)}`);
    } else if (t === 'INSTR') {
        console.log(`${indent}${magenta(node.op)}`);
    } else if (t === 'MAIN') {
        console.log(`${indent}${bold(cyan('MAIN'))}`);
        printNode(node.body, depth + 1);
    } else {
        console.log(`${indent}${cyan(t)}`);
    }
}

// ── REPL ──────────────────────────────────────────────────────────────────────
async function cmdRepl() {
    console.log(`
${bold(cyan('점(Jeom)'))} ${gray(`v${VERSION}`)} REPL
${gray('───────────────────────────────────────')}
${gray('점 유니코드 문자만으로 프로그래밍하는 난해 언어')}

${yellow('메타 명령:')}
  ${cyan('.help')}      도움말        ${cyan('.stack')}     스택 출력
  ${cyan('.env')}       변수 목록      ${cyan('.clear')}     초기화
  ${cyan('.enc "텍스트"')}  문자열 인코딩  ${cyan('.num 숫자')}   숫자 인코딩
  ${cyan('.quit')}      종료

${gray('코드 입력 후 Enter로 실행합니다.')}
${gray('───────────────────────────────────────')}
`);

    const iface = rl.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
    });

    // VM 상태 유지
    const vm = makeNodeVM();

    const prompt = () => {
        iface.question(
            `${cyan('jeom')}${gray(`[${vm.stack.length}]`)} › `,
            async line => {
                const s = line.trim();
                if (s === '.quit' || s === '.exit') {
                    console.log(gray('종료합니다.'));
                    iface.close();
                    return;
                }
                if (s === '.help') {
                    console.log(`\n${yellow('주요 토큰:')} · PRINT  ·· PRINTLN  ∘ VAR  ∘∘ GET  ⦁ PUSH`);
                    console.log(`  ⋅ ADD  ⋅⋅ SUB  ⋅⋅⋅ MUL  ⋅∘ DIV  ⋅∘∘ MOD`);
                    console.log(`  … IF  …· ELSE  ‥‥ WHILE  ‥ LOOP  ˙ FUNC  ˙˙˙ CALL\n`);
                } else if (s === '.stack') {
                    console.log(yellow('스택:'), vm.stack);
                } else if (s === '.env') {
                    const env = Object.fromEntries(
                        Object.entries(vm.env).filter(([, v]) => typeof v !== 'object' || !v.args)
                    );
                    console.log(yellow('변수:'), env);
                } else if (s === '.clear') {
                    vm.stack.length = 0;
                    vm.env = {};
                    console.log(gray('초기화됨'));
                } else if (s.startsWith('.enc ')) {
                    let t = s.slice(5).trim();
                    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) t = t.slice(1, -1);
                    console.log(cyan(encodeString(t)));
                } else if (s.startsWith('.num ')) {
                    const n = parseInt(s.slice(5));
                    if (isNaN(n)) console.log(red('숫자 오류'));
                    else console.log(cyan(encodeNumber(n)));
                } else if (s) {
                    // 코드 실행: •·...⋮⋮ 로 감싸기
                    const wrapped = `•·\n${s}\n⋮⋮`;
                    try {
                        const toks = tokenize(wrapped);
                        const ast = parse(toks);
                        // 새 함수 등록
                        ast.forEach(n => {
                            if (n.type === 'FUNCDEF') vm._registerFunc(n);
                        });
                        const main = ast.find(n => n.type === 'MAIN');
                        if (main) await vm._execStmts(main.body);
                        if (vm.stack.length)
                            console.log(green('→'), vm._display(vm.stack[vm.stack.length - 1]));
                    } catch (e) {
                        console.error(red(`[오류] ${e.message}`));
                    }
                }
                prompt();
            }
        );
    };

    iface.on('close', () => process.exit(0));
    prompt();
}

// ── 새 파일 ───────────────────────────────────────────────────────────────────
function cmdNew(filePath) {
    if (!filePath.endsWith('.jeom')) filePath += '.jeom';
    if (fs.existsSync(filePath)) {
        const ans = require('child_process').execSync(
            `read -p "파일이 존재합니다. 덮어쓰시겠습니까? [y/N] " ans && echo $ans`, {
                shell: '/bin/bash',
                encoding: 'utf8'
            }
        ).trim();
        if (ans.toLowerCase() !== 'y') {
            console.log(gray('취소됨'));
            return;
        }
    }
    const template =
        `◘ 점(Jeom) 언어 — Hello World 템플릿
◘ 파일 확장자: .jeom
◘ 점 유니코드 문자만으로 작성합니다

◘ 아래 문자열은 "Hello, Jeom!" 의 점 인코딩입니다
◘ 컴파일러의 .enc 명령으로 직접 인코딩할 수 있습니다

•·
  ${encodeString('Hello, Jeom!')}
  ··
⋮⋮
`;
    fs.writeFileSync(filePath, template, 'utf8');
    console.log(green(`✓ 생성됨: ${filePath}`));
}

// ── ops 목록 ──────────────────────────────────────────────────────────────────
function cmdOps() {
    console.log(bold('점(Jeom) 전체 명령 토큰'));
    console.log(gray('─'.repeat(50)));
    const groups = {};
    for (const [raw, name] of Object.entries(OP_TABLE)) {
        const prefix = name.split('_')[0];
        if (!groups[prefix]) groups[prefix] = [];
        groups[prefix].push([raw, name]);
    }
    for (const [g, items] of Object.entries(groups)) {
        console.log(`\n${yellow(g)}`);
        for (const [raw, name] of items)
            console.log(`  ${cyan(raw.padEnd(12))}  ${green(name)}`);
    }
}

// ── 메인 ──────────────────────────────────────────────────────────────────────
async function main() {
    const args = process.argv.slice(2);
    const cmd = args[0];

    if (!cmd || cmd === '--help' || cmd === '-h') {
        console.log(`
${bold(cyan('점(Jeom) 언어 CLI'))} ${gray(`v${VERSION}`)}

${yellow('사용법:')} node jeom_cli.js <명령> [옵션]

${yellow('명령:')}
  ${cyan('run')}       <file.jeom>        파일 실행
  ${cyan('check')}     <file.jeom>        문법 검사
  ${cyan('encode')}    "문자열"           문자열 → 점 인코딩
  ${cyan('encode-num')} <숫자>            숫자 → 점 인코딩
  ${cyan('decode')}    <점코드>           점 인코딩 디코딩
  ${cyan('tokens')}    <file.jeom>        토큰 목록 출력
  ${cyan('ast')}       <file.jeom>        AST 출력
  ${cyan('repl')}                         대화형 환경
  ${cyan('new')}       <file.jeom>        새 파일 생성
  ${cyan('ops')}                          전체 명령 토큰 목록
  ${cyan('version')}                      버전 정보

${yellow('예제:')}
  node jeom_cli.js run hello.jeom
  node jeom_cli.js encode "안녕하세요"
  node jeom_cli.js repl
`);
        return;
    }

    switch (cmd) {
        case 'run': {
            if (!args[1]) {
                console.error(red('파일 경로가 필요합니다'));
                process.exit(1);
            }
            const include = [];
            let i = 2;
            while (i < args.length) {
                if (args[i] === '-I' || args[i] === '--include') {
                    include.push(args[++i]);
                }
                i++;
            }
            await cmdRun(args[1], {
                include
            });
            break;
        }
        case 'check':
            if (!args[1]) {
                console.error(red('파일 경로가 필요합니다'));
                process.exit(1);
            }
            cmdCheck(args[1]);
            break;
        case 'encode': {
            if (!args[1]) {
                console.error(red('문자열이 필요합니다'));
                process.exit(1);
            }
            const enc = encodeString(args[1]);
            console.log(`${yellow('원문:')} ${args[1]}`);
            console.log(`${cyan('인코딩:')} ${enc}`);
            break;
        }
        case 'encode-num': {
            const n = parseInt(args[1]);
            if (isNaN(n)) {
                console.error(red('정수가 필요합니다'));
                process.exit(1);
            }
            console.log(`${yellow('숫자:')} ${n}  ${gray(`(binary: ${n.toString(2)})`)} `);
            console.log(`${cyan('인코딩:')} ${encodeNumber(n)}`);
            break;
        }
        case 'decode': {
            const code = (args[1] || '').trim();
            if (code.startsWith('●')) {
                const d = decodeString(code);
                console.log(d !== null ? `${yellow('문자열:')} ${JSON.stringify(d)}` : red('디코딩 실패'));
            } else if (code.startsWith('•')) {
                const d = decodeNumber(code);
                console.log(d !== null ? `${yellow('숫자:')} ${d}` : red('디코딩 실패'));
            } else {
                const op = OP_TABLE[code];
                console.log(op ? `${yellow('명령:')} ${green(op)}` : gray('알 수 없는 토큰'));
            }
            break;
        }
        case 'tokens': {
            if (!args[1]) {
                console.error(red('파일 경로가 필요합니다'));
                process.exit(1);
            }
            const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 200;
            cmdTokens(args[1], limit);
            break;
        }
        case 'ast':
            if (!args[1]) {
                console.error(red('파일 경로가 필요합니다'));
                process.exit(1);
            }
            cmdAst(args[1]);
            break;
        case 'repl':
            await cmdRepl();
            break;
        case 'new':
            if (!args[1]) {
                console.error(red('파일 이름이 필요합니다'));
                process.exit(1);
            }
            cmdNew(args[1]);
            break;
        case 'ops':
            cmdOps();
            break;
        case 'version':
            console.log(`${bold(cyan('점(Jeom)'))} ${green(`v${VERSION}`)}`);
            console.log(gray('점 유니코드 문자만으로 프로그래밍하는 난해 언어'));
            console.log(gray(`Node.js ${process.version} · ${process.platform}`));
            break;
        default:
            console.error(red(`알 수 없는 명령: ${cmd}`));
            console.error(gray('도움말: node jeom_cli.js --help'));
            process.exit(1);
    }
}

main().catch(e => {
    console.error(red(`치명적 오류: ${e.message}`));
    if (process.env.JEOM_DEBUG) console.error(e.stack);
    process.exit(1);
});
