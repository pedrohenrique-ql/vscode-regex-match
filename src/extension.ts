import { commands, ExtensionContext } from 'vscode';

import FileCreator from './FileCreator';

export function activate(context: ExtensionContext) {
  const disposable = commands.registerCommand('regex-match.openRegexTestWindow', async () => {
    await FileCreator.openRegexTestFile(context.extensionPath);
  });

  context.subscriptions.push(disposable);
}
