# Regex Match

Regex Match is a Visual Studio Code extension that enables dynamically creating, testing and debugging regular expressions within a text file. It provides a simple and user-friendly interface, making the process of working with regular expressions effortless and efficient.

Press `Ctrl+Alt+X`/`Cmd+Alt+X` to open the regex test window, where you can place the regular expression on the first line and the texts to match between delimiters (`---`). The extension will highlight the matches in the text, making it easy to see the results.

![Regex Match](resources/regex-match.gif)

## Table of Contents

- [Features](#features)
- [Release Notes](#release-notes)
- [Development](#development)
  - [Requirements](#requirements)
  - [Usage](#installation)
  - [Testing](#testing)

## Features

- Create, test and debug regular expressions within a text file.
- Highlight matches in the text.

## Release Notes

### 0.1.0

- Create, test and debug regular expressions within a text file.
- Highlight matches in the text.
- Use `Ctrl+Alt+X`/`Cmd+Alt+X` to open the regex match window.

## Development

### Requirements

- [Node.js v.20.11.0](https://nodejs.org/)
- [Visual Studio Code v1.87.0](https://code.visualstudio.com/)
- [pnpm v8.15.3](https://pnpm.io/)

### Usage

1. Install the dependencies:

   ```bash
   pnpm install
   ```
2. Build the extension:

   ```bash
   pnpm compile
   ```

3. Press `F5` to open a new window with the extension loaded.
4. Press `Ctrl+Alt+X`/`Cmd+Alt+X` to open the regex match window.

### Testing

To run the interface tests, run the following command:

```
pnpm test:vsc
```

To run the unit tests, run the following command:

```
pnpm test:vi
```
