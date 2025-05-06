import { ExtensionContext } from 'vscode';

import RegexTestController from '@/controllers/regex-test/RegexTestController';
import TestRegexCodeLensProvider from '@/providers/code-lenses/TestRegexCodeLensProvider';
import DiagnosticProvider from '@/providers/DiagnosticProvider';
import TestRegexCodeLensManagerService from '@/services/test-regex-code-lens/TestRegexCodeLensManagerService';

export const REGEX_MATCH_LANGUAGE_ID = 'regex-match';

export function activate(context: ExtensionContext) {
  const diagnosticProvider = new DiagnosticProvider(REGEX_MATCH_LANGUAGE_ID);
  const regexTestController = new RegexTestController(context.extensionPath, diagnosticProvider);

  const testRegexCodeLensProvider = new TestRegexCodeLensProvider();
  const testRegexCodeLensManagerService = new TestRegexCodeLensManagerService(context, testRegexCodeLensProvider);

  context.subscriptions.push(regexTestController, testRegexCodeLensManagerService);
}
