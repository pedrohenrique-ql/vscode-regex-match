import { Hover, HoverProvider, MarkdownString, Position, Range, TextDocument } from 'vscode';

import { TEST_AREA_DELIMITER } from '@/controllers/regex-test/FileParser';
import RegexExplainer from '@/services/regex-explanation/RegexExplainer';

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
      explanations.map(({ token, description }) => `\`${token}\` — ${description}`).join('\n\n'),
    );

    const [start, end] = explanations[0].range;

    return new Hover(markdown, new Range(position.line, start, position.line, end));
  }

  private isRegexLine(document: TextDocument, line: number): boolean {
    const lineText = document.lineAt(line).text;

    if (lineText === '' || lineText === TEST_AREA_DELIMITER) {
      return false;
    }

    let delimiterCount = 0;
    for (let i = 0; i < line; i++) {
      if (document.lineAt(i).text === TEST_AREA_DELIMITER) {
        delimiterCount++;
      }
    }

    return delimiterCount % 2 === 0;
  }
}

export default RegexHoverProvider;
