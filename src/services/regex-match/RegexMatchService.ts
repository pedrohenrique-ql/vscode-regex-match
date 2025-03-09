import {
  Diagnostic,
  Disposable,
  ExtensionContext,
  Range,
  TextDocument,
  TextDocumentChangeEvent,
  TextEditor,
  Uri,
  ViewColumn,
  commands,
  window,
  workspace,
} from 'vscode';

import ApplyRegexCodeLensProvider from '@/providers/code-lenses/ApplyRegexCodeLensProvider';
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
  private regexTests: RegexTest[] = [];

  private diagnosticProvider: DiagnosticProvider;
  private textDecorationApplier: TextDecorationApplier;
  private applyRegexCodeLensProvider: ApplyRegexCodeLensProvider | undefined;
  private disposables: Disposable[] = [];

  private currentViewColumn: ViewColumn | undefined;
  private isEditorVisible = false;

  private isOpeningWithCodeRegex = false;

  constructor(context: ExtensionContext, diagnosticProvider: DiagnosticProvider) {
    this.diagnosticProvider = diagnosticProvider;
    this.regexTestFileUri = Uri.file(`${context.extensionPath}${REGEX_TEST_FILE_PATH}`);
    this.textDecorationApplier = new TextDecorationApplier();

    const commands = this.registerCommands();
    const disposables = this.registerDisposables();
    this.disposables.push(...commands, ...disposables);

    this.checkRegexMatchEditorVisibility();
  }

  getRegexTests() {
    return this.regexTests;
  }

  private checkRegexMatchEditorVisibility() {
    const regexMatchEditor = window.visibleTextEditors.find(
      (editor) => editor.document.uri.path === this.regexTestFileUri.path,
    );

    this.currentViewColumn = regexMatchEditor?.viewColumn;

    if (regexMatchEditor) {
      this.updateRegexTest(regexMatchEditor);
      this.isEditorVisible = true;
    }
  }

  registerCommands(): Disposable[] {
    const openRegexTextCommand = commands.registerCommand('regex-match.openRegexMatchWindow', (codeRegex?: CodeRegex) =>
      this.openRegexTestWindow(codeRegex),
    );

    const applyRegexToCodeCommand = commands.registerCommand(
      'regex-match.applyRegexToCode',
      (codeRegex: CodeRegex, updatedRegexSource?: string) => this.onApplyRegexToCode(codeRegex, updatedRegexSource),
    );

    return [openRegexTextCommand, applyRegexToCodeCommand];
  }

  registerDisposables(): Disposable[] {
    const changeTextDocumentDisposable = workspace.onDidChangeTextDocument((event) => this.onChangeTextDocument(event));

    const changeActiveTextEditorDisposable = window.onDidChangeVisibleTextEditors((editors) =>
      this.onChangeVisibleEditors(editors),
    );

    const changeColorHighlightingConfigurationDisposable = this.onChangeColorHighlightingConfiguration();

    return [
      changeTextDocumentDisposable,
      changeActiveTextEditorDisposable,
      changeColorHighlightingConfigurationDisposable,
    ];
  }

  private async openRegexTestWindow(codeRegex?: CodeRegex) {
    this.isOpeningWithCodeRegex = !!codeRegex;

    const document = await FileCreator.openRegexTestFile(this.regexTestFileUri, codeRegex?.pattern);

    const activeEditor = window.activeTextEditor;
    if (!(activeEditor && document === activeEditor.document)) {
      return;
    }

    this.currentViewColumn = activeEditor.viewColumn;
    this.isEditorVisible = true;

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

  private onChangeTextDocument(event: TextDocumentChangeEvent) {
    const activeEditor = window.activeTextEditor;
    const eventDocument = event.document;

    if (
      activeEditor &&
      eventDocument.uri.path === this.regexTestFileUri.path &&
      eventDocument === activeEditor.document &&
      event.contentChanges.length > 0 &&
      !this.isOpeningWithCodeRegex
    ) {
      this.updateRegexTest(activeEditor);
    }

    if (this.isOpeningWithCodeRegex) {
      this.isOpeningWithCodeRegex = false;
    }
  }

  private onChangeVisibleEditors(textEditors: readonly TextEditor[]) {
    const regexMatchEditor = textEditors.find(
      (editor) => editor.document.uri.toString() === this.regexTestFileUri.toString(),
    );

    if (!regexMatchEditor) {
      this.isEditorVisible = false;
      return;
    }

    if (!this.textDecorationApplier.hasPreviousDecorations() && !this.isEditorVisible) {
      this.updateRegexTest(regexMatchEditor);
    }

    const shouldApplyPreviousDecorations =
      (this.currentViewColumn !== undefined && this.currentViewColumn !== regexMatchEditor.viewColumn) ||
      !this.isEditorVisible;

    if (shouldApplyPreviousDecorations) {
      this.currentViewColumn = regexMatchEditor.viewColumn;
      this.isEditorVisible = true;

      this.textDecorationApplier.applyPreviousDecorations(regexMatchEditor);
    }
  }

  setApplyRegexCodeLensProvider(applyRegexCodeLensProvider: ApplyRegexCodeLensProvider) {
    this.applyRegexCodeLensProvider = applyRegexCodeLensProvider;
  }

  private async onApplyRegexToCode(codeRegex: CodeRegex, updatedRegexSource?: string) {
    if (!updatedRegexSource) {
      return;
    }

    const editor = window.visibleTextEditors.find(
      (editor) => editor.document.uri.toString() === codeRegex.documentUri?.toString(),
    );

    if (!editor) {
      window.showErrorMessage('The code editor for the regex test was not found.');
      return;
    }

    await editor.edit((editBuilder) => {
      editBuilder.replace(codeRegex.range, updatedRegexSource);
    });

    const newRange = new Range(codeRegex.range.start, codeRegex.range.start.translate(0, updatedRegexSource.length));

    const regexTest = this.regexTests.find((regexTest) => regexTest.getCodeRegex() === codeRegex);
    const updatedCodeRegex: CodeRegex = { ...codeRegex, range: newRange, pattern: updatedRegexSource };

    if (regexTest) {
      regexTest.setCodeRegex(updatedCodeRegex);

      if (this.applyRegexCodeLensProvider) {
        this.applyRegexCodeLensProvider.refresh();
      }
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
