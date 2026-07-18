# JeomLang Server

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
