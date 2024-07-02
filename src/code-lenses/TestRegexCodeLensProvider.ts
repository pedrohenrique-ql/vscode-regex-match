import { CodeLens, CodeLensProvider, Command, ProviderResult, Range, TextDocument } from 'vscode';

import { getRegexDetect } from './utils';

class TestRegexCodeLensProvider implements CodeLensProvider {
  provideCodeLenses(document: TextDocument): ProviderResult<CodeLens[]> {
    const codeLenses: CodeLens[] = [];
    const regexDetect = getRegexDetect(document.languageId);

    if (!regexDetect) {
      return codeLenses;
    }

    const textCode = document.getText();

    let matches;
    while ((matches = regexDetect.exec(textCode)) !== null) {
      const startPos = document.positionAt(matches.index);
      const endPos = document.positionAt(matches.index + matches[0].length);
      const range = new Range(startPos, endPos);

      const pattern = matches[0].trim();

      const command: Command = {
        title: 'Test Regex',
        command: 'regex-match.openRegexMatchWindow',
        arguments: [pattern],
      };

      codeLenses.push(new CodeLens(range, command));
    }

    return codeLenses;
  }
}

export default TestRegexCodeLensProvider;
