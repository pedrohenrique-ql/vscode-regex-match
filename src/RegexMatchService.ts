import {
  Disposable,
  ExtensionContext,
  Range,
  TextDocument,
  TextDocumentChangeEvent,
  Uri,
  commands,
  window,
  workspace,
} from 'vscode';

import FileCreator from './FileCreator';
import FileParser from './FileParser';
import RegexTester, { MatchResult } from './RegexTester';

export const REGEX_TEST_FILE_PATH = '/regex-test-file/RegexMatch.rgx';

const matchDecoration = window.createTextEditorDecorationType({ backgroundColor: 'rgba(255,165,0,0.5)' });

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
    this.parseAndTestRegex(document);
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
      this.applyMatchDecorations(matchResults, document);
    } catch (error) {
      if (error instanceof Error) {
        void window.showErrorMessage(error.message);
      }
    }
  }

  private applyMatchDecorations(matchResults: MatchResult[], document: TextDocument) {
    const activeEditor = window.activeTextEditor;
    if (!(activeEditor && document === activeEditor.document)) {
      return;
    }

    const ranges = matchResults.map(({ range }) => {
      const start = document.positionAt(range[0]);
      const end = document.positionAt(range[1]);

      return new Range(start, end);
    });

    activeEditor.setDecorations(matchDecoration, ranges);
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
      this.parseAndTestRegex(document);
    }
  }
}

export default RegexMatchService;
