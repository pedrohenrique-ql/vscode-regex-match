import { CodeLens, CodeLensProvider, Command, ProviderResult, Range, TextDocument } from 'vscode';

import { getRegexDetect } from './utils';

export interface CodeRegex {
  pattern: string;
  range?: Range;
  document?: TextDocument;
}

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
      const startPosition = document.positionAt(matches.index);
      const endPosition = document.positionAt(matches.index + matches[0].length);
      const range = new Range(startPosition, endPosition);

      const pattern = matches[0].trim();
      const codeRegex: CodeRegex = { pattern, range, document };

      const command: Command = {
        title: 'Test Regex',
        command: 'regex-match.openRegexMatchWindow',
        arguments: [codeRegex],
      };

      codeLenses.push(new CodeLens(range, command));
    }

    return codeLenses;
  }
}

export default TestRegexCodeLensProvider;
