import { window } from 'vscode';

import { ParsedRegexTest } from './FileParser';

class RegexTester {
  static async testRegex({ matchingRegex, testLines }: ParsedRegexTest) {
    for (const line of testLines) {
      const trimmedLine = line.trim();

      matchingRegex.lastIndex = 0;

      if (matchingRegex.test(trimmedLine)) {
        await window.showInformationMessage(`Matched! ${trimmedLine}`);
      } else {
        await window.showInformationMessage(`Not matched :( ${trimmedLine}`);
      }
    }
  }
}

export default RegexTester;
