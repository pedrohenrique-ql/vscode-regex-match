import { ParsedRegexTest } from './FileParser';

export interface MatchResult {
  substring: string;
  range: number[];
}

class RegexTester {
  static testRegex({ matchingRegex, testLines, startTestIndex }: ParsedRegexTest): MatchResult[] {
    const matchResults: MatchResult[] = [];

    let lineStartIndex = startTestIndex;

    for (const line of testLines) {
      let match: RegExpExecArray | null;

      while ((match = matchingRegex.exec(line)) !== null) {
        const range = [lineStartIndex + match.index, lineStartIndex + match.index + match[0].length];

        matchResults.push({ substring: match[0], range });

        if (!matchingRegex.global) {
          break;
        }
      }

      lineStartIndex += line.length + 1;
    }

    return matchResults;
  }
}

export default RegexTester;
