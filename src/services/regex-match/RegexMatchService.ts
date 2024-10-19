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
  private textDecorationApplier: TextDecorationApplier;
  private disposables: Disposable[] = [];

  private regexTests: RegexTest[] = [];

  constructor(context: ExtensionContext, diagnosticProvider: DiagnosticProvider) {
    this.diagnosticProvider = diagnosticProvider;
    this.regexTestFileUri = Uri.file(`${context.extensionPath}${REGEX_TEST_FILE_PATH}`);
    this.textDecorationApplier = new TextDecorationApplier();

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
    const changeTextDocumentDisposable = this.setupTextDocumentChangeHandling();

    const changeActiveTextEditorDisposable = window.onDidChangeActiveTextEditor((editor) =>
      this.onChangeActiveTextEditor(editor),
    );

    const changeColorHighlightingConfigurationDisposable = this.onChangeColorHighlightingConfiguration();

    return [
      changeTextDocumentDisposable,
      changeActiveTextEditorDisposable,
      changeColorHighlightingConfigurationDisposable,
    ];
  }

  private async openRegexTestWindow(codeRegex?: CodeRegex) {
    const document = await FileCreator.openRegexTestFile(this.regexTestFileUri, codeRegex?.pattern);

    const activeEditor = window.activeTextEditor;
    if (!(activeEditor && document === activeEditor.document)) {
      return;
    }

    this.updateRegexTest(activeEditor, codeRegex);
  }

  private updateRegexTest(textEditor: TextEditor, codeRegex?: CodeRegex) {
    const regexTests = this.parseAndTestRegex(textEditor.document, codeRegex);
    this.textDecorationApplier.applyDecorations(textEditor, regexTests);
  }

  private parseAndTestRegex(document: TextDocument, codeRegex?: CodeRegex) {
    const fileContent = document.getText();
    const diagnostics: Diagnostic[] = [];

    try {
      const parsedRegexTests = FileParser.parseFileContent(fileContent, this.regexTests, codeRegex);
      this.regexTests = parsedRegexTests;

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
      this.updateRegexTest(activeEditor);
    }
  }

  private onChangeActiveTextEditor(activeEditor: TextEditor | undefined) {
    if (activeEditor && activeEditor.document.uri.path === this.regexTestFileUri.path) {
      this.updateRegexTest(activeEditor);
    }
  }

  private onChangeColorHighlightingConfiguration() {
    return workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('regex-match.colorHighlighting')) {
        const visibleEditors = window.visibleTextEditors;

        const regexMatchEditor = visibleEditors.find(
          (editor) => editor.document.uri.path === this.regexTestFileUri.path,
        );

        if (regexMatchEditor) {
          this.textDecorationApplier.applyDecorations(regexMatchEditor, this.regexTests, {
            isToUpdateDecorations: true,
          });
        }
      }
    });
  }

  dispose() {
    this.textDecorationApplier.dispose();
    disposeAll(this.disposables);
  }
}

export default RegexMatchService;
