import { ExtensionContext } from 'vscode';

import TestRegexCodeLensProvider from './providers/code-lenses/TestRegexCodeLensProvider';
import DiagnosticProvider from './providers/DiagnosticProvider';
import RegexMatchService from './services/regex-match/RegexMatchService';
import TestRegexCodeLensManagerService from './services/test-regex-code-lens/TestRegexCodeLensManagerService';

export function activate(context: ExtensionContext) {
  const diagnosticProvider = new DiagnosticProvider('regex-match');
  const regexMatchService = new RegexMatchService(context, diagnosticProvider);

  const testRegexCodeLensProvider = new TestRegexCodeLensProvider();
  const testRegexCodeLensManagerService = new TestRegexCodeLensManagerService(context, testRegexCodeLensProvider);

  context.subscriptions.push(regexMatchService, testRegexCodeLensManagerService);
}
