import RegexMatchFormatError from '@/exceptions/RegexMatchFormatError';
import { CodeRegex } from '@/providers/code-lenses/TestRegexCodeLensProvider';

import RegexTest from './RegexTest';

export const TEST_AREA_DELIMITER = '---';

const NEW_LINE_LENGTH = 1;

class FileParser {
  static parseFileContent(fileContent: string, currentRegexTests: RegexTest[], codeRegex?: CodeRegex) {
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
          const regexTest = new RegexTest({
            regexPattern: fileLines[regexLineIndex],
            regexLineIndex,
            testLines,
            startTestIndex,
          });

          regexTests.push(regexTest);

          testLines = [];
          regexLineIndex = undefined;
        }
      } else if (isInTestStringArea) {
        testLines.push(fileLines[i]);
      } else if (fileLines[i] !== '') {
        regexLineIndex = i;
      }

      charCount += fileLines[i].length + NEW_LINE_LENGTH;
    }

    if (isInTestStringArea || regexLineIndex !== undefined) {
      throw new RegexMatchFormatError(0);
    }

    this.insertCodeRegex(currentRegexTests, regexTests, codeRegex);

    return regexTests;
  }

  private static insertCodeRegex(currentRegexTests: RegexTest[], newRegexTests: RegexTest[], newCodeRegex?: CodeRegex) {
    const lastNewRegexTest = newRegexTests.at(-1);
    if (lastNewRegexTest && newCodeRegex) {
      lastNewRegexTest.setCodeRegex(newCodeRegex);
    }

    const hasCodeRegex = currentRegexTests.some((regexTest) => regexTest.isCodeRegex());
    if (currentRegexTests.length === 0 || (!hasCodeRegex && !newCodeRegex)) {
      return;
    }

    if (currentRegexTests.length === newRegexTests.length) {
      for (let i = 0; i < currentRegexTests.length; i++) {
        const currentRegexTest = currentRegexTests.at(i);
        const newRegexTest = newRegexTests.at(i);

        if (currentRegexTest?.isCodeRegex() && newRegexTest) {
          newRegexTest.setCodeRegex(currentRegexTest.getCodeRegex());
        }
      }
    }

    if (newRegexTests.length > currentRegexTests.length) {
      const newRegexTestsCopy = newRegexTests.slice();

      for (let i = 0; i < currentRegexTests.length; i++) {
        const currentRegexTest = currentRegexTests.at(i);

        if (!currentRegexTest?.isCodeRegex()) {
          continue;
        }

        const regexTestWithSameMatchingRegexIndex = newRegexTests.findIndex(
          (regexTest) => regexTest.getMatchingRegexSource() === currentRegexTest.getMatchingRegexSource(),
        );

        if (regexTestWithSameMatchingRegexIndex !== -1) {
          newRegexTests[regexTestWithSameMatchingRegexIndex].setCodeRegex(currentRegexTest.getCodeRegex());
          newRegexTestsCopy.splice(regexTestWithSameMatchingRegexIndex, 1);
          continue;
        }

        const regexTestWithSameTestStringIndex = newRegexTests.findIndex(
          (regexTest) => regexTest.getTestString() === currentRegexTest.getTestString(),
        );

        if (regexTestWithSameTestStringIndex !== -1) {
          newRegexTests[regexTestWithSameTestStringIndex].setCodeRegex(currentRegexTest.getCodeRegex());
          newRegexTestsCopy.splice(regexTestWithSameTestStringIndex, 1);
        }
      }
    }

    if (newRegexTests.length < currentRegexTests.length) {
      for (let i = 0; i < newRegexTests.length; i++) {
        const newRegexTest = newRegexTests.at(i);

        if (!newRegexTest) {
          continue;
        }

        const currentRegexTest = currentRegexTests.find(
          (regexTest) => regexTest.getMatchingRegexSource() === newRegexTest.getMatchingRegexSource(),
        );

        if (currentRegexTest) {
          newRegexTest.setCodeRegex(currentRegexTest.getCodeRegex());
        }
      }
    }
  }

  private static isTestAreaDelimiter(line: string): boolean {
    return line === TEST_AREA_DELIMITER;
  }
}

export default FileParser;
