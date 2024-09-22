import {
  DecorationRenderOptions,
  Disposable,
  Range,
  TextDocument,
  TextEditor,
  TextEditorDecorationType,
  window,
  workspace,
} from 'vscode';

import { TEST_AREA_DELIMITER } from '@/services/regex-match/FileParser';
import RegexTest, { MatchRange, MatchResult } from '@/services/regex-match/RegexTest';

import { DECORATION_KEYS, DecorationKey, DecorationMapping, DEFAULT_DECORATION_COLORS } from './utils';

class TextDecorationApplier implements Disposable {
  private decorations: DecorationMapping;
  private configurationChangeDisposable: Disposable = Disposable.from();

  constructor() {
    this.decorations = this.createDecorations();
    this.configurationChangeDisposable = this.watchConfigurationChanges();
  }

  private createDecorations(): DecorationMapping {
    const colorSettings = this.loadColorSettings();

    return {
      ...this.createMatchDecorations(colorSettings),
      delimiter: this.createTextDecorationType({ color: colorSettings.delimiter, fontWeight: 'bold' }),
    };
  }

  private createMatchDecorations(colorSettings: Record<string, string>): DecorationMapping {
    const decorations: DecorationMapping = {} as DecorationMapping;

    DECORATION_KEYS.forEach((key) => {
      decorations[key] = this.createTextDecorationType({ backgroundColor: colorSettings[key] });
    });

    return decorations;
  }

  private loadColorSettings() {
    const settings: Record<string, string> = {};
    DECORATION_KEYS.forEach((key) => {
      settings[key] = this.getConfigurationColor(key);
    });

    return settings;
  }

  private createTextDecorationType(options: DecorationRenderOptions) {
    return window.createTextEditorDecorationType(options);
  }

  private getConfigurationColor(decorationKey: DecorationKey) {
    return workspace
      .getConfiguration('regex-match.colorHighlighting')
      .get<string>(decorationKey, DEFAULT_DECORATION_COLORS[decorationKey]);
  }

  private watchConfigurationChanges() {
    return workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('regex-match.colorHighlighting')) {
        this.createDecorations();
      }
    });
  }

  updateDecorations(document: TextDocument, regexTests?: RegexTest[]) {
    const activeEditor = window.activeTextEditor;
    if (!(activeEditor && document === activeEditor.document)) {
      return;
    }

    const capturingGroupDecorations = this.getCapturingGroupDecorations();

    this.resetDecorations(activeEditor, capturingGroupDecorations);
    this.applyDelimiterDecorations(activeEditor);

    if (regexTests) {
      const matchResults = regexTests.flatMap((regexTest) => regexTest.test());
      this.applyMatchDecorations(activeEditor, matchResults, capturingGroupDecorations);
    }
  }

  private applyMatchDecorations(
    activeEditor: TextEditor,
    matchResults: MatchResult[],
    capturingGroupDecorations: TextEditorDecorationType[],
  ) {
    const document = activeEditor.document;

    const ranges = matchResults.map(({ range, groupRanges: groupIndexes }) => {
      const matchRanges = this.findMatchRanges(document, range, groupIndexes);
      const groupRanges = this.findCapturingGroupRanges(document, groupIndexes);

      return { matchRanges, groupRanges };
    });

    activeEditor.setDecorations(
      this.decorations.match,
      ranges.flatMap(({ matchRanges }) => matchRanges),
    );

    const groupRanges = this.organizeGroupRangesByDecoration(ranges, capturingGroupDecorations);
    this.applyCapturingGroupDecorations(activeEditor, groupRanges, capturingGroupDecorations);
  }

  private findMatchRanges(document: TextDocument, matchRange: MatchRange, groupIndexes: MatchRange[] = []): Range[] {
    if (groupIndexes.length === 0) {
      return [new Range(document.positionAt(matchRange[0]), document.positionAt(matchRange[1]))];
    }

    const nonGroupRanges: MatchRange[] = [];
    let lastEnd = matchRange[0];

    groupIndexes.forEach(([groupStart, groupEnd]) => {
      if (lastEnd < groupStart) {
        nonGroupRanges.push([lastEnd, groupStart]);
      }
      lastEnd = groupEnd;
    });

    if (lastEnd < matchRange[1]) {
      nonGroupRanges.push([lastEnd, matchRange[1]]);
    }

    return nonGroupRanges.map(([start, end]) => new Range(document.positionAt(start), document.positionAt(end)));
  }

  private findCapturingGroupRanges(document: TextDocument, groupIndexes?: number[][]): Range[] | undefined {
    if (groupIndexes) {
      return groupIndexes.map(([start, end]) => new Range(document.positionAt(start), document.positionAt(end)));
    }
  }

  private organizeGroupRangesByDecoration(
    ranges: { matchRanges: Range[]; groupRanges: Range[] | undefined }[],
    capturingGroupDecorations: TextEditorDecorationType[],
  ) {
    const organizedGroupRanges: Range[][] = Array.from({ length: capturingGroupDecorations.length }, () => []);

    ranges.forEach(({ groupRanges }) => {
      groupRanges?.forEach((groupRange, index) => {
        const targetIndex = index % capturingGroupDecorations.length;
        organizedGroupRanges[targetIndex].push(groupRange);
      });
    });

    return organizedGroupRanges;
  }

  private applyCapturingGroupDecorations(
    activeEditor: TextEditor,
    groupRanges: Range[][],
    capturingGroupDecorations: TextEditorDecorationType[],
  ) {
    groupRanges.forEach((groupRange, index) => {
      activeEditor.setDecorations(capturingGroupDecorations[index % capturingGroupDecorations.length], groupRange);
    });
  }

  private getCapturingGroupDecorations() {
    return [
      this.decorations.firstGroup,
      this.decorations.secondGroup,
      this.decorations.thirdGroup,
      this.decorations.fourthGroup,
      this.decorations.fifthGroup,
      this.decorations.sixthGroup,
    ];
  }

  private applyDelimiterDecorations(activeEditor: TextEditor) {
    const document = activeEditor.document;
    const fileContent = document.getText();

    const delimiterRegex = new RegExp(`^${TEST_AREA_DELIMITER}$`, 'gm');
    let match: RegExpExecArray | null;

    const ranges: Range[] = [];

    while ((match = delimiterRegex.exec(fileContent))) {
      const start = document.positionAt(match.index);
      const end = document.positionAt(match.index + TEST_AREA_DELIMITER.length);

      ranges.push(new Range(start, end));
    }

    activeEditor.setDecorations(this.decorations.delimiter, ranges);
  }

  private resetDecorations(activeEditor: TextEditor, capturingGroupDecorations: TextEditorDecorationType[]) {
    activeEditor.setDecorations(this.decorations.match, []);
    activeEditor.setDecorations(this.decorations.delimiter, []);

    capturingGroupDecorations.forEach((groupDecoration) => activeEditor.setDecorations(groupDecoration, []));
  }

  dispose() {
    this.configurationChangeDisposable.dispose();
  }
}

export default TextDecorationApplier;
