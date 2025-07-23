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

import RegexTest, { MatchRange, MatchResult } from '@/services/regex-match/RegexTest';

import { DECORATION_KEYS, DecorationKey, DecorationMapping, DEFAULT_DECORATION_COLORS } from './utils';

class TextDecorationApplier implements Disposable {
  private decorationSettings: DecorationMapping = {} as DecorationMapping;
  private configurationChangeDisposable: Disposable = Disposable.from();

  private previousDecorations: Map<TextEditorDecorationType, Range[]> = new Map<TextEditorDecorationType, Range[]>();

  constructor() {
    this.updateDecorationSettings();
  }

  private updateDecorationSettings() {
    const colorSettings = this.loadColorSettings();
    this.decorationSettings = this.createDecorations(colorSettings);
  }

  private createDecorations(colorSettings: Record<string, string>): DecorationMapping {
    return {
      ...this.createMatchDecorations(colorSettings),
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

  applyDecorations(
    textEditor: TextEditor,
    regexTests?: RegexTest[],
    options: { isToUpdateDecorations: boolean } = { isToUpdateDecorations: false },
  ) {
    this.clearDecorations(textEditor);

    if (options.isToUpdateDecorations) {
      this.updateDecorationSettings();
    }

    const capturingGroupDecorations = this.getCapturingGroupDecorations();

    if (regexTests) {
      const matchResults = regexTests.flatMap((regexTest) => regexTest.test());
      this.applyMatchDecorations(textEditor, matchResults, capturingGroupDecorations);
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

    const matchRanges = ranges.flatMap(({ matchRanges }) => matchRanges);

    activeEditor.setDecorations(this.decorationSettings.match, matchRanges);
    this.previousDecorations.set(this.decorationSettings.match, matchRanges);

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
      this.previousDecorations.set(capturingGroupDecorations[index % capturingGroupDecorations.length], groupRange);
    });
  }

  private getCapturingGroupDecorations() {
    return [
      this.decorationSettings.firstGroup,
      this.decorationSettings.secondGroup,
      this.decorationSettings.thirdGroup,
      this.decorationSettings.fourthGroup,
      this.decorationSettings.fifthGroup,
      this.decorationSettings.sixthGroup,
    ];
  }

  clearDecorations(textEditor: TextEditor) {
    textEditor.setDecorations(this.decorationSettings.match, []);

    const capturingGroupDecorations = this.getCapturingGroupDecorations();
    capturingGroupDecorations.forEach((groupDecoration) => textEditor.setDecorations(groupDecoration, []));
  }

  applyPreviousDecorations(textEditor: TextEditor) {
    this.previousDecorations.forEach((ranges, decorationType) => {
      textEditor.setDecorations(decorationType, ranges);
    });
  }

  hasPreviousDecorations() {
    return this.previousDecorations.size > 0;
  }

  dispose() {
    this.configurationChangeDisposable.dispose();
  }
}

export default TextDecorationApplier;
