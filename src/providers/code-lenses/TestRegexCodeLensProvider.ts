import { CodeLens, CodeLensProvider, Command, ProviderResult, Range, TextDocument, Uri } from 'vscode';
import { getRegexLanguage } from './languages';

export interface CodeRegex {
  pattern: string;
  range: Range;
  documentUri: Uri | null;
  languageId?: string;
}

class TestRegexCodeLensProvider implements CodeLensProvider {
  provideCodeLenses(document: TextDocument): ProviderResult<CodeLens[]> {
    const codeLenses: CodeLens[] = [];
    const language = getRegexLanguage(document.languageId);
    if (!language) return codeLenses;
    const source = document.getText();
    for (const match of language.detect(source)) {
      const start = document.positionAt(match.index);
      const range = new Range(start, document.positionAt(match.index + match.pattern.length));
      const codeRegex: CodeRegex = {
        pattern: language.toPattern(match), range, documentUri: document.uri, languageId: document.languageId,
      };
      const command: Command = {
        title: 'Test Regex', command: 'regex-match.openRegexMatchWindow', arguments: [codeRegex],
      };
      codeLenses.push(new CodeLens(range, command));
    }
    return codeLenses;
  }
}
export default TestRegexCodeLensProvider;
