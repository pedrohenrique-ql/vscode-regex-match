import {
  Diagnostic,
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

import TextDecorationApplier from './decorations/TextDecorationApplier';
import DiagnosticProvider from './DiagnosticProvider';
import FileCreator from './FileCreator';
import FileParser from './FileParser';

export const REGEX_TEST_FILE_PATH = '/regex-test-file/RegexMatch.rgx';

const REGEX_TEST_PATTERN_ERROR_MESSAGE = `Parsing error: The format of the regex test is incorrect. Please ensure your test follows the required pattern.\n\nExpected format:\n\n/regex/[flags]\n---\ntest string\n---`;

class RegexMatchService {
  private regexTestFileUri: Uri;
  private diagnosticProvider: DiagnosticProvider;

  constructor(context: ExtensionContext) {
    this.regexTestFileUri = Uri.file(`${context.extensionPath}${REGEX_TEST_FILE_PATH}`);
    this.diagnosticProvider = new DiagnosticProvider('regex-match');
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

  getDiagnosticCollection() {
    return this.diagnosticProvider.getDiagnosticCollection();
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
    const regexTests = this.parseAndTestRegex(document);
    TextDecorationApplier.updateDecorations(document, regexTests);
  }

  private parseAndTestRegex(document: TextDocument) {
    const fileContent = document.getText();
    const diagnostics: Diagnostic[] = [];

    try {
      const parsedRegexTests = FileParser.parseFileContent(fileContent);

      if (!parsedRegexTests) {
        const firstLine = document.lineAt(0).text;
        const errorRange = new Range(0, 0, 0, firstLine.length);
        const parsingDiagnosticError = this.diagnosticProvider.createErrorDiagnostic(
          errorRange,
          REGEX_TEST_PATTERN_ERROR_MESSAGE,
        );

        diagnostics.push(parsingDiagnosticError);
        return;
      }

      return parsedRegexTests;
    } catch (error) {
      if (error instanceof Error) {
        const firstLine = document.lineAt(0).text;
        const errorRange = new Range(0, 0, 0, firstLine.length);
        const regexSyntaxDiagnosticError = this.diagnosticProvider.createErrorDiagnostic(errorRange, error.message);

        diagnostics.push(regexSyntaxDiagnosticError);
      }
    } finally {
      this.diagnosticProvider.updateDiagnostics(this.regexTestFileUri, diagnostics);
    }
  }

  private setupTextDocumentChangeHandling() {
    return workspace.onDidChangeTextDocument((event) => this.onChangeTextDocument(event));
  }

  private onChangeTextDocument(event: TextDocumentChangeEvent) {
    const activeEditor = window.activeTextEditor;
    const eventDocument = event.document;

    if (
      activeEditor &&
      eventDocument.uri.path === this.regexTestFileUri.path &&
      eventDocument === activeEditor.document &&
      event.contentChanges.length > 0
    ) {
      this.updateRegexTest(eventDocument);
    }
  }
}

export default RegexMatchService;
