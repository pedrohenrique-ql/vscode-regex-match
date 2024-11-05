import RegexSyntaxError from '@/exceptions/RegexSyntaxError';
import { CodeRegex } from '@/providers/code-lenses/TestRegexCodeLensProvider';

export const REQUIRED_FLAG = 'd';

export type MatchRange = [number, number];

export interface MatchResult {
  substring: string;
  range: MatchRange;
  groupRanges?: MatchRange[];
}

export interface RegexTestProps {
  regexPattern: string;
  regexLineIndex: number;
  testLines: string[];
  startTestIndex: number;
  isCodeRegex?: boolean;
  codeRegex?: CodeRegex;
  error?: Error;
}

class RegexTest {
  private matchingRegex?: RegExp;
  private testString: string;
  private startTestIndex: number;
  private codeRegex?: CodeRegex;

  constructor({ regexPattern, regexLineIndex, testLines, startTestIndex, codeRegex }: RegexTestProps) {
    this.matchingRegex = this.transformStringToRegExp(regexPattern, regexLineIndex);
    this.testString = testLines.join('\n');
    this.startTestIndex = startTestIndex;
    this.codeRegex = codeRegex;
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
      const matchGroups = regexPattern.match(/^\/?(.*?)(?<flags>\/[gimuysvd]*)?$/);

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
    const range: MatchRange = [lineStartIndex + match.index, lineStartIndex + match.index + match[0].length];

    let groupRanges: MatchRange[] | undefined;
    if (match.indices && match.indices.length > 1) {
      const matchGroupIndexes = match.indices.slice(1);
      groupRanges = this.getGroupRanges(matchGroupIndexes, lineStartIndex);
    }

    return { substring: match[0], range, groupRanges };
  }

  private getGroupRanges(matchIndexes: (number[] | undefined)[], startIndex: number): MatchRange[] {
    const ranges: MatchRange[] = [];

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

  getMatchingRegexSource() {
    const codeRegExp = this.getCodeRegExp();
    const hasIndicesFlag = codeRegExp?.hasIndices;

    const newRegexFlags = hasIndicesFlag
      ? this.matchingRegex?.flags
      : this.matchingRegex?.flags.replace(REQUIRED_FLAG, '');

    return `/${this.matchingRegex?.source}/${newRegexFlags}`;
  }

  getFormattedTestString() {
    return this.testString.split('\n');
  }

  getStartTestIndex() {
    return this.startTestIndex;
  }

  isCodeRegex() {
    return this.codeRegex !== undefined;
  }

  getCodeRegex() {
    return this.codeRegex;
  }

  getCodeRegExp(): RegExp | undefined {
    if (!this.codeRegex) {
      return;
    }

    const codeRegexPattern = this.codeRegex.pattern;
    const matchGroups = codeRegexPattern.match(/^\/?(.*?)(?<flags>\/[gimuysvd]*)?$/);

    if (matchGroups) {
      const [, pattern] = matchGroups;
      const flagsGroup = matchGroups.groups?.flags;

      const flags = flagsGroup?.replace('/', '') ?? '';
      const codeRegex = new RegExp(pattern, flags);

      return codeRegex;
    }
  }

  setCodeRegex(codeRegex?: CodeRegex) {
    this.codeRegex = codeRegex;
  }
}

export default RegexTest;
