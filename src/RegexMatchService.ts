import {
  Disposable,
  ExtensionContext,
  TextDocument,
  TextDocumentChangeEvent,
  Uri,
  commands,
  window,
  workspace,
} from 'vscode';

import TextDecorationApplier from './decorations/TextDecorationApplier';
import FileCreator from './FileCreator';
import FileParser from './FileParser';
import RegexTester from './RegexTester';

export const REGEX_TEST_FILE_PATH = '/regex-test-file/RegexMatch.rgx';

class RegexMatchService {
  private regexTestFileUri: Uri;

  constructor(context: ExtensionContext) {
    this.regexTestFileUri = Uri.file(`${context.extensionPath}/${REGEX_TEST_FILE_PATH}`);
  }

  registerCommands(): Disposable[] {
    const openRegexTextCommand = commands.registerCommand('regex-match.openRegexMatchWindow', () =>
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
    TextDecorationApplier.updateDecorations(document, matchResults);
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
