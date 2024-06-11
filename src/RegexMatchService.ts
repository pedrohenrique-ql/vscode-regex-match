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
import RegexMatchFormatError from './exceptions/RegexMatchFormatError';
import RegexSyntaxError from './exceptions/RegexSyntaxError';
import FileCreator from './FileCreator';
import FileParser from './FileParser';
import RegexTest from './RegexTest';

export const REGEX_TEST_FILE_PATH = '/regex-test-file/RegexMatch.rgx';

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

      const { regexTests, regexTestsWithError } = this.reduceParsedRegexTests(parsedRegexTests);

      if (regexTestsWithError.length > 0) {
        for (const regexTest of regexTestsWithError) {
          const error = regexTest.getError();
          if (error) {
            const diagnosticError = this.handleError(error, document);
            diagnostics.push(diagnosticError);
          }
        }
      }

      return regexTests;
    } catch (error) {
      if (error instanceof Error) {
        const diagnosticError = this.handleError(error, document);
        diagnostics.push(diagnosticError);
      }
    } finally {
      this.diagnosticProvider.updateDiagnostics(this.regexTestFileUri, diagnostics);
    }
  }

  private reduceParsedRegexTests(parsedRegexTests: RegexTest[]) {
    const { regexTestsWithError, regexTests } = parsedRegexTests.reduce(
      (acc: { regexTests: RegexTest[]; regexTestsWithError: RegexTest[] }, parsedRegexTest: RegexTest) => {
        if (parsedRegexTest.getError()) {
          acc.regexTestsWithError.push(parsedRegexTest);
        } else {
          acc.regexTests.push(parsedRegexTest);
        }
        return acc;
      },
      { regexTests: [], regexTestsWithError: [] },
    );

    return { regexTestsWithError, regexTests };
  }

  private handleError(error: Error, document: TextDocument): Diagnostic {
    let documentErrorLine = document.lineAt(0).text;
    let errorRange = new Range(0, 0, 0, documentErrorLine.length);

    if (error instanceof RegexMatchFormatError || error instanceof RegexSyntaxError) {
      documentErrorLine = document.lineAt(error.line).text;
      errorRange = new Range(error.line, 0, error.line, documentErrorLine.length);
    }

    const diagnosticError = this.diagnosticProvider.createErrorDiagnostic(errorRange, error.message);
    return diagnosticError;
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
