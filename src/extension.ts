import { ExtensionContext, languages } from 'vscode';

import TestRegexCodeLensProvider from './code-lenses/TestRegexCodeLensProvider';
import RegexMatchService from './RegexMatchService';

export function activate(context: ExtensionContext) {
  const regexMatchService = new RegexMatchService(context);

  const codeLens = new TestRegexCodeLensProvider();
  const codeLensProvider = languages.registerCodeLensProvider({ pattern: '**/*' }, codeLens);

  const regexMatchCommands = regexMatchService.registerCommands();
  const regexMatchDisposables = regexMatchService.registerDisposables();
  const diagnosticCollection = regexMatchService.getDiagnosticCollection();

  context.subscriptions.push(...regexMatchCommands, ...regexMatchDisposables, diagnosticCollection, codeLensProvider);
}
