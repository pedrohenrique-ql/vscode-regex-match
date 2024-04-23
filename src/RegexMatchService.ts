import {
  ConfigurationTarget,
  Disposable,
  ExtensionContext,
  TextDocumentChangeEvent,
  Uri,
  commands,
  window,
  workspace,
} from 'vscode';

import FileCreator from './FileCreator';
import FileParser from './FileParser';
import RegexTester from './RegexTester';

export const REGEX_TEST_FILE_PATH = '/regex-test-file/RegexMatch.rgx';

class RegexMatchService {
  private regexTestFileUri: Uri;
  private regexTestDebounce: NodeJS.Timeout | undefined;

  constructor(context: ExtensionContext) {
    this.regexTestFileUri = Uri.file(`${context.extensionPath}/${REGEX_TEST_FILE_PATH}`);
  }

  registerCommands(): Disposable[] {
    const openRegexTextCommand = commands.registerCommand('regex-match.openRegexTestWindow', () =>
      this.openRegexTestWindow(),
    );

    return [openRegexTextCommand];
  }

  registerDisposables(): Disposable[] {
    const onChangeTextDocumentDisposable = this.setupTextDocumentChangeHandling();

    return [onChangeTextDocumentDisposable];
  }

  async setupFileAutoSave() {
    await workspace
      .getConfiguration('', this.regexTestFileUri)
      .update('files.autoSave', 'afterDelay', ConfigurationTarget.Global);
  }

  private async parseAndTestRegex(fileContent: string) {
    try {
      const parsedRegexTest = FileParser.parseFileContent(fileContent);

      if (!parsedRegexTest) {
        await window.showErrorMessage('Regex not found. Please format the file according to the established standard.');
        return;
      }

      RegexTester.testRegex(parsedRegexTest);
    } catch (error) {
      if (error instanceof Error) {
        await window.showErrorMessage(error.message);
      }
    }
  }

  private async openRegexTestWindow() {
    const document = await FileCreator.openRegexTestFile(this.regexTestFileUri);
    await this.parseAndTestRegex(document.getText());
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
      if (this.regexTestDebounce) {
        clearTimeout(this.regexTestDebounce);
      }

      this.regexTestDebounce = setTimeout(async () => {
        await this.parseAndTestRegex(document.getText());
      }, 300);
    }
  }
}

export default RegexMatchService;
