import { Range, TextDocument, TextEditor, window } from 'vscode';

import { TEST_AREA_DELIMITER } from '@/FileParser';
import { MatchResult } from '@/RegexTester';

import { DELIMITER_DECORATION, GROUP_DECORATIONS, MATCH_DECORATION } from './constants';

class TextDecorationApplier {
  static updateDecorations(document: TextDocument, matchResults?: MatchResult[]) {
    const activeEditor = window.activeTextEditor;
    if (!(activeEditor && document === activeEditor.document)) {
      return;
    }

    this.resetDecorations(activeEditor);

    if (matchResults) {
      this.applyMatchDecorations(activeEditor, matchResults);
      this.applyDelimiterDecorations(activeEditor);
    }
  }

  private static applyMatchDecorations(activeEditor: TextEditor, matchResults: MatchResult[]) {
    const document = activeEditor.document;

    const ranges = matchResults.map(({ range, groupRanges: groupIndexes }) => {
      const start = document.positionAt(range[0]);
      const end = document.positionAt(range[1]);

      const matchRange = new Range(start, end);
      activeEditor.setDecorations(MATCH_DECORATION, [matchRange]);

      const groupRanges = this.getGroupRanges(document, groupIndexes);

      return { matchRange, groupRanges };
    });

    const matchRanges = ranges.map(({ matchRange }) => matchRange);
    activeEditor.setDecorations(MATCH_DECORATION, matchRanges);

    const g: Range[][] = Array.from({ length: GROUP_DECORATIONS.length }, () => []);

    ranges.forEach(({ groupRanges }) => {
      groupRanges?.forEach((groupRange, index) => {
        const targetIndex = index % GROUP_DECORATIONS.length;
        g[targetIndex].push(groupRange);
      });
    });

    this.applyCapturingGroupDecorations(activeEditor, g);
  }

  private static getGroupRanges(document: TextDocument, groupIndexes?: number[][]): Range[] | undefined {
    if (groupIndexes) {
      return groupIndexes.map(([start, end]) => new Range(document.positionAt(start), document.positionAt(end)));
    }
  }

  private static applyCapturingGroupDecorations(activeEditor: TextEditor, groupRanges: Range[][]) {
    groupRanges.forEach((groupRange, index) => {
      activeEditor.setDecorations(GROUP_DECORATIONS[index % GROUP_DECORATIONS.length], groupRange);
    });
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

    activeEditor.setDecorations(DELIMITER_DECORATION, ranges);
  }

  private static resetDecorations(activeEditor: TextEditor) {
    activeEditor.setDecorations(MATCH_DECORATION, []);
    activeEditor.setDecorations(DELIMITER_DECORATION, []);

    GROUP_DECORATIONS.forEach((groupDecoration) => activeEditor.setDecorations(groupDecoration, []));
  }
}

export default TextDecorationApplier;
