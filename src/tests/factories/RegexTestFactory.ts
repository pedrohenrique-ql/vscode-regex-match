import { Position, Range, Uri } from 'vscode';

import RegexTest, { RegexTestProps } from '@/controllers/regex-test/RegexTest';

export interface CreateRegexTestOptions extends Partial<RegexTestProps> {
  codeRegexPattern?: string;
  codeRegexUri?: string;
}

export function createRegexTest(options: CreateRegexTestOptions = {}): RegexTest {
  const {
    regexPattern = '/test/gm',
    regexLineIndex = 0,
    testLines = ['test content'],
    startTestIndex = 0,
    isCodeRegex = false,
    codeRegexPattern = '/hello/gm',
    codeRegexUri = 'test://code',
  } = options;

  const codeRegex = isCodeRegex
    ? {
        pattern: codeRegexPattern,
        range: new Range(new Position(0, 0), new Position(0, codeRegexPattern.length)),
        documentUri: Uri.parse(codeRegexUri),
      }
    : undefined;

  return new RegexTest({
    regexPattern,
    regexLineIndex,
    testLines,
    startTestIndex,
    codeRegex,
  });
}
