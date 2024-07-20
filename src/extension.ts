import { ConfigurationChangeEvent, Disposable, ExtensionContext, languages, workspace } from 'vscode';

import TestRegexCodeLensProvider from './providers/code-lenses/TestRegexCodeLensProvider';
import DiagnosticProvider from './providers/DiagnosticProvider';
import RegexMatchService from './regex-match-window/RegexMatchService';

function updateCodeLensProvider(testRegexCodeLensProvider: TestRegexCodeLensProvider, context: ExtensionContext) {
  const isCodeLensEnabled = workspace.getConfiguration('regex-match').get<boolean>('codeLens.enabled');
  let codeLensDisposable: Disposable | undefined;

  if (isCodeLensEnabled) {
    if (!codeLensDisposable) {
      codeLensDisposable = languages.registerCodeLensProvider({ pattern: '**/*' }, testRegexCodeLensProvider);
      context.subscriptions.push(codeLensDisposable);
    }
  } else if (codeLensDisposable) {
    codeLensDisposable.dispose();
    codeLensDisposable = undefined;
  }
}

function onChangeConfiguration(
  event: ConfigurationChangeEvent,
  testRegexCodeLensProvider: TestRegexCodeLensProvider,
  context: ExtensionContext,
) {
  if (event.affectsConfiguration('regex-match.codeLens.enabled')) {
    updateCodeLensProvider(testRegexCodeLensProvider, context);
  }
}

export function activate(context: ExtensionContext) {
  const diagnosticProvider = new DiagnosticProvider('regex-match');

  const regexMatchService = new RegexMatchService(context, diagnosticProvider);
  const diagnosticCollection = diagnosticProvider.getDiagnosticCollection();

  const testRegexCodeLensProvider = new TestRegexCodeLensProvider();
  updateCodeLensProvider(testRegexCodeLensProvider, context);

  const onChangeConfigurationDisposable = workspace.onDidChangeConfiguration((event) =>
    onChangeConfiguration(event, testRegexCodeLensProvider, context),
  );

  context.subscriptions.push(regexMatchService, diagnosticCollection, onChangeConfigurationDisposable);
}
