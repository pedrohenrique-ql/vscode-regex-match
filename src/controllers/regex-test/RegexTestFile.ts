import {
  Diagnostic,
  Disposable,
  Range,
  TextDocument,
  TextEditor,
  Uri,
  ViewColumn,
  commands,
  window,
  workspace,
} from 'vscode';

import FileParser from '@/controllers/regex-test/FileParser';
import RegexTest from '@/controllers/regex-test/RegexTest';
import TextDecorationApplier from '@/decorations/TextDecorationApplier';
import RegexMatchFormatError from '@/exceptions/RegexMatchFormatError';
import RegexSyntaxError from '@/exceptions/RegexSyntaxError';
import ApplyRegexCodeLensProvider from '@/providers/code-lenses/ApplyRegexCodeLensProvider';
import { CodeRegex } from '@/providers/code-lenses/TestRegexCodeLensProvider';
import DiagnosticProvider from '@/providers/DiagnosticProvider';
import { disposeAll } from '@/utils/dispose';

class RegexTestFile implements Disposable {
  private readonly fileUri: Uri;
  private readonly isDefaultTestFile: boolean;
  private regexTests: RegexTest[] = [];

  private readonly diagnosticProvider: DiagnosticProvider;
  private textDecorationApplier: TextDecorationApplier;
  private applyRegexCodeLensProvider?: ApplyRegexCodeLensProvider;
  private disposables: Disposable[] = [];

  private currentViewColumn: ViewColumn | undefined;
  private isEditorVisible = false;

  constructor(
    fileUri: Uri,
    diagnosticProvider: DiagnosticProvider,
    options: {
      applyRegexCodeLensProvider?: ApplyRegexCodeLensProvider;
      isDefaultTestFile?: boolean;
      isOpeningWithCodeRegex?: boolean;
    } = {},
  ) {
    const { isDefaultTestFile = false, isOpeningWithCodeRegex = false } = options;

    this.fileUri = fileUri;
    this.isDefaultTestFile = isDefaultTestFile;
    this.diagnosticProvider = diagnosticProvider;
    this.applyRegexCodeLensProvider = options.applyRegexCodeLensProvider;

    this.textDecorationApplier = new TextDecorationApplier();

    this.registerCommands();
    this.registerDisposables();

    this.checkRegexMatchEditorVisibility({ isOpeningWithCodeRegex });
  }

  getRegexTests() {
    return this.regexTests;
  }

  private checkRegexMatchEditorVisibility(options: { isOpeningWithCodeRegex?: boolean } = {}) {
    const regexMatchEditor = window.visibleTextEditors.find((editor) => editor.document.uri.path === this.fileUri.path);

    this.currentViewColumn = regexMatchEditor?.viewColumn;

    if (regexMatchEditor && !options.isOpeningWithCodeRegex) {
      this.updateRegexTest(regexMatchEditor);
      this.isEditorVisible = true;
    }
  }

  registerCommands() {
    if (!this.isDefaultTestFile) {
      return;
    }

    const applyRegexToCodeCommand = commands.registerCommand(
      'regex-match.applyRegexToCode',
      (codeRegex: CodeRegex, updatedRegexSource?: string) => this.onApplyRegexToCode(codeRegex, updatedRegexSource),
    );

    this.disposables.push(applyRegexToCodeCommand);
  }

  registerDisposables() {
    const changeActiveTextEditorDisposable = window.onDidChangeVisibleTextEditors((editors) =>
      this.onChangeVisibleEditors(editors),
    );

    const changeColorHighlightingConfigurationDisposable = this.onChangeColorHighlightingConfiguration();

    this.disposables.push(changeActiveTextEditorDisposable, changeColorHighlightingConfigurationDisposable);
  }

  updateRegexTest(textEditor: TextEditor, codeRegex?: CodeRegex) {
    const regexTests = this.parseAndTestRegex(textEditor.document, codeRegex);

    if (this.applyRegexCodeLensProvider) {
      this.applyRegexCodeLensProvider.setRegexTests(regexTests ?? []);
    }

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
      this.diagnosticProvider.updateDiagnostics(document.uri, diagnostics);
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

  handleTextDocumentChange(textEditor: TextEditor, codeRegex?: CodeRegex) {
    this.updateRegexTest(textEditor, codeRegex);
  }

  private onChangeVisibleEditors(textEditors: readonly TextEditor[]) {
    const regexMatchEditor = textEditors.find((editor) => {
      return editor.document.uri.toString() === this.fileUri.toString();
    });

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

        const regexMatchEditor = visibleEditors.find((editor) => editor.document.uri.path === this.fileUri.path);

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

export default RegexTestFile;
