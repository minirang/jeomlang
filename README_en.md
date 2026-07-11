# JeomLang (점랭)

<p align="center">
  <img src="assets/img/logo_animated.svg" alt="Jeom Logo" width="96">
</p>

<p align="center">
  <a href="https://jeomlang.vercel.app/">Homepage</a> ·
  <a href="https://jeomlang.vercel.app/ide">Web IDE</a> ·
  <a href="docs/GRAMMAR.md">Grammar Reference</a> ·
  <a href="docs/SPEC.md">Language Specification</a> ·
  <a href="docs/CHANGELOG.md">Changelog</a> · 
  <a href="https://www.npmjs.com/package/jeomlang">npm package</a> · 
  <a href="README.md">Korean README</a> · 
  <a href="https://esolangs.org/wiki/Jeomlang">esolang.org wiki</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-Apache--2.0-green" alt="license">
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="node">
</p>

> An esoteric programming language written using only **16 Unicode dot characters**  
> File extension: `.jeom`

-----

## Overview

**JeomLang (점랭)** is an esoteric programming language where all code is written entirely using Unicode “dot” characters.  
Despite being esoteric, it is a complete language featuring **functions · recursion · arrays · dictionaries · error handling · lambdas · higher-order functions · modules**.

A single engine file (`core/engine.js`) powers both the browser-based web IDE and the Node.js CLI.

-----

## Project Structure

```text
jeomlang/
├── core/
│   ├── engine.js          ← Shared JS engine (lexer+parser+VM, UMD)
│   └── cli.js             ← Node.js CLI
├── ide/
│   ├── index.html         ← Web IDE
│   ├── ide.css
│   ├── src/ide.ts         ← TypeScript source
│   └── dist/ide.js        ← Build output
├── home/
│   ├── index.html         ← Main page
│   ├── index.js
│   └── style.css
├── assets/img/            ← Logo images
├── stdlib/std.jeom        ← Standard library
├── examples/              ← Example files
├── docs/                  ← Documentation
├── server/                ← 점랭 서버
├── shared/
│   └── custom-elements.js ← Shared web component (<jeom-version>)
└── tools/
    ├── formatter/
    │   └── formatter.py   ← Code formatter
    ├── language-support/  ← Highlighter, Linguist
    └── vscode-extension/  ← VS Code extension
```

-----

## Quick Start

### Web IDE

Available directly at <https://jeomlang.vercel.app/ide>.

### CLI Installation (Node.js 18+)

```bash
npm install -g jeomlang
jeom run hello.jeom
```

Or clone locally:

```bash
git clone https://github.com/minirang/jeomlang.git
cd jeomlang
node core/cli.js run examples/hello.jeom
```

### CLI Commands

```bash
jeom run <file.jeom>          # Execute
jeom check <file.jeom>        # Syntax check
jeom repl                     # Interactive REPL
jeom encode "Hello"           # String → dot encoding
jeom encode-num 42            # Integer → dot encoding
jeom encode-float 3.14        # Float → dot encoding
jeom decode "•·.·.•"          # Dot code → value
jeom tokens <file.jeom>       # Token list
jeom ast <file.jeom>          # Print AST
jeom ops                      # All command tokens
jeom new <file.jeom>          # Create new file
jeom version                  # Show version
```

-----

## 16 Dot Characters

|Symbol|Unicode|Purpose|
|:-:|------|-----------------|
|`.`|U+002E|0 bit|
|`·`|U+00B7|1 bit|
|`˙`|U+02D9|Function-related|
|`•`|U+2022|Number literal delimiter|
|`․`|U+2024|Command composition|
|`‥`|U+2025|Loop · error · decimal separator|
|`…`|U+2026|Conditional branching|
|`‧`|U+2027|String byte separator|
|`∘`|U+2218|Variable|
|`⋅`|U+22C5|Arithmetic · logic|
|`●`|U+25CF|String literal delimiter|
|`◦`|U+25E6|Array · dictionary|
|`⦁`|U+2981|Stack operations|
|`⸳`|U+2E33|Type conversion|
|`⋮`|U+22EE|Block|
|`⋯`|U+22EF|File · module|
|`◘`|U+25D8|Comment|

-----

## Literal Encoding

**Integer**: `•<binary>•` — `.`=0, `·`=1, big-endian  
Example: `••`=0, `•·•`=1, `•·.·•`=5, `•·.·.•`=10

**Float**: `•<integer>‥<fraction>•`  
Example: `•·‥·•`=1.5, `•··‥.·•`=3.25, `•‥·•`=0.5

**String**: `●<UTF-8 bytes>●` — byte separator `‧`, each byte is 8 bits  
Example: `●.·..·...‧.··.·..·●` = “Hi”

-----

## Code Examples

### Hello World

```jeom
◘ Hello, Jeom!
•·
  ●.·..·...‧.··..·.·‧.··.··..‧.··.··..‧.··.····‧..·.··..‧..·.....‧.·..·.·.‧.··..·.·‧.··.····‧.··.··.·‧..·....·●
  ··
⋮⋮
```

### Factorial (Recursion) — 5! = 120

```jeom
˙ ·∘·
˙∘ ·
⋮
  ∘∘ ·
  •·•
  ⋅‧∘∘
  …
  ⋮
    •·• ˙˙
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

See the [`examples/`](examples/) folder for more examples.

-----

## Formatter

The JS engine parses the source code, and Python outputs the formatted result.  
`node` must be available in PATH.

```bash
python3 tools/formatter/formatter.py hello.jeom           # Generate hello.fmt.jeom
python3 tools/formatter/formatter.py hello.jeom -r        # Format and remove original
python3 tools/formatter/formatter.py hello.jeom -o out.jeom
python3 tools/formatter/formatter.py hello.jeom --check   # Check if formatting is needed
python3 tools/formatter/formatter.py *.jeom               # Multiple files
```

-----

## Standard Library

```jeom
●.···..··‧.···.·..‧.··..·..‧.··.··..‧.··.·..·‧.··...·.‧..·.····‧.···..··‧.···.·..‧.··..·..‧..·.···.‧.··.·.·.‧.··..·.·‧.··.····‧.··.··.·●
⋯·⦁
```

|Function Token|Description|
|-------|-----------|
|`·∘∘`  |Sort array ascending|
|`·∘·`  |Array maximum|
|`·∘··` |Array minimum|
|`·∘∘∘` |Array sum|
|`·∘·∘` |Reverse array|
|`·∘··∘`|Check array inclusion|
|`·∘∘·` |Join array into string|

-----

## Engine API

```js
const {
  encodeString,   // String → dot literal
  encodeNumber,   // Integer → dot literal
  encodeFloat,    // Float → dot literal
  decodeString,   // Dot literal → string
  decodeNumber,   // Dot literal → number (integer/float)
  tokenize,
  parse,
  JeomVM,
} = require('./core/engine.js');

const vm = new JeomVM({
  stdout: s => process.stdout.write(s),
  stderr: s => process.stderr.write(s),
  stdin:  () => Promise.resolve(''),
  readFile:   path => fs.promises.readFile(path, 'utf8'),
  writeFile:  (path, s) => fs.promises.writeFile(path, s),
  fileExists: path => fs.promises.access(path).then(() => true, () => false),
});

await vm.run(sourceCode);
```

-----

## VS Code Extension

Included in [`tools/vscode-extension/`](tools/vscode-extension/).<br>
And also [`https://github.com/captain34643875-wq/JeomLang-VScode`](https://github.com/captain34643875-wq/JeomLang-VScode).<br>
Provides syntax highlighting, code snippets, and language configuration.

-----

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

-----

## License

[Apache License 2.0](LICENSE)

-----

## Naming Notice

Only jeomlang, jeom, JeomLang, JEOM, JEOMLANG, Jeomlang, Jeom, and 점랭 refer to this language.
