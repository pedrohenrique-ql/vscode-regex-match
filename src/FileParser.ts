export const TEST_AREA_DELIMITER = '---';

const REQUIRED_FLAG = 'd';
const DEFAULT_FLAGS = ['g', 'm'];

export interface ParsedRegexTest {
  matchingRegex: RegExp;
  testLines: string[];
  startTestIndex: number;
}

class FileParser {
  static parseFileContent(fileContent: string): ParsedRegexTest | undefined {
    const fileLines = fileContent.split('\n');

    const firstDelimiterLineIndex = this.findFirstDelimiterLineIndex(fileLines);
    if (
      firstDelimiterLineIndex === undefined ||
      firstDelimiterLineIndex === fileLines.length - 1 ||
      firstDelimiterLineIndex === 0
    ) {
      return undefined;
    }

    const regexLine = fileLines[firstDelimiterLineIndex - 1];
    const matchingRegex = this.transformStringToRegExp(regexLine);

    if (!matchingRegex) {
      return undefined;
    }

    const testLines = this.getTestLines(fileLines.slice(firstDelimiterLineIndex), matchingRegex.multiline);

    const startTestIndex = fileContent.indexOf(TEST_AREA_DELIMITER) + TEST_AREA_DELIMITER.length + 1;

    return { matchingRegex, testLines, startTestIndex };
  }

  static findFirstDelimiterLineIndex(fileLines: string[]): number | undefined {
    for (let i = 0; i < fileLines.length; i++) {
      if (this.isTestAreaDelimiter(fileLines[i])) {
        return i;
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

  private static isTestAreaDelimiter(line: string): boolean {
    return line === TEST_AREA_DELIMITER;
  }
}

export default FileParser;
