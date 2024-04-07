const DEFAULT_FLAG = 'g';
const TEST_AREA_DIVIDER = '---';

export interface ParsedRegexTest {
  matchingRegex: RegExp;
  testLines: string[];
}

class FileParser {
  static parseRegexAndTextLines(fileContent: string): ParsedRegexTest | undefined {
    const fileLines = fileContent.split('\n');

    if (fileLines.length > 0) {
      const matchingRegex = this.transformStringToRegExp(fileLines[0]);

      if (matchingRegex) {
        const testLines = this.getTestLines(fileLines.slice(1));
        return { matchingRegex, testLines };
      }
    }
  }

  static transformStringToRegExp(patternString: string): RegExp | undefined {
    const matchGroups = patternString.match(/\/?(.*?)(?<flags>\/[igmsuy]*)?$/i);

    if (matchGroups) {
      const [, pattern] = matchGroups;
      const flags = matchGroups.groups?.flags;

      return new RegExp(pattern, flags?.replace('/', '') ?? DEFAULT_FLAG);
    }
  }

  static getTestLines(fileContent: string[]): string[] {
    return fileContent.filter((line) => line !== TEST_AREA_DIVIDER);
  }
}

export default FileParser;
