import { Range, TextDocument, TextEditor, window } from 'vscode';

import { TEST_AREA_DELIMITER } from './FileParser';
import { MatchResult } from './RegexTester';

const matchDecorationType = window.createTextEditorDecorationType({ backgroundColor: 'rgba(255,165,0,0.5)' });
const groupDecorationType = window.createTextEditorDecorationType({ backgroundColor: 'rgba(4,194,120,0.5)' });

const delimiterDecorationType = window.createTextEditorDecorationType({
  color: 'rgba(189,147,249)',
  fontWeight: 'bold',
});

class TextDecorationApplier {
  static updateDecorations(document: TextDocument, matchResults: MatchResult[]) {
    const activeEditor = window.activeTextEditor;
    if (!(activeEditor && document === activeEditor.document)) {
      return;
    }

    this.applyMatchDecorations(activeEditor, matchResults);
    this.applyDelimiterDecorations(activeEditor);
  }

  private static applyMatchDecorations(activeEditor: TextEditor, matchResults: MatchResult[]) {
    const document = activeEditor.document;

    const ranges = matchResults.map(({ range, groupRanges: groupIndexes }) => {
      const start = document.positionAt(range[0]);
      const end = document.positionAt(range[1]);

      const groupRanges = this.getGroupRanges(document, groupIndexes);

      const lineRange = new Range(start, end);
      return { lineRange, groupRanges };
    });

    const lineRanges = ranges.map(({ lineRange }) => lineRange);
    activeEditor.setDecorations(matchDecorationType, lineRanges);

    const groupRanges = ranges.flatMap(({ groupRanges }) => groupRanges ?? []);
    activeEditor.setDecorations(groupDecorationType, groupRanges);
  }

  private static getGroupRanges(document: TextDocument, groupIndexes?: number[][]): Range[] | undefined {
    if (groupIndexes) {
      return groupIndexes.map(([start, end]) => new Range(document.positionAt(start), document.positionAt(end)));
    }
  }

  private static applyDelimiterDecorations(activeEditor: TextEditor) {
    const document = activeEditor.document;
    const fileContent = document.getText();

    const delimiterRegex = new RegExp(TEST_AREA_DELIMITER, 'g');
    let match: RegExpExecArray | null;

    const ranges: Range[] = [];

    while ((match = delimiterRegex.exec(fileContent))) {
      const start = document.positionAt(match.index);
      const end = document.positionAt(match.index + TEST_AREA_DELIMITER.length);

      ranges.push(new Range(start, end));
    }

    activeEditor.setDecorations(delimiterDecorationType, ranges);
  }
}

export default TextDecorationApplier;
