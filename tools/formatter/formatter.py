#!/usr/bin/env python3
"""
formatter — 언어 코드 포맷터

JS 엔진(engine.js)으로 파싱 후 Python이 포맷 출력.
node.js 가 PATH에 있어야 합니다.

사용법:
    python3 formatter.py hello.jeom              # hello.fmt.jeom 생성
    python3 formatter.py hello.jeom -r           # 포맷 후 원본 삭제
    python3 formatter.py hello.jeom -o out.jeom  # 출력 경로 직접 지정
    python3 formatter.py hello.jeom --check      # 포맷 필요 여부만 확인
    python3 formatter.py *.jeom                  # 여러 파일 한번에

포맷 규칙:
    1. 들여쓰기: ⋮ 블록마다 2스페이스 (--indent N 으로 변경)
    2. 같은 논리 줄의 토큰은 스페이스 1개로 구분
    3. ⋮ BLOCK  — 독립 줄, 이후 depth +1
    4. ⋮⋮ END / …· ELSE / …‥ ELIF / ‥·· CATCH / ‥·˙ FINALLY — depth -1 후 독립 줄
    5. 주석(◘) — 독립 줄, 텍스트 앞 스페이스 1개 정규화
    6. 함수 정의(˙ <이름>), 인자(˙∘ <이름>) — 각각 독립 줄
    7. VAR(∘ <이름> <값>), GET(∘∘ <이름>), STORE(∘⋅ <이름>), DEL(∘∘∘ <이름>) — 독립 줄
    8. IF/WHILE/LOOP/TRY/CALL/RET 등 — 독립 줄
    9. MAIN marker(•·) — 앞에 빈 줄 1개, 이후 depth +1
    10. 연속 빈 줄 2개 이상 → 1개
    11. 후행 공백 제거, 파일 끝 개행 보장
"""

from __future__ import annotations
import sys, os, json, subprocess, argparse, shutil
from typing import Dict, List, Optional, Tuple

COMMENT_CHAR = "\u25d8"
MAIN_RAW = "\u2022\u00b7"
BLOCK_OPEN = "\u22ee"
FUNC_DEF = "\u02d9"
FUNC_ARG = "\u02d9\u2218"
VAR_OP = "\u2218"
GET_OP = "\u2218\u2218"
STORE_OP = "\u2218\u22c5"
DEL_OP = "\u2218\u2218\u2218"

BLOCK_END_OPS = {
    "\u22ee\u22ee",
    "\u2026\u00b7",
    "\u2026\u2025",
    "\u2025\u00b7\u00b7",
    "\u2025\u00b7\u02d9",
}

NEWLINE_OPS = {
    "\u2026",
    "\u2025\u2025",
    "\u2025",
    "\u2025\u00b7",
    "\u2025\u00b7\u2218",
    "\u2025\u00b7\u2981",
    "\u02d9\u02d9\u02d9",
    "\u02d9\u02d9",
    "\u2025\u2218",
    "\u2025\u2218\u2218",
    "\u22ef",
    "\u22ef\u00b7",
    "\u00b7",
    "\u00b7\u00b7",
    "\u00b7\u2218",
    "\u22ee\u2218",
    "\u22ef\u00b7\u2981",
}

NEWLINE_OPS_WITH_NAME = {
    "\u02d9\u02d9\u02d9",
    "\u22ef",
    "\u22ef\u00b7",
}

_JS = r"""
'use strict';
const E = require(process.env._JEOM_ENGINE);
let src = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => { src += d; });
process.stdin.on('end', () => {
  const COMMENT = E.C.COMMENT;
  const comments = {};
  src.split('\n').forEach((line, i) => {
    const idx = line.indexOf(COMMENT);
    if (idx !== -1)
      comments[String(i + 1)] = { col: idx + 1, text: line.slice(idx).trimEnd() };
  });
  try {
    const tokens = E.tokenize(src)
      .filter(t => t.type !== 'EOF')
      .map(t => ({ type: t.type, raw: t.raw, line: t.line, col: t.col }));
    process.stdout.write(JSON.stringify({ ok: true, tokens, comments }));
  } catch (e) {
    process.stdout.write(JSON.stringify({ ok: false, error: e.message }));
  }
});
"""


def _find_engine(script_dir: str) -> Optional[str]:
    for c in [
        os.path.join(script_dir, "engine.js"),
        os.path.join(script_dir, "..", "engine.js"),
        os.path.join(os.getcwd(), "engine.js"),
    ]:
        p = os.path.abspath(c)
        if os.path.exists(p):
            return p
    return None


def parse_with_js(source: str, engine_path: str) -> Tuple[bool, dict]:
    node = shutil.which("node") or shutil.which("nodejs")
    if not node:
        return False, {
            "error": "node.js 가 PATH에 없습니다. https://nodejs.org 에서 설치하세요."
        }
    try:
        r = subprocess.run(
            [node, "-e", _JS],
            input=source,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=15,
            env={**os.environ, "_JEOM_ENGINE": engine_path},
        )
    except subprocess.TimeoutExpired:
        return False, {"error": "JS 파서 타임아웃 (15초 초과)"}
    except Exception as e:
        return False, {"error": f"JS 파서 실행 오류: {e}"}

    stdout = r.stdout.strip()
    if not stdout:
        return False, {"error": f"JS 파서 출력 없음. stderr: {r.stderr.strip()[:200]}"}
    try:
        data = json.loads(stdout)
    except json.JSONDecodeError as e:
        return False, {"error": f"JS 출력 파싱 실패: {e} | stdout={stdout[:100]}"}
    if not data.get("ok"):
        return False, {"error": data.get("error", "알 수 없는 파서 오류")}
    return True, data


class Formatter:
    def __init__(self, tokens: List[dict], comments: Dict[str, dict], indent: int = 2):
        self.tokens = tokens
        self.comments = {int(k): v for k, v in comments.items()}
        self.INDENT = " " * indent
        self.pos = 0
        self.depth = 0
        self._lines: List[str] = []
        self._cur: List[str] = []
        self._seen_comments: set = set()

    def _peek(self, offset: int = 0) -> Optional[dict]:
        i = self.pos + offset
        return self.tokens[i] if i < len(self.tokens) else None

    def _adv(self) -> Optional[dict]:
        t = self._peek()
        self.pos += 1
        return t

    def _ind(self) -> str:
        return self.INDENT * self.depth

    def _flush(self):
        if self._cur:
            self._lines.append((self._ind() + " ".join(self._cur)).rstrip())
            self._cur = []

    def _blank(self):
        if self._lines and self._lines[-1] != "":
            self._lines.append("")

    def _next_is_name(self) -> bool:
        """VAR/GET/STORE/DEL 뒤 이름 토큰 판별.
        BLOCK_END_OPS 와 BLOCK_OPEN 만 제외 — 나머지 점 문자는 모두 이름 가능."""
        nxt = self._peek()
        if nxt is None or nxt["type"] != "OP":
            return False
        raw = nxt["raw"]
        return raw not in BLOCK_END_OPS and raw != BLOCK_OPEN

    def _next_is_func_name(self) -> bool:
        """˙ / ˙∘ 뒤 이름 판별. 함수 관련 키워드는 이름으로 쓰지 않음."""
        nxt = self._peek()
        if nxt is None or nxt["type"] != "OP":
            return False
        raw = nxt["raw"]
        return (
            raw not in BLOCK_END_OPS
            and raw != BLOCK_OPEN
            and raw != FUNC_DEF
            and raw != FUNC_ARG
        )

    def _emit_comments_upto(self, line_no: int):
        for ln in sorted(k for k in self.comments if k not in self._seen_comments):
            if ln > line_no:
                break
            self._flush()
            text = self.comments[ln]["text"]
            body = text[len(COMMENT_CHAR) :].strip()
            fmt = (COMMENT_CHAR + " " + body) if body else COMMENT_CHAR
            self._lines.append((self._ind() + fmt).rstrip())
            self._seen_comments.add(ln)

    def _emit_remaining_comments(self):
        for ln in sorted(k for k in self.comments if k not in self._seen_comments):
            self._flush()
            text = self.comments[ln]["text"]
            body = text[len(COMMENT_CHAR) :].strip()
            fmt = (COMMENT_CHAR + " " + body) if body else COMMENT_CHAR
            self._lines.append((self._ind() + fmt).rstrip())
            self._seen_comments.add(ln)

    def format(self) -> str:
        while self.pos < len(self.tokens):
            t = self._peek()
            if t is None:
                break

            self._emit_comments_upto(t["line"])
            t = self._peek()
            if t is None:
                break

            tt = t["type"]
            raw = t["raw"]

            if tt == "OP" and raw in BLOCK_END_OPS:
                self._adv()
                self._flush()
                self.depth = max(0, self.depth - 1)
                self._cur.append(raw)
                self._flush()
                continue

            if tt == "OP" and raw == BLOCK_OPEN:
                self._adv()
                self._flush()
                self._cur.append(raw)
                self._flush()
                self.depth += 1
                continue

            if tt == "NUMBER" and raw == MAIN_RAW:
                self._adv()
                self._flush()
                self._blank()
                self._cur.append(raw)
                self._flush()
                self.depth += 1
                continue

            if tt == "OP" and raw == FUNC_DEF:
                self._adv()
                self._flush()
                self._blank()
                self._cur.append(raw)
                if self._next_is_func_name():
                    self._cur.append(self._adv()["raw"])
                self._flush()
                continue

            if tt == "OP" and raw == FUNC_ARG:
                self._adv()
                self._flush()
                self._cur.append(raw)
                if self._next_is_func_name():
                    self._cur.append(self._adv()["raw"])
                self._flush()
                continue

            if tt == "OP" and raw == VAR_OP:
                self._adv()
                self._flush()
                self._cur.append(raw)

                if self._next_is_name():
                    self._cur.append(self._adv()["raw"])

                nxt = self._peek()
                if nxt:
                    if nxt["type"] in ("NUMBER", "STRING"):
                        self._cur.append(self._adv()["raw"])
                    elif (
                        nxt["type"] == "OP"
                        and nxt["raw"] not in BLOCK_END_OPS
                        and nxt["raw"] != BLOCK_OPEN
                    ):
                        self._cur.append(self._adv()["raw"])
                self._flush()
                continue

            if tt == "OP" and raw == GET_OP:
                self._adv()
                self._flush()
                self._cur.append(raw)
                if self._next_is_name():
                    self._cur.append(self._adv()["raw"])
                self._flush()
                continue

            if tt == "OP" and raw == STORE_OP:
                self._adv()
                self._flush()
                self._cur.append(raw)
                if self._next_is_name():
                    self._cur.append(self._adv()["raw"])
                self._flush()
                continue

            if tt == "OP" and raw == DEL_OP:
                self._adv()
                self._flush()
                self._cur.append(raw)
                if self._next_is_name():
                    self._cur.append(self._adv()["raw"])
                self._flush()
                continue

            if tt == "OP" and raw in NEWLINE_OPS:
                self._adv()
                self._flush()
                self._cur.append(raw)
                if raw in NEWLINE_OPS_WITH_NAME and self._next_is_name():
                    self._cur.append(self._adv()["raw"])
                self._flush()
                continue

            self._adv()
            self._cur.append(raw)

        self._flush()
        self._emit_remaining_comments()
        self._flush()

        out: List[str] = []
        blank = 0
        for line in self._lines:
            if line == "":
                blank += 1
                if blank <= 1:
                    out.append(line)
            else:
                blank = 0
                out.append(line)

        result = "\n".join(out)
        if not result.endswith("\n"):
            result += "\n"
        return result


def _try_remove(path: str):
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception:
        pass


def process_file(
    src_path: str, out_path: str, engine_path: str, opts: dict
) -> Tuple[bool, str]:
    try:
        source = open(src_path, "r", encoding="utf-8").read()
    except FileNotFoundError:
        return False, f"파일 없음: {src_path}"
    except PermissionError:
        return False, f"읽기 권한 없음: {src_path}"
    except Exception as e:
        return False, f"읽기 오류: {e}"

    if not source.strip():
        return False, "빈 파일입니다"

    ok, data = parse_with_js(source, engine_path)
    if not ok:
        return False, data["error"]

    try:
        fmt = Formatter(data["tokens"], data["comments"], indent=opts.get("indent", 2))
        result = fmt.format()
    except Exception as e:
        return False, f"포맷 오류: {e}"

    if opts.get("check"):
        return (
            (True, "이미 포맷됨") if result == source else (False, "포맷이 필요합니다")
        )

    out_dir = os.path.dirname(out_path)
    if out_dir:
        try:
            os.makedirs(out_dir, exist_ok=True)
        except Exception as e:
            return False, f"디렉터리 생성 실패: {e}"

    tmp = out_path + "._fmt_tmp"
    try:
        with open(tmp, "w", encoding="utf-8") as f:
            f.write(result)
        os.replace(tmp, out_path)
    except PermissionError:
        _try_remove(tmp)
        return False, f"쓰기 권한 없음: {out_path}"
    except Exception as e:
        _try_remove(tmp)
        return False, f"쓰기 오류: {e}"

    return True, out_path


_COLOR = sys.stdout.isatty()


def _c(t, code):
    return f"\033[{code}m{t}\033[0m" if _COLOR else t


def _ok(m):
    print(_c("✓", "32") + " " + m)


def _err(m):
    print(_c("✗", "31") + " " + m, file=sys.stderr)


def _warn(m):
    print(_c("!", "33") + " " + m)


def _info(m):
    print(_c("·", "36") + " " + m)


def main():
    ap = argparse.ArgumentParser(
        prog="formatter",
        description="점랭 (JeomLang) 언어 코드 포맷터 (JS 엔진으로 파싱)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예제:
  python3 formatter.py hello.jeom              → hello.fmt.jeom
  python3 formatter.py hello.jeom -r           → 생성 후 원본 삭제
  python3 formatter.py hello.jeom -o out.jeom  → 경로 직접 지정
  python3 formatter.py hello.jeom --check      → 확인만 (exit 1 if needed)
  python3 formatter.py *.jeom                  → 여러 파일
        """,
    )
    ap.add_argument("files", nargs="+", metavar="파일.jeom")
    ap.add_argument(
        "-r", "--remove", action="store_true", help="포맷 성공 후 원본 삭제"
    )
    ap.add_argument(
        "-o", "--output", metavar="경로", help="출력 경로 (파일 1개일 때만)"
    )
    ap.add_argument("--check", action="store_true", help="포맷 필요 여부 확인만")
    ap.add_argument(
        "--indent",
        type=int,
        default=2,
        metavar="N",
        help="들여쓰기 스페이스 수 (기본: 2)",
    )
    ap.add_argument(
        "--suffix", default=".fmt", metavar="접미사", help="출력 접미사 (기본: .fmt)"
    )
    ap.add_argument("--engine", metavar="경로", help="engine.js 경로 (기본: 자동)")
    args = ap.parse_args()

    if args.output and len(args.files) > 1:
        _err("-o 는 파일이 1개일 때만 사용 가능합니다")
        sys.exit(1)
    if args.check and args.remove:
        _err("--check 와 -r 은 동시에 사용할 수 없습니다")
        sys.exit(1)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    engine_path = args.engine or _find_engine(script_dir)
    if not engine_path:
        _err("engine.js 를 찾을 수 없습니다. --engine 으로 경로를 지정하세요.")
        sys.exit(1)

    opts = {"check": args.check, "indent": args.indent}
    ok_count = fail_count = 0

    for src_path in args.files:
        if not os.path.exists(src_path):
            _err(f"파일 없음: {src_path}")
            fail_count += 1
            continue
        if not src_path.endswith(".jeom"):
            _warn(f"확장자가 .jeom 이 아닙니다: {src_path}")

        if args.output:
            out_path = args.output
        elif args.check:
            out_path = src_path
        else:
            base, ext = os.path.splitext(src_path)
            out_path = os.path.join(
                os.path.dirname(src_path) or ".",
                os.path.basename(base) + args.suffix + ext,
            )

        success, msg = process_file(src_path, out_path, engine_path, opts)

        if args.check:
            (_ok if success else _warn)(f"{src_path}: {msg}")
            if success:
                ok_count += 1
            else:
                fail_count += 1
            continue

        if success:
            _ok(f"{src_path}  →  {msg}")
            ok_count += 1
            if args.remove and os.path.abspath(src_path) != os.path.abspath(out_path):
                try:
                    os.remove(src_path)
                    _info(f"원본 삭제: {src_path}")
                except PermissionError:
                    _warn(f"원본 삭제 실패 (권한 없음): {src_path}")
                except Exception as e:
                    _warn(f"원본 삭제 실패: {e}")
        else:
            _err(f"{src_path}: {msg}")
            fail_count += 1
            if out_path != src_path:
                _try_remove(out_path)

    if len(args.files) > 1:
        print()
        total = ok_count + fail_count
        (_ok if fail_count == 0 else _warn)(
            f"완료: {ok_count}/{total} 성공"
            + (f", {fail_count} 실패" if fail_count else "")
        )

    if fail_count > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
