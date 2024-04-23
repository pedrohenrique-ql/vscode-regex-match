import { window } from 'vscode';

import { ParsedRegexTest } from './FileParser';

interface MatchResult {
  line: string;
  matched: boolean;
  indexes: number[][];
}

class RegexTester {
  static testRegex({ matchingRegex, testLines }: ParsedRegexTest): MatchResult[] {
    const matchResults: MatchResult[] = [];

    for (const line of testLines) {
      const trimmedLine = line.trim();
      const lineMatch = [...trimmedLine.matchAll(matchingRegex)];

      if (lineMatch.length > 0) {
        if (matchingRegex.flags.includes('m')) {
          for (const line of trimmedLine.split('\n')) {
            void window.showInformationMessage(`Matched! ${line}`);
          }
        } else {
          void window.showInformationMessage(`Matched! ${trimmedLine}`);
        }

        const indexes = lineMatch.map((match) => (match.indices ? match.indices[0] : [])) as number[][];

        matchResults.push({
          line,
          matched: true,
          indexes,
        });
      } else {
        void window.showInformationMessage(`Not matched :( ${trimmedLine}`);

        matchResults.push({
          line,
          matched: false,
          indexes: [],
        });
      }
    }

    return matchResults;
  }
}

export default RegexTester;
