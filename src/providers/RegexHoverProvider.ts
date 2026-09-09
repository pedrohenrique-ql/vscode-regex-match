import { Hover, HoverProvider, MarkdownString, Position, Range, TextDocument } from 'vscode';

import { TEST_AREA_DELIMITER } from '@/controllers/regex-test/FileParser';
import RegexExplainer, { toInlineCode } from '@/services/regex-explanation/RegexExplainer';

class RegexHoverProvider implements HoverProvider {
  provideHover(document: TextDocument, position: Position): Hover | undefined {
    if (!this.isRegexLine(document, position.line)) {
      return undefined;
    }

    const lineText = document.lineAt(position.line).text;
    const explanations = RegexExplainer.explainAt(lineText, position.character);

    if (explanations.length === 0) {
      return undefined;
    }

    const markdown = new MarkdownString(
      explanations.map(({ token, description }) => `${toInlineCode(token)} — ${description}`).join('\n\n'),
    );

    const [start, end] = explanations[0].range;

    return new Hover(markdown, new Range(position.line, start, position.line, end));
  }

  private isRegexLine(document: TextDocument, line: number): boolean {
    let isInTestStringArea = false;
    let regexLineIndex: number | undefined;

    for (let currentLine = 0; currentLine < document.lineCount; currentLine++) {
      const currentLineText = document.lineAt(currentLine).text;

      if (currentLineText === TEST_AREA_DELIMITER) {
        isInTestStringArea = !isInTestStringArea;

        if (isInTestStringArea) {
          if (regexLineIndex === line) {
            return true;
          }

          if (currentLine > line) {
            return false;
          }
        }

        regexLineIndex = undefined;
        continue;
      }

      if (!isInTestStringArea && currentLineText !== '') {
        regexLineIndex = currentLine;
      }
    }

    return regexLineIndex === line;
  }
}

export default RegexHoverProvider;
