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
    const regex = new RegExp('[0-9]a', 'g');

    const parsedRegexTest: ParsedRegexTest = {
      matchingRegex: regex,
      testLines: ['bbb9abbbb'],
      startTestIndex: 0,
    };

    const matchResult = RegexTester.testRegex(parsedRegexTest);
    expect(matchResult.length).toBe(1);

    expect(matchResult[0].substring).toBe('9a');
    expect(matchResult[0].range).toEqual([3, 5]);
  });

  it('should test regex correctly, if the regex matches and has multiple matches in one line', () => {
    const regex = new RegExp('[0-9]a', 'g');

    const parsedRegexTest: ParsedRegexTest = {
      matchingRegex: regex,
      testLines: ['9abbbbbbbbb8abbbbb7a'],
      startTestIndex: 0,
    };

    const matchResult = RegexTester.testRegex(parsedRegexTest);
    expect(matchResult.length).toBe(3);

    expect(matchResult[0].substring).toBe('9a');
    expect(matchResult[0].range).toEqual([0, 2]);

    expect(matchResult[1].substring).toBe('8a');
    expect(matchResult[1].range).toEqual([11, 13]);

    expect(matchResult[2].substring).toBe('7a');
    expect(matchResult[2].range).toEqual([18, 20]);
  });

  it('should not return match results, if the regex does not match any test lines', () => {
    const regex = new RegExp('[0-9]a', 'g');

    const parsedRegexTest: ParsedRegexTest = {
      matchingRegex: regex,
      testLines: ['bbbb'],
      startTestIndex: 0,
    };

    const matchResult = RegexTester.testRegex(parsedRegexTest);
    expect(matchResult.length).toBe(0);
  });

  it('should test regex correctly, if there are many test lines and has multine flag', () => {
    const regex = new RegExp('^[0-9]a', 'gm');

    const parsedRegexTest: ParsedRegexTest = {
      matchingRegex: regex,
      testLines: ['9abbb', 'bb8ab', '7abb'],
      startTestIndex: 0,
    };

    const matchResult = RegexTester.testRegex(parsedRegexTest);
    expect(matchResult.length).toBe(2);

    expect(matchResult[0].substring).toBe('9a');
    expect(matchResult[0].range).toEqual([0, 2]);

    expect(matchResult[1].substring).toBe('7a');
    expect(matchResult[1].range).toEqual([12, 14]);
  });

  it('should test regex correctly, if there are many test lines and does not have multine flag', () => {
    const regex = new RegExp('^[0-9]a', 'g');

    const parsedRegexTest: ParsedRegexTest = {
      matchingRegex: regex,
      testLines: ['9abbb\nbb8ab\n7abb'],
      startTestIndex: 0,
    };

    const matchResult = RegexTester.testRegex(parsedRegexTest);
    expect(matchResult.length).toBe(1);

    expect(matchResult[0].substring).toBe('9a');
    expect(matchResult[0].range).toEqual([0, 2]);
  });
});
