import { ParsedRegexTest } from './FileParser';

export interface MatchResult {
  substring: string;
  range: number[];
  groupRanges?: number[][];
}

class RegexTester {
  static testRegex({ matchingRegex, testLines, startTestIndex }: ParsedRegexTest): MatchResult[] {
    const matchResults: MatchResult[] = [];

    let lineStartIndex = startTestIndex;

    for (const line of testLines) {
      let match: RegExpExecArray | null;

      while ((match = matchingRegex.exec(line)) !== null) {
        const range = [lineStartIndex + match.index, lineStartIndex + match.index + match[0].length];

        let groupRanges: number[][] | undefined;
        if (match.indices && match.indices.length > 1) {
          const matchGroupIndexes = match.indices.slice(1);
          groupRanges = this.getGroupRanges(matchGroupIndexes, lineStartIndex);
        }

        matchResults.push({ substring: match[0], range, groupRanges });

        if (!matchingRegex.global) {
          break;
        }
      }

      lineStartIndex += line.length + 1;
    }

    return matchResults;
  }

  static getGroupRanges(matchIndexes: (number[] | undefined)[], startIndex: number): number[][] {
    const ranges: number[][] = [];

    for (const range of matchIndexes) {
      if (range) {
        const [start, end] = range;
        ranges.push([startIndex + start, startIndex + end]);
      }
    }

    return ranges;
  }
}

export default RegexTester;
