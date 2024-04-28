export const TEST_AREA_DELIMITER = '---';

const DEFAULT_FLAGS = ['g', 'm'];

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
        const testLines = this.getTestLines(fileLines.slice(1), matchingRegex.multiline);

        const startTestIndex = fileContent.indexOf(TEST_AREA_DELIMITER) + TEST_AREA_DELIMITER.length + 1;

        return { matchingRegex, testLines, startTestIndex };
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
}

export default FileParser;
