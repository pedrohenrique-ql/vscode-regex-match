import RegexMatchFormatError from './exceptions/RegexMatchFormatError';
import RegexSyntaxError from './exceptions/RegexSyntaxError';
import RegexTest from './RegexTest';

export const TEST_AREA_DELIMITER = '---';

const NEW_LINE_LENGTH = 1;
const REQUIRED_FLAG = 'd';

export interface ParsedRegexTest {
  matchingRegex: RegExp;
  testLines: string[];
  startTestIndex: number;
}

class FileParser {
  static parseFileContent(fileContent: string) {
    const fileLines = fileContent.split('\n');

    const regexTests: RegexTest[] = [];
    let regexLineIndex: number | undefined;
    let testLines: string[] = [];
    let isInTestStringArea = false;

    let startTestIndex = 0;
    let charCount = 0;

    for (let i = 0; i < fileLines.length; i++) {
      if (this.isTestAreaDelimiter(fileLines[i])) {
        isInTestStringArea = !isInTestStringArea;

        if (isInTestStringArea) {
          if (regexLineIndex === undefined) {
            throw new RegexMatchFormatError(i);
          }

          startTestIndex = charCount + fileLines[i].length + NEW_LINE_LENGTH;
        } else if (regexLineIndex !== undefined) {
          const regexTest = this.createRegexTest(fileLines[regexLineIndex], regexLineIndex, testLines, startTestIndex);
          if (!regexTest) {
            throw new RegexMatchFormatError(i);
          }

          regexTests.push(regexTest);

          testLines = [];
          regexLineIndex = undefined;
        }
      } else if (isInTestStringArea) {
        testLines.push(fileLines[i]);
      } else {
        regexLineIndex = i;
      }

      charCount += fileLines[i].length + NEW_LINE_LENGTH;
    }

    if (isInTestStringArea || regexLineIndex !== undefined) {
      throw new RegexMatchFormatError(0);
    }

    return regexTests;
  }

  static createRegexTest(
    regexLine: string,
    regexLineIndex: number,
    testLines: string[],
    startTestIndex: number,
  ): RegexTest | undefined {
    try {
      const matchingRegex = this.transformStringToRegExp(regexLine);

      if (!matchingRegex) {
        throw new RegexMatchFormatError(regexLineIndex);
      }

      const formattedTestLines = this.getTestLines(testLines, matchingRegex.multiline);

      return new RegexTest({ matchingRegex, testLines: formattedTestLines, startTestIndex });
    } catch (error) {
      if (error instanceof SyntaxError) {
        const regexSyntaxError = new RegexSyntaxError(error.message, regexLineIndex);
        return new RegexTest({ error: regexSyntaxError, testLines, startTestIndex });
      }
    }
  }

  static transformStringToRegExp(regexLine: string): RegExp | undefined {
    const matchGroups = regexLine.match(/^\/?(.*?)(?<flags>\/[igmsuy]*)?$/i);

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
