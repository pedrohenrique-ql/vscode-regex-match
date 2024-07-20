import RegexSyntaxError from '@/exceptions/RegexSyntaxError';

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
  private testString: string;
  private startTestIndex: number;

  constructor({ regexPattern, regexLineIndex, testLines, startTestIndex }: RegexTestProps) {
    this.matchingRegex = this.transformStringToRegExp(regexPattern, regexLineIndex);
    this.testString = testLines.join('\n');
    this.startTestIndex = startTestIndex;
  }

  test(): MatchResult[] {
    if (!this.matchingRegex) {
      throw new Error('Regex not found');
    }

    const regexCopy = new RegExp(this.matchingRegex.source, this.matchingRegex.flags);
    const matchResults: MatchResult[] = [];

    let match: RegExpExecArray | null;

    while ((match = regexCopy.exec(this.testString)) !== null) {
      if (match[0] !== '') {
        const processedMatch = this.processMatch(match, this.startTestIndex);
        matchResults.push(processedMatch);
      }

      if (!regexCopy.global) {
        break;
      }

      if (match.index === regexCopy.lastIndex) {
        regexCopy.lastIndex++;
      }
    }

    return matchResults;
  }

  private transformStringToRegExp(regexPattern: string, regexLineIndex: number): RegExp | undefined {
    try {
      const matchGroups = regexPattern.match(/^\/?(.*?)(?<flags>\/[igmsuy]*)?$/);

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

  getFormattedTestString() {
    return this.testString.split('\n');
  }

  getStartTestIndex() {
    return this.startTestIndex;
  }
}

export default RegexTest;
