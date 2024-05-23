import {
  Diagnostic,
  DiagnosticCollection,
  DiagnosticSeverity,
  Disposable,
  ExtensionContext,
  Range,
  TextDocument,
  TextDocumentChangeEvent,
  Uri,
  commands,
  languages,
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
  private diagnosticCollection: DiagnosticCollection;

  constructor(context: ExtensionContext) {
    this.regexTestFileUri = Uri.file(`${context.extensionPath}/${REGEX_TEST_FILE_PATH}`);
    this.diagnosticCollection = this.createDiagnosticCollection();
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

  createDiagnosticCollection() {
    return languages.createDiagnosticCollection('regex-match');
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
    const fileContent = document.getText();
    const diagnostics: Diagnostic[] = [];

    try {
      const parsedRegexTest = FileParser.parseFileContent(fileContent);

      if (!parsedRegexTest) {
        void window.showErrorMessage('Regex not found. Please format the file according to the established standard.');
        return;
      }

      const matchResults = RegexTester.testRegex(parsedRegexTest);
      return matchResults;
    } catch (error) {
      if (error instanceof Error) {
        const firstLine = document.lineAt(0).text;
        const errorRange = new Range(0, 0, 0, firstLine.length);
        const regexSyntaxErrorDiagnostic = new Diagnostic(
          errorRange,
          `Regex syntax error: ${error.message}`,
          DiagnosticSeverity.Error,
        );

        diagnostics.push(regexSyntaxErrorDiagnostic);
      }
    } finally {
      this.diagnosticCollection.set(this.regexTestFileUri, diagnostics);
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
