import {
  Diagnostic,
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

import { CodeRegex } from '@/providers/code-lenses/TestRegexCodeLensProvider';

import TextDecorationApplier from '../../decorations/TextDecorationApplier';
import RegexMatchFormatError from '../../exceptions/RegexMatchFormatError';
import RegexSyntaxError from '../../exceptions/RegexSyntaxError';
import DiagnosticProvider from '../../providers/DiagnosticProvider';
import { disposeAll } from '../../utils/dipose';
import FileCreator from './FileCreator';
import FileParser from './FileParser';
import RegexTest from './RegexTest';

export const REGEX_TEST_FILE_PATH = '/regex-test-file/RegexMatch.rgx';

class RegexMatchService implements Disposable {
  private regexTestFileUri: Uri;
  private diagnosticProvider: DiagnosticProvider;
  private disposables: Disposable[] = [];

  private regexTests: RegexTest[] = [];

  constructor(context: ExtensionContext, diagnosticProvider: DiagnosticProvider) {
    this.diagnosticProvider = diagnosticProvider;
    this.regexTestFileUri = Uri.file(`${context.extensionPath}${REGEX_TEST_FILE_PATH}`);

    const commands = this.registerCommands();
    const disposables = this.registerDisposables();
    this.disposables.push(...commands, ...disposables);
  }

  getRegexTests() {
    return this.regexTests;
  }

  registerCommands(): Disposable[] {
    const openRegexTextCommand = commands.registerCommand('regex-match.openRegexMatchWindow', (codeRegex?: CodeRegex) =>
      this.openRegexTestWindow(codeRegex),
    );

    return [openRegexTextCommand];
  }

  registerDisposables(): Disposable[] {
    const onChangeTextDocumentDisposable = this.setupTextDocumentChangeHandling();

    const onChangeActiveTextEditorDisposable = window.onDidChangeActiveTextEditor((editor) =>
      this.onChangeActiveTextEditor(editor),
    );

    return [onChangeTextDocumentDisposable, onChangeActiveTextEditorDisposable];
  }

  private async openRegexTestWindow(codeRegex?: CodeRegex) {
    const document = await FileCreator.openRegexTestFile(this.regexTestFileUri, codeRegex?.pattern);

    const activeEditor = window.activeTextEditor;
    if (!(activeEditor && document === activeEditor.document)) {
      return;
    }

    this.updateRegexTest(document, codeRegex);
  }

  private updateRegexTest(document: TextDocument, codeRegex?: CodeRegex) {
    const regexTests = this.parseAndTestRegex(document, codeRegex);
    TextDecorationApplier.updateDecorations(document, regexTests);
  }

  private parseAndTestRegex(document: TextDocument, codeRegex?: CodeRegex) {
    const fileContent = document.getText();
    const diagnostics: Diagnostic[] = [];

    try {
      const parsedRegexTests = FileParser.parseFileContent(fileContent, this.regexTests, codeRegex);
      this.regexTests = parsedRegexTests;
      console.log('parsedRegexTests', parsedRegexTests);

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

  private onChangeActiveTextEditor(activeEditor: TextEditor | undefined) {
    if (activeEditor && activeEditor.document.uri.path === this.regexTestFileUri.path) {
      this.updateRegexTest(activeEditor.document);
    }
  }

  dispose() {
    disposeAll(this.disposables);
  }
}

export default RegexMatchService;
