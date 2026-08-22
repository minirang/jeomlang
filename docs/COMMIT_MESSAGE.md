# JeomLang 커밋 메시지 가이드

이 프로젝트는 깔끔한 git 히스토리를 유지하기 위해 Conventional Commits 사양을 따릅니다.

---

## 형식

모든 커밋 메시지는 헤더(필수), 본문(선택), 바닥글(선택)로 구성되어야 합니다.

[형식 템플릿]
type(scope): subject

[body - 선택적 상세 내용]

[footer - 선택적 이슈 링크]

- Type: 반드시 소문자여야 합니다. 커밋의 의도를 나타냅니다.
- Scope: 프로젝트에서 영향을 받는 모듈을 나타냅니다. (선택 사항)
- Subject: 변경 사항에 대한 간결한 설명입니다.
  - 규칙 1: 명령형 어조를 사용하세요. (예: added 대신 add, fixed 대신 fix 사용)
  - 규칙 2: 소문자로 시작하고 마침표로 끝나지 않아야 합니다.

---

## 커밋 타입 (Commit Types)

모든 제목(Subject)은 명령형 어조(명령문 형태)로 작성해야 합니다.

- feat: 새로운 기능
  (예: feat(core): add new unicode dot operator)
- fix: 버그 수정
  (예: fix(interpreter): resolve stack overflow on recursive calls)
- refactor: 버그를 수정하거나 기능을 추가하지 않는 코드 변경
  (예: refactor(parser): modularize token scanning logic)
- style: 코드의 의미에 영향을 주지 않는 변경 사항 (공백, 포맷팅 등)
  (예: style(vscode): fix indentation in extension source)
- docs: 문서 변경만 해당
  (예: docs: add dictionary examples to README.md)
- test: 누락된 테스트 추가 또는 기존 테스트 수정
  (예: test(core): add unit tests for operator precedence)
- perf: 성능을 향상시키는 코드 변경
  (예: perf(parser): optimize AST traversal speed)
- chore: 빌드 프로세스, 보조 도구 또는 라이브러리 변경
  (예: chore: update dependencies in package.json)

---

## 스코프 가이드 (Scope Guide)

JeomLang 생태계의 어느 부분을 수정하는지 명시하기 위해 다음 스코프를 사용하세요:

- core: 언어 사양 및 핵심 정의.
- interpreter: 런타임 엔진 및 인터프리터 메커니즘.
- parser: 구문 분석 및 추상 구문 트리(AST) 생성.
- vscode: VS Code 확장 기능 (구문 강조, 스니펫).
- server: 온라인 인터프리터 백엔드 및 진단 API.

---

## 좋은 예시 (Good Examples)

### 단일 행 커밋
feat(core): implement mapping for new unicode dot characters
fix(interpreter): correct negative number calculation error
docs: add CONTRIBUTING.md for external contributors

### 본문과 바닥글이 포함된 다중 행 커밋
fix(parser): resolve parsing failure on consecutive whitespaces

- Fix tokenization break when multiple whitespaces exist between dot characters.
- Update regex patterns to handle edge case whitespace boundaries.

Fixes: #12

---

## 나쁜 예시 (Bad Examples)

### 1. 잘못된 시제 및 접두사 누락
- [BAD] added new dot mapping
  - 나쁜 이유: 명령형 어조(add) 대신 과거 시제(added)를 사용했으며, 타입 접두사(feat:)를 완전히 누락했습니다.

### 2. 모호한 설명
- [BAD] fix: bug fix
  - 나쁜 이유: 어떤 버그가 수정되었는지에 대한 컨텍스트를 전혀 제공하지 않으므로, 디버깅이나 변경 로그 생성을 위한 git 히스토리로서의 가치가 없습니다.

### 3. 불분명한 의미
- [BAD] feat: modified some stuff
  - 나쁜 이유: modified, updated, stuff 같은 단어는 너무 모호합니다. 어떤 기능이 도입되었는지 정확히 기술하지 않았습니다.

### 4. 잘못된 대소문자 및 문장 부호
- [BAD] Fix(Core): Add new operator.
  - 나쁜 이유: 타입(Fix)과 스코프(Core)는 반드시 완전히 소문자여야 합니다. 제목은 소문자로 시작해야 하며 마침표로 끝나면 안 됩니다.

---

# JeomLang Commit Message Guide

This project follows the Conventional Commits specification to maintain a clean git history.

---

## Format

Every commit message must consist of a header (compulsory), a body (optional), and a footer (optional).

[Format Template]
type(scope): subject

[body - optional details]

[footer - optional issue links]

- Type: Must be lowercase. Represents the intent of the commit.
- Scope: Represents the affected module of the project. (Optional)
- Subject: A concise description of the change. 
  - Rule 1: Use the imperative mood (e.g., Use add instead of added, fix instead of fixed).
  - Rule 2: Start with lowercase and do not end with a period.

---

## Commit Types

All subjects must be written in the imperative mood (command form).

- feat: A new feature
  (e.g., feat(core): add new unicode dot operator)
- fix: A bug fix
  (e.g., fix(interpreter): resolve stack overflow on recursive calls)
- refactor: A code change that neither fixes a bug nor adds a feature
  (e.g., refactor(parser): modularize token scanning logic)
- style: Changes that do not affect the meaning of the code (white-space, formatting)
  (e.g., style(vscode): fix indentation in extension source)
- docs: Documentation only changes
  (e.g., docs: add dictionary examples to README.md)
- test: Adding missing tests or correcting existing tests
  (e.g., test(core): add unit tests for operator precedence)
- perf: A code change that improves performance
  (e.g., perf(parser): optimize AST traversal speed)
- chore: Changes to the build process, auxiliary tools, or libraries
  (e.g., chore: update dependencies in package.json)

---

## Scope Guide

Use these scopes to specify which part of the JeomLang ecosystem you are modifying:

- core: Language specifications and core definitions.
- interpreter: Runtime engine and interpreter mechanics.
- parser: Syntax analysis and Abstract Syntax Tree (AST) generation.
- vscode: VS Code extension features (syntax highlighting, snippets).
- server: Online interpreter backend and diagnostic API.

---

## Good Examples

### Single-line commit
feat(core): implement mapping for new unicode dot characters
fix(interpreter): correct negative number calculation error
docs: add CONTRIBUTING.md for external contributors

### Multi-line commit with body and footer
fix(parser): resolve parsing failure on consecutive whitespaces

- Fix tokenization break when multiple whitespaces exist between dot characters.
- Update regex patterns to handle edge case whitespace boundaries.

Fixes: #12

---

## Bad Examples

### 1. Wrong Tense and No Prefix
- [BAD] added new dot mapping
  - Why it is bad: It uses the past tense (added) instead of the imperative mood (add), and completely omits the type prefix (feat:).

### 2. Vague Description
- [BAD] fix: bug fix
  - Why it is bad: It provides absolutely no context about what bug was fixed, making the git history useless for debugging or changelog generation.

### 3. Ambiguous Meaning
- [BAD] feat: modified some stuff
  - Why it is bad: Words like modified, updated, or stuff are too ambiguous. It does not state exactly what feature was introduced.

### 4. Incorrect Capitalization and Punctuation
- [BAD] Fix(Core): Add new operator.
  - Why it is bad: The type (Fix) and scope (Core) must be entirely lowercase. The subject should start with a lowercase letter and should not end with a period.
