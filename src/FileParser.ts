export const TEST_AREA_DIVIDER = '---';

const DEFAULT_FLAGS = ['g', 'm'];
const REQUIRED_FLAG = 'd';

export interface ParsedRegexTest {
  matchingRegex: RegExp;
  testLines: string[];
  startTestIndex: number;
}

class FileParser {
  static parseFileContent(fileContent: string): ParsedRegexTest | undefined {
    const fileLines = fileContent.split('\n');

    if (fileLines.length > 0) {
      const matchingRegex = this.transformStringToRegExp(fileLines[0]);

      if (matchingRegex) {
        const testLines = this.getTestLines(fileLines.slice(1));
        const startTestIndex = fileContent.indexOf(TEST_AREA_DIVIDER) + TEST_AREA_DIVIDER.length + 1;

        return { matchingRegex, testLines, startTestIndex };
      }
    }
  }

  static transformStringToRegExp(patternString: string): RegExp | undefined {
    const matchGroups = patternString.match(/^\/?(.*?)(?<flags>\/[igmsuyd]*)?$/i);

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

  static getTestLines(fileContent: string[]): string[] {
    return fileContent.filter((line) => line !== TEST_AREA_DIVIDER);
  }
}

export default FileParser;
