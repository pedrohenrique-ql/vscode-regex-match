import { commands, window, ExtensionContext, workspace, Uri, ConfigurationTarget } from 'vscode';

import FileCreator from './FileCreator';
import FileParser from './FileParser';
import RegexTester from './RegexTester';

const REGEX_TEST_FILE_PATH = '/regex-test-file/RegexMatch.rgx';

export async function activate(context: ExtensionContext) {
  const regexTestFileUri = Uri.file(`${context.extensionPath}/${REGEX_TEST_FILE_PATH}`);
  await workspace
    .getConfiguration('', regexTestFileUri)
    .update('files.autoSave', 'afterDelay', ConfigurationTarget.Global);

  let testDebounce: NodeJS.Timeout | undefined;

  async function parseAndTextRegex(fileContent: string) {
    try {
      const parsedRegexTest = FileParser.parseRegexAndTextLines(fileContent);

      if (!parsedRegexTest) {
        await window.showErrorMessage('Regex not found. Please format the file according to the established standard.');
        return;
      }

      await RegexTester.testRegex(parsedRegexTest);
    } catch (error) {
      if (error instanceof Error) {
        await window.showErrorMessage(error.message);
      }
    }
  }

  const openRegexTestWindowDisposable = commands.registerCommand('regex-match.openRegexTestWindow', async () => {
    const document = await FileCreator.openRegexTestFile(regexTestFileUri);
    await parseAndTextRegex(document.getText());
  });

  const onChangeTextDocumentDisposable = workspace.onDidChangeTextDocument((event) => {
    const activeEditor = window.activeTextEditor;
    if (!activeEditor) {
      return;
    }

    const document = event.document;

    if (document === activeEditor.document && event.contentChanges.length !== 0) {
      if (testDebounce) {
        clearTimeout(testDebounce);
      }

      testDebounce = setTimeout(async () => {
        await parseAndTextRegex(document.getText());
      }, 500);
    }
  });

  context.subscriptions.push(openRegexTestWindowDisposable, onChangeTextDocumentDisposable);
}
