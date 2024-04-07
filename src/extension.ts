import { commands, window, ExtensionContext, workspace } from 'vscode';

import FileCreator from './FileCreator';
import FileParser from './FileParser';
import RegexTester from './RegexTester';

export function activate(context: ExtensionContext) {
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
    const document = await FileCreator.openRegexTestFile(context.extensionPath);
    await parseAndTextRegex(document.getText());
  });

  const onChangeTextDocumentDisposable = workspace.onDidChangeTextDocument(async (event) => {
    const activeEditor = window.activeTextEditor;
    if (!activeEditor) {
      return;
    }

    const document = event.document;
    if (document === activeEditor.document) {
      await parseAndTextRegex(document.getText());
    }
  });

  context.subscriptions.push(openRegexTestWindowDisposable, onChangeTextDocumentDisposable);
}
