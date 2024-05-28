import { ParsedRegexTest } from './FileParser';

const NEW_LINE_LENGTH = 1;

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
        if (match[0].trim() === '') {
          break;
        }

        const processedMatch = this.processMatch(match, lineStartIndex);
        matchResults.push(processedMatch);

        if (!matchingRegex.global) {
          break;
        }
      }

      lineStartIndex += line.length + NEW_LINE_LENGTH;
    }

    return matchResults;
  }

  static processMatch(match: RegExpExecArray, lineStartIndex: number): MatchResult {
    const range = [lineStartIndex + match.index, lineStartIndex + match.index + match[0].length];

    let groupRanges: number[][] | undefined;
    if (match.indices && match.indices.length > 1) {
      const matchGroupIndexes = match.indices.slice(1);
      groupRanges = this.getGroupRanges(matchGroupIndexes, lineStartIndex);
    }

    return { substring: match[0], range, groupRanges };
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
