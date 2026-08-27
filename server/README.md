# JeomLang 서버 (한국어)

JeomLang(점랭) 코드를 실행하고 검증하기 위한 경량 REST API 서버입니다.

Flask(Python)를 사용하며, Node.js를 통해 JeomLang 엔진과 연결됩니다.

## 요구 사항

- Python 3.8 이상
- Node.js 18 이상
- npm

## 설치

```bash
pip install -r requirements.txt
npm install jeomlang
```

## 사용법

```bash
python app.py
```

서버는 기본적으로 `http://localhost:5000`에서 실행됩니다.

## API

### `GET /health`

서버가 정상적으로 실행되고 있는지 확인합니다.

**응답**

```json
{ "status": "ok" }
```

-----

### `POST /run`

JeomLang 코드를 실행하고 실행 결과를 반환합니다.

**요청**

```json
{ "code": "<jeom 소스 코드>" }
```

**성공**

```json
{
  "success": true,
  "output": "Hello, Jeom!\n"
}
```

**실패**

```json
{
  "success": false,
  "error": "런타임 오류 메시지"
}
```

-----

### `POST /check`

JeomLang 코드를 실제로 실행하지 않고 유효성을 검사합니다.

렉서(lexer)와 파서(parser)를 실행하고, 유효한 `main` 블록이 존재하는지도 확인합니다.

**요청**

```json
{ "code": "<jeom 소스 코드>" }
```

**성공**

```json
{
  "valid": true,
  "message": "문법 오류 없음"
}
```

**실패**

```json
{
  "valid": false,
  "error": "파싱 오류 메시지"
}
```

-----

## 작동 방식

```text
Client → Flask (app.py) → runner.py → node_runner.js → JeomLang 엔진
```

`node_runner.js`는 다음 순서로 JeomLang 엔진을 불러옵니다.

1. `../core/engine.js` (로컬 저장소)
2. `jeomlang` npm 패키지 (대체 경로)

## 프로젝트 구조

```text
server/
├── app.py            # Flask 앱 및 라우트 정의
├── runner.py         # 서브프로세스 실행 로직 (Python → Node.js)
├── node_runner.js    # Node.js와 JeomLang 엔진을 연결하는 브리지
└── requirements.txt  # Python 의존성 패키지
```

## 라이선스

[Apache License 2.0](LICENSE) — 자세한 내용은 [LICENSE](../LICENSE) 파일을 참고하세요.

---

# JeomLang Server (English)

A lightweight REST API server for executing and validating [JeomLang](https://jeomlang.vercel.app/) (점랭) code.

Built with Flask (Python) and bridges to the JeomLang engine via Node.js.

## Requirements

- Python 3.8+
- Node.js 18+
- npm

## Installation

```bash
pip install -r requirements.txt
npm install jeomlang
```

## Usage

```bash
python app.py
```

The server runs at `http://localhost:5000` by default.

## API

### `GET /health`

Check if the server is running.

**Response**

```json
{ "status": "ok" }
```

-----

### `POST /run`

Execute JeomLang code and return the output.

**Request**

```json
{ "code": "<jeom source code>" }
```

**Success**

```json
{
  "success": true,
  "output": "Hello, Jeom!\n"
}
```

**Failure**

```json
{
  "success": false,
  "error": "런타임 오류 메시지"
}
```

-----

### `POST /check`

Validate JeomLang code without executing it. Runs the lexer and parser, and checks for a valid `main` block.

**Request**

```json
{ "code": "<jeom source code>" }
```

**Success**

```json
{
  "valid": true,
  "message": "문법 오류 없음"
}
```

**Failure**

```json
{
  "valid": false,
  "error": "파싱 오류 메시지"
}
```

-----

## How It Works

```
Client → Flask (app.py) → runner.py → node_runner.js → JeomLang Engine
```

`node_runner.js` loads the engine in the following order:

1. `../core/engine.js` (local repository)
1. `jeomlang` npm package (fallback)

## Project Structure

```
server/
├── app.py            # Flask app, route definitions
├── runner.py         # Subprocess logic (Python → Node.js)
├── node_runner.js    # Node.js bridge to JeomLang engine
└── requirements.txt  # Python dependencies
```

## License

[Apache License 2.0](LICENSE) — see [LICENSE](../LICENSE)
