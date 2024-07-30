<p align="center">
  <img src="./resources/icon.png" align="center" width="100px" height="100px">
</p>

<h1 align="center">
  Regex Match
</h1>

<p align="center">
  Create, test and debug regular expressions within a text file
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=pedrohenrique-ql.regex-match">
    <img alt="Visual Studio Marketplace Version" src="https://img.shields.io/visual-studio-marketplace/v/pedrohenrique-ql.regex-match?logo=visualstudiocode&logoColor=007acc&label=VS%20Marketplace&labelColor=2c2c32&color=007acc"></a>
  <a href="https://github.com/pedrohenrique-ql/vscode-regex-match/actions?query=branch%3Acanary">
    <img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/pedrohenrique-ql/vscode-regex-match/ci.yaml?branch=canary&logo=github&label=CI&labelColor=2c2c32"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=pedrohenrique-ql.regex-match">
    <img alt="Visual Studio Marketplace Installs" src="https://img.shields.io/visual-studio-marketplace/i/pedrohenrique-ql.regex-match?logo=visualstudiocode&logoColor=007acc&label=Installs&labelColor=2c2c32&color=007acc"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=pedrohenrique-ql.regex-match">
    <img alt="Visual Studio Marketplace Downloads" src="https://img.shields.io/visual-studio-marketplace/d/pedrohenrique-ql.regex-match?logo=visualstudiocode&logoColor=007acc&label=Downloads&labelColor=2c2c32&color=007acc"></a>
</p>

---

[Regex Match](https://marketplace.visualstudio.com/items?itemName=pedrohenrique-ql.regex-match) is a Visual Studio Code extension that enables dynamically creating, testing and debugging regular expressions within a text file. It provides a simple and user-friendly interface, making the process of working with regular expressions effortless and efficient.

Press `Ctrl+Alt+X`/`Cmd+Alt+X` or use the command `Regex Match: Open Regex Match Window` to open the regex test window, where you can test your regular expressions with the help of highlights.

![Regex Match Demo](https://raw.githubusercontent.com/pedrohenrique-ql/vscode-regex-match/main/resources/demo.gif)

## Table of Contents

- [Features](#features)
- [Release Notes](#release-notes)
- [Development](#development)
  - [Requirements](#requirements)
  - [Usage](#usage)
  - [Testing](#testing)

## 🚀 Features

### Test Regular Expressions

Create, test and debug your regex in a text window. To do this, use the standard format with the regex on the first line of the file with the flags required for your case, plus the test string between the text area delimiters (`---`).

![Testing Regular Expressions](https://raw.githubusercontent.com/pedrohenrique-ql/vscode-regex-match/main/resources/test-regex-feature.gif)

### Highlight of Capturing Groups

Each group in a regular expression is highlighted in a different color, making it easy to distinguish and identify them. Color-coded regex capture groups enhance readability and simplify debugging.

![Highlight of Capturing Groups](https://raw.githubusercontent.com/pedrohenrique-ql/vscode-regex-match/main/resources/capturing-groups-feature.gif)

### Test Multiple Regular Expressions

You can test multiple regular expressions in the same file. Each regex test works independently, with its own test lines and capture groups. This feature allows you to test different regex patterns in the same place.

![Test Multiple Regular Expressions](https://raw.githubusercontent.com/pedrohenrique-ql/vscode-regex-match/main/resources/multiple-regex-feature.gif)

### Test Regular Expressions from the Code Editor

Through VS Code's code lens functionality, Regex Match makes it easy to test the regex present in your code. The code lens will appear above the regex, allowing you to test it in Regex Match window.

![Test Regular Expressions from the Code Editor](https://raw.githubusercontent.com/pedrohenrique-ql/vscode-regex-match/main/resources/code-lens-feature.gif)

## 📝 Release Notes

## 0.4.2

- Fixed the regex detector to detect two or more regex in the same line.
- Fixed packaging to ensure only required files are included in the `.vsix` package.

## 0.4.1

- Fixed Javascript regex detector to avoid detecting comments starting by `/*`.
- Fixed the problem of losing the highlights of the regex test when switching tabs in the editor.

## 0.4.0

- Added the functionality to test regex present in the code editor in the regex match window.
- Created configuration settings to enable/disable the code lens feature.

View the full [CHANGELOG](./CHANGELOG.md).

## 🛠️ Development

### Requirements

The following dependencies are required to run the project:

| Dependency                                           | Version           |
| ---------------------------------------------------- | ----------------- |
| [Node.js](https://nodejs.org/)                       | >= 20.11.0 && <21 |
| [Visual Studio Code](https://code.visualstudio.com/) | ^1.91.0           |
| [pnpm](https://pnpm.io/)                             | 8.15.3            |

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
