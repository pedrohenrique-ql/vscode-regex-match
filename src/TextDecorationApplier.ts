import { Range, TextDocument, TextEditor, window } from 'vscode';

import { TEST_AREA_DELIMITER } from './FileParser';
import { MatchResult } from './RegexTester';

const matchDecorationType = window.createTextEditorDecorationType({ backgroundColor: 'rgba(255,165,0,0.5)' });
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

    const ranges = matchResults.map(({ range }) => {
      const start = document.positionAt(range[0]);
      const end = document.positionAt(range[1]);

      return new Range(start, end);
    });

    activeEditor.setDecorations(matchDecorationType, ranges);
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
