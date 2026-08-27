interface JeomEngineType {
    encodeString: (s: string) => string;
    encodeNumber: (n: number) => string;
    encodeFloat: (n: number) => string;
    decodeString: (s: string) => string | null;
    decodeNumber: (s: string) => number | null;
    tokenize: (code: string) => any[];
    parse: (tokens: any[]) => any[];
    JeomVM: any;
    JeomError: any;
    JeomExit: any;
    OP_TABLE: Record<string, string>;
}

declare const JeomEngine: JeomEngineType;

interface Window {
    runCode: () => Promise<void>;
    submitInput: () => void;
    checkCode: () => void;
    clearOutput: () => void;
    downloadCode: () => void;
    openFile: (e: any) => void;
    switchTab: (name: string) => void;
    encStr: () => void;
    encNum: () => void;
    encFloat: () => void;
    doDecode: () => void;
    insertEnc: (type: "s" | "n" | "f") => void;
    loadEx: (name: string) => void;
    undoCode: () => void;
    redoCode: () => void;
}

(function () {
    "use strict";

    const {
        encodeString,
        encodeNumber,
        encodeFloat,
        decodeString,
        decodeNumber,
        tokenize,
        parse,
        JeomVM,
        JeomError,
        JeomExit,
        OP_TABLE,
    } = JeomEngine;

    function makeExamples(): Record<string, string> {
        const S = encodeString,
            N = encodeNumber;
        return {
            hello: `◘ Hello, Jeom!\n•·\n  ${S("Hello, Jeom!")}\n  ··\n⋮⋮`,
            vars: `◘ 변수와 연산\n•·\n  ∘ · ${N(10)}\n  ∘ ·· ${N(3)}\n  ∘∘ ·\n  ∘∘ ··\n  ⋅\n  ··\n  ∘∘ ·\n  ∘∘ ··\n  ⋅⋅\n  ··\n  ∘∘ ·\n  ∘∘ ··\n  ⋅⋅⋅\n  ··\n⋮⋮`,
            func: `◘ 함수 정의와 호출\n˙ ·∘·∘\n˙∘ ·\n˙∘ ··\n⋮\n  ∘∘ ·\n  ∘∘ ··\n  ⋅\n  ˙˙\n⋮⋮\n\n•·\n  ${N(7)}\n  ${N(5)}\n  ˙˙˙ ·∘·∘\n  ··\n⋮⋮`,
            loop: `◘ 1부터 5까지 출력\n•·\n  ∘ · ${N(1)}\n  ‥‥\n  ⋮\n    ∘∘ ·\n    ${N(6)}\n    ⋅‧‧‧\n  ⋮⋮\n  ⋮\n    ∘∘ ·\n    ··\n    ∘∘ ·\n    ${N(1)}\n    ⋅\n    ∘⋅ ·\n  ⋮⋮\n⋮⋮`,
            array: `◘ 배열 조작\n•·\n  ${N(10)}\n  ${N(20)}\n  ${N(30)}\n  ${N(3)}\n  ◦\n  ∘⋅ ·\n  ∘∘ ·\n  ··\n  ∘∘ ·\n  ${N(1)}\n  ◦◦\n  ··\n  ∘∘ ·\n  ${N(99)}\n  ◦∘\n  ··\n  ∘∘ ·\n  ⸳‧\n  ··\n⋮⋮`,
            trycatch: `◘ 오류 처리\n•·\n  ‥·\n  ⋮\n    ${N(10)}\n    ${N(0)}\n    ⋅∘\n    ··\n  ⋮⋮\n  ‥··\n  ⋮\n    ∘⋅ ·∘\n    ${S("오류: ")}\n    ∘∘ ·∘\n    ⋅\n    ··\n  ⋮⋮\n  ‥·˙\n  ⋮\n    ${S("항상 실행")}\n    ··\n  ⋮⋮\n⋮⋮`,
            input: `◘ 입력 받기\n•·\n  ${S("이름: ")}\n  ·\n  ·˙\n  ∘⋅ ·\n  ${S("안녕, ")}\n  ∘∘ ·\n  ⋅\n  ${S("!")}\n  ⋅\n  ··\n⋮⋮`,
            dict: `◘ 딕셔너리\n•·\n  ${S("name")} ${S("jeom")}\n  ${S("ver")} ${N(1)}\n  ${N(2)}\n  ◦‧\n  ∘⋅ ·\n  ∘∘ ·\n  ··\n  ∘∘ ·\n  ${S("name")}\n  ◦‧‧\n  ··\n⋮⋮`,
        };
    }

    const EXAMPLES = makeExamples();

    interface RefGroup {
        label: string;
        items: [string, string][];
    }

    const REF_GROUPS: RefGroup[] = [
        {
            label: "I/O",
            items: [
                ["·", "PRINT"],
                ["··", "PRINTLN"],
                ["·˙", "INPUT"],
                ["·˙˙", "INPUTN"],
                ["·∘", "ERR"],
            ],
        },
        {
            label: "변수",
            items: [
                ["∘", "VAR"],
                ["∘∘", "GET"],
                ["∘⋅", "STORE"],
                ["∘∘∘", "DEL"],
            ],
        },
        {
            label: "스택",
            items: [
                ["⦁", "PUSH"],
                ["⦁⦁", "POP"],
                ["⦁⦁⦁", "SWAP"],
                ["⦁∘⦁", "DUP"],
                ["⦁∘", "PEEK"],
            ],
        },
        {
            label: "산술",
            items: [
                ["⋅", "ADD"],
                ["⋅⋅", "SUB"],
                ["⋅⋅⋅", "MUL"],
                ["⋅∘", "DIV"],
                ["⋅∘∘", "MOD"],
                ["⋅∘∘∘", "POW"],
            ],
        },
        {
            label: "비교",
            items: [
                ["⋅‧", "EQ"],
                ["⋅‧‧", "NEQ"],
                ["⋅‧‧‧", "LT"],
                ["⋅‧∘", "GT"],
                ["⋅‧∘∘", "LTE"],
                ["⋅‧∘∘∘", "GTE"],
            ],
        },
        {
            label: "논리",
            items: [
                ["⋅⦁", "AND"],
                ["⋅⦁⦁", "OR"],
                ["⋅⦁⦁⦁", "NOT"],
                ["⋅⦁∘", "XOR"],
            ],
        },
        {
            label: "흐름",
            items: [
                ["…", "IF"],
                ["…·", "ELSE"],
                ["‥", "LOOP"],
                ["‥‥", "WHILE"],
                ["‥∘", "BREAK"],
                ["‥∘∘", "CONT"],
            ],
        },
        {
            label: "블록",
            items: [
                ["⋮", "BLOCK"],
                ["⋮⋮", "END"],
                ["⋯·", "LABEL"],
                ["⋯", "GOTO"],
            ],
        },
        {
            label: "함수",
            items: [
                ["˙", "FUNC"],
                ["˙˙", "RET"],
                ["˙˙˙", "CALL"],
                ["˙∘", "ARG"],
                ["˙⦁", "LAMBDA"],
                ["˙⋅", "CURRY"],
            ],
        },
        {
            label: "배열",
            items: [
                ["◦", "ARR"],
                ["◦◦", "IDX"],
                ["◦◦◦", "IDXS"],
                ["◦∘", "APP"],
                ["◦∘∘", "SLICE"],
                ["◦⋅", "MAP"],
                ["◦⋅⋅", "FILTER"],
                ["◦⋅⋅⋅", "REDUCE"],
            ],
        },
        {
            label: "딕셔너리",
            items: [
                ["◦‧", "DICT"],
                ["◦‧‧", "DGET"],
                ["◦‧‧‧", "DSET"],
                ["◦⦁", "KEYS"],
                ["◦⦁⦁", "VALS"],
            ],
        },
        {
            label: "타입",
            items: [
                ["⸳", "INT"],
                ["⸳⸳", "FLOAT"],
                ["⸳⸳⸳", "STR"],
                ["⸳∘", "BOOL"],
                ["⸳⦁", "TYPE"],
                ["⸳‧", "LEN"],
            ],
        },
        {
            label: "오류",
            items: [
                ["‥·", "TRY"],
                ["‥··", "CATCH"],
                ["‥·˙", "FINALLY"],
                ["‥·∘", "THROW"],
                ["‥·⦁", "ASSERT"],
            ],
        },
        {
            label: "시스템",
            items: [
                ["⋮∘", "EXIT"],
                ["⋮⦁", "DEBUG"],
                ["⋮‧", "RAND"],
                ["⋮⋅", "TIME"],
                ["⋮‧‧", "HASH"],
                ["⋮·⦁", "SLEEP"],
                ["⋯·⦁", "IMPORT"],
            ],
        },
    ];

    const editor = document.getElementById("editor") as HTMLTextAreaElement;
    const lineNums = document.getElementById("lineNums") as HTMLDivElement;
    const outputEl = document.getElementById("output") as HTMLDivElement;
    const sDot = document.getElementById("sDot") as HTMLDivElement;
    const sTxt = document.getElementById("sTxt") as HTMLSpanElement;

    let inputResolve: ((value: string) => void) | null = null;
    let lastSEnc = "",
        lastNEnc = "",
        lastFEnc = "";

    const MAX_HISTORY = 200;
    let history: string[] = [""];
    let historyIdx = 0;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let isUndoRedo = false;

    function pushHistory(value: string) {
        if (isUndoRedo) return;
        history = history.slice(0, historyIdx + 1);
        if (history[historyIdx] === value) return;
        history.push(value);
        if (history.length > MAX_HISTORY) history.shift();
        historyIdx = history.length - 1;
    }

    function undoCode() {
        if (historyIdx <= 0) return;
        historyIdx--;
        isUndoRedo = true;
        editor.value = history[historyIdx];
        isUndoRedo = false;
        updateLN();
    }

    function redoCode() {
        if (historyIdx >= history.length - 1) return;
        historyIdx++;
        isUndoRedo = true;
        editor.value = history[historyIdx];
        isUndoRedo = false;
        updateLN();
    }

    window.undoCode = undoCode;
    window.redoCode = redoCode;

    function setStatus(msg: string, type?: "ok" | "err" | "run" | "준비") {
        sDot.className =
            "s-dot" +
            (type === "ok" ? " ok" : type === "err" ? " err" : type === "run" ? " run" : "");
        sTxt.textContent = msg;
    }

    function appendOut(text: string, cls?: string) {
        const sp = document.createElement("span");
        sp.className = cls || "o-out";
        sp.textContent = text;
        outputEl.appendChild(sp);
        const pv = document.getElementById("output-tab") as HTMLDivElement;
        pv.scrollTop = pv.scrollHeight;
    }

    async function runCode() {
        const src = editor.value;
        if (!src.trim()) return;
        switchTab("output");
        outputEl.innerHTML = "";
        appendOut("▶ 실행 시작\n", "o-info");
        setStatus("실행 중...", "run");

        const vm = new JeomVM({
            stdout: (s: string) => appendOut(s, "o-out"),
            stderr: (s: string) => appendOut(s, "o-err"),
            stdin: () =>
                new Promise<string>((res) => {
                    inputResolve = res;
                    (document.getElementById("inputFld") as HTMLInputElement).value = "";
                    (document.getElementById("inputOv") as HTMLDivElement).classList.add("show");
                    setTimeout(
                        () => (document.getElementById("inputFld") as HTMLInputElement).focus(),
                        40,
                    );
                }),
        });

        try {
            await vm.run(src);
            appendOut("\n◘ 정상 종료\n", "o-ok");
            setStatus("완료", "ok");
        } catch (e: any) {
            if (e && e.name === "JeomExit") {
                appendOut("\n◘ EXIT(" + e.exitCode + ")\n", e.exitCode === 0 ? "o-ok" : "o-fail");
                setStatus(e.exitCode === 0 ? "완료" : "오류", e.exitCode === 0 ? "ok" : "err");
            } else {
                appendOut("\n✗ " + (e.message || String(e)) + "\n", "o-fail");
                setStatus("오류", "err");
            }
        }
    }
    window.runCode = runCode;

    function submitInput() {
        const val = (document.getElementById("inputFld") as HTMLInputElement).value;
        (document.getElementById("inputOv") as HTMLDivElement).classList.remove("show");
        appendOut(val + "\n", "o-info");
        if (inputResolve) {
            inputResolve(val);
            inputResolve = null;
        }
    }
    window.submitInput = submitInput;

    (document.getElementById("inputFld") as HTMLInputElement).addEventListener("keydown", (e) => {
        if (e.key === "Enter") submitInput();
    });

    function checkCode() {
        const src = editor.value;
        switchTab("output");
        outputEl.innerHTML = "";
        try {
            tokenize(src);
            appendOut("✓ 렉서 통과\n", "o-ok");
            const ast = parse(tokenize(src));
            if (!ast.find((n) => n.type === "MAIN"))
                throw new JeomError("main 블록(•·...⋮⋮)이 없습니다");
            appendOut("✓ 파서 통과\n", "o-ok");
            const fnCount = ast.filter((n) => n.type === "FUNCDEF").length;
            appendOut("  함수 " + fnCount + "개 정의됨\n", "o-info");
            setStatus("검사 통과", "ok");
        } catch (e: any) {
            appendOut("✗ " + (e.message || String(e)) + "\n", "o-fail");
            setStatus("오류 발견", "err");
        }
    }
    window.checkCode = checkCode;

    function clearOutput() {
        outputEl.innerHTML = '<span class="o-info">◘ 출력 지워짐\n</span>';
        setStatus("준비");
    }
    window.clearOutput = clearOutput;

    function downloadCode() {
        let fn = (document.getElementById("filename") as HTMLInputElement).value || "main.jeom";
        if (!fn.endsWith(".jeom")) fn += ".jeom";
        const blob = new Blob([editor.value], { type: "text/plain;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fn;
        a.click();
        toast("저장됨: " + fn);
    }
    window.downloadCode = downloadCode;

    function openFile(e: any) {
        const f = e.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = (ev) => {
            if (ev.target) {
                editor.value = ev.target.result as string;
                pushHistory(editor.value);
                updateLN();
            }
        };
        r.readAsText(f, "utf-8");
        (document.getElementById("filename") as HTMLInputElement).value = f.name;
    }
    window.openFile = openFile;

    function switchTab(name: string) {
        const names = ["output", "encoder", "tokens"];
        document
            .querySelectorAll(".tab")
            .forEach((t, i) => t.classList.toggle("active", names[i] === name));
        document.querySelectorAll(".pview").forEach((v) => v.classList.remove("active"));
        (document.getElementById(name + "-tab") as HTMLElement).classList.add("active");
    }
    window.switchTab = switchTab;

    function updateLN() {
        const lines = editor.value.split("\n");
        lineNums.innerHTML = lines.map((_, i) => "<span>" + (i + 1) + "</span>").join("");
        (document.getElementById("sChars") as HTMLElement).textContent = String(
            editor.value.length,
        );
    }

    function updateCursor() {
        const p = editor.selectionStart,
            v = editor.value;
        const before = v.substring(0, p);
        (document.getElementById("sLn") as HTMLElement).textContent = String(
            before.split("\n").length,
        );
        (document.getElementById("sCol") as HTMLElement).textContent = String(
            p - before.lastIndexOf("\n"),
        );
    }

    editor.addEventListener("input", () => {
        updateLN();
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => pushHistory(editor.value), 300);
    });
    editor.addEventListener("scroll", () => {
        lineNums.scrollTop = editor.scrollTop;
    });
    editor.addEventListener("click", updateCursor);
    editor.addEventListener("keyup", updateCursor);

    editor.addEventListener("keydown", (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "z") {
            e.preventDefault();
            if (debounceTimer) {
                clearTimeout(debounceTimer);
                debounceTimer = null;
                pushHistory(editor.value);
            }
            undoCode();
            return;
        }

        if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
            e.preventDefault();
            redoCode();
            return;
        }
        if (e.key === "Tab") {
            e.preventDefault();
            const s = editor.selectionStart,
                end = editor.selectionEnd;
            editor.value = editor.value.substring(0, s) + "  " + editor.value.substring(end);
            editor.selectionStart = editor.selectionEnd = s + 2;
            updateLN();
        }
        if (e.key === "F5" || ((e.ctrlKey || e.metaKey) && e.key === "Enter")) {
            e.preventDefault();
            runCode();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
            e.preventDefault();
            downloadCode();
        }
    });

    function encStr() {
        const v = (document.getElementById("sEncIn") as HTMLInputElement).value;
        const el = document.getElementById("sEncOut") as HTMLElement;
        if (!v) {
            el.innerHTML = '<span style="color:var(--text3)">결과</span>';
            lastSEnc = "";
            return;
        }
        lastSEnc = encodeString(v);
        el.textContent = lastSEnc;
    }
    window.encStr = encStr;

    function encNum() {
        const v = parseInt((document.getElementById("nEncIn") as HTMLInputElement).value, 10);
        const el = document.getElementById("nEncOut") as HTMLElement;
        if (isNaN(v)) {
            el.innerHTML = '<span style="color:var(--text3)">결과</span>';
            lastNEnc = "";
            return;
        }
        lastNEnc = encodeNumber(v);
        el.textContent = lastNEnc;
    }
    window.encNum = encNum;

    function encFloat() {
        const v = parseFloat((document.getElementById("fEncIn") as HTMLInputElement).value);
        const el = document.getElementById("fEncOut") as HTMLElement;
        if (isNaN(v)) {
            el.innerHTML = '<span style="color:var(--text3)">결과</span>';
            lastFEnc = "";
            return;
        }
        lastFEnc = encodeFloat(v);
        el.textContent = lastFEnc;
    }
    window.encFloat = encFloat;

    function doDecode() {
        const v = (document.getElementById("decIn") as HTMLInputElement).value.trim();
        const el = document.getElementById("decOut") as HTMLElement;
        if (v.startsWith("●")) {
            const d = decodeString(v);
            el.textContent = d !== null ? '"' + d + '"' : "디코딩 실패";
        } else if (v.startsWith("•")) {
            const d = decodeNumber(v);
            el.textContent = d !== null ? String(d) : "디코딩 실패";
        } else {
            const op = OP_TABLE[v];
            el.textContent = op ? "OP: " + op : "● 또는 • 로 시작해야 합니다";
        }
    }
    window.doDecode = doDecode;

    function insertEnc(type: "s" | "n" | "f") {
        const code = type === "s" ? lastSEnc : type === "f" ? lastFEnc : lastNEnc;
        if (!code) return;
        insertToken(code);
        toast("에디터에 삽입됨");
    }
    window.insertEnc = insertEnc;

    function toast(msg: string) {
        const el = document.getElementById("toast") as HTMLElement;
        el.textContent = msg;
        el.classList.add("show");
        setTimeout(() => el.classList.remove("show"), 1800);
    }

    function insertToken(tok: string) {
        const s = editor.selectionStart,
            end = editor.selectionEnd;
        editor.value = editor.value.substring(0, s) + tok + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = s + tok.length;
        editor.focus();
        updateLN();
        pushHistory(editor.value);
    }

    function buildSidebar() {
        const list = document.getElementById("refList") as HTMLElement;
        REF_GROUPS.forEach((g) => {
            const sec = document.createElement("div");
            sec.className = "ref-section";
            sec.textContent = g.label;
            list.appendChild(sec);
            g.items.forEach(([tok, name]) => {
                const row = document.createElement("div");
                row.className = "ref-item";
                row.innerHTML =
                    '<span class="ref-tok">' +
                    tok +
                    '</span><span class="ref-name">' +
                    name +
                    "</span>";
                row.addEventListener("click", () => insertToken(tok));
                list.appendChild(row);
            });
        });
    }

    function buildTokenGrid() {
        const grid = document.getElementById("tokGrid") as HTMLElement;
        REF_GROUPS.forEach((g) => {
            g.items.forEach(([tok, name]) => {
                const card = document.createElement("div");
                card.className = "tok-card";
                card.innerHTML =
                    '<span class="tc-sym">' +
                    tok +
                    '</span><span class="tc-name">' +
                    name +
                    "</span>";
                card.addEventListener("click", () => {
                    insertToken(tok);
                    toast(tok + " 삽입됨");
                });
                grid.appendChild(card);
            });
        });
    }

    function loadEx(name: string) {
        editor.value = EXAMPLES[name] || "";
        pushHistory(editor.value);
        updateLN();
        setStatus("예제 로드됨");
    }
    window.loadEx = loadEx;

    buildSidebar();
    buildTokenGrid();
    loadEx("hello");
    updateLN();
    setStatus("준비", "준비");
})();
