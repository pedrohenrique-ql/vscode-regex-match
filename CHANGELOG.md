# Change Log

## 0.4.2

- Fixed the regex detector to detect two or more regex in the same line.
- Fixed packaging to ensure only required files are included in the `.vsix` package.

## 0.4.1

- Fixed Javascript regex detector to avoid detecting comments starting by `/*`.
- Fixed the problem of losing the highlights of the regex test when switching tabs in the editor.

## 0.4.0

- Added the functionality to test regex present in the code editor in the regex match window.
- Created configuration settings to enable/disable the code lens feature.

## 0.3.0

- Enables multiple regex testing in the regex match window.
- Correction of regex testing with `\n` and wildcard character.

## 0.2.0

- Highlight capturing groups in the test string.
- Use diagnostics to show errors in the regex match window.
- Prevents the extension from acting on non-extension files.

## 0.1.0

- Create, test and debug regular expressions within a text file.
- Highlight matches in the text.
- Use `Ctrl+Alt+X`/`Cmd+Alt+X` to open the regex match window.
