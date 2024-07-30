# Change Log

## [v0.4.2] - 30/07/2024

- Reduced the extension package size by removing unnecessary files
- Fixed packaging to ensure only required files are included in the `.vsix` package.

## [v0.4.1] - 17/07/2024

- Fixed Javascript regex detector to avoid detecting comments starting by `/*`.
- Fixed the problem of losing the highlights of the regex test when switching tabs in the editor.

## [v0.4.0] - 07/07/2024

- Added the functionality to test regex present in the code editor in the regex match window.
- Created configuration settings to enable/disable the code lens feature.

## [v0.3.0] - 20/06/2024

- Enables multiple regex testing in the regex match window.
- Correction of regex testing with `\n` and wildcard character.

## [v0.2.0] - 28/05/2024

- Highlight capturing groups in the test string.
- Use diagnostics to show errors in the regex match window.
- Prevents the extension from acting on non-extension files.

## [v0.1.0] - 15/05/2024

- Create, test and debug regular expressions within a text file.
- Highlight matches in the text.
- Use `Ctrl+Alt+X`/`Cmd+Alt+X` to open the regex match window.
