import { commands, ExtensionContext } from 'vscode';

import FileCreator from './FileCreator';
import FileParser from './FileParser';

export function activate(context: ExtensionContext) {
  const disposable = commands.registerCommand('regex-match.openRegexTestWindow', async () => {
    const document = await FileCreator.openRegexTestFile(context.extensionPath);

    const fileContent = document.getText();
    FileParser.parseRegexAndTextLines(fileContent);
  });

  context.subscriptions.push(disposable);
}
