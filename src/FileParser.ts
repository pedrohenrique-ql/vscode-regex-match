export const TEST_AREA_DELIMITER = '---';

const REQUIRED_FLAG = 'd';
const DEFAULT_FLAGS = ['g', 'm'];

export interface ParsedRegexTest {
  matchingRegex: RegExp;
  numberOfCapturingGroups: number;
  testLines: string[];
  startTestIndex: number;
}

class FileParser {
  static parseFileContent(fileContent: string): ParsedRegexTest | undefined {
    const fileLines = fileContent.split('\n');

    if (fileLines.length > 0) {
      const matchingRegex = this.transformStringToRegExp(fileLines[0]);

      if (matchingRegex) {
        const testLines = this.getTestLines(fileLines.slice(1), matchingRegex.multiline);

        const startTestIndex = fileContent.indexOf(TEST_AREA_DELIMITER) + TEST_AREA_DELIMITER.length + 1;

        const numberOfCapturingGroups = this.getNumberOfCapturingGroups(matchingRegex);

        return { matchingRegex, numberOfCapturingGroups, testLines, startTestIndex };
      }
    }
  }

  static transformStringToRegExp(patternString: string): RegExp | undefined {
    const matchGroups = patternString.match(/^\/?(.*?)(?<flags>\/[igmsuy]*)?$/i);

    if (matchGroups) {
      const [, pattern] = matchGroups;
      const flagsGroup = matchGroups.groups?.flags;

      let flags = flagsGroup?.replace('/', '');

      if (!flags) {
        flags = DEFAULT_FLAGS.join('');
      }

      if (!flags.includes(REQUIRED_FLAG)) {
        flags += REQUIRED_FLAG;
      }

      return new RegExp(pattern, flags);
    }
  }

  static getTestLines(fileContent: string[], multineFlag: boolean): string[] {
    const testLines = fileContent.filter((line) => line !== TEST_AREA_DELIMITER);

    if (multineFlag) {
      return testLines;
    }

    return [testLines.join('\n')];
  }

  static getNumberOfCapturingGroups(matchingRegex: RegExp): number {
    return (matchingRegex.toString().match(/\((?!\?)/g) ?? []).length;
  }
}

export default FileParser;
