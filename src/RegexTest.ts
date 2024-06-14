import RegexSyntaxError from './exceptions/RegexSyntaxError';

const NEW_LINE_LENGTH = 1;
const REQUIRED_FLAG = 'd';

export interface MatchResult {
  substring: string;
  range: number[];
  groupRanges?: number[][];
}

export interface RegexTestProps {
  regexPattern: string;
  regexLineIndex: number;
  testLines: string[];
  startTestIndex: number;
  error?: Error;
}

class RegexTest {
  private matchingRegex?: RegExp;
  private testLines: string[];
  private startTestIndex: number;

  constructor({ regexPattern, regexLineIndex, testLines, startTestIndex }: RegexTestProps) {
    this.matchingRegex = this.transformStringToRegExp(regexPattern, regexLineIndex);

    if (this.matchingRegex?.multiline) {
      this.testLines = testLines;
    } else {
      this.testLines = [testLines.join('\n')];
    }

    this.startTestIndex = startTestIndex;
  }

  test(): MatchResult[] {
    if (!this.matchingRegex) {
      throw new Error('Regex not found');
    }

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

  private transformStringToRegExp(regexPattern: string, regexLineIndex: number): RegExp | undefined {
    try {
      const matchGroups = regexPattern.match(/^\/?(.*?)(?<flags>\/[igmsuy]*)?$/i);

      if (matchGroups) {
        const [, pattern] = matchGroups;
        const flagsGroup = matchGroups.groups?.flags;

        let flags = flagsGroup?.replace('/', '') ?? '';
        let matchingRegex = new RegExp(pattern, flags);

        if (!flags.includes(REQUIRED_FLAG)) {
          flags += REQUIRED_FLAG;
        }

        matchingRegex = new RegExp(pattern, flags);
        return matchingRegex;
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new RegexSyntaxError(error.message, regexLineIndex);
      }
    }
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

  getMatchingRegex() {
    return this.matchingRegex;
  }

  getTestLines() {
    return this.testLines;
  }

  getStartTestIndex() {
    return this.startTestIndex;
  }
}

export default RegexTest;
