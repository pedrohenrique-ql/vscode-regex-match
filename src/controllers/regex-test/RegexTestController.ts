import {
  commands,
  Disposable,
  ExtensionContext,
  languages,
  TextDocument,
  TextDocumentChangeEvent,
  TextEditor,
  Uri,
  window,
  workspace,
} from 'vscode';

import RegexTestFile from '@/controllers/regex-test/RegexTestFile';
import { REGEX_MATCH_LANGUAGE_ID } from '@/extension';
import ApplyRegexCodeLensProvider from '@/providers/code-lenses/ApplyRegexCodeLensProvider';
import { CodeRegex } from '@/providers/code-lenses/TestRegexCodeLensProvider';
import { disposeAll } from '@/utils/dispose';

import DiagnosticProvider from '../../providers/DiagnosticProvider';
import FileCreator from './FileCreator';

export const REGEX_TEST_FILE_PATH = '/regex-test-file/RegexMatch.rgx';

class RegexTestController implements Disposable {
  private readonly rgxFiles = new Map<string, RegexTestFile>();
  private readonly defaultRegexTestFileUri: Uri;

  private readonly diagnosticProvider: DiagnosticProvider;
  private applyRegexCodeLensProvider: ApplyRegexCodeLensProvider;

  private disposables: Disposable[] = [];
  private codeRegex?: CodeRegex;

  constructor(extensionPath: ExtensionContext['extensionPath'], diagnosticProvider: DiagnosticProvider) {
    this.diagnosticProvider = diagnosticProvider;
    this.defaultRegexTestFileUri = Uri.file(`${extensionPath}${REGEX_TEST_FILE_PATH}`);

    this.applyRegexCodeLensProvider = new ApplyRegexCodeLensProvider();
    this.disposables = this.registerDisposables();

    this.checkOpenRgxFiles();
  }

  registerDisposables(): Disposable[] {
    const closeTextDocumentDisposable = workspace.onDidCloseTextDocument((document) =>
      this.onCloseTextDocument(document),
    );

    const changeVisibleEditorsDisposable = window.onDidChangeVisibleTextEditors((event) =>
      this.onChangeVisibleTextEditors(event),
    );

    const onChangeTextDocumentDisposable = workspace.onDidChangeTextDocument((event) =>
      this.onChangeTextDocument(event),
    );

    const openRegexTextCommand = commands.registerCommand('regex-match.openRegexMatchWindow', (codeRegex?: CodeRegex) =>
      this.openDefaultRegexTestWindow(codeRegex),
    );

    const applyRegexDisposable = languages.registerCodeLensProvider(
      { pattern: this.defaultRegexTestFileUri.path, scheme: 'file' },
      this.applyRegexCodeLensProvider,
    );

    return [
      closeTextDocumentDisposable,
      changeVisibleEditorsDisposable,
      onChangeTextDocumentDisposable,
      openRegexTextCommand,
      applyRegexDisposable,
    ];
  }

  addRegexTestFile(documentUri: Uri) {
    const isDefaultTestFile = this.isDefaultRegexTestFile(documentUri.toString());

    const regexTestFile = new RegexTestFile(documentUri, this.diagnosticProvider, {
      isDefaultTestFile,
      applyRegexCodeLensProvider: isDefaultTestFile ? this.applyRegexCodeLensProvider : undefined,
      isOpeningWithCodeRegex: !!this.codeRegex,
    });

    this.rgxFiles.set(documentUri.toString(), regexTestFile);
  }

  onCloseTextDocument(document: TextDocument) {
    const documentUri = document.uri.toString();

    if (this.rgxFiles.has(documentUri)) {
      const regexTestFile = this.rgxFiles.get(documentUri);
      regexTestFile?.dispose();
      this.rgxFiles.delete(documentUri);
    }
  }

  onChangeVisibleTextEditors(textEditors: readonly TextEditor[]) {
    const visibleRgxEditors = textEditors.filter((editor) => editor.document.languageId === REGEX_MATCH_LANGUAGE_ID);

    for (const editor of visibleRgxEditors) {
      const documentUriString = editor.document.uri.toString();

      if (!this.rgxFiles.has(documentUriString)) {
        this.addRegexTestFile(editor.document.uri);
      }
    }

    for (const [uriString, regexTestFile] of this.rgxFiles) {
      const regexMatchEditor = textEditors.find((editor) => editor.document.uri.toString() === uriString);

      if (!regexMatchEditor) {
        regexTestFile.dispose();
        this.rgxFiles.delete(uriString);
      }
    }
  }

  onChangeTextDocument(event: TextDocumentChangeEvent) {
    const activeEditor = window.activeTextEditor;
    const eventDocument = event.document;

    const regexTestFile = this.rgxFiles.get(eventDocument.uri.toString());

    const isToUpdateFile = regexTestFile && event.contentChanges.length > 0 && eventDocument === activeEditor?.document;

    if (isToUpdateFile) {
      regexTestFile.handleTextDocumentChange(activeEditor, this.codeRegex);
      this.codeRegex = undefined;
    }
  }

  private checkOpenRgxFiles() {
    const regexMatchEditor = window.visibleTextEditors.filter(
      (editor) => editor.document.languageId === REGEX_MATCH_LANGUAGE_ID,
    );

    for (const editor of regexMatchEditor) {
      const documentUriString = editor.document.uri.toString();

      if (!this.rgxFiles.has(documentUriString)) {
        this.addRegexTestFile(editor.document.uri);
      }
    }
  }

  async openDefaultRegexTestWindow(codeRegex?: CodeRegex) {
    this.codeRegex = codeRegex;
    await FileCreator.openRegexTestFile(this.defaultRegexTestFileUri, codeRegex?.pattern);
  }

  isDefaultRegexTestFile(documentUriString: string) {
    return this.defaultRegexTestFileUri.toString() === documentUriString;
  }

  dispose() {
    disposeAll(this.disposables);
    disposeAll(Array.from(this.rgxFiles.values()));
    this.rgxFiles.clear();
  }
}

export default RegexTestController;
