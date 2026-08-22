# 빠른 시작

JeomLang을 처음 사용하는 경우 아래 방법 중 하나로 바로 실행해 볼 수 있습니다.

## 웹 IDE

설치 없이 브라우저에서 바로 JeomLang을 실행할 수 있습니다.

**웹 IDE:**  
https://jeomlang.vercel.app/ide

웹 IDE에서 JeomLang 코드를 작성하고 실행 결과를 바로 확인할 수 있습니다.

## CLI 설치

JeomLang CLI를 사용하려면 **Node.js 18 이상**이 필요합니다.

### npm으로 설치

```bash
npm install -g jeomlang
jeom run hello.jeom
```

### 저장소를 직접 클론

```bash
git clone https://github.com/minirang/jeomlang.git
cd jeomlang
node core/cli.js run examples/hello.jeom
```

## CLI 명령

```bash
jeom run <파일.jeom>          # 실행
jeom check <파일.jeom>        # 문법 검사
jeom repl                     # 대화형 REPL
jeom encode "Hello"           # 문자열 → 점 인코딩
jeom encode-num 42            # 정수 → 점 인코딩
jeom encode-float 3.14        # 소수 → 점 인코딩
jeom decode "•·.·.•"          # 점 코드 → 값
jeom tokens <파일.jeom>       # 토큰 목록
jeom ast <파일.jeom>          # AST 출력
jeom ops                      # 전체 명령 토큰
jeom new <파일.jeom>          # 새 파일 생성
jeom version                  # 버전 확인
```

### 주요 명령

#### 파일 실행

```bash
jeom run hello.jeom
```

`.jeom` 파일을 JeomLang 엔진으로 실행합니다.

#### 문법 검사

```bash
jeom check hello.jeom
```

프로그램을 실행하지 않고 문법 오류를 검사합니다.

#### REPL

```bash
jeom repl
```

대화형 환경에서 JeomLang 코드를 입력하고 결과를 확인할 수 있습니다.

#### 인코딩

문자열이나 숫자를 JeomLang의 점 리터럴 형식으로 변환할 수 있습니다.

```bash
jeom encode "Hello"
jeom encode-num 42
jeom encode-float 3.14
```

#### 디코딩

점 리터럴을 원래 값으로 변환합니다.

```bash
jeom decode "•·.·.•"
```

#### 토큰 및 AST 확인

```bash
jeom tokens hello.jeom
jeom ast hello.jeom
```

## 다음 단계

JeomLang의 문법과 언어 기능을 자세히 알아보려면 다음 문서를 참고하세요.

- `docs/GRAMMAR.md` — 문법 레퍼런스
- `docs/SPEC.md` — 언어 명세
- `docs/CHANGELOG.md` — 변경 이력

또한 `examples/` 디렉터리에서 다양한 JeomLang 예제 프로그램을 확인할 수 있습니다.

---

# Quick Start

If you are new to JeomLang, you can get started immediately using one of the methods below.

## Web IDE

You can run JeomLang directly in your browser without installing anything.

**Web IDE:**  
https://jeomlang.vercel.app/ide

Write JeomLang code in the Web IDE and immediately see the execution results.

## CLI Installation

The JeomLang CLI requires **Node.js 18 or later**.

### Install with npm

```bash
npm install -g jeomlang
jeom run hello.jeom
```

### Clone the Repository

If you need the source code, you can clone the repository and run JeomLang locally.

```bash
git clone https://github.com/minirang/jeomlang.git
cd jeomlang
node core/cli.js run examples/hello.jeom
```

## CLI Commands

```bash
jeom run <file.jeom>          # Run a JeomLang file
jeom check <file.jeom>        # Check syntax
jeom repl                     # Start the interactive REPL
jeom encode "Hello"           # Encode a string into a JeomLang literal
jeom encode-num 42            # Encode an integer into a JeomLang literal
jeom encode-float 3.14        # Encode a float into a JeomLang literal
jeom decode "•·.·.•"          # Decode a JeomLang literal
jeom tokens <file.jeom>       # Display the token list
jeom ast <file.jeom>          # Display the AST
jeom ops                      # Display all command tokens
jeom new <file.jeom>          # Create a new JeomLang file
jeom version                  # Display the JeomLang version
```

### Common Commands

#### Run a File

```bash
jeom run hello.jeom
```

Runs a `.jeom` file using the JeomLang engine.

#### Check Syntax

```bash
jeom check hello.jeom
```

Checks the syntax of a JeomLang file without executing it.

#### REPL

```bash
jeom repl
```

Starts an interactive environment where you can enter JeomLang code and inspect the results.

#### Encoding

You can convert strings and numbers into JeomLang's dot-based literal format.

```bash
jeom encode "Hello"
jeom encode-num 42
jeom encode-float 3.14
```

#### Decoding

Converts a JeomLang literal back into its original value.

```bash
jeom decode "•·.·.•"
```

#### Inspect Tokens and AST

Use these commands to inspect how JeomLang source code is analyzed.

```bash
jeom tokens hello.jeom
jeom ast hello.jeom
```

## Next Steps

For more information about JeomLang's syntax and language features, see the following documents:

- `docs/GRAMMAR.md` — Grammar reference
- `docs/SPEC.md` — Language specification
- `docs/CHANGELOG.md` — Changelog

You can also find various JeomLang example programs in the `examples/` directory.