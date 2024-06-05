import RegexTest from './RegexTest';

export const TEST_AREA_DELIMITER = '---';
const NEW_LINE_LENGTH = 1;

const REQUIRED_FLAG = 'd';
const DEFAULT_FLAGS = ['g', 'm'];

export interface ParsedRegexTest {
  matchingRegex: RegExp;
  testLines: string[];
  startTestIndex: number;
}

class FileParser {
  static parseFileContent(fileContent: string) {
    const fileLines = fileContent.split('\n');

    const regexTests: RegexTest[] = [];
    let regexLine: string | undefined;
    let testLines: string[] = [];
    let isInTestStringArea = false;

    let startTestIndex = 0;
    let charCount = 0;

    for (const line of fileLines) {
      if (this.isTestAreaDelimiter(line)) {
        isInTestStringArea = !isInTestStringArea;

        if (isInTestStringArea) {
          startTestIndex = charCount + line.length + NEW_LINE_LENGTH;
        } else {
          if (!regexLine) {
            return null;
          }

          const matchingRegex = this.transformStringToRegExp(regexLine);
          if (!matchingRegex) {
            return null;
          }

          testLines = this.getTestLines(testLines, matchingRegex.multiline);
          regexTests.push(new RegexTest({ matchingRegex, testLines, startTestIndex }));
          testLines = [];
          regexLine = undefined;
        }
      } else if (isInTestStringArea) {
        testLines.push(line);
      } else {
        regexLine = line;
      }

      charCount += line.length + NEW_LINE_LENGTH;
    }

    if (isInTestStringArea || !!regexLine) {
      return null;
    }

    return regexTests;
  }

  // static parseFileContent(fileContent: string): ParsedRegexTest | null {
  //   const fileLines = fileContent.split('\n');

  //   const firstDelimiterLineIndex = this.findFirstDelimiterLineIndex(fileLines);
  //   if (
  //     firstDelimiterLineIndex === undefined ||
  //     firstDelimiterLineIndex === fileLines.length - 1 ||
  //     firstDelimiterLineIndex === 0
  //   ) {
  //     return null;
  //   }

  //   const regexLine = fileLines[firstDelimiterLineIndex - 1];
  //   const matchingRegex = this.transformStringToRegExp(regexLine);

  //   if (!matchingRegex) {
  //     return null;
  //   }

  //   const testLines = this.getTestLines(fileLines.slice(firstDelimiterLineIndex), matchingRegex.multiline);

  //   const startTestIndex = fileContent.indexOf(TEST_AREA_DELIMITER) + TEST_AREA_DELIMITER.length + 1;

  //   return { matchingRegex, testLines, startTestIndex };
  // }

  static findFirstDelimiterLineIndex(fileLines: string[]): number | undefined {
    for (let i = 0; i < fileLines.length; i++) {
      if (this.isTestAreaDelimiter(fileLines[i])) {
        return i;
      }
    }
  }

  static transformStringToRegExp(regexLine: string): RegExp | undefined {
    const matchGroups = regexLine.match(/^\/?(.*?)(?<flags>\/[igmsuy]*)?$/i);

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

  static getTestLines(fileContent: string[], multilineFlag: boolean): string[] {
    const testLines = fileContent.filter((line) => line !== TEST_AREA_DELIMITER);

    if (multilineFlag) {
      return testLines;
    }

    return [testLines.join('\n')];
  }

  private static isTestAreaDelimiter(line: string): boolean {
    return line === TEST_AREA_DELIMITER;
  }
}

export default FileParser;
