# 점랭(JeomLang) 언어 명세서 (한국어)

> 작성자: minirang  
> 최종 수정: 2026/7/12

-----

## 1. 개요

점랭(JeomLang)은 유니코드 “점” 계열 문자 16종만으로 모든 코드를 작성하는 스택 기반 난해한 프로그래밍 언어입니다.

- **렉서 → 파서 → VM** 3단계 파이프라인
- 모든 값은 스택을 통해 전달
- 비동기 VM (async/await 기반)
- UMD 포맷 엔진으로 브라우저·Node.js 양쪽 구동

-----

## 2. 문자 집합

점 언어에서 의미를 갖는 문자는 아래 16종입니다. 그 외 문자는 렉서 오류입니다.  
공백(스페이스, 탭, 개행)은 토큰 구분자로만 사용됩니다.

|기호 |유니코드  |역할                   |
|:-:|------|---------------------|
|`.`|U+002E|0비트                  |
|`·`|U+00B7|1비트                  |
|`˙`|U+02D9|함수 관련 명령             |
|`•`|U+2022|숫자 리터럴 구분자           |
|`․`|U+2024|명령 조합                |
|`‥`|U+2025|반복 · 오류 · **소수점 구분자**|
|`…`|U+2026|조건 분기                |
|`‧`|U+2027|문자열 바이트 구분자          |
|`∘`|U+2218|변수 명령                |
|`⋅`|U+22C5|산술 · 논리 명령           |
|`●`|U+25CF|문자열 리터럴 구분자          |
|`◦`|U+25E6|배열 · 딕셔너리 명령         |
|`⦁`|U+2981|스택 조작 명령             |
|`⸳`|U+2E33|타입 변환 명령             |
|`⋮`|U+22EE|블록                   |
|`⋯`|U+22EF|파일 · 모듈 명령           |
|`◘`|U+25D8|주석 (줄 끝까지, 토큰 아님)    |

-----

## 3. 토큰 타입

렉서가 생성하는 토큰 타입:

|타입      |설명               |
|--------|-----------------|
|`NUMBER`|숫자 리터럴 (`•...•`) |
|`STRING`|문자열 리터럴 (`●...●`)|
|`OP`    |점 문자 시퀀스 명령      |
|`EOF`   |파일 끝             |

-----

## 4. 리터럴

### 4.1 정수 리터럴

```
정수 ::= '•' 비트열 '•'
비트열 ::= ('.' | '·')+
```

- `.` = 0비트, `·` = 1비트, big-endian 이진수
- `••` = 0 (빈 비트열)
- 음수는 지원하지 않음 (SUB 연산으로 처리)

### 4.2 소수 리터럴

```
소수 ::= '•' 비트열 '‥' 비트열 '•'
```

- `‥` (U+2025)가 정수부와 소수부를 구분
- 소수부 i번째(0-indexed) 비트 = `bit × 2^-(i+1)`
- 최대 24비트 소수부 정밀도

### 4.3 문자열 리터럴

```
문자열 ::= '●' 바이트열 '●'
바이트열 ::= (바이트 '‧')* 바이트?
바이트 ::= (ZERO | ONE) × 8
```

- 각 바이트는 정확히 8비트
- 바이트 경계: `‧` (U+2027)
- 인코딩: UTF-8
- 리터럴 내부 공백 무시 (가독성용)

### 4.4 MAIN 마커

```
MAIN ::= '•·'  (뒤에 공백 | EOF | 주석일 때만)
```

`•·` 다음에 비트 문자(`.` 또는 `·`)가 오면 숫자 리터럴로 처리합니다.

-----

## 5. 프로그램 구조

```
프로그램 ::= (함수정의 | 최상위문)* MAIN블록
MAIN블록 ::= '•·' 문장* '⋮⋮'
```

- 함수 정의는 위치에 관계없이 MAIN 실행 전에 등록됩니다 (호이스팅)
- MAIN 블록은 프로그램당 하나

-----

## 6. 변수

```
VAR   ::= '∘' 이름 값표현식
GET   ::= '∘∘' 이름
STORE ::= '∘⋅' 이름
DEL   ::= '∘∘∘' 이름
```

- 이름: 어떤 점 문자 조합도 가능 (명령 토큰과 동일해도 컨텍스트로 구분)
- 변수는 환경(env) 딕셔너리에 저장

-----

## 7. 스택

모든 연산은 스택을 통해 값을 주고받습니다.

|토큰     |명령  |동작           |
|-------|----|-------------|
|`⦁ <값>`|PUSH|값을 스택에 push  |
|`⦁⦁`   |POP |스택 팝 (버림)    |
|`⦁⦁⦁`  |SWAP|상위 2개 교환     |
|`⦁∘⦁`  |DUP |최상단 복제       |
|`⦁∘`   |PEEK|최상단 복사 (팝 없이)|

**이진 연산 순서**: `A B OP` → b=먼저 팝, a=나중 팝 → 결과 push

-----

## 8. 산술 연산

|토큰    |명령 |결과                          |
|------|---|----------------------------|
|`⋅`   |ADD|a+b (숫자 덧셈, 문자열 연결, 배열 이어붙임)|
|`⋅⋅`  |SUB|a-b                         |
|`⋅⋅⋅` |MUL|a×b                         |
|`⋅∘`  |DIV|a÷b (b=0이면 런타임 오류)          |
|`⋅∘∘` |MOD|a%b                         |
|`⋅∘∘∘`|POW|a^b                         |

-----

## 9. 비교 / 논리 연산

비교 결과는 1(참) 또는 0(거짓).

|토큰     |명령 |조건     |
|-------|---|-------|
|`⋅‧`   |EQ |a==b   |
|`⋅‧‧`  |NEQ|a!=b   |
|`⋅‧‧‧` |LT |a<b    |
|`⋅‧∘`  |GT |a>b    |
|`⋅‧∘∘` |LTE|a<=b   |
|`⋅‧∘∘∘`|GTE|a>=b   |
|`⋅⦁`   |AND|a&&b   |
|`⋅⦁⦁`  |OR |a||b   |
|`⋅⦁⦁⦁` |NOT|!a     |
|`⋅⦁∘`  |XOR|a XOR b|

**Truthy**: 0, null, undefined, `""`, `[]` → falsy. 나머지 → truthy.

-----

## 10. 제어 흐름

### IF / ELIF / ELSE

```
IF문    ::= '…' 블록
ELSE    ::= '…·' 블록
ELIF    ::= '…‥' 블록(조건) 블록(본문)
```

### LOOP / WHILE

```
LOOP  ::= '‥' 블록           ← 스택 팝 = 횟수 n
WHILE ::= '‥‥' 블록 블록      ← 조건블록, 본문블록
```

### BREAK / CONTINUE

```
BREAK ::= '‥∘'
CONT  ::= '‥∘∘'
```

### GOTO / LABEL

```
LABEL ::= '⋯·' 이름
GOTO  ::= '⋯' 이름
```

-----

## 11. 블록

```
블록 ::= '⋮' 문장* '⋮⋮'
```

중첩 가능. 들여쓰기는 의미 없음.

-----

## 12. 함수

### 정의

```
함수정의 ::= '˙' 이름 ('˙∘' 이름)* 블록
```

### 호출

```
호출 ::= '˙˙˙' 이름
```

인자는 선언 순서대로 스택에 push한 뒤 호출.

### 반환

```
RET ::= '˙˙'
```

스택 최상단 팝 → 호출자 스택에 push.

### 람다 / 커링

```
람다  ::= '˙⦁' ('˙∘' 이름)* 블록
커링  ::= '˙⋅'   ← 스택: val, fn → fn(val, ?) push
```

-----

## 13. 배열

|토큰    |명령    |스택 동작                             |
|------|------|----------------------------------|
|`◦`   |ARR   |n, v₁..vₙ → [v₁..vₙ]              |
|`◦◦`  |IDX   |idx, arr → arr[idx]               |
|`◦◦◦` |IDXS  |val, idx, arr → arr (arr[idx]=val)|
|`◦∘`  |APP   |val, arr → arr (push val)         |
|`◦∘∘` |SLICE |end, start, arr → arr[start:end]  |
|`◦⋅`  |MAP   |fn, arr → 새 배열                    |
|`◦⋅⋅` |FILTER|fn, arr → 필터된 배열                  |
|`◦⋅⋅⋅`|REDUCE|init, fn, arr → 누적값               |

**중요**: FILTER/MAP에서 fn과 arr을 같은 변수에서 두 번 GET하면 안 됩니다. fn은 별도 변수에 저장해서 전달하세요.

-----

## 14. 딕셔너리

|토큰    |명령  |스택 동작                                |
|------|----|-------------------------------------|
|`◦‧`  |DICT|n, k₁,v₁..kₙ,vₙ → {k₁:v₁..}          |
|`◦‧‧` |DGET|key, dict → dict[key]                |
|`◦‧‧‧`|DSET|val, key, dict → dict (dict[key]=val)|
|`◦⦁`  |KEYS|dict → 키 배열                          |
|`◦⦁⦁` |VALS|dict → 값 배열                          |

-----

## 15. 타입 변환

|토큰   |명령   |동작                                      |
|-----|-----|----------------------------------------|
|`⸳`  |INT  |truncate to integer                     |
|`⸳⸳` |FLOAT|Number()                                |
|`⸳⸳⸳`|STR  |String()                                |
|`⸳∘` |BOOL |truthy → 1, falsy → 0                   |
|`⸳⦁` |TYPE |“number” | “string” | “array” | “object”|
|`⸳‧` |LEN  |length / Object.keys 길이                 |
|`⸳⋅` |CAST |type, val → 명시적 변환                      |

-----

## 16. 오류 처리

```
TRY     ::= '‥·' 블록
CATCH   ::= '‥··' 블록      ← 진입 시 에러 메시지 스택에 push
FINALLY ::= '‥·˙' 블록      ← 항상 실행
THROW   ::= '‥·∘'           ← 스택 팝 → 예외 발생
ASSERT  ::= '‥·⦁'           ← falsy면 예외 발생
```

-----

## 17. 입출력

|토큰   |명령     |동작              |
|-----|-------|----------------|
|`·`  |PRINT  |stdout (줄바꿈 없음) |
|`··` |PRINTLN|stdout + `\n`   |
|`·∘` |ERR    |stderr + `\n`   |
|`·˙` |INPUT  |stdin → 문자열 push|
|`·˙˙`|INPUTN |stdin → 숫자 push |

-----

## 18. 파일시스템

|토큰   |명령     |동작              |
|-----|-------|----------------|
|`⋯⋯` |FOPEN  |mode, path → 핸들 |
|`⋯⋯⋯`|FREAD  |핸들 → 내용 문자열     |
|`⋯∘` |FWRITE |content, 핸들 → 쓰기|
|`⋯∘∘`|FCLOSE |핸들 닫기           |
|`⋯⦁` |FEXIST |path → 1/0      |
|`⋯⦁⦁`|FDELETE|path 삭제         |
|`⋯⋅` |FLIST  |path → 항목 배열    |
|`⋯‧` |MKDIR  |path 생성         |

-----

## 19. 모듈

```
IMPORT ::= '⋯·⦁'   ← 스택 팝 = 경로
EXPORT ::= '⋯·˙' 이름
```

- 로드된 파일의 함수·변수가 현재 환경에 병합
- 순환 임포트 캐싱으로 방지

-----

## 20. 시스템

|토큰    |명령   |동작                      |
|------|-----|------------------------|
|`⋮∘`  |EXIT |종료 코드 팝 → 종료            |
|`⋮∘∘` |NOOP |아무것도 안 함                |
|`⋮⦁`  |DEBUG|스택 전체 stderr 출력         |
|`⋮⋅`  |TIME |유닉스 타임스탬프(초) push       |
|`⋮‧`  |RAND |0.0~1.0 난수 push         |
|`⋮‧‧` |HASH |djb2 해시 (16진수 문자열)      |
|`⋮‧‧‧`|REGEX|pattern, text → 첫 매칭 문자열|
|`⋮·⦁` |SLEEP|밀리초 대기                  |
|`⋮·`  |EVAL |문자열 → 점 코드로 실행          |
|`⋮··` |EXEC |시스템 명령 실행 → 결과          |
|`⋮·∘` |ENV  |환경변수 이름 → 값             |

-----

## 21. VM 제한값 (기본값)

|항목         |기본값      |
|-----------|---------|
|최대 스텝      |2,000,000|
|최대 재귀 깊이   |500      |
|최대 WHILE 반복|100,000  |

`JeomVM` 생성 시 `maxSteps`, `maxCallDepth`, `maxLoop` 옵션으로 변경 가능합니다.

-----

## 22. 실행 파이프라인

```
소스 텍스트
  ↓ tokenize()
토큰 목록 [NUMBER | STRING | OP | EOF]
  ↓ parse()
AST [FUNCDEF | MAIN | IF | WHILE | LOOP | TRY | CALL | INSTR ...]
  ↓ JeomVM.run()
  1. 최상위 FUNCDEF 호이스팅
  2. MAIN 블록 실행
  3. 스택 기반 인터프리터
```

-----

## 23. 에러 타입

|타입            |의미                          |
|--------------|----------------------------|
|`JeomError`   |런타임 오류 (렉서 오류 포함)           |
|`JeomBreak`   |BREAK 신호 (내부용)              |
|`JeomContinue`|CONTINUE 신호 (내부용)           |
|`JeomReturn`  |함수 반환 신호 (내부용)              |
|`JeomGoto`    |GOTO 신호 (내부용)               |
|`JeomExit`    |EXIT 신호 — `exitCode` 프로퍼티 포함|

-----

## 24. 공개 API

```js
const {
  VERSION,
  encodeString, encodeNumber, encodeFloat,
  decodeString, decodeNumber,
  tokenize, parse,
  JeomVM,
  JeomError, JeomBreak, JeomContinue,
  JeomReturn, JeomGoto, JeomExit,
  OP_TABLE, DOT_CHARS, C,
} = require('./core/engine.js');
```

-----

*JeomLang 언어 명세서 끝*


-----

# JeomLang Language Specification (English)

> Author: minirang  
> Last modified: 2026/7/12

-----

## 1. Overview

JeomLang is a stack-based esoteric programming language where all code is written using only 16 types of Unicode "dot" characters.

- **Lexer → Parser → VM** 3-stage pipeline
- All values are passed through the stack
- Asynchronous VM (based on async/await)
- Runs on both Browser and Node.js with a UMD format engine

-----

## 2. Character Set

The 16 characters below are the only ones with meaning in JeomLang. Any other character will cause a lexer error.  
Whitespace (spaces, tabs, newlines) is used only as a token separator.

|Symbol |Unicode |Role                   |
|:-:|------|---------------------|
|`.`|U+002E|0 bit                  |
|`·`|U+00B7|1 bit                  |
|`˙`|U+02D9|Function-related commands             |
|`•`|U+2022|Numeric literal separator           |
|`․`|U+2024|Command combination                |
|`‥`|U+2025|Loop · Error · **Decimal separator**|
|`…`|U+2026|Conditional branching                |
|`‧`|U+2027|String byte separator          |
|`∘`|U+2218|Variable commands                |
|`⋅`|U+22C5|Arithmetic · Logic commands           |
|`●`|U+25CF|String literal separator          |
|`◦`|U+25E6|Array · Dictionary commands         |
|`⦁`|U+2981|Stack manipulation commands             |
|`⸳`|U+2E33|Type conversion commands             |
|`⋮`|U+22EE|Block                   |
|`⋯`|U+22EF|File · Module commands           |
|`◘`|U+25D8|Comment (to end of line, not a token)    |

-----

## 3. Token Types

Token types generated by the lexer:

|Type      |Description               |
|--------|-----------------|
|`NUMBER`|Numeric literal (`•...•`) |
|`STRING`|String literal (`●...●`)|
|`OP`    |Dot character sequence command      |
|`EOF`   |End of file             |

-----

## 4. Literals

### 4.1 Integer Literals

```
Integer ::= '•' BitString '•'
BitString ::= ('.' | '·')+
```

- `.` = 0 bit, `·` = 1 bit, big-endian binary
- `••` = 0 (Empty bit string)
- Negative numbers are not supported (handled via SUB operation)

### 4.2 Float Literals

```
Float ::= '•' BitString '‥' BitString '•'
```

- `‥` (U+2025) separates the integer and fractional parts
- i-th (0-indexed) bit of fractional part = `bit × 2^-(i+1)`
- Maximum 24-bit fractional precision

### 4.3 String Literals

```
String ::= '●' ByteString '●'
ByteString ::= (Byte '‧')* Byte?
Byte ::= (ZERO | ONE) × 8
```

- Each byte is exactly 8 bits
- Byte boundary: `‧` (U+2027)
- Encoding: UTF-8
- Internal whitespace ignored (for readability)

### 4.4 MAIN Marker

```
MAIN ::= '•·'  (Only when followed by whitespace | EOF | comment)
```

If a bit character (`.` or `·`) follows `•·`, it is treated as a numeric literal.

-----

## 5. Program Structure

```
Program ::= (FunctionDef | TopLevelStmt)* MAINBlock
MAINBlock ::= '•·' Statement* '⋮⋮'
```

- Function definitions are registered before MAIN execution regardless of their position (hoisting)
- One MAIN block per program

-----

## 6. Variables

```
VAR   ::= '∘' Name ValueExpr
GET   ::= '∘∘' Name
STORE ::= '∘⋅' Name
DEL   ::= '∘∘∘' Name
```

- Name: Any combination of dot characters is allowed (distinguished by context even if identical to a command token)
- Variables are stored in the environment (env) dictionary

-----

## 7. Stack

All operations pass values through the stack.

|Token     |Command  |Action           |
|-------|----|-------------|
|`⦁ <value>`|PUSH|Push value to stack  |
|`⦁⦁`   |POP |Pop stack (discard)    |
|`⦁⦁⦁`  |SWAP|Swap top 2 items     |
|`⦁∘⦁`  |DUP |Duplicate top item       |
|`⦁∘`   |PEEK|Copy top item (without popping)|

**Binary operation order**: `A B OP` → b=first pop, a=second pop → push result

-----

## 8. Arithmetic Operations

|Token    |Command |Result                          |
|------|---|----------------------------|
|`⋅`   |ADD|a+b (Number addition, string concatenation, array merge)|
|`⋅⋅`  |SUB|a-b                         |
|`⋅⋅⋅` |MUL|a×b                         |
|`⋅∘`  |DIV|a÷b (Runtime error if b=0)          |
|`⋅∘∘` |MOD|a%b                         |
|`⋅∘∘∘`|POW|a^b                         |

-----

## 9. Comparison / Logical Operations

Comparison result is 1 (true) or 0 (false).

|Token     |Command |Condition     |
|-------|---|-------|
|`⋅‧`   |EQ |a==b   |
|`⋅‧‧`  |NEQ|a!=b   |
|`⋅‧‧‧` |LT |a<b    |
|`⋅‧∘`  |GT |a>b    |
|`⋅‧∘∘` |LTE|a<=b   |
|`⋅‧∘∘∘`|GTE|a>=b   |
|`⋅⦁`   |AND|a&&b   |
|`⋅⦁⦁`  |OR |a||b   |
|`⋅⦁⦁⦁` |NOT|!a     |
|`⋅⦁∘`  |XOR|a XOR b|

**Truthy**: 0, null, undefined, `""`, `[]` → falsy. Everything else → truthy.

-----

## 10. Flow Control

### IF / ELIF / ELSE

```
IF      ::= '…' Block
ELSE    ::= '…·' Block
ELIF    ::= '…‥' Block(Condition) Block(Body)
```

### LOOP / WHILE

```
LOOP  ::= '‥' Block           ← Stack pop = count n
WHILE ::= '‥‥' Block Block      ← ConditionBlock, BodyBlock
```

### BREAK / CONTINUE

```
BREAK ::= '‥∘'
CONT  ::= '‥∘∘'
```

### GOTO / LABEL

```
LABEL ::= '⋯·' Name
GOTO  ::= '⋯' Name
```

-----

## 11. Blocks

```
Block ::= '⋮' Statement* '⋮⋮'
```

Nesting allowed. Indentation has no semantic meaning.

-----

## 12. Functions

### Definition

```
FunctionDef ::= '˙' Name ('˙∘' Name)* Block
```

### Call

```
Call ::= '˙˙˙' Name
```

Arguments are pushed to the stack in declaration order before calling.

### Return

```
RET ::= '˙˙'
```

Pop top of stack → push to caller's stack.

### Lambda / Curry

```
Lambda ::= '˙⦁' ('˙∘' Name)* Block
Curry  ::= '˙⋅'   ← Stack: val, fn → push fn(val, ?)
```

-----

## 13. Arrays

|Token    |Command    |Stack Action                             |
|------|------|----------------------------------|
|`◦`   |ARR   |n, v₁..vₙ → [v₁..vₙ]              |
|`◦◦`  |IDX   |idx, arr → arr[idx]               |
|`◦◦◦` |IDXS  |val, idx, arr → arr (arr[idx]=val)|
|`◦∘`  |APP   |val, arr → arr (push val)         |
|`◦∘∘` |SLICE |end, start, arr → arr[start:end]  |
|`◦⋅`  |MAP   |fn, arr → new array                    |
|`◦⋅⋅` |FILTER|fn, arr → filtered array                  |
|`◦⋅⋅⋅`|REDUCE|init, fn, arr → accumulated value               |

**Important**: Do not GET `fn` and `arr` twice from the same variable in FILTER/MAP. Store `fn` in a separate variable to pass it.

-----

## 14. Dictionaries

|Token    |Command  |Stack Action                                |
|------|----|-------------------------------------|
|`◦‧`  |DICT|n, k₁,v₁..kₙ,vₙ → {k₁:v₁..}          |
|`◦‧‧` |DGET|key, dict → dict[key]                |
|`◦‧‧‧`|DSET|val, key, dict → dict (dict[key]=val)|
|`◦⦁`  |KEYS|dict → key array                          |
|`◦⦁⦁` |VALS|dict → value array                          |

-----

## 15. Type Conversion

|Token   |Command   |Action                                      |
|-----|-----|----------------------------------------|
|`⸳`  |INT  |truncate to integer                     |
|`⸳⸳` |FLOAT|Number()                                |
|`⸳⸳⸳`|STR  |String()                                |
|`⸳∘` |BOOL |truthy → 1, falsy → 0                   |
|`⸳⦁` |TYPE |“number” | “string” | “array” | “object”|
|`⸳‧` |LEN  |length / Object.keys length                 |
|`⸳⋅` |CAST |type, val → explicit conversion                      |

-----

## 16. Error Handling

```
TRY     ::= '‥·' Block
CATCH   ::= '‥··' Block      ← Pushes error message to stack upon entry
FINALLY ::= '‥·˙' Block      ← Always executes
THROW   ::= '‥·∘'           ← Pop stack → raise exception
ASSERT  ::= '‥·⦁'           ← Raise exception if falsy
```

-----

## 17. I/O

|Token   |Command     |Action              |
|-----|-------|----------------|
|`·`  |PRINT  |stdout (no newline) |
|`··` |PRINTLN|stdout + `\n`   |
|`·∘` |ERR    |stderr + `\n`   |
|`·˙` |INPUT  |stdin → push string|
|`·˙˙`|INPUTN |stdin → push number |

-----

## 18. File System

|Token   |Command     |Action              |
|-----|-------|----------------|
|`⋯⋯` |FOPEN  |mode, path → handle |
|`⋯⋯⋯`|FREAD  |handle → content string     |
|`⋯∘` |FWRITE |content, handle → write|
|`⋯∘∘`|FCLOSE |close handle           |
|`⋯⦁` |FEXIST |path → 1/0      |
|`⋯⦁⦁`|FDELETE|delete path         |
|`⋯⋅` |FLIST  |path → entry array    |
|`⋯‧` |MKDIR  |create path         |

-----

## 19. Modules

```
IMPORT ::= '⋯·⦁'   ← Stack pop = path
EXPORT ::= '⋯·˙' Name
```

- Functions and variables of the loaded file are merged into the current environment
- Circular imports are prevented via caching

-----

## 20. System

|Token    |Command   |Action                      |
|------|-----|------------------------|
|`⋮∘`  |EXIT |Pop exit code → exit            |
|`⋮∘∘` |NOOP |Do nothing                |
|`⋮⦁`  |DEBUG|Print entire stack to stderr         |
|`⋮⋅`  |TIME |Push Unix timestamp (seconds)       |
|`⋮‧`  |RAND |Push 0.0~1.0 random number         |
|`⋮‧‧` |HASH |djb2 hash (hex string)      |
|`⋮‧‧‧`|REGEX|pattern, text → first matched string|
|`⋮·⦁` |SLEEP|Wait milliseconds                  |
|`⋮·`  |EVAL |string → execute as Jeom code          |
|`⋮··` |EXEC |Execute system command → result          |
|`⋮·∘` |ENV  |Environment variable name → value             |

-----

## 21. VM Limits (Defaults)

|Item         |Default      |
|-----------|---------|
|Max steps      |2,000,000|
|Max call depth   |500      |
|Max WHILE loops|100,000  |

Can be changed using `maxSteps`, `maxCallDepth`, and `maxLoop` options when creating `JeomVM`.

-----

## 22. Execution Pipeline

```
Source text
  ↓ tokenize()
Token list [NUMBER | STRING | OP | EOF]
  ↓ parse()
AST [FUNCDEF | MAIN | IF | WHILE | LOOP | TRY | CALL | INSTR ...]
  ↓ JeomVM.run()
  1. Hoist top-level FUNCDEF
  2. Execute MAIN block
  3. Stack-based interpreter
```

-----

## 23. Error Types

|Type            |Meaning                          |
|--------------|----------------------------|
|`JeomError`   |Runtime error (including lexer errors)           |
|`JeomBreak`   |BREAK signal (internal)              |
|`JeomContinue`|CONTINUE signal (internal)           |
|`JeomReturn`  |Function return signal (internal)              |
|`JeomGoto`    |GOTO signal (internal)               |
|`JeomExit`    |EXIT signal — includes `exitCode` property|

-----

## 24. Public API

```js
const {
  VERSION,
  encodeString, encodeNumber, encodeFloat,
  decodeString, decodeNumber,
  tokenize, parse,
  JeomVM,
  JeomError, JeomBreak, JeomContinue,
  JeomReturn, JeomGoto, JeomExit,
  OP_TABLE, DOT_CHARS, C,
} = require('./core/engine.js');
```

-----

*End of JeomLang Language Specification*
