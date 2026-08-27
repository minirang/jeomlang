# 점랭(JeomLang) 언어 문법 레퍼런스 (한국어)

> 점 유니코드 문자 16종만으로 작성하는 스택 기반 난해한 프로그래밍 언어

-----

## 문자 집합

점 언어에서 의미를 가지는 문자는 아래 16종뿐입니다.  
공백(스페이스, 탭, 개행)은 토큰 구분자로만 사용되며 의미가 없습니다.  
그 외 문자는 렉서 오류입니다.

|기호 |유니코드  |이름                         |용도                   |
|:-:|:----:|---------------------------|---------------------|
|`.`|U+002E|FULL STOP                  |0비트                  |
|`·`|U+00B7|MIDDLE DOT                 |1비트                  |
|`˙`|U+02D9|DOT ABOVE                  |함수 관련 명령             |
|`•`|U+2022|BULLET                     |숫자 리터럴 구분자           |
|`․`|U+2024|ONE DOT LEADER             |명령 조합                |
|`‥`|U+2025|TWO DOT LEADER             |반복 · 오류 · **소수점 구분자**|
|`…`|U+2026|HORIZONTAL ELLIPSIS        |조건 분기                |
|`‧`|U+2027|HYPHENATION POINT          |문자열 바이트 구분자          |
|`∘`|U+2218|RING OPERATOR              |변수 명령                |
|`⋅`|U+22C5|DOT OPERATOR               |산술 · 논리 명령           |
|`●`|U+25CF|BLACK CIRCLE               |문자열 리터럴 구분자          |
|`◦`|U+25E6|WHITE BULLET               |배열 · 딕셔너리 명령         |
|`⦁`|U+2981|Z NOTATION SPOT            |스택 조작 명령             |
|`⸳`|U+2E33|RAISED DOT                 |타입 변환 명령             |
|`⋮`|U+22EE|VERTICAL ELLIPSIS          |블록                   |
|`⋯`|U+22EF|MIDLINE HORIZONTAL ELLIPSIS|파일 · 모듈 명령           |
|`◘`|U+25D8|INVERSE BULLET             |주석 (줄 끝까지, 토큰 아님)    |

-----

## 리터럴

### 정수 리터럴

```
정수 ::= '•' 비트열 '•'
비트열 ::= (ZERO | ONE)+
ZERO ::= '.'   (U+002E)
ONE  ::= '·'   (U+00B7)
```

- 비트열은 big-endian 이진수입니다.
- `••` = 0 (빈 비트열은 0)
- `•·•` = 1
- `•·.·•` = 5 (binary `101`)
- `•·.·.•` = 10 (binary `1010`)

### 소수 리터럴 (v1.1.0)

```
소수 ::= '•' 비트열 '‥' 비트열 '•'
```

- `‥` (U+2025) 가 정수부와 소수부를 구분합니다.
- 정수부 비트열은 정수 리터럴과 동일한 방식으로 해석합니다.
- 소수부 비트열에서 i번째(0-indexed) 비트의 값은 `bit × 2^-(i+1)` 입니다.
- `•·‥·•` = 1.5 (정수부 `·`=1, 소수부 `·`=0.5)
- `•··‥.·•` = 3.25 (정수부 `··`=3, 소수부 `.·`=0.25)
- `•‥·•` = 0.5 (정수부 없음=0, 소수부 `·`=0.5)
- `•··‥.•` = 3.0 (정수부 `··`=3, 소수부 `.`=0)

### 문자열 리터럴

```
문자열 ::= '●' 바이트열 '●'
바이트열 ::= (바이트 '‧')* 바이트?
바이트 ::= (ZERO | ONE) × 8  (8비트)
```

- 각 바이트는 정확히 8개의 0/1 비트로 표현합니다.
- 바이트 경계는 `‧` (U+2027)으로 구분합니다.
- 인코딩은 UTF-8입니다.
- 리터럴 내부의 공백(스페이스, 탭, 개행)은 무시됩니다 (가독성용).

```jeom
◘ "Hi" 인코딩 예시
◘ H = 0x48 = 01001000 → .·..····
◘ i = 0x69 = 01101001 → .··.·..·
●.·..·...‧.··.·..·●
```

### MAIN 마커

```
MAIN ::= '•·'  (뒤에 공백 또는 EOF 또는 주석이 올 때만)
```

- `•·` 다음에 공백/EOF/주석이 아닌 비트 문자가 오면 숫자 리터럴로 처리합니다.
- 예: `•·.·.•`는 숫자 10이고, `•·` (뒤에 공백)은 MAIN 마커입니다.

-----

## 프로그램 구조

```
프로그램 ::= 함수정의* MAIN블록
MAIN블록 ::= '•·' 문장* '⋮⋮'
```

- 함수 정의는 MAIN 블록 앞에 위치합니다.
- 최상위 함수 정의는 MAIN 실행 전에 등록됩니다 (호이스팅).
- MAIN 블록은 프로그램 당 하나입니다.

-----

## 블록

```
블록 ::= '⋮' 문장* '⋮⋮'
```

- `⋮` (U+22EE) 로 시작하고 `⋮⋮` 로 끝납니다.
- 블록은 중첩 가능합니다.

-----

## 변수

```
VAR   ::= '∘' 이름 값표현식      ◘ 선언 + 할당
GET   ::= '∘∘' 이름              ◘ 읽기 → 스택 push
STORE ::= '∘⋅' 이름              ◘ 스택 팝 → 저장
DEL   ::= '∘∘∘' 이름             ◘ 삭제

이름 ::= OP토큰  (어떤 점 문자 조합도 이름으로 사용 가능)
값표현식 ::= 숫자리터럴 | 문자열리터럴 | GET | OP토큰
```

변수명은 어떤 점 문자 조합도 가능합니다. 명령 토큰과 동일한 시퀀스도 이름으로 쓸 수 있습니다 (컨텍스트로 구분).

```jeom
◘ 예시
∘ · •·.·.•      ◘ 변수 · = 10
∘∘ ·             ◘ 변수 · 읽기 → 스택
•·.·.•
∘⋅ ·             ◘ 스택 팝 → 변수 · 에 저장
∘∘∘ ·            ◘ 변수 · 삭제
```

-----

## 스택 조작

|토큰     |명령  |동작           |
|-------|----|-------------|
|`⦁ <값>`|PUSH|값을 스택에 push  |
|`⦁⦁`   |POP |스택 팝 (버림)    |
|`⦁⦁⦁`  |SWAP|상위 2개 교환     |
|`⦁∘⦁`  |DUP |최상단 복제       |
|`⦁∘`   |PEEK|최상단 복사 (팝 없이)|

스택 연산 순서: `A B ⋅` → a=두 번째 팝, b=첫 번째 팝, 결과 = a + b

-----

## 산술 연산

모두 이진(두 피연산자) 연산이며, b=먼저 팝, a=나중 팝 순서입니다.

|토큰    |명령 |결과                               |
|------|---|---------------------------------|
|`⋅`   |ADD|a + b (숫자는 덧셈, 문자열은 연결, 배열은 이어붙임)|
|`⋅⋅`  |SUB|a - b                            |
|`⋅⋅⋅` |MUL|a × b                            |
|`⋅∘`  |DIV|a ÷ b (b=0이면 런타임 오류)             |
|`⋅∘∘` |MOD|a % b                            |
|`⋅∘∘∘`|POW|a ^ b                            |

-----

## 비교 연산

결과는 1 (참) 또는 0 (거짓)입니다.

|토큰     |명령 |조건    |
|-------|---|------|
|`⋅‧`   |EQ |a == b|
|`⋅‧‧`  |NEQ|a != b|
|`⋅‧‧‧` |LT |a < b |
|`⋅‧∘`  |GT |a > b |
|`⋅‧∘∘` |LTE|a <= b|
|`⋅‧∘∘∘`|GTE|a >= b|

-----

## 논리 연산

결과는 1 (참) 또는 0 (거짓)입니다.

|토큰    |명령 |동작     |
|------|---|-------|
|`⋅⦁`  |AND|a && b |
|`⋅⦁⦁` |OR |a || b |
|`⋅⦁⦁⦁`|NOT|!a     |
|`⋅⦁∘` |XOR|a XOR b|

**Truthy 규칙:** `0`, `null`, `undefined`, 빈 문자열 `""`, 빈 배열 `[]` → falsy. 나머지 → truthy.

-----

## 조건 분기

### IF

```
IF문 ::= '…' 블록
```

스택에서 값을 팝하여 truthy면 블록 실행.

### IF-ELSE

```
IF-ELSE문 ::= '…' 블록 '…·' 블록
```

### IF-ELIF-ELSE

```
IF-ELIF문 ::= '…' 블록
              ('…‥' 블록 블록)*
              ('…·' 블록)?
```

ELIF 패턴: `…‥ ⋮<조건블록>⋮⋮ ⋮<본문블록>⋮⋮`  
조건 블록을 실행하여 스택 팝 값이 truthy면 본문 블록을 실행하고 이후 분기는 건너뜁니다.

```jeom
◘ ELIF 예시: 변수 · 가 1이면 "one", 2이면 "two", 아니면 "other"
∘∘ ·
•·•
⋅‧
…
⋮
  ●.··.····‧.··.···.‧.··..·.·● ··
⋮⋮
…‥
⋮
  ∘∘ ·
  •·.•
  ⋅‧
⋮⋮
⋮
  ●.···.·..‧.···.···‧.··.····● ··
⋮⋮
…·
⋮
  ●.··.····‧.···.·..‧.··.·...‧.··..·.·‧.···..·.● ··
⋮⋮
```

-----

## 반복

### LOOP (횟수 반복)

```
LOOP문 ::= '‥' 블록
```

스택에서 횟수 n을 팝하여 블록을 n회 실행합니다. n ≤ 0이면 실행하지 않습니다.

```jeom
•··•
‥
⋮
  ●.····...● ·    ◘ "x" 를 3번 출력 → xxx
⋮⋮
```

### WHILE

```
WHILE문 ::= '‥‥' 블록 블록
            ◘ WHILE '‥‥' 조건블록 본문블록
```

조건 블록을 실행하여 스택 팝이 truthy인 동안 본문 블록을 반복합니다.

```jeom
◘ i=1 부터 4 미만까지 출력
∘ · •·•
‥‥
⋮
  ∘∘ ·
  •·..•
  ⋅‧‧‧
⋮⋮
⋮
  ∘∘ ·
  ··
  ∘∘ · •·• ⋅ ∘⋅ ·
⋮⋮
```

### BREAK / CONTINUE

|토큰   |명령   |동작                      |
|-----|-----|------------------------|
|`‥∘` |BREAK|현재 반복문 즉시 탈출            |
|`‥∘∘`|CONT |현재 반복의 나머지를 건너뛰고 다음 반복으로|

-----

## 함수

### 함수 정의

```
함수정의 ::= '˙' 이름 ('˙∘' 이름)* 블록
```

```jeom
˙ ·∘·∘       ◘ 함수 이름: ·∘·∘
˙∘ ·          ◘ 첫 번째 인자: ·
˙∘ ··         ◘ 두 번째 인자: ··
⋮
  ∘∘ ·
  ∘∘ ··
  ⋅
  ˙˙           ◘ 반환
⋮⋮
```

### 함수 호출

```
호출 ::= '˙˙˙' 이름
```

인자는 선언 순서대로 스택에 push한 뒤 호출합니다.

```jeom
•···•  •·.·•    ◘ 7, 5 push
˙˙˙ ·∘·∘         ◘ 호출 → 스택에 12 push
```

### RET (반환)

```
RET ::= '˙˙'
```

스택 최상단 값을 팝하여 반환값으로 전달합니다. 반환값은 호출자의 스택에 push됩니다.

### LAMBDA (익명 함수)

```
람다 ::= '˙⦁' ('˙∘' 이름)* 블록
```

```jeom
˙⦁
˙∘ ·
⋮
  ∘∘ ·
  •·.•
  ⋅⋅⋅
  ˙˙
⋮⋮
∘⋅ ·∘    ◘ 람다를 변수 ·∘ 에 저장
```

### CURRY (부분 적용)

```
CURRY ::= '˙⋅'
```

스택에서 값(첫 번째 인자) 팝 → 함수 팝 → 첫 인자가 고정된 새 함수를 스택에 push합니다.

```jeom
∘∘ ·∘        ◘ add 함수 push
•·.·.•        ◘ 10
˙⋅            ◘ add10 = add(10, ?)
∘⋅ ··
•·.·• ˙˙˙ ··  ◘ add10(5) = 15
```

-----

## 배열

### 생성

```
ARR ::= '◦'
```

스택에서 n(개수)을 팝하고 그 위의 n개 값을 팝하여 배열로 만들어 push합니다.

```jeom
•·• •·.• •··• •··•
◦    ◘ [1, 2, 3]
```

### 인덱싱 및 수정

|토큰   |명령   |동작                                           |
|-----|-----|---------------------------------------------|
|`◦◦` |IDX  |`idx, arr` 팝 → `arr[idx]` push               |
|`◦◦◦`|IDXS |`val, idx, arr` 팝 → `arr[idx]=val` → arr push|
|`◦∘` |APP  |`val, arr` 팝 → arr에 val 추가 → arr push        |
|`◦∘∘`|SLICE|`end, start, arr` 팝 → `arr[start:end]` push  |

### 고차 함수

|토큰    |명령    |동작                                       |
|------|------|-----------------------------------------|
|`◦⋅`  |MAP   |`fn, arr` 팝 → fn을 각 원소에 적용 → 새 배열 push   |
|`◦⋅⋅` |FILTER|`fn, arr` 팝 → fn이 truthy인 원소만 → 새 배열 push|
|`◦⋅⋅⋅`|REDUCE|`init, fn, arr` 팝 → 누적 계산 → 결과 push      |

-----

## 딕셔너리

### 생성

```
DICT ::= '◦‧'
```

스택에서 n(쌍의 수)을 팝하고 그 위의 n×2개 값을 (key, value) 순서로 팝하여 딕셔너리로 만들어 push합니다.

```jeom
●.··.···.‧.··....·‧.··.··.·‧.··..·.·●    ◘ "name"
●.··.·.·.‧.··..·.·‧.··.····‧.··.··.·●    ◘ "jeom"
●.···.··.‧.··..·.·‧.···..·.●             ◘ "ver"
•·•                                        ◘ 1
•·.•
◦‧    ◘ {"name":"jeom","ver":1}
```

### 딕셔너리 조작

|토큰    |명령  |동작                                              |
|------|----|------------------------------------------------|
|`◦‧‧` |DGET|`key, dict` 팝 → `dict[key]` push                |
|`◦‧‧‧`|DSET|`val, key, dict` 팝 → `dict[key]=val` → dict push|
|`◦⦁`  |KEYS|`dict` 팝 → 키 배열 push                            |
|`◦⦁⦁` |VALS|`dict` 팝 → 값 배열 push                            |

-----

## 타입 변환

|토큰   |명령   |동작                                                         |
|-----|-----|-----------------------------------------------------------|
|`⸳`  |INT  |스택 최상단 → 정수 변환 (소수 truncate)                               |
|`⸳⸳` |FLOAT|→ 실수 변환                                                    |
|`⸳⸳⸳`|STR  |→ 문자열 변환                                                   |
|`⸳∘` |BOOL |→ 1 또는 0                                                   |
|`⸳⦁` |TYPE |→ 타입 이름 문자열 (`"number"`, `"string"`, `"array"`, `"object"`)|
|`⸳‧` |LEN  |→ 문자열/배열/딕셔너리 길이                                           |
|`⸳⋅` |CAST |`type, val` 팝 → 명시적 타입 변환                                  |

-----

## 오류 처리

### TRY-CATCH-FINALLY

```
TRY문 ::= '‥·' 블록
          ('‥··' 블록)?
          ('‥·˙' 블록)?
```

- CATCH 블록 진입 시 에러 메시지가 스택에 자동으로 push됩니다.
- FINALLY 블록은 정상/예외 여부와 관계없이 항상 실행됩니다.

```jeom
‥·
⋮
  •·• •• ⋅∘    ◘ 1÷0 → 예외 발생
⋮⋮
‥··
⋮
  ∘⋅ ·          ◘ 에러 메시지를 변수 · 에 저장
  ●···.··..‧·..··...‧·.·..·..‧···.·.··‧·.·..·.·‧·..··...‧..···.·.‧..·.....●
  ∘∘ ·
  ⋅ ··           ◘ "오류: " + 메시지 출력
⋮⋮
‥·˙
⋮
  ●···.··..‧·..··..·‧·....·..‧···.·.··‧·.·...··‧·...··..● ··    ◘ "완료" 출력
⋮⋮
```

### THROW / ASSERT

|토큰   |명령    |동작                  |
|-----|------|--------------------|
|`‥·∘`|THROW |스택 팝 → 해당 메시지로 예외 발생|
|`‥·⦁`|ASSERT|스택 팝 → falsy이면 예외 발생|

-----

## 입출력

|토큰   |명령     |동작                      |
|-----|-------|------------------------|
|`·`  |PRINT  |스택 팝 → stdout (줄바꿈 없음)  |
|`··` |PRINTLN|스택 팝 → stdout + `\n`    |
|`·∘` |ERR    |스택 팝 → stderr + `\n`    |
|`·˙` |INPUT  |stdin 한 줄 읽기 → 문자열로 push|
|`·˙˙`|INPUTN |stdin 한 줄 읽기 → 숫자로 push |

-----

## 파일시스템

|토큰   |명령     |동작                          |
|-----|-------|----------------------------|
|`⋯⋯` |FOPEN  |`mode, path` 팝 → 파일 핸들 push |
|`⋯⋯⋯`|FREAD  |핸들 팝 → 파일 내용 문자열 push       |
|`⋯∘` |FWRITE |`content, handle` 팝 → 파일에 쓰기|
|`⋯∘∘`|FCLOSE |핸들 팝 (닫기)                   |
|`⋯⦁` |FEXIST |path 팝 → 존재하면 1, 아니면 0 push |
|`⋯⦁⦁`|FDELETE|path 팝 → 파일 삭제              |
|`⋯⋅` |FLIST  |path 팝 → 디렉터리 항목 배열 push    |
|`⋯‧` |MKDIR  |path 팝 → 디렉터리 생성            |

-----

## 모듈 시스템

```
IMPORT문 ::= '⋯·⦁'
```

스택에서 경로(문자열)를 팝하여 해당 `.jeom` 파일을 로드합니다.  
로드된 파일의 함수와 변수가 현재 환경에 병합됩니다.  
순환 임포트는 캐싱으로 방지합니다.

```jeom
●.···..··‧.···.·..‧.··..·..‧.··.··..‧.··.·..·‧.··...·.‧..·.····‧.···..··‧.···.·..‧.··..·..‧..·.···.‧.··.·.·.‧.··..·.·‧.··.····‧.··.··.·●
⋯·⦁
```

|토큰   |명령    |동작                 |
|-----|------|-------------------|
|`⋯·⦁`|IMPORT|path 팝 → 모듈 로드 및 병합|
|`⋯·˙`|EXPORT|심볼 내보내기            |

-----

## 흐름 제어 (GOTO/LABEL)

```
LABEL문 ::= '⋯·' 이름
GOTO문  ::= '⋯' 이름
```

```jeom
⋯ ·∘             ◘ ·∘ 레이블로 점프
●···.·.·.‧·.··...·‧·.··.·..‧···.·.··‧·....·..‧·...·...‧···.·.··‧·..···..‧·.......● ··    ◘ 건너뜀 (실행 안 됨)
⋯· ·∘             ◘ 레이블 정의
●···.··..‧·..·.···‧·.·.··..‧···.·.·.‧·.···...‧·.··....‧···.··..‧·....·..‧·..···..‧..·.....‧···.··..‧·...·.··‧·.·..·..‧···.··.·‧·..·.··.‧·...·..·● ··    ◘ 여기서 실행
```

-----

## 시스템 명령

|토큰    |명령   |동작                                             |
|------|-----|-----------------------------------------------|
|`⋮∘`  |EXIT |스택 팝(종료 코드) → 프로그램 종료                          |
|`⋮∘∘` |NOOP |아무것도 하지 않음                                     |
|`⋮⦁`  |DEBUG|현재 스택 전체를 stderr에 출력                           |
|`⋮⋅`  |TIME |현재 유닉스 타임스탬프(초) push                           |
|`⋮‧`  |RAND |0.0 이상 1.0 미만 난수 push                          |
|`⋮‧‧` |HASH |문자열 팝 → djb2 해시값(16진수 문자열) push                |
|`⋮‧‧‧`|REGEX|`pattern, text` 팝 → 첫 번째 매칭 문자열 push (없으면 null)|
|`⋮·⦁` |SLEEP|밀리초 팝 → 대기                                     |
|`⋮·`  |EVAL |문자열 팝 → 점 코드로 실행                               |
|`⋮··` |EXEC |시스템 명령 문자열 팝 → 실행 결과 push                      |
|`⋮·∘` |ENV  |환경변수 이름 팝 → 값 push                             |

-----

## 주석

```
주석 ::= '◘' (줄 끝까지의 모든 문자)
```

`◘` (U+25D8) 이후 같은 줄의 내용은 모두 무시됩니다. 토큰으로 처리되지 않습니다.

```jeom
•·
  ∘ · •·.·.•    ◘ a = 10 (이 부분은 주석)
⋮⋮
```

-----

## 실행 모델 요약

1. **렉서**: 소스 → 토큰 목록 (NUMBER, STRING, OP, EOF)
1. **파서**: 토큰 → AST (FUNCDEF, MAIN, IF, WHILE, LOOP, TRY, CALL 등)
1. **VM**: AST를 순서대로 실행하는 스택 기반 인터프리터
- 최상위 함수 정의를 먼저 등록 (호이스팅)
- MAIN 블록 실행
- 모든 값은 스택을 통해 전달
- 변수는 환경(env) 딕셔너리에 저장
- 함수 호출 시 클로저 스냅샷 사용

-----

## 완전한 예제

```jeom
◘ 팩토리얼 (재귀) — 5! = 120
˙ ·∘·
˙∘ ·
⋮
  ∘∘ ·
  •·•
  ⋅‧∘∘
  …
  ⋮
    •·•
    ˙˙
  ⋮⋮
  ∘∘ ·
  ∘∘ ·
  •·•
  ⋅⋅
  ˙˙˙ ·∘·
  ⋅⋅⋅
  ˙˙
⋮⋮

•·
  •·.·•
  ˙˙˙ ·∘·
  ··
⋮⋮
```

출력: `120` (5!)

-----

*점랭(JeomLang) 언어 문법 레퍼런스*


-----

# JeomLang Language Syntax Reference (English)

> A stack-based esoteric programming language written using only 16 Unicode dot characters

-----

## Character Set

Only the 16 characters below have meaning in JeomLang.  
Whitespace (spaces, tabs, newlines) is used only as a token separator and has no semantic meaning.  
Any other character will cause a lexer error.

|Symbol|Unicode |Name                       |Role                 |
|:-:|:----:|---------------------------|---------------------|
|`.`|U+002E|FULL STOP                  |0 bit                |
|`·`|U+00B7|MIDDLE DOT                 |1 bit                |
|`˙`|U+02D9|DOT ABOVE                  |Function-related commands|
|`•`|U+2022|BULLET                     |Numeric literal separator|
|`․`|U+2024|ONE DOT LEADER             |Command combination      |
|`‥`|U+2025|TWO DOT LEADER             |Loop · Error · **Decimal separator**|
|`…`|U+2026|HORIZONTAL ELLIPSIS        |Conditional branching    |
|`‧`|U+2027|HYPHENATION POINT          |String byte separator    |
|`∘`|U+2218|RING OPERATOR              |Variable commands        |
|`⋅`|U+22C5|DOT OPERATOR               |Arithmetic · Logic commands|
|`●`|U+25CF|BLACK CIRCLE               |String literal separator |
|`◦`|U+25E6|WHITE BULLET               |Array · Dictionary commands|
|`⦁`|U+2981|Z NOTATION SPOT            |Stack manipulation commands|
|`⸳`|U+2E33|RAISED DOT                 |Type conversion commands |
|`⋮`|U+22EE|VERTICAL ELLIPSIS          |Block                |
|`⋯`|U+22EF|MIDLINE HORIZONTAL ELLIPSIS|File · Module commands   |
|`◘`|U+25D8|INVERSE BULLET             |Comment (to end of line, not a token)|

-----

## Literals

### Integer Literals

```
Integer ::= '•' BitString '•'
BitString ::= (ZERO | ONE)+
ZERO ::= '.'   (U+002E)
ONE  ::= '·'   (U+00B7)
```

- The bit string is a big-endian binary number.
- `••` = 0 (Empty bit string is 0)
- `•·•` = 1
- `•·.·•` = 5 (binary `101`)
- `•·.·.•` = 10 (binary `1010`)

### Float Literals (v1.1.0)

```
Float ::= '•' BitString '‥' BitString '•'
```

- `‥` (U+2025) separates the integer and fractional parts.
- The integer part bit string is interpreted the same way as an integer literal.
- The value of the i-th (0-indexed) bit in the fractional part is `bit × 2^-(i+1)`.
- `•·‥·•` = 1.5 (Integer part `·`=1, fractional part `·`=0.5)
- `•··‥.·•` = 3.25 (Integer part `··`=3, fractional part `.·`=0.25)
- `•‥·•` = 0.5 (No integer part=0, fractional part `·`=0.5)
- `•··‥.•` = 3.0 (Integer part `··`=3, fractional part `.`=0)

### String Literals

```
String ::= '●' ByteString '●'
ByteString ::= (Byte '‧')* Byte?
Byte ::= (ZERO | ONE) × 8  (8 bits)
```

- Each byte is represented by exactly 8 bits of 0/1.
- Byte boundaries are separated by `‧` (U+2027).
- The encoding is UTF-8.
- Whitespace (spaces, tabs, newlines) inside literals is ignored (for readability).

```jeom
◘ "Hi" encoding example
◘ H = 0x48 = 01001000 → .·..····
◘ i = 0x69 = 01101001 → .··.·..·
●.·..·...‧.··.·..·●
```

### MAIN Marker

```
MAIN ::= '•·'  (Only when followed by whitespace or EOF or comment)
```

- If a bit character comes after `•·` instead of whitespace/EOF/comment, it is treated as a numeric literal.
- Example: `•·.·.•` is the number 10, and `•·` (followed by space) is the MAIN marker.

-----

## Program Structure

```
Program ::= FunctionDef* MAINBlock
MAINBlock ::= '•·' Statement* '⋮⋮'
```

- Function definitions are placed before the MAIN block.
- Top-level function definitions are registered before MAIN execution (hoisting).
- There is one MAIN block per program.

-----

## Blocks

```
Block ::= '⋮' Statement* '⋮⋮'
```

- Starts with `⋮` (U+22EE) and ends with `⋮⋮`.
- Blocks can be nested.

-----

## Variables

```
VAR   ::= '∘' Name ValueExpr     ◘ Declare + Assign
GET   ::= '∘∘' Name              ◘ Read → Push to stack
STORE ::= '∘⋅' Name              ◘ Pop stack → Store
DEL   ::= '∘∘∘' Name             ◘ Delete

Name ::= OP Token  (Any combination of dot characters can be used as a name)
ValueExpr ::= NumericLiteral | StringLiteral | GET | OPToken
```

Variable names can be any combination of dot characters. Even sequences identical to command tokens can be used as names (distinguished by context).

```jeom
◘ Example
∘ · •·.·.•      ◘ Variable · = 10
∘∘ ·             ◘ Read variable · → stack
•·.·.•
∘⋅ ·             ◘ Pop stack → store in variable ·
∘∘∘ ·            ◘ Delete variable ·
```

-----

## Stack Manipulation

|Token    |Command|Action       |
|-------|----|-------------|
|`⦁ <value>`|PUSH|Push value to stack|
|`⦁⦁`   |POP |Pop stack (discard)|
|`⦁⦁⦁`  |SWAP|Swap top 2 items|
|`⦁∘⦁`  |DUP |Duplicate top item|
|`⦁∘`   |PEEK|Copy top item (without popping)|

Stack operation order: `A B ⋅` → a=second pop, b=first pop, result = a + b

-----

## Arithmetic Operations

All are binary (two operand) operations, ordered by b=first pop, a=second pop.

|Token |Command|Result                           |
|------|---|---------------------------------|
|`⋅`   |ADD|a + b (Number addition, string concatenation, array merge)|
|`⋅⋅`  |SUB|a - b                            |
|`⋅⋅⋅` |MUL|a × b                            |
|`⋅∘`  |DIV|a ÷ b (Runtime error if b=0)             |
|`⋅∘∘` |MOD|a % b                            |
|`⋅∘∘∘`|POW|a ^ b                            |

-----

## Comparison Operations

Result is 1 (true) or 0 (false).

|Token    |Command|Condition|
|-------|---|------|
|`⋅‧`   |EQ |a == b|
|`⋅‧‧`  |NEQ|a != b|
|`⋅‧‧‧` |LT |a < b |
|`⋅‧∘`  |GT |a > b |
|`⋅‧∘∘` |LTE|a <= b|
|`⋅‧∘∘∘`|GTE|a >= b|

-----

## Logical Operations

Result is 1 (true) or 0 (false).

|Token |Command|Action |
|------|---|-------|
|`⋅⦁`  |AND|a && b |
|`⋅⦁⦁` |OR |a || b |
|`⋅⦁⦁⦁`|NOT|!a     |
|`⋅⦁∘` |XOR|a XOR b|

**Truthy Rules:** `0`, `null`, `undefined`, empty string `""`, empty array `[]` → falsy. The rest → truthy.

-----

## Conditional Branching

### IF

```
IF Statement ::= '…' Block
```

Pops value from stack; if truthy, executes block.

### IF-ELSE

```
IF-ELSE Statement ::= '…' Block '…·' Block
```

### IF-ELIF-ELSE

```
IF-ELIF Statement ::= '…' Block
                      ('…‥' Block Block)*
                      ('…·' Block)?
```

ELIF pattern: `…‥ ⋮<ConditionBlock>⋮⋮ ⋮<BodyBlock>⋮⋮`  
Executes the condition block; if the popped stack value is truthy, executes the body block and skips subsequent branches.

```jeom
◘ ELIF example: If variable · is 1 "one", if 2 "two", else "other"
∘∘ ·
•·•
⋅‧
…
⋮
  ●.··.····‧.··.···.‧.··..·.·● ··
⋮⋮
…‥
⋮
  ∘∘ ·
  •·.•
  ⋅‧
⋮⋮
⋮
  ●.···.·..‧.···.···‧.··.····● ··
⋮⋮
…·
⋮
  ●.··.····‧.···.·..‧.··.·...‧.··..·.·‧.···..·.● ··
⋮⋮
```

-----

## Loops

### LOOP (Count iteration)

```
LOOP Statement ::= '‥' Block
```

Pops the count n from the stack and executes the block n times. Does not execute if n ≤ 0.

```jeom
•··•
‥
⋮
  ●.····...● ·    ◘ Print "x" 3 times → xxx
⋮⋮
```

### WHILE

```
WHILE Statement ::= '‥‥' Block Block
                    ◘ WHILE '‥‥' ConditionBlock BodyBlock
```

Executes the condition block and repeats the body block as long as the popped stack value is truthy.

```jeom
◘ Print i=1 to less than 4
∘ · •·•
‥‥
⋮
  ∘∘ ·
  •·..•
  ⋅‧‧‧
⋮⋮
⋮
  ∘∘ ·
  ··
  ∘∘ · •·• ⋅ ∘⋅ ·
⋮⋮
```

### BREAK / CONTINUE

|Token  |Command|Action                  |
|-----|-----|------------------------|
|`‥∘` |BREAK|Exit the current loop immediately      |
|`‥∘∘`|CONT |Skip the rest of the current iteration and go to the next|

-----

## Functions

### Function Definition

```
FunctionDef ::= '˙' Name ('˙∘' Name)* Block
```

```jeom
˙ ·∘·∘       ◘ Function name: ·∘·∘
˙∘ ·          ◘ First argument: ·
˙∘ ··         ◘ Second argument: ··
⋮
  ∘∘ ·
  ∘∘ ··
  ⋅
  ˙˙           ◘ Return
⋮⋮
```

### Function Call

```
Call ::= '˙˙˙' Name
```

Arguments are pushed to the stack in declaration order before calling.

```jeom
•···•  •·.·•    ◘ Push 7, 5
˙˙˙ ·∘·∘         ◘ Call → push 12 to stack
```

### RET (Return)

```
RET ::= '˙˙'
```

Pops the top value from the stack and passes it as the return value. The return value is pushed to the caller's stack.

### LAMBDA (Anonymous Function)

```
LAMBDA ::= '˙⦁' ('˙∘' Name)* Block
```

```jeom
˙⦁
˙∘ ·
⋮
  ∘∘ ·
  •·.•
  ⋅⋅⋅
  ˙˙
⋮⋮
∘⋅ ·∘    ◘ Store lambda in variable ·∘
```

### CURRY (Partial Application)

```
CURRY ::= '˙⋅'
```

Pops value (first argument) from stack → pops function → pushes a new function with the first argument fixed to the stack.

```jeom
∘∘ ·∘        ◘ push add function
•·.·.•        ◘ 10
˙⋅            ◘ add10 = add(10, ?)
∘⋅ ··
•·.·• ˙˙˙ ··  ◘ add10(5) = 15
```

-----

## Arrays

### Creation

```
ARR ::= '◦'
```

Pops n (count) from the stack, then pops n values above it to create an array and pushes it.

```jeom
•·• •·.• •··• •··•
◦    ◘ [1, 2, 3]
```

### Indexing and Modification

|Token  |Command|Action                                     |
|-----|-----|---------------------------------------------|
|`◦◦` |IDX  |Pop `idx, arr` → push `arr[idx]`               |
|`◦◦◦`|IDXS |Pop `val, idx, arr` → `arr[idx]=val` → push arr|
|`◦∘` |APP  |Pop `val, arr` → append val to arr → push arr  |
|`◦∘∘`|SLICE|Pop `end, start, arr` → push `arr[start:end]`  |

### Higher-order Functions

|Token  |Command|Action                                   |
|------|------|-----------------------------------------|
|`◦⋅`  |MAP   |Pop `fn, arr` → apply fn to each element → push new array|
|`◦⋅⋅` |FILTER|Pop `fn, arr` → only elements where fn is truthy → push new array|
|`◦⋅⋅⋅`|REDUCE|Pop `init, fn, arr` → accumulate → push result |

-----

## Dictionaries

### Creation

```
DICT ::= '◦‧'
```

Pops n (number of pairs) from the stack, then pops n×2 values above it in (key, value) order to create a dictionary and pushes it.

```jeom
●.··.···.‧.··....·‧.··.··.·‧.··..·.·●    ◘ "name"
●.··.·.·.‧.··..·.·‧.··.····‧.··.··.·●    ◘ "jeom"
●.···.··.‧.··..·.·‧.···..·.●             ◘ "ver"
•·•                                        ◘ 1
•·.•
◦‧    ◘ {"name":"jeom","ver":1}
```

### Dictionary Manipulation

|Token  |Command|Action                                          |
|------|----|------------------------------------------------|
|`◦‧‧` |DGET|Pop `key, dict` → push `dict[key]`                |
|`◦‧‧‧`|DSET|Pop `val, key, dict` → `dict[key]=val` → push dict|
|`◦⦁`  |KEYS|Pop `dict` → push key array                       |
|`◦⦁⦁` |VALS|Pop `dict` → push value array                     |

-----

## Type Conversion

|Token|Command|Action                                                     |
|-----|-----|-----------------------------------------------------------|
|`⸳`  |INT  |Top of stack → convert to integer (truncate fraction)      |
|`⸳⸳` |FLOAT|→ convert to float                                         |
|`⸳⸳⸳`|STR  |→ convert to string                                        |
|`⸳∘` |BOOL |→ 1 or 0                                                   |
|`⸳⦁` |TYPE |→ type name string (`"number"`, `"string"`, `"array"`, `"object"`)|
|`⸳‧` |LEN  |→ string/array/dictionary length                           |
|`⸳⋅` |CAST |Pop `type, val` → explicit type conversion                 |

-----

## Error Handling

### TRY-CATCH-FINALLY

```
TRY Statement ::= '‥·' Block
                  ('‥··' Block)?
                  ('‥·˙' Block)?
```

- Upon entering the CATCH block, the error message is automatically pushed to the stack.
- The FINALLY block is always executed regardless of success/exception.

```jeom
‥·
⋮
  •·• •• ⋅∘    ◘ 1÷0 → exception occurs
⋮⋮
‥··
⋮
  ∘⋅ ·          ◘ Store error message in variable ·
  ●···.··..‧·..··...‧·.·..·..‧···.·.··‧·.·..·.·‧·..··...‧..···.·.‧..·.....●
  ∘∘ ·
  ⋅ ··           ◘ Print "Error: " + message
⋮⋮
‥·˙
⋮
  ●···.··..‧·..··..·‧·....·..‧···.·.··‧·.·...··‧·...··..● ··    ◘ Print "Done"
⋮⋮
```

### THROW / ASSERT

|Token  |Command|Action              |
|-----|------|--------------------|
|`‥·∘`|THROW |Pop stack → throw exception with message|
|`‥·⦁`|ASSERT|Pop stack → throw exception if falsy|

-----

## I/O

|Token|Command|Action                  |
|-----|-------|------------------------|
|`·`  |PRINT  |Pop stack → stdout (no newline)  |
|`··` |PRINTLN|Pop stack → stdout + `\n`    |
|`·∘` |ERR    |Pop stack → stderr + `\n`    |
|`·˙` |INPUT  |Read line from stdin → push as string|
|`·˙˙`|INPUTN |Read line from stdin → push as number |

-----

## File System

|Token |Command|Action                      |
|-----|-------|----------------------------|
|`⋯⋯` |FOPEN  |Pop `mode, path` → push file handle |
|`⋯⋯⋯`|FREAD  |Pop handle → push file content string     |
|`⋯∘` |FWRITE |Pop `content, handle` → write to file|
|`⋯∘∘`|FCLOSE |Pop handle (close)                  |
|`⋯⦁` |FEXIST |Pop path → push 1 if exists, else 0 |
|`⋯⦁⦁`|FDELETE|Pop path → delete file              |
|`⋯⋅` |FLIST  |Pop path → push array of directory entries    |
|`⋯‧` |MKDIR  |Pop path → create directory            |

-----

## Module System

```
IMPORT Statement ::= '⋯·⦁'
```

Pops the path (string) from the stack and loads the corresponding `.jeom` file.  
Functions and variables of the loaded file are merged into the current environment.  
Circular imports are prevented via caching.

```jeom
●.···..··‧.···.·..‧.··..·..‧.··.··..‧.··.·..·‧.··...·.‧..·.····‧.···..··‧.···.·..‧.··..·..‧..·.···.‧.··.·.·.‧.··..·.·‧.··.····‧.··.··.·●
⋯·⦁
```

|Token|Command|Action               |
|-----|------|-------------------|
|`⋯·⦁`|IMPORT|Pop path → load and merge module|
|`⋯·˙`|EXPORT|Export symbol      |

-----

## Flow Control (GOTO/LABEL)

```
LABEL Statement ::= '⋯·' Name
GOTO Statement  ::= '⋯' Name
```

```jeom
⋯ ·∘             ◘ Jump to label ·∘
●···.·.·.‧·.··...·‧·.··.·..‧···.·.··‧·....·..‧·...·...‧···.·.··‧·..···..‧·.......● ··    ◘ Skipped (not executed)
⋯· ·∘             ◘ Label definition
●···.··..‧·..·.···‧·.·.··..‧···.·.·.‧·.···...‧·.··....‧···.··..‧·....·..‧·..···..‧..·.....‧···.··..‧·...·.··‧·.·..·..‧···.··.·‧·..·.··.‧·...·..·● ··    ◘ Executed here
```

-----

## System Commands

|Token |Command|Action                                          |
|------|-----|-----------------------------------------------|
|`⋮∘`  |EXIT |Pop stack (exit code) → exit program                      |
|`⋮∘∘` |NOOP |Do nothing                                     |
|`⋮⦁`  |DEBUG|Print entire stack to stderr                           |
|`⋮⋅`  |TIME |Push current Unix timestamp (seconds)                           |
|`⋮‧`  |RAND |Push random number between 0.0 and 1.0                          |
|`⋮‧‧` |HASH |Pop string → push djb2 hash (hex string)                |
|`⋮‧‧‧`|REGEX|Pop `pattern, text` → push first matched string (null if none)|
|`⋮·⦁` |SLEEP|Pop milliseconds → wait                                     |
|`⋮·`  |EVAL |Pop string → execute as Jeom code                               |
|`⋮··` |EXEC |Pop system command string → push execution result                      |
|`⋮·∘` |ENV  |Pop environment variable name → push value                             |

-----

## Comments

```
Comment ::= '◘' (All characters until end of line)
```

All content on the same line after `◘` (U+25D8) is ignored. It is not processed as a token.

```jeom
•·
  ∘ · •·.·.•    ◘ a = 10 (this part is a comment)
⋮⋮
```

-----

## Execution Model Summary

1. **Lexer**: Source → Token list (NUMBER, STRING, OP, EOF)
1. **Parser**: Token → AST (FUNCDEF, MAIN, IF, WHILE, LOOP, TRY, CALL, etc.)
1. **VM**: Stack-based interpreter executing AST sequentially
- Registers top-level function definitions first (hoisting)
- Executes MAIN block
- All values are passed through the stack
- Variables are stored in the environment (env) dictionary
- Uses closure snapshots on function call

-----

## Complete Example

```jeom
◘ Factorial (Recursive) — 5! = 120
˙ ·∘·
˙∘ ·
⋮
  ∘∘ ·
  •·•
  ⋅‧∘∘
  …
  ⋮
    •·•
    ˙˙
  ⋮⋮
  ∘∘ ·
  ∘∘ ·
  •·•
  ⋅⋅
  ˙˙˙ ·∘·
  ⋅⋅⋅
  ˙˙
⋮⋮

•·
  •·.·•
  ˙˙˙ ·∘·
  ··
⋮⋮
```

Output: `120` (5!)

-----

*JeomLang Language Syntax Reference*
