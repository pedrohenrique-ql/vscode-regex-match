import {
  CodeLensProvider,
  ConfigurationChangeEvent,
  Diagnostic,
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

import TestRegexCodeLensProvider from './code-lenses/TestRegexCodeLensProvider';
import TextDecorationApplier from './decorations/TextDecorationApplier';
import DiagnosticProvider from './DiagnosticProvider';
import RegexMatchFormatError from './exceptions/RegexMatchFormatError';
import RegexSyntaxError from './exceptions/RegexSyntaxError';
import FileCreator from './FileCreator';
import FileParser from './FileParser';

export const REGEX_TEST_FILE_PATH = '/regex-test-file/RegexMatch.rgx';

class RegexMatchService {
  private context: ExtensionContext;

  private regexTestFileUri: Uri;
  private diagnosticProvider: DiagnosticProvider;

  private testRegexCodeLensProvider: CodeLensProvider;
  private codeLensDisposable: Disposable | undefined;

  constructor(context: ExtensionContext) {
    this.context = context;
    this.regexTestFileUri = Uri.file(`${context.extensionPath}${REGEX_TEST_FILE_PATH}`);
    this.diagnosticProvider = new DiagnosticProvider('regex-match');
    this.testRegexCodeLensProvider = new TestRegexCodeLensProvider();

    this.updateCodeLensProvider();
  }

  registerCommands(): Disposable[] {
    const openRegexTextCommand = commands.registerCommand('regex-match.openRegexMatchWindow', (codeRegex?: string) =>
      this.openRegexTestWindow(codeRegex),
    );

    return [openRegexTextCommand];
  }

  registerDisposables(): Disposable[] {
    const onChangeTextDocumentDisposable = this.setupTextDocumentChangeHandling();
    const onChangeConfigurationDisposable = workspace.onDidChangeConfiguration((event) =>
      this.onChangeConfiguration(event),
    );

    return [onChangeTextDocumentDisposable, onChangeConfigurationDisposable];
  }

  getDiagnosticCollection() {
    return this.diagnosticProvider.getDiagnosticCollection();
  }

  private async openRegexTestWindow(codeRegex?: string) {
    const document = await FileCreator.openRegexTestFile(this.regexTestFileUri, codeRegex);

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
      return parsedRegexTests;
    } catch (error) {
      if (error instanceof Error) {
        const diagnosticError = this.handleError(error, document);
        diagnostics.push(diagnosticError);
      }
    } finally {
      this.diagnosticProvider.updateDiagnostics(this.regexTestFileUri, diagnostics);
    }
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

  private onChangeConfiguration(event: ConfigurationChangeEvent) {
    if (event.affectsConfiguration('regex-match.codeLens.enabled')) {
      this.updateCodeLensProvider();
    }
  }

  private updateCodeLensProvider() {
    const isCodeLensEnabled = workspace.getConfiguration('regex-match').get<boolean>('codeLens.enabled');

    if (isCodeLensEnabled) {
      if (!this.codeLensDisposable) {
        this.codeLensDisposable = languages.registerCodeLensProvider(
          { pattern: '**/*' },
          this.testRegexCodeLensProvider,
        );

        this.context.subscriptions.push(this.codeLensDisposable);
      }
    } else if (this.codeLensDisposable) {
      this.codeLensDisposable.dispose();
      this.codeLensDisposable = undefined;
    }
  }
}

export default RegexMatchService;
