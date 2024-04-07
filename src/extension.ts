import { commands, window, ExtensionContext } from 'vscode';

import FileCreator from './FileCreator';
import FileParser from './FileParser';
import RegexTester from './RegexTester';

export function activate(context: ExtensionContext) {
  const disposable = commands.registerCommand('regex-match.openRegexTestWindow', async () => {
    const document = await FileCreator.openRegexTestFile(context.extensionPath);

    const fileContent = document.getText();
    const parsedRegexTest = FileParser.parseRegexAndTextLines(fileContent);

    if (!parsedRegexTest) {
      await window.showErrorMessage(`Regex not found. Please format the file according to the established standard.`);
      return;
    }

    await RegexTester.testRegex(parsedRegexTest);
  });

  context.subscriptions.push(disposable);
}
