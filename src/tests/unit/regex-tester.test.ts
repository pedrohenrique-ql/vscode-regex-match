import { describe, expect, it, vi } from 'vitest';

import { ParsedRegexTest } from '../../FileParser';
import RegexTester from '../../RegexTester';

vi.mock('vscode', () => ({
  window: {
    showInformationMessage: vi.fn(),
  },
}));

describe('Regex Tester', () => {
  it('should test regex correctly, if the regex matches and has one match', () => {
    const regex = new RegExp('[0-9]a', 'gd');

    const parsedRegexTest: ParsedRegexTest = {
      matchingRegex: regex,
      testLines: ['bbb9abbbb'],
    };

    const matchResult = RegexTester.testRegex(parsedRegexTest);

    expect(matchResult.length).toBe(1);
    expect(matchResult[0].matched).toBe(true);
    expect(matchResult[0].indexes).toEqual([[3, 5]]);
    expect(matchResult[0].line).toBe(parsedRegexTest.testLines[0]);
  });

  it('should test regex correctly, if the regex matches and has multiple matches', () => {
    const regex = new RegExp('[0-9]a', 'gd');

    const parsedRegexTest: ParsedRegexTest = {
      matchingRegex: regex,
      testLines: ['9abbbbbbbbb9abbbbb9a'],
    };

    const matchResult = RegexTester.testRegex(parsedRegexTest);

    expect(matchResult.length).toBe(1);
    expect(matchResult[0].matched).toBe(true);
    expect(matchResult[0].indexes).toEqual([
      [0, 2],
      [11, 13],
      [18, 20],
    ]);
    expect(matchResult[0].line).toBe(parsedRegexTest.testLines[0]);
  });

  it('should test regex correctly, if the regex does not match', () => {
    const regex = new RegExp('[0-9]a', 'gd');

    const parsedRegexTest: ParsedRegexTest = {
      matchingRegex: regex,
      testLines: ['bbbb'],
    };

    const matchResult = RegexTester.testRegex(parsedRegexTest);

    expect(matchResult.length).toBe(1);
    expect(matchResult[0].matched).toBe(false);
    expect(matchResult[0].indexes).toEqual([]);
    expect(matchResult[0].line).toBe(parsedRegexTest.testLines[0]);
  });

  it('should test regex correctly, if the regex has multine flag', () => {
    const regex = new RegExp('[0-9]a', 'gdm');

    const parsedRegexTest: ParsedRegexTest = {
      matchingRegex: regex,
      testLines: ['bbb9a\n9abbb\nbb9abb'],
    };

    const matchResult = RegexTester.testRegex(parsedRegexTest);

    expect(matchResult.length).toBe(1);
    expect(matchResult[0].matched).toBe(true);
    expect(matchResult[0].indexes).toEqual([
      [3, 5],
      [6, 8],
      [14, 16],
    ]);
    expect(matchResult[0].line).toBe(parsedRegexTest.testLines[0]);
  });
});
