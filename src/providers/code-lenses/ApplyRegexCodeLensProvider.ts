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
    const codeRegexList = this.regexTests.filter((regexTest) => regexTest.isCodeRegex());

    if (codeRegexList.length === 0) {
      return [];
    }

    const codeLenses: CodeLens[] = [];
    const documentText = document.getText();

    for (const regexTest of codeRegexList) {
      const updatedRegex = regexTest.getMatchingRegex();
      const codeRegExp = regexTest.getCodeRegExp();

      if (!updatedRegex || !codeRegExp) {
        continue;
      }

      const matchingRegexSource = regexTest.getMatchingRegexSource();
      const codeRegexSource = `/${codeRegExp.source}/${codeRegExp.flags}`;

      const isRegexUpdated = codeRegexSource !== matchingRegexSource;

      if (!isRegexUpdated) {
        continue;
      }

      const updatedRegexSource = updatedRegex.source;
      const escapedRegexString = escapeRegexSource(updatedRegexSource);
      const searchRegex = new RegExp(escapedRegexString, 'g');
      const match = searchRegex.exec(documentText);

      if (match && this.isCodeRegexInEditor(regexTest)) {
        const startPosition = document.positionAt(match.index);
        const endPosition = document.positionAt(match.index + match[0].length);
        const matchRange = new Range(startPosition, endPosition);

        const command: CodeLens['command'] = {
          title: 'Apply Regex to Code',
          command: 'regex-match.applyRegexToCode',
          arguments: [regexTest.getCodeRegex(), matchingRegexSource],
        };

        codeLenses.push(new CodeLens(matchRange, command));
      }
    }

    return codeLenses;
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
