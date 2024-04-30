import {
  Disposable,
  ExtensionContext,
  Range,
  TextDocument,
  TextDocumentChangeEvent,
  TextEditor,
  Uri,
  commands,
  window,
  workspace,
} from 'vscode';

import FileCreator from './FileCreator';
import FileParser, { TEST_AREA_DELIMITER } from './FileParser';
import RegexTester, { MatchResult } from './RegexTester';

export const REGEX_TEST_FILE_PATH = '/regex-test-file/RegexMatch.rgx';

const matchDecorationType = window.createTextEditorDecorationType({ backgroundColor: 'rgba(255,165,0,0.5)' });
const delimiterDecorationType = window.createTextEditorDecorationType({
  color: 'rgba(189,147,249)',
  fontWeight: 'bold',
});

class RegexMatchService {
  private regexTestFileUri: Uri;

  constructor(context: ExtensionContext) {
    this.regexTestFileUri = Uri.file(`${context.extensionPath}/${REGEX_TEST_FILE_PATH}`);
  }

  registerCommands(): Disposable[] {
    const openRegexTextCommand = commands.registerCommand('regex-match.openRegexTestWindow', () =>
      this.openRegexTestWindow(),
    );

    return [openRegexTextCommand];
  }

  registerDisposables(): Disposable[] {
    const onChangeTextDocumentDisposable = this.setupTextDocumentChangeHandling();

    return [onChangeTextDocumentDisposable];
  }

  private async openRegexTestWindow() {
    const document = await FileCreator.openRegexTestFile(this.regexTestFileUri);

    const activeEditor = window.activeTextEditor;
    if (!(activeEditor && document === activeEditor.document)) {
      return;
    }

    this.updateRegexTest(document);
  }

  private updateRegexTest(document: TextDocument) {
    const matchResults = this.parseAndTestRegex(document);
    this.updateDecorations(document, matchResults ?? []);
  }

  private parseAndTestRegex(document: TextDocument) {
    try {
      const fileContent = document.getText();
      const parsedRegexTest = FileParser.parseFileContent(fileContent);

      if (!parsedRegexTest) {
        void window.showErrorMessage('Regex not found. Please format the file according to the established standard.');
        return;
      }

      const matchResults = RegexTester.testRegex(parsedRegexTest);
      return matchResults;
    } catch (error) {
      if (error instanceof Error) {
        void window.showErrorMessage(error.message);
      }
    }
  }

  private updateDecorations(document: TextDocument, matchResults: MatchResult[]) {
    const activeEditor = window.activeTextEditor;
    if (!(activeEditor && document === activeEditor.document)) {
      return;
    }

    this.applyMatchDecorations(activeEditor, matchResults);
    this.applyDelimiterDecorations(activeEditor);
  }

  private applyMatchDecorations(activeEditor: TextEditor, matchResults: MatchResult[]) {
    const document = activeEditor.document;

    const ranges = matchResults.map(({ range }) => {
      const start = document.positionAt(range[0]);
      const end = document.positionAt(range[1]);

      return new Range(start, end);
    });

    activeEditor.setDecorations(matchDecorationType, ranges);
  }

  private applyDelimiterDecorations(activeEditor: TextEditor) {
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

  private setupTextDocumentChangeHandling() {
    return workspace.onDidChangeTextDocument((event) => this.onChangeTextDocument(event));
  }

  private onChangeTextDocument(event: TextDocumentChangeEvent) {
    const activeEditor = window.activeTextEditor;
    if (!activeEditor) {
      return;
    }

    const document = event.document;

    if (document === activeEditor.document && event.contentChanges.length !== 0) {
      this.updateRegexTest(document);
    }
  }
}

export default RegexMatchService;
