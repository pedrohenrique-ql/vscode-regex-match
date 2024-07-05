import { ExtensionContext } from 'vscode';

import RegexMatchService from './RegexMatchService';

export function activate(context: ExtensionContext) {
  const regexMatchService = new RegexMatchService(context);

  const regexMatchCommands = regexMatchService.registerCommands();
  const regexMatchDisposables = regexMatchService.registerDisposables();
  const diagnosticCollection = regexMatchService.getDiagnosticCollection();

  context.subscriptions.push(...regexMatchCommands, ...regexMatchDisposables, diagnosticCollection);
}
