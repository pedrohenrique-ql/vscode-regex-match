import { ParsedRegexTest } from './FileParser';

const NEW_LINE_LENGTH = 1;

export interface MatchResult {
  substring: string;
  range: number[];
  groupRanges?: number[][];
}

class RegexTest {
  private matchingRegex: RegExp;
  private testLines: string[];
  private startTestIndex: number;

  constructor(parsedRegexTest: ParsedRegexTest) {
    this.matchingRegex = parsedRegexTest.matchingRegex;
    this.testLines = parsedRegexTest.testLines;
    this.startTestIndex = parsedRegexTest.startTestIndex;
  }

  test(): MatchResult[] {
    const matchResults: MatchResult[] = [];

    let lineStartIndex = this.startTestIndex;

    for (const line of this.testLines) {
      let match: RegExpExecArray | null;

      while ((match = this.matchingRegex.exec(line)) !== null) {
        if (match[0].trim() === '') {
          break;
        }

        const processedMatch = this.processMatch(match, lineStartIndex);
        matchResults.push(processedMatch);

        if (!this.matchingRegex.global) {
          break;
        }
      }

      lineStartIndex += line.length + NEW_LINE_LENGTH;
    }

    return matchResults;
  }

  private processMatch(match: RegExpExecArray, lineStartIndex: number): MatchResult {
    const range = [lineStartIndex + match.index, lineStartIndex + match.index + match[0].length];

    let groupRanges: number[][] | undefined;
    if (match.indices && match.indices.length > 1) {
      const matchGroupIndexes = match.indices.slice(1);
      groupRanges = this.getGroupRanges(matchGroupIndexes, lineStartIndex);
    }

    return { substring: match[0], range, groupRanges };
  }

  private getGroupRanges(matchIndexes: (number[] | undefined)[], startIndex: number): number[][] {
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

export default RegexTest;
