import { ExtensionContext } from 'vscode';

import RegexMatchService from './RegexMatchService';

export async function activate(context: ExtensionContext) {
  const regexMatchService = new RegexMatchService(context);

  await regexMatchService.setupFileAutoSave();

  const regexMatchCommands = regexMatchService.registerCommands();
  const regexMatchDisposables = regexMatchService.registerDisposables();

  context.subscriptions.push(...regexMatchCommands, ...regexMatchDisposables);
}
