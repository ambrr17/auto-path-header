# Auto Path Header

Auto Path Header is a Visual Studio Code extension that automatically inserts the relative file path as a comment on the first line.

Language: EN | [RU](./README_RU.md)

Author: Niklis

## Features

- Automatic insertion of the file path on open
- Support for many programming languages
- Duplicate comment prevention
- RU/EN localization support
- Configurable settings
- Error handling with localized messages
- Automatic path update on rename/move
- Manual comment insertion via Command Palette

## Supported languages

### Single-line comments (`//`)
- JavaScript, TypeScript, Java, C, C++, C#, Go, Rust, Swift, Kotlin, PHP

### Hash comments (`#`)
- Python, Shell Script, Ruby, Perl, .env

### Block comments (`/* */`)
- CSS, SCSS, Sass

### SQL comments (`--`)
- SQL

### HTML comments (`<!-- -->`)
- HTML, XML

## Installation

1. Download the `.vsix` package from releases
2. In VS Code: `Ctrl+Shift+P` → "Extensions: Install from VSIX..."
3. Pick the downloaded file

## Settings

- `autoPathHeader.enabled` — enable/disable automatic insertion
- `autoPathHeader.language` — message language (auto/en/ru)
- `autoPathHeader.updateOnRename` — automatically update comment on rename/move
- `autoPathHeader.askBeforeUpdate` — ask before updating comment (works when updateOnRename = true)
- `autoPathHeader.formatTemplate` — customize the comment line. Supports `{comment}`, `{path}`, `{prefix}`, `{suffix}` placeholders.
- `autoPathHeader.disabledLanguages` — array of VS Code language IDs where auto insertion/updates are disabled.

## Usage

- Works automatically on file open (for supported languages)
- Manual insertion:
  1. `Ctrl+Shift+P` → "Auto Path Header: Insert Path Comment"

## Development

### Requirements
- Node.js
- VS Code Extension Development Host

### Install deps
```bash
npm install
```

### Compile
```bash
npm run compile
```

### Package
```bash
npm run package
```

## Tests

- Unit tests (Mocha):
```bash
npm test
```

- VS Code integration tests:
```bash
npm run test:it
```

## Contributing

1. Fork this repository
2. Create a feature branch
3. Implement changes
4. Add/adjust tests
5. Open a Pull Request

## License

MIT License

## Versions

- v0.0.2 — RU localization, error handling, rename updates, tests
- v0.0.1 — initial functionality

## Support

If you have questions or suggestions, please open an Issue.
