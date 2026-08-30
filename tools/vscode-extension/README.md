# <img src="assets/icon.png" width="22" alt="JEOM" /> JEOM VS Code Runner (한국어)

<p>
  <a href="README.md">📖 <strong>README</strong></a>
  &nbsp;&nbsp;
  <a href="COMPATIBILITY.md">🔗 <strong>Compatibility</strong></a>
  &nbsp;&nbsp;
  <a href="ABSORPTION.md">📦 <strong>공식 리포지토리 흡수</strong></a>
</p>

VS Code에서 점랭(`.jeom`) 파일을 바로 실행하기 위한 확장 프로젝트입니다.
공식 [jeomlang](https://github.com/minirang/jeomlang)의 `tools/vscode-extension/`으로 흡수 예정입니다.

원본 점랭 프로젝트:

- Website: https://jeomlang.vercel.app/
- GitHub: https://github.com/minirang/jeomlang

이 저장소의 목적은 점랭 언어 자체를 소유하거나 배포하는 것이 아니라, VS Code에서 `.jeom` 파일을 Python/C처럼 VS CODE로 실행할 수 있게 만드는 것입니다.

## 기능

- `.jeom` 파일 언어 인식
- `.jeom` 파일 아이콘 표시
- 기본 문법 하이라이트
- 기본 스니펫
- `Ctrl + Shift + B`로 현재 `.jeom` 파일 실행
- 에디터 오른쪽 위 Run 버튼으로 실행
- 파일 상단 `Run JEOM` / `Check JEOM` CodeLens
- 우클릭 메뉴와 명령 팔레트 실행
- `core/cli.js` 또는 번들 `official/cli.js`로 실행
- **크로스 플랫폼 지원**: Windows (PowerShell), Mac/Linux (bash)

## 실행 명령

현재 열린 `.jeom` 파일을 아래 명령으로 실행합니다.

```powershell
node ./official/cli.js run <현재 .jeom 파일>
```

문법 검사는 아래 명령으로 실행합니다.

```powershell
node ./official/cli.js check <현재 .jeom 파일>
```

확장은 워크스페이스의 `core/cli.js`(공식 리포) 또는 `official/cli.js`(이 리포 번들)를 사용합니다.

## Ctrl + Shift + B로 실행

1. VS Code에서 이 폴더를 엽니다.
2. 실행할 `.jeom` 파일을 엽니다.
3. `Ctrl + Shift + B`를 누릅니다.
4. `JEOM: Run Current File` 작업이 실행됩니다.

## Run 버튼으로 실행

Run 버튼과 문법 하이라이트는 VS Code 확장 기능입니다. 현재 VS Code 창에 확장으로 설치되어야 Python처럼 에디터 오른쪽 위 실행 버튼이 나타납니다.

### 권장: 로컬 확장으로 설치

PowerShell에서 아래 명령을 실행합니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-local-extension.ps1
```

그 다음 VS Code를 `Developer: Reload Window`로 다시 불러오거나 완전히 껐다 켭니다. 이후 `.jeom` 파일을 열면 다음이 나타납니다.

- 파일 언어 모드: `JEOM`
- 문법 하이라이트
- 파일 상단 `Run JEOM` / `Check JEOM`
- 에디터 오른쪽 위 재생 버튼

### 개발 모드: F5로 실행

1. 이 저장소를 VS Code로 엽니다.
2. `F5`를 눌러 `Run JEOM VS Code Extension`을 실행합니다.
3. 새로 열린 Extension Development Host 창에서 `.jeom` 파일을 엽니다.
4. 에디터 오른쪽 위 재생 버튼, `Run JEOM` CodeLens, 또는 `Ctrl + F5`로 실행합니다.

F5가 잘 안 되면 위의 로컬 설치 방식을 쓰는 편이 더 안정적입니다. 일반 VS Code 창에서 `Ctrl + F5`가 Node 디버거 실행으로 잡히면 `Debugger attached` 같은 문구와 긴 `NODE_OPTIONS` 명령이 출력될 수 있습니다. 깨끗하게 실행하려면 확장이 설치된 상태에서 `.jeom` 파일의 Run 버튼이나 `Run JEOM` CodeLens를 사용하세요.

확장으로 실행할 때는 `.jeom` 파일이 이 저장소 밖에 있어도 됩니다. 기본적으로 `official/cli.js`를 사용합니다.

## 공식 파일 업데이트

점랭이 업데이트될 때마다 `official/` 폴더의 파일들을 최신 버전으로 동기화할 수 있습니다.

```bash
npm run update-jeom
```

이 명령은 공식 웹사이트에서 다음 파일들을 `official/`에 다운로드합니다 (`core/`, `stdlib/`와 동일 내용):

- `official/cli.js` ← `core/cli.js`
- `official/engine.js` ← `core/engine.js`
- `official/std.jeom` ← `stdlib/std.jeom`

업데이트 완료 시간은 `official/.version` 파일에 저장됩니다.

## CLI 경로 직접 지정

다른 위치의 점랭 CLI를 쓰고 싶다면 VS Code 설정에서 `jeom.cliPath`를 지정하면 됩니다.

예:

```json
{
  "jeom.cliPath": "${workspaceFolder}/official/cli.js"
}
```

공식 CLI의 명령 형식이 다르거나 전역 명령을 쓰고 싶다면 `jeom.runCommand`와 `jeom.checkCommand`를 지정할 수 있습니다.

```json
{
  "jeom.runCommand": "jeom run ${file}",
  "jeom.checkCommand": "jeom check ${file}"
}
```

자세한 호환 방식은 `COMPATIBILITY.md`를 참고하세요.

## 포함된 파일

- `.vscode/tasks.json`: 현재 열린 `.jeom` 파일 실행, `Ctrl + Shift + B` 기본 작업
- `.vscode/settings.json`: `*.jeom` 파일 연결 및 Code Runner 확장 실행 명령
- `.vscode/launch.json`: 확장 개발 호스트 실행 구성
- `.vscode/jeom.code-snippets`: 워크스페이스 스니펫
- `official/`: 공식 `core/`·`stdlib/` 사본 (단독 확장 설치용)
- `ABSORPTION.md`: 공식 리포 `tools/vscode-extension/` 흡수 가이드
- `extension.js`: Run 버튼, CodeLens, 우클릭 메뉴, 명령 팔레트 실행 기능
- `scripts/install-local-extension.ps1`: 현재 확장을 로컬 VS Code 확장 폴더에 설치
- `COMPATIBILITY.md`: 공식 CLI/엔진 호환 방식 설명
- `syntaxes/jeom.tmLanguage.json`: 기본 TextMate 문법 하이라이트 정의
- `language-configuration.json`: 주석, 괄호, 자동 닫기 설정
- `../../assets/img/icon.png`: JEOM 파일 아이콘 (리포 루트 자산)
- `package.json`: VS Code 확장 메타데이터

## 참고

점랭 언어 사양과 예제는 원본 사이트와 원본 GitHub 저장소를 기준으로 확인하세요. 이 저장소는 VS Code 실행 환경을 붙이는 용도입니다.

---

# <img src="assets/icon.png" width="22" alt="JEOM" /> JEOM VS Code Runner (English)

<p>
  <a href="README.md">📖 <strong>README</strong></a>
  &nbsp;&nbsp;
  <a href="COMPATIBILITY.md">🔗 <strong>Compatibility</strong></a>
  &nbsp;&nbsp;
  <a href="ABSORPTION.md">📦 <strong>Official Repository Absorption</strong></a>
</p>

An extension project for running Jeomlang (`.jeom`) files directly in VS Code.
It is planned to be absorbed into `tools/vscode-extension/` of the official [jeomlang](https://github.com/minirang/jeomlang) repository.

Original Jeomlang project:

- Website: https://jeomlang.vercel.app/
- GitHub: https://github.com/minirang/jeomlang

The purpose of this repository is not to own or distribute the Jeomlang language itself, but to make it possible to run `.jeom` files in VS Code like Python/C files.

## Features

- `.jeom` file language recognition
- `.jeom` file icon display
- Basic syntax highlighting
- Basic snippets
- Run the current `.jeom` file with `Ctrl + Shift + B`
- Run with the Run button in the upper-right corner of the editor
- `Run JEOM` / `Check JEOM` CodeLens at the top of the file
- Run from the right-click menu and Command Palette
- Run using `core/cli.js` or the bundled `official/cli.js`
- **Cross-platform support**: Windows (PowerShell), Mac/Linux (bash)

## Run Commands

Run the currently open `.jeom` file with the following command:

```powershell
node ./official/cli.js run <current .jeom file>
```

Run a syntax check with the following command:

```powershell
node ./official/cli.js check <current .jeom file>
```

The extension uses `core/cli.js` from the workspace (official repository) or `official/cli.js` (bundled in this repository).

## Run with Ctrl + Shift + B

1. Open this folder in VS Code.
2. Open the `.jeom` file you want to run.
3. Press `Ctrl + Shift + B`.
4. The `JEOM: Run Current File` task will run.

## Run Button

The Run button and syntax highlighting are VS Code extension features. The extension must currently be installed in the VS Code window for the Run button to appear in the upper-right corner of the editor like Python.

### Recommended: Install as a Local Extension

Run the following command in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-local-extension.ps1
```

Then reload VS Code with `Developer: Reload Window` or completely restart it. After that, open a `.jeom` file and the following will appear:

- File language mode: `JEOM`
- Syntax highlighting
- `Run JEOM` / `Check JEOM` at the top of the file
- Play button in the upper-right corner of the editor

### Development Mode: Run with F5

1. Open this repository in VS Code.
2. Press `F5` to run `Run JEOM VS Code Extension`.
3. In the newly opened Extension Development Host window, open a `.jeom` file.
4. Run it using the play button in the upper-right corner of the editor, `Run JEOM` CodeLens, or `Ctrl + F5`.

If F5 does not work properly, using the local installation method above is more stable. If `Ctrl + F5` is recognized as Node debugging in a normal VS Code window, messages such as `Debugger attached` and a long `NODE_OPTIONS` command may be printed. To run it cleanly, use the Run button or `Run JEOM` CodeLens on a `.jeom` file after installing the extension.

When running through the extension, the `.jeom` file can be located outside this repository. By default, `official/cli.js` is used.

## Updating Official Files

Whenever Jeomlang is updated, the files in the `official/` folder can be synchronized to the latest version.

```bash
npm run update-jeom
```

This command downloads the following files from the official website into `official/` (the same contents as `core/` and `stdlib/`):

- `official/cli.js` ← `core/cli.js`
- `official/engine.js` ← `core/engine.js`
- `official/std.jeom` ← `stdlib/std.jeom`

The update completion time is stored in the `official/.version` file.

## Directly Specify the CLI Path

If you want to use the Jeomlang CLI from another location, specify `jeom.cliPath` in the VS Code settings.

Example:

```json
{
  "jeom.cliPath": "${workspaceFolder}/official/cli.js"
}
```

If the official CLI uses a different command format or you want to use a global command, you can specify `jeom.runCommand` and `jeom.checkCommand`.

```json
{
  "jeom.runCommand": "jeom run ${file}",
  "jeom.checkCommand": "jeom check ${file}"
}
```

See `COMPATIBILITY.md` for details on the compatibility method.

## Included Files

- `.vscode/tasks.json`: Runs the currently open `.jeom` file, default task for `Ctrl + Shift + B`
- `.vscode/settings.json`: Associates `*.jeom` files and defines the Code Runner extension execution command
- `.vscode/launch.json`: Extension Development Host launch configuration
- `.vscode/jeom.code-snippets`: Workspace snippets
- `official/`: Copies of the official `core/` and `stdlib/` (for standalone extension installation)
- `ABSORPTION.md`: Guide for absorbing into the official repository's `tools/vscode-extension/`
- `extension.js`: Run button, CodeLens, right-click menu, Command Palette execution features
- `scripts/install-local-extension.ps1`: Installs the current extension into the local VS Code extension folder
- `COMPATIBILITY.md`: Explanation of compatibility with the official CLI/engine
- `syntaxes/jeom.tmLanguage.json`: Basic TextMate syntax highlighting definition
- `language-configuration.json`: Comment, bracket, and auto-closing settings
- `../../assets/img/icon.png`: JEOM file icon (repository root asset)
- `package.json`: VS Code extension metadata

## Reference

Refer to the original website and original GitHub repository for the Jeomlang language specification and examples. This repository is intended only to provide the VS Code execution environment.
