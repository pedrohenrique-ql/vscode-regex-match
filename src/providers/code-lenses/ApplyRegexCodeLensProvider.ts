import {
  CodeLens,
  CodeLensProvider,
  Event,
  EventEmitter,
  ProviderResult,
  Range,
  TextDocument,
  workspace,
} from 'vscode';

import RegexTest from '@/controllers/regex-test/RegexTest';
import { escapeRegexSource } from '@/utils/regex';

class ApplyRegexCodeLensProvider implements CodeLensProvider {
  private regexTests: RegexTest[];

  private _onDidChangeCodeLenses: EventEmitter<void> = new EventEmitter<void>();
  readonly onDidChangeCodeLenses: Event<void> = this._onDidChangeCodeLenses.event;

  constructor() {
    this.regexTests = [];
  }

  provideCodeLenses(document: TextDocument): ProviderResult<CodeLens[]> {
    const codeLenses: CodeLens[] = [];

    for (let currentIndex = 0; currentIndex < this.regexTests.length; currentIndex++) {
      const regexTest = this.regexTests[currentIndex];

      if (!this.shouldProcessRegexTest(regexTest)) {
        continue;
      }

      const matchRanges = this.findRegexMatchRanges(document, regexTest);
      if (matchRanges.length === 0) {
        continue;
      }

      if (!this.isCodeRegexInEditor(regexTest)) {
        continue;
      }

      const matchingRegexSource = regexTest.getMatchingRegexSource();
      if (!matchingRegexSource) {
        continue;
      }

      const targetRange = this.determineTargetRange(matchRanges, currentIndex, matchingRegexSource);
      const command = {
        title: 'Apply Regex to Code',
        command: 'regex-match.applyRegexToCode',
        arguments: [regexTest.getCodeRegex(), matchingRegexSource],
      } satisfies CodeLens['command'];

      codeLenses.push(new CodeLens(targetRange, command));
    }

    return codeLenses;
  }

  private shouldProcessRegexTest(regexTest: RegexTest): boolean {
    if (!regexTest.isCodeRegex()) {
      return false;
    }

    const updatedRegex = regexTest.getMatchingRegex();
    const codeRegExp = regexTest.getCodeRegExp();

    if (!updatedRegex || !codeRegExp) {
      return false;
    }

    const matchingRegexSource = regexTest.getMatchingRegexSource();
    const codeRegexSource = `/${codeRegExp.source}/${codeRegExp.flags}`;

    return codeRegexSource !== matchingRegexSource;
  }

  private findRegexMatchRanges(document: TextDocument, regexTest: RegexTest): Range[] {
    const updatedRegex = regexTest.getMatchingRegex();
    if (!updatedRegex) {
      return [];
    }

    const updatedRegexSource = updatedRegex.source;
    const escapedRegexString = escapeRegexSource(updatedRegexSource);
    const searchRegex = new RegExp(escapedRegexString, 'g');
    const documentText = document.getText();

    const matchRanges: Range[] = [];
    let match: RegExpExecArray | null;

    while ((match = searchRegex.exec(documentText)) !== null) {
      const startPosition = document.positionAt(match.index);
      const endPosition = document.positionAt(match.index + match[0].length);
      matchRanges.push(new Range(startPosition, endPosition));
    }

    return matchRanges;
  }

  private determineTargetRange(matchRanges: Range[], currentIndex: number, matchingRegexSource: string): Range {
    if (matchRanges.length === 1) {
      return matchRanges[0];
    }

    const regexTestsWithSamePattern = this.getRegexTestsWithSamePattern(matchingRegexSource);
    const positionInPattern = regexTestsWithSamePattern.indexOf(currentIndex);
    const targetIndex = Math.min(positionInPattern, matchRanges.length - 1);

    return matchRanges[targetIndex];
  }

  private getRegexTestsWithSamePattern(matchingRegexSource: string): number[] {
    const indices: number[] = [];

    for (let i = 0; i < this.regexTests.length; i++) {
      const otherRegexTest = this.regexTests[i];
      const otherMatchingRegexSource = otherRegexTest.getMatchingRegexSource();

      if (otherMatchingRegexSource === matchingRegexSource) {
        indices.push(i);
      }
    }

    return indices;
  }

  private isCodeRegexInEditor(regexTest: RegexTest): boolean {
    const codeRegex = regexTest.getCodeRegex();
    const codeRegexDocumentUri = codeRegex?.documentUri;

    if (!codeRegexDocumentUri) {
      return false;
    }

    const codeRegexDocument = workspace.textDocuments.find(
      (document) => document.uri.toString() === codeRegexDocumentUri.toString(),
    );

    return !!codeRegexDocument?.getText().includes(codeRegex.pattern);
  }

  setRegexTests(regexTests: RegexTest[]): void {
    this.regexTests = regexTests;
  }

  refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }
}

export default ApplyRegexCodeLensProvider;
