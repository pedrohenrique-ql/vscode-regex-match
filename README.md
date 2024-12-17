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

Create, test and debug your regex in the Regex Match file. To do this, use this syntax:

```py
/your-regex-here/[flags]
---
test input line 1
test input line 2
test input line n
---
```

![Testing Regular Expressions](https://raw.githubusercontent.com/pedrohenrique-ql/vscode-regex-match/main/resources/test-regex-feature.gif)

### Test Regular Expressions from the Code Editor

With VS Code's CodeLens functionality, Regex Match allows you to test the regular expressions directly from your code. By using the `Test Regex` CodeLens, you can send the regex from your code to the Regex Match extension for testing. Once edited, you can update the original regex in the code using the `Apply Regex to Code` CodeLens.

![Test Regular Expressions from the Code Editor](https://raw.githubusercontent.com/pedrohenrique-ql/vscode-regex-match/main/resources/code-lens-feature.gif)

### Highlight of Capturing Groups

Each group in a regular expression is highlighted in a different color, making it easy to distinguish and identify them. Color-coded regex capture groups enhance readability and simplify debugging.

![Highlight of Capturing Groups](https://raw.githubusercontent.com/pedrohenrique-ql/vscode-regex-match/main/resources/capturing-groups-feature.gif)

### Test Multiple Regular Expressions

You can test multiple regular expressions in the same file. Each regex test should follow the specified syntax, with its own test lines and capture groups. This feature allows you to test different regex patterns independently in the same file.

![Test Multiple Regular Expressions](https://raw.githubusercontent.com/pedrohenrique-ql/vscode-regex-match/main/resources/multiple-regex-feature.gif)

## ⚙️ Extension Settings

The following settings are available to customize the extension:

| Setting Type                                | Default Value | Description                                                                  |
| ------------------------------------------- | ------------- | ---------------------------------------------------------------------------- |
| `regex-match.codeLens.enabled`              | `true`        | Enable the code lens that allows you to test the regex from the code editor. |
| `regex-match.colorHighlighting.match`       | `#FFA50080`   | Color used to highlight the matches.                                         |
| `regex-match.colorHighlighting.firstGroup`  | `#07925C99`   | Color used to highlight the first group.                                     |
| `regex-match.colorHighlighting.secondGroup` | `#3164CACC`   | Color used to highlight the second group.                                    |
| `regex-match.colorHighlighting.thirdGroup`  | `#6E25B7B2`   | Color used to highlight the third group.                                     |
| `regex-match.colorHighlighting.fourthGroup` | `#D339DF99`   | Color used to highlight the fourth group.                                    |
| `regex-match.colorHighlighting.fifthGroup`  | `#006B6BCC`   | Color used to highlight the fifth group.                                     |
| `regex-match.colorHighlighting.sixthGroup`  | `#B82F2F99`   | Color used to highlight the sixth group.                                     |

## 📝 Release Notes

### v0.5.0

- Refactored services to implement disposables, improving resource management and extension stability.
- Added configurable settings to customize the color highlighting of regex matches.
- Added a new CodeLens to update the regex extracted from the code using the 'Test Regex' CodeLens with the regex edited in the extension file, replacing the original regex in its original location.

## v0.4.2

- Fixed the regex detector to detect two or more regex in the same line.
- Reduced the extension package size by removing unnecessary files.

## v0.4.1

- Fixed Javascript regex detector to avoid detecting comments starting by `/*`.
- Fixed the problem of losing the highlights of the regex test when switching tabs in the editor.

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
