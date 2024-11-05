import { ExtensionContext, languages } from 'vscode';

import ApplyRegexCodeLensProvider from './providers/code-lenses/ApplyRegexCodeLensProvider';
import TestRegexCodeLensProvider from './providers/code-lenses/TestRegexCodeLensProvider';
import DiagnosticProvider from './providers/DiagnosticProvider';
import RegexMatchService, { REGEX_TEST_FILE_PATH } from './services/regex-match/RegexMatchService';
import TestRegexCodeLensManagerService from './services/test-regex-code-lens/TestRegexCodeLensManagerService';

export function activate(context: ExtensionContext) {
  const diagnosticProvider = new DiagnosticProvider('regex-match');
  const regexMatchService = new RegexMatchService(context, diagnosticProvider);

  const testRegexCodeLensProvider = new TestRegexCodeLensProvider();
  const testRegexCodeLensManagerService = new TestRegexCodeLensManagerService(context, testRegexCodeLensProvider);

  const applyRegexCodeLensProvider = new ApplyRegexCodeLensProvider(regexMatchService);
  const applyRegexDisposable = languages.registerCodeLensProvider(
    { pattern: `${context.extensionPath}${REGEX_TEST_FILE_PATH}`, scheme: 'file' },
    applyRegexCodeLensProvider,
  );

  context.subscriptions.push(regexMatchService, testRegexCodeLensManagerService, applyRegexDisposable);
}
