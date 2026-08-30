# JEOM Compatibility (한국어)

이 확장은 CLI를 다음 순서로 찾습니다: `core/cli.js` → `official/cli.js` (워크스페이스·확장 번들).

공식 엔진과의 호환성을 유지하려면 `npm run update-jeom`으로 `official/` 폴더를 최신 공식 파일로 갱신하면 됩니다.

## Bundled Official Files

```text
jeomlang/                    (공식 모노레포)
  core/cli.js
  core/engine.js
  stdlib/std.jeom

이 리포 (단독 확장)/
  official/cli.js            ← core/cli.js 사본
  official/engine.js
  official/std.jeom
```

`official/cli.js`는 같은 폴더의 `engine.js`를 로드합니다.
공식 리포 루트를 VS Code로 열면 `core/cli.js`가 우선됩니다.

## External CLI Mode

다른 위치의 공식 CLI를 직접 쓰고 싶다면 VS Code 설정에 명령 템플릿을 지정할 수 있습니다.
공식 CLI의 실행 형식이 아래와 같다면:

```powershell
jeom run hello.jeom
jeom check hello.jeom
```

VS Code 설정에 다음처럼 지정할 수 있습니다.

```json
{
  "jeom.runCommand": "jeom run ${file}",
  "jeom.checkCommand": "jeom check ${file}"
}
```

공식 CLI가 `node`로 실행되는 JS 파일이라면:

```json
{
  "jeom.runCommand": "node C:\\path\\to\\official\\cli.js run ${file}",
  "jeom.checkCommand": "node C:\\path\\to\\official\\cli.js check ${file}"
}
```

## Placeholders

명령 템플릿에서는 다음 값을 사용할 수 있습니다.

- `${file}` 또는 `${filePath}`: 현재 `.jeom` 파일 경로
- `${workspaceFolder}`: 현재 VS Code 워크스페이스 경로
- `${cliPath}`: `jeom.cliPath`로 지정했거나 기본으로 잡힌 CLI 경로
- `${mode}`: `run` 또는 `check`

경로 placeholder는 PowerShell에서 안전하게 따옴표 처리됩니다.

## Default Mode

`jeom.runCommand`와 `jeom.checkCommand`를 비워두면 다음 경로를 사용합니다.

```text
VS Code extension -> node core/cli.js (또는 official/cli.js) run/check file.jeom
```

## Compatibility Check

공식 엔진과 내장 엔진의 호환성을 확인하려면 같은 `.jeom` 예제를 실행해서
출력, 에러 메시지, 종료 코드를 비교해야 합니다.

권장 기준:

- 공식 예제 파일
- README에 있는 최소 예제
- 변수, 함수, 조건문, 반복문, 파일 입출력처럼 동작 차이가 나기 쉬운 예제

---

# JEOM Compatibility (English)

This extension looks for the CLI in the following order: `core/cli.js` → `official/cli.js` (workspace · extension bundle).

To maintain compatibility with the official engine, update the `official/` folder to the latest official files with `npm run update-jeom`.

## Bundled Official Files

```text
jeomlang/                    (official monorepo)
  core/cli.js
  core/engine.js
  stdlib/std.jeom

This repository (standalone extension)/
  official/cli.js            ← copy of core/cli.js
  official/engine.js
  official/std.jeom
```

`official/cli.js` loads `engine.js` from the same folder.
When the root of the official repository is opened in VS Code, `core/cli.js` takes priority.

## External CLI Mode

If you want to use the official CLI from another location directly, you can specify a command template in the VS Code settings.

If the official CLI uses the following execution format:

```powershell
jeom run hello.jeom
jeom check hello.jeom
```

Specify the following in the VS Code settings:

```json
{
  "jeom.runCommand": "jeom run ${file}",
  "jeom.checkCommand": "jeom check ${file}"
}
```

If the official CLI is a JS file executed with `node`:

```json
{
  "jeom.runCommand": "node C:\\path\\to\\official\\cli.js run ${file}",
  "jeom.checkCommand": "node C:\\path\\to\\official\\cli.js check ${file}"
}
```

## Placeholders

The following values can be used in command templates:

- `${file}` or `${filePath}`: Path to the current `.jeom` file
- `${workspaceFolder}`: Path to the current VS Code workspace
- `${cliPath}`: CLI path specified by `jeom.cliPath` or the default CLI path
- `${mode}`: `run` or `check`

Path placeholders are safely quoted in PowerShell.

## Default Mode

If `jeom.runCommand` and `jeom.checkCommand` are left empty, the following path is used:

```text
VS Code extension -> node core/cli.js (or official/cli.js) run/check file.jeom
```

## Compatibility Check

To verify compatibility between the official engine and the bundled engine, run the same `.jeom` examples and compare the output, error messages, and exit codes.

Recommended criteria:

- Official example files
- Minimal examples from the README
- Examples that are likely to have behavioral differences, such as variables, functions, conditionals, loops, and file I/O
