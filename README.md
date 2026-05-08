# jeomlang

<p align="center">
  <img src="img/logo_animated.svg" alt="Jeom Logo" width="96">
</p>

> 점 유니코드 문자 **16종**만으로 프로그래밍하는 난해 언어  
> 파일 확장자: `.jeom` · 버전: `1.1.0`

---

## 개요

**점(Jeom)** 은 유니코드의 "점" 계열 문자만으로 모든 코드를 작성하는 난해 프로그래밍 언어입니다.  
브레인퍽처럼 난해하지만 **함수 · 재귀 · 배열 · 딕셔너리 · 오류처리 · 파일시스템 · 모듈**을 갖춘 완전한 언어입니다.

**공용 엔진(`jeom_engine.js`)** 하나로 브라우저 HTML IDE와 Node.js CLI를 모두 구동합니다.  
**Python 엔진(`jeom/`)** 도 동일 스펙으로 동작합니다.

---

## 파일 구조

```
jeom_lang/
├── jeom_engine.js       ← 공용 JS 엔진 (렉서+파서+VM, UMD)
├── jeom_cli.js          ← Node.js CLI
├── jeom_ide.html        ← 브라우저 웹 IDE (독립 실행)
├── jeom_ide.css         ← IDE 스타일시트
├── jeom_ide.js          ← IDE 로직
├── stdlib/
│   └── std.jeom         ← 표준 라이브러리
├── examples/
│   ├── hello.jeom
│   ├── fizzbuzz.jeom
│   └── factorial.jeom
├── img/
│   ├── logo.svg
│   └── logo_animated.svg
├── SPEC.md              ← 언어 명세서
└── README.md
```

---

## 빠른 시작

### 웹 IDE

`jeom_ide.html`을 브라우저로 열면 끝 — 서버 불필요.  
같은 폴더에 `jeom_engine.js`, `jeom_ide.css`, `jeom_ide.js`, `logo_animated.svg` 필요.

### CLI (Node.js 18+)

```bash
node jeom_cli.js run hello.jeom        # 실행
node jeom_cli.js check hello.jeom      # 문법 검사
node jeom_cli.js repl                  # 대화형 REPL
node jeom_cli.js encode "Hello"        # 문자열 → 점 인코딩
node jeom_cli.js encode-num 42         # 숫자 → 점 인코딩
node jeom_cli.js decode "•·.·.•"       # 점 코드 → 값
node jeom_cli.js tokens hello.jeom     # 토큰 목록
node jeom_cli.js ast hello.jeom        # AST 출력
node jeom_cli.js ops                   # 전체 명령 토큰
node jeom_cli.js new myfile.jeom       # 새 파일 생성
```

### Python 엔진

```bash
python3 -c "from jeom import run_source; run_source(open('hello.jeom').read())"
```

---

## 점 문자 16종

| 기호 | 유니코드 | 이름 | 역할 |
|:----:|----------|------|------|
| `.`  | U+002E | FULL STOP | 0비트 |
| `·`  | U+00B7 | MIDDLE DOT | 1비트 |
| `˙`  | U+02D9 | DOT ABOVE | 함수 관련 |
| `•`  | U+2022 | BULLET | 숫자 리터럴 구분자 |
| `․`  | U+2024 | ONE DOT LEADER | 명령 조합 |
| `‥`  | U+2025 | TWO DOT LEADER | 반복·오류 |
| `…`  | U+2026 | HORIZONTAL ELLIPSIS | 조건 분기 |
| `‧`  | U+2027 | HYPHENATION POINT | 문자열 바이트 구분자 |
| `∘`  | U+2218 | RING OPERATOR | 변수 |
| `⋅`  | U+22C5 | DOT OPERATOR | 산술·논리 |
| `●`  | U+25CF | BLACK CIRCLE | 문자열 리터럴 구분자 |
| `◦`  | U+25E6 | WHITE BULLET | 배열·딕셔너리 |
| `⦁`  | U+2981 | Z NOTATION SPOT | 스택 조작 |
| `⸳`  | U+2E33 | RAISED DOT | 타입 변환 |
| `⋮`  | U+22EE | VERTICAL ELLIPSIS | 블록 |
| `⋯`  | U+22EF | MIDLINE HORIZONTAL ELLIPSIS | 파일·모듈 |
| `◘`  | U+25D8 | INVERSE BULLET | 주석 (줄 끝까지) |

---

## 실행 모델

- **숫자 리터럴**: `•<이진수>•` (`.`=0, `·`=1) — 예: `•·.·•` = 5, `••` = 0
- **문자열 리터럴**: `●<UTF-8 바이트>●` (바이트 경계: `‧`)
- **진입점**: `•·` ... `⋮⋮`
- **블록**: `⋮` ... `⋮⋮`
- **주석**: `◘` 이후 줄 끝까지
- **STORE** (`∘⋅ <이름>`): 스택 최상단 팝 → 변수 저장

---

## 코드 예제

### Hello World

```jeom
•·
  ●.·......·‧.·.....·‧··..··.·‧··..··.·‧···..··‧..·.····‧..·····.‧·.....·.‧.·.....·‧.·......·‧··.·····●
  ··
⋮⋮
```

> 💡 REPL에서 `.enc "Hello, Jeom!"` 입력하면 자동 인코딩

### 변수와 연산

```jeom
•·
  ∘ · •·.·.•    ◘ a = 10
  ∘ ·· •··•     ◘ b = 3
  ∘∘ ·  ∘∘ ··  ⋅    ··   ◘ 13
  ∘∘ ·  ∘∘ ··  ⋅⋅   ··   ◘ 7
  ∘∘ ·  ∘∘ ··  ⋅⋅⋅  ··   ◘ 30
⋮⋮
```

### 함수

```jeom
˙ ·∘·∘
˙∘ ·
˙∘ ··
⋮
  ∘∘ ·  ∘∘ ··  ⋅  ˙˙
⋮⋮

•·
  •···•  •·.·•
  ˙˙˙ ·∘·∘
  ··             ◘ 12
⋮⋮
```

### WHILE 반복 (1~5)

```jeom
•·
  ∘ · •·•
  ‥‥
  ⋮
    ∘∘ ·  •··.•  ⋅‧‧‧
  ⋮⋮
  ⋮
    ∘∘ ·  ··
    ∘∘ ·  •·•  ⋅  ∘⋅ ·
  ⋮⋮
⋮⋮
```

### 오류 처리

```jeom
•·
  ‥·
  ⋮
    •·.·.•  ••  ⋅∘  ··
  ⋮⋮
  ‥··
  ⋮
    ∘⋅ ·∘
    ●(오류: )●
    ∘∘ ·∘  ⋅  ··
  ⋮⋮
  ‥·˙
  ⋮
    ●(완료)●  ··
  ⋮⋮
⋮⋮
```

---

## 명령 토큰 요약

### I/O

| 토큰 | 명령 | 설명 |
|------|------|------|
| `·` | PRINT | stdout 출력 (줄바꿈 없음) |
| `··` | PRINTLN | stdout 출력 + 줄바꿈 |
| `·˙` | INPUT | stdin → 스택 (문자열) |
| `·˙˙` | INPUTN | stdin → 스택 (숫자) |
| `·∘` | ERR | stderr 출력 |

### 변수

| 토큰 | 명령 | 설명 |
|------|------|------|
| `∘` | VAR | `∘ <이름> <값>` 선언+할당 |
| `∘∘` | GET | `∘∘ <이름>` 읽기 → 스택 |
| `∘⋅` | STORE | `∘⋅ <이름>` 스택 팝 → 저장 |
| `∘∘∘` | DEL | 변수 삭제 |

### 스택

| 토큰 | 명령 | 설명 |
|------|------|------|
| `⦁` | PUSH | `⦁ <값>` 스택에 push |
| `⦁⦁` | POP | 스택 팝 (버림) |
| `⦁⦁⦁` | SWAP | 상위 2개 교환 |
| `⦁∘⦁` | DUP | 최상단 복제 |
| `⦁∘` | PEEK | 최상단 복사 (팝 없이) |

### 산술

| 토큰 | 명령 | 설명 |
|------|------|------|
| `⋅` | ADD | a + b |
| `⋅⋅` | SUB | a - b |
| `⋅⋅⋅` | MUL | a × b |
| `⋅∘` | DIV | a ÷ b |
| `⋅∘∘` | MOD | a % b |
| `⋅∘∘∘` | POW | a ^ b |

### 비교

| 토큰 | 명령 | 설명 |
|------|------|------|
| `⋅‧` | EQ | a == b → 1/0 |
| `⋅‧‧` | NEQ | a != b → 1/0 |
| `⋅‧‧‧` | LT | a < b → 1/0 |
| `⋅‧∘` | GT | a > b → 1/0 |
| `⋅‧∘∘` | LTE | a <= b → 1/0 |
| `⋅‧∘∘∘` | GTE | a >= b → 1/0 |

### 논리

| 토큰 | 명령 | 설명 |
|------|------|------|
| `⋅⦁` | AND | a && b → 1/0 |
| `⋅⦁⦁` | OR | a \|\| b → 1/0 |
| `⋅⦁⦁⦁` | NOT | !a → 1/0 |
| `⋅⦁∘` | XOR | a XOR b → 1/0 |

### 흐름 제어

| 토큰 | 명령 | 설명 |
|------|------|------|
| `…` | IF | truthy면 then 블록 실행 |
| `…·` | ELSE | IF 거짓 분기 |
| `…‥` | ELIF | 추가 조건 분기 |
| `‥` | LOOP | n회 반복 (스택 팝) |
| `‥‥` | WHILE | 조건+본문 반복 |
| `‥∘` | BREAK | 반복 탈출 |
| `‥∘∘` | CONT | 다음 반복으로 |
| `⋮` | BLOCK | 블록 시작 |
| `⋮⋮` | END | 블록 끝 |
| `⋯` | GOTO | 레이블로 점프 |
| `⋯·` | LABEL | 레이블 정의 |

### 함수

| 토큰 | 명령 | 설명 |
|------|------|------|
| `˙` | FUNC | 함수 정의 시작 |
| `˙∘` | ARG | 인자 이름 선언 |
| `˙˙` | RET | 반환 (스택 팝 → 반환값) |
| `˙˙˙` | CALL | 함수 호출 |
| `˙⦁` | LAMBDA | 익명 함수 |
| `˙⋅` | CURRY | 첫 인자 부분 적용 |

### 배열

| 토큰 | 명령 | 설명 |
|------|------|------|
| `◦` | ARR | n개 팝 → 배열 생성 |
| `◦◦` | IDX | arr[idx] |
| `◦◦◦` | IDXS | arr[idx] = val |
| `◦∘` | APP | 배열에 값 추가 |
| `◦∘∘` | SLICE | 슬라이싱 [start:end] |
| `◦⋅` | MAP | 배열에 함수 적용 |
| `◦⋅⋅` | FILTER | 배열 필터 |
| `◦⋅⋅⋅` | REDUCE | 배열 리듀스 |

### 딕셔너리

| 토큰 | 명령 | 설명 |
|------|------|------|
| `◦‧` | DICT | n쌍 → 딕셔너리 생성 |
| `◦‧‧` | DGET | dict[key] |
| `◦‧‧‧` | DSET | dict[key] = val |
| `◦⦁` | KEYS | 키 목록 |
| `◦⦁⦁` | VALS | 값 목록 |

### 타입 변환

| 토큰 | 명령 | 설명 |
|------|------|------|
| `⸳` | INT | 정수 변환 |
| `⸳⸳` | FLOAT | 실수 변환 |
| `⸳⸳⸳` | STR | 문자열 변환 |
| `⸳∘` | BOOL | 불리언 변환 |
| `⸳⦁` | TYPE | 타입 이름 |
| `⸳‧` | LEN | 길이 |

### 오류 처리

| 토큰 | 명령 | 설명 |
|------|------|------|
| `‥·` | TRY | 예외 처리 시작 |
| `‥··` | CATCH | 예외 처리 (에러 메시지 스택 push) |
| `‥·˙` | FINALLY | 항상 실행 |
| `‥·∘` | THROW | 예외 발생 |
| `‥·⦁` | ASSERT | 조건 실패 시 예외 |

### 파일시스템

| 토큰 | 명령 | 설명 |
|------|------|------|
| `⋯⋯` | FOPEN | 파일 핸들 생성 |
| `⋯⋯⋯` | FREAD | 파일 읽기 |
| `⋯∘` | FWRITE | 파일 쓰기 |
| `⋯∘∘` | FCLOSE | 파일 닫기 |
| `⋯⦁` | FEXIST | 파일 존재 여부 (1/0) |
| `⋯⦁⦁` | FDELETE | 파일 삭제 |
| `⋯⋅` | FLIST | 디렉터리 목록 |
| `⋯‧` | MKDIR | 디렉터리 생성 |

### 모듈

| 토큰 | 명령 | 설명 |
|------|------|------|
| `⋯·⦁` | IMPORT | 모듈 임포트 (스택에서 경로 팝) |
| `⋯·˙` | EXPORT | 심볼 내보내기 |

### 시스템

| 토큰 | 명령 | 설명 |
|------|------|------|
| `⋮∘` | EXIT | 프로그램 종료 |
| `⋮∘∘` | NOOP | 아무것도 안 함 |
| `⋮⦁` | DEBUG | 스택 전체 stderr 출력 |
| `⋮⋅` | TIME | 유닉스 타임스탬프 |
| `⋮‧` | RAND | 0.0~1.0 난수 |
| `⋮‧‧` | HASH | djb2 해시 |
| `⋮‧‧‧` | REGEX | 정규식 매칭 |
| `⋮·⦁` | SLEEP | 대기 (밀리초) |
| `⋮·` | EVAL | 문자열을 코드로 실행 |
| `⋮··` | EXEC | 시스템 명령 실행 |
| `⋮·∘` | ENV | 환경변수 읽기 |

전체 목록: `node jeom_cli.js ops`

---

## 표준 라이브러리 (std.jeom)

```jeom
●(stdlib/std.jeom)●
⋯·⦁
```

| 함수 토큰 | 인자 | 설명 |
|-----------|------|------|
| `·∘∘` | arr | 오름차순 버블정렬 |
| `·∘·` | arr | 최댓값 |
| `·∘··` | arr | 최솟값 |
| `·∘∘∘` | arr | 합계 |
| `·∘·∘` | arr | 역순 복사본 |
| `·∘··∘` | arr, val | 포함 여부 (1/0) |
| `·∘∘·` | arr, sep | 배열 → 문자열 연결 |

---

## 아키텍처

```
jeom_engine.js  (UMD — 브라우저 & Node.js 공용)
├── tokenize(source)   렉서: 소스 → 토큰 배열
├── parse(tokens)      파서: 토큰 → AST
└── JeomVM(opts)       스택 VM (async/await)
      ├── stdout / stderr / stdin 콜백
      └── readFile / writeFile / fileExists 콜백

jeom_cli.js     Node.js CLI
jeom_ide.html   웹 IDE (jeom_engine.js 인라인)
jeom_ide.css    웹 IDE 스타일
jeom_ide.js     웹 IDE 로직
```

---

## 주요 변경 이력

### v1.1.0
- **STORE 명령 추가** (`∘⋅`): 스택 팝 → 변수 저장
- JS/Python 엔진 스펙 완전 통일
- MAIN marker 렉서 판정 수정
- GTE/LTE 토큰 매핑 수정
- std.jeom 전면 재작성 (8/8 테스트 통과)

### v1.0.0
- 초기 릴리즈

---

## 라이선스

Apache 2.0 License
