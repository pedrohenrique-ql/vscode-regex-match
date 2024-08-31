import { CodeRegex } from '@/providers/code-lenses/TestRegexCodeLensProvider';

import RegexMatchFormatError from '../../exceptions/RegexMatchFormatError';
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
            codeRegex,
          });

          if (currentRegexTests.length > regexTests.length) {
            const currentTest = currentRegexTests[regexTests.length];
            const isCodeRegex = codeRegex?.pattern === fileLines[regexLineIndex];

            regexTest.setCodeRegex(isCodeRegex ? codeRegex : currentTest.getCodeRegex());
          }

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

    return regexTests;
  }

  private static isTestAreaDelimiter(line: string): boolean {
    return line === TEST_AREA_DELIMITER;
  }
}

export default FileParser;
