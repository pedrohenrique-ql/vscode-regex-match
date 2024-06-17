import { describe, expect, it, vi } from 'vitest';

import RegexSyntaxError from '@/exceptions/RegexSyntaxError';
import RegexTest, { RegexTestProps } from '@/RegexTest';

vi.mock('vscode', () => ({
  window: {
    showInformationMessage: vi.fn(),
  },
}));

describe('Regex Test', () => {
  it('should test regex correctly, if the regex matches and has one match', () => {
    const regexTestProps: RegexTestProps = {
      regexPattern: '/[0-9]a/g',
      regexLineIndex: 0,
      testLines: ['bbb9abbbb'],
      startTestIndex: 0,
    };

    const regexTest = new RegexTest(regexTestProps);
    const matchResult = regexTest.test();
    expect(matchResult.length).toBe(1);

    expect(matchResult[0].substring).toBe('9a');
    expect(matchResult[0].range).toEqual([3, 5]);
    expect(matchResult[0].groupRanges).toBeUndefined();
  });

  it('should test regex correctly, if the regex matches and has multiple matches in one line', () => {
    const regexTestProps: RegexTestProps = {
      regexPattern: '/[0-9]a/g',
      regexLineIndex: 0,
      testLines: ['9abbbbbbbbb8abbbbb7a'],
      startTestIndex: 0,
    };

    const regexTest = new RegexTest(regexTestProps);
    const matchResult = regexTest.test();
    expect(matchResult.length).toBe(3);

    expect(matchResult[0].substring).toBe('9a');
    expect(matchResult[0].range).toEqual([0, 2]);
    expect(matchResult[0].groupRanges).toBeUndefined();

    expect(matchResult[1].substring).toBe('8a');
    expect(matchResult[1].range).toEqual([11, 13]);
    expect(matchResult[1].groupRanges).toBeUndefined();

    expect(matchResult[2].substring).toBe('7a');
    expect(matchResult[2].range).toEqual([18, 20]);
    expect(matchResult[2].groupRanges).toBeUndefined();
  });

  it('should not return match results, if the regex does not match any test lines', () => {
    const regexTestProps: RegexTestProps = {
      regexPattern: '/[0-9]a/g',
      regexLineIndex: 0,
      testLines: ['bbbb'],
      startTestIndex: 0,
    };

    const regexTest = new RegexTest(regexTestProps);
    const matchResult = regexTest.test();
    expect(matchResult.length).toBe(0);
  });

  it('should test regex correctly, if there are many test lines and has multiline flag', () => {
    const regexTestProps: RegexTestProps = {
      regexPattern: '/^[0-9]a/gm',
      regexLineIndex: 0,
      testLines: ['9abbb', 'bb8ab', '7abb'],
      startTestIndex: 0,
    };

    const regexTest = new RegexTest(regexTestProps);
    const matchResult = regexTest.test();
    expect(matchResult.length).toBe(2);

    expect(matchResult[0].substring).toBe('9a');
    expect(matchResult[0].range).toEqual([0, 2]);
    expect(matchResult[0].groupRanges).toBeUndefined();

    expect(matchResult[1].substring).toBe('7a');
    expect(matchResult[1].range).toEqual([12, 14]);
    expect(matchResult[1].groupRanges).toBeUndefined();
  });

  it('should test regex correctly, if there are many test lines and does not have multine flag', () => {
    const regexTestProps: RegexTestProps = {
      regexPattern: '/^[0-9]a/g',
      regexLineIndex: 0,
      testLines: ['9abbb\nbb8ab\n7abb'],
      startTestIndex: 0,
    };

    const regexTest = new RegexTest(regexTestProps);
    const matchResult = regexTest.test();
    expect(matchResult.length).toBe(1);

    expect(matchResult[0].substring).toBe('9a');
    expect(matchResult[0].range).toEqual([0, 2]);
    expect(matchResult[0].groupRanges).toBeUndefined();
  });

  it('should test regex correctly, if the start test index is greater than zero', () => {
    const regexTestProps: RegexTestProps = {
      regexPattern: '/[0-9]a/gm',
      regexLineIndex: 0,
      testLines: ['9abbb', 'bb8ab', '7abb'],
      startTestIndex: 15,
    };

    const regexTest = new RegexTest(regexTestProps);
    const matchResult = regexTest.test();
    expect(matchResult.length).toBe(3);

    expect(matchResult[0].substring).toBe('9a');
    expect(matchResult[0].range).toEqual([15, 17]);
    expect(matchResult[0].groupRanges).toBeUndefined();

    expect(matchResult[1].substring).toBe('8a');
    expect(matchResult[1].range).toEqual([23, 25]);
    expect(matchResult[1].groupRanges).toBeUndefined();

    expect(matchResult[2].substring).toBe('7a');
    expect(matchResult[2].range).toEqual([27, 29]);
    expect(matchResult[2].groupRanges).toBeUndefined();
  });

  it('should test regex correctly, if it has i flag', () => {
    const regexTestProps: RegexTestProps = {
      regexPattern: '/[0-9]a/gi',
      regexLineIndex: 0,
      testLines: ['9ab', '8a', '7A'],
      startTestIndex: 0,
    };

    const regexTest = new RegexTest(regexTestProps);
    const matchResult = regexTest.test();
    expect(matchResult.length).toBe(3);

    expect(matchResult[0].substring).toBe('9a');
    expect(matchResult[0].range).toEqual([0, 2]);
    expect(matchResult[0].groupRanges).toBeUndefined();

    expect(matchResult[1].substring).toBe('8a');
    expect(matchResult[1].range).toEqual([4, 6]);
    expect(matchResult[1].groupRanges).toBeUndefined();

    expect(matchResult[2].substring).toBe('7A');
    expect(matchResult[2].range).toEqual([7, 9]);
    expect(matchResult[2].groupRanges).toBeUndefined();
  });

  it('should test regex correctly, if the regex is empty', () => {
    const regexTestProps: RegexTestProps = {
      regexPattern: '',
      regexLineIndex: 0,
      testLines: ['9ab', '8a', '7A'],
      startTestIndex: 0,
    };

    const regexTest = new RegexTest(regexTestProps);
    const matchResult = regexTest.test();
    expect(matchResult.length).toBe(0);
  });

  it('should test regex correctly, if the regex is a wildcard regex', () => {
    const regexTestProps: RegexTestProps = {
      regexPattern: '/.*/gm',
      regexLineIndex: 0,
      testLines: ['9ab', '8a', '7A'],
      startTestIndex: 0,
    };

    const regexTest = new RegexTest(regexTestProps);
    const matchResult = regexTest.test();
    expect(matchResult.length).toBe(3);

    expect(matchResult[0].substring).toBe('9ab');
    expect(matchResult[0].range).toEqual([0, 3]);
    expect(matchResult[0].groupRanges).toBeUndefined();

    expect(matchResult[1].substring).toBe('8a');
    expect(matchResult[1].range).toEqual([4, 6]);
    expect(matchResult[1].groupRanges).toBeUndefined();

    expect(matchResult[2].substring).toBe('7A');
    expect(matchResult[2].range).toEqual([7, 9]);
    expect(matchResult[2].groupRanges).toBeUndefined();
  });

  it('should test regex correctly, if the regex has a new line character', () => {
    const regexTestProps: RegexTestProps = {
      regexPattern: '/[0-9]a\\n\\d{3}b/gm',
      regexLineIndex: 0,
      testLines: ['9a', '123b', '7A'],
      startTestIndex: 0,
    };

    const regexTest = new RegexTest(regexTestProps);
    const matchResult = regexTest.test();
    expect(matchResult.length).toBe(1);

    expect(matchResult[0].substring).toBe('9a\n123b');
    expect(matchResult[0].range).toEqual([0, 7]);
    expect(matchResult[0].groupRanges).toBeUndefined();
  });

  it('should throw an error, if the regex is invalid', () => {
    const regexTestProps: RegexTestProps = {
      regexPattern: '/(?/gm',
      regexLineIndex: 6,
      testLines: ['9ab', '8a', '7A'],
      startTestIndex: 0,
    };

    try {
      new RegexTest(regexTestProps);
      expect.unreachable('Expected to throw an error');
    } catch (error) {
      expect(error).toBeInstanceOf(RegexSyntaxError);

      const regexMatchFormatError = error as RegexSyntaxError;
      expect(regexMatchFormatError.message).toContain('Invalid regular expression');
      expect(regexMatchFormatError.line).toBe(regexTestProps.regexLineIndex);
    }
  });

  describe('Capturing Groups', () => {
    it('should extract capturing group ranges', () => {
      const regexTestProps: RegexTestProps = {
        regexPattern: '/[0-9]ax(abc)/gm',
        regexLineIndex: 0,
        testLines: ['bb8axabcx'],
        startTestIndex: 0,
      };

      const regexTest = new RegexTest(regexTestProps);
      const matchResult = regexTest.test();
      expect(matchResult.length).toBe(1);

      expect(matchResult[0].substring).toBe('8axabc');
      expect(matchResult[0].range).toEqual([2, 8]);

      expect(matchResult[0].groupRanges).toBeDefined();
      expect(matchResult[0].groupRanges!.length).toBe(1);
      expect(matchResult[0].groupRanges).toEqual([[5, 8]]);
    });

    it('should extract ranges of many capturing groups', () => {
      const regexTestProps: RegexTestProps = {
        regexPattern: '/[0-9]ax(abc)x(cba)/gm',
        regexLineIndex: 0,
        testLines: ['bb8axabcxcba'],
        startTestIndex: 0,
      };

      const regexTest = new RegexTest(regexTestProps);
      const matchResult = regexTest.test();
      expect(matchResult.length).toBe(1);

      expect(matchResult[0].substring).toBe('8axabcxcba');
      expect(matchResult[0].range).toEqual([2, 12]);

      expect(matchResult[0].groupRanges).toBeDefined();
      expect(matchResult[0].groupRanges!.length).toBe(2);
      expect(matchResult[0].groupRanges![0]).toEqual([5, 8]);
      expect(matchResult[0].groupRanges![1]).toEqual([9, 12]);
    });

    it('should extract the capture group ranges from each line, if there are many test lines', () => {
      const regexTestProps: RegexTestProps = {
        regexPattern: '/[0-9]ax(abc)/gm',
        regexLineIndex: 0,
        testLines: ['bb8axabcx', '9axabc123', '1234axabc'],
        startTestIndex: 0,
      };

      const regexTest = new RegexTest(regexTestProps);
      const matchResult = regexTest.test();
      expect(matchResult.length).toBe(3);

      expect(matchResult[0].substring).toBe('8axabc');
      expect(matchResult[0].range).toEqual([2, 8]);
      expect(matchResult[0].groupRanges).toBeDefined();
      expect(matchResult[0].groupRanges!.length).toBe(1);
      expect(matchResult[0].groupRanges).toEqual([[5, 8]]);

      expect(matchResult[1].substring).toBe('9axabc');
      expect(matchResult[1].range).toEqual([10, 16]);
      expect(matchResult[1].groupRanges).toBeDefined();
      expect(matchResult[1].groupRanges!.length).toBe(1);
      expect(matchResult[1].groupRanges).toEqual([[13, 16]]);

      expect(matchResult[2].substring).toBe('4axabc');
      expect(matchResult[2].range).toEqual([23, 29]);
      expect(matchResult[2].groupRanges).toBeDefined();
      expect(matchResult[2].groupRanges!.length).toBe(1);
      expect(matchResult[2].groupRanges).toEqual([[26, 29]]);
    });

    it('should extract named capturing group ranges', () => {
      const regexTestProps: RegexTestProps = {
        regexPattern: '/[0-9]ax(?<group>abc)(x)/gm',
        regexLineIndex: 0,
        testLines: ['bb8axabcx'],
        startTestIndex: 0,
      };

      const regexTest = new RegexTest(regexTestProps);
      const matchResult = regexTest.test();
      expect(matchResult.length).toBe(1);

      expect(matchResult[0].substring).toBe('8axabcx');
      expect(matchResult[0].range).toEqual([2, 9]);

      expect(matchResult[0].groupRanges).toBeDefined();
      expect(matchResult[0].groupRanges!.length).toBe(2);
      expect(matchResult[0].groupRanges![0]).toEqual([5, 8]);
      expect(matchResult[0].groupRanges![1]).toEqual([8, 9]);
    });

    it('should test regex correctly, if there is an optional capturing group', () => {
      const regexTestProps: RegexTestProps = {
        regexPattern: '/[0-9]x(?<group>abc)(cba)?/gm',
        regexLineIndex: 0,
        testLines: ['8xabccba', '9xabc'],
        startTestIndex: 0,
      };

      const regexTest = new RegexTest(regexTestProps);
      const matchResult = regexTest.test();
      expect(matchResult.length).toBe(2);

      expect(matchResult[0].substring).toBe('8xabccba');
      expect(matchResult[0].range).toEqual([0, 8]);

      expect(matchResult[0].groupRanges).toBeDefined();
      expect(matchResult[0].groupRanges!.length).toBe(2);
      expect(matchResult[0].groupRanges![0]).toEqual([2, 5]);
      expect(matchResult[0].groupRanges![1]).toEqual([5, 8]);

      expect(matchResult[1].substring).toBe('9xabc');
      expect(matchResult[1].range).toEqual([9, 14]);

      expect(matchResult[1].groupRanges).toBeDefined();
      expect(matchResult[1].groupRanges!.length).toBe(1);
      expect(matchResult[1].groupRanges![0]).toEqual([11, 14]);
    });

    it('should test regex correctly, if there is a non-capturing group', () => {
      const regexTestProps: RegexTestProps = {
        regexPattern: '/[0-9]x(?<group>abc)(?:cba)/gm',
        regexLineIndex: 0,
        testLines: ['8xabccba'],
        startTestIndex: 0,
      };

      const regexTest = new RegexTest(regexTestProps);
      const matchResult = regexTest.test();
      expect(matchResult.length).toBe(1);

      expect(matchResult[0].substring).toBe('8xabccba');
      expect(matchResult[0].range).toEqual([0, 8]);

      expect(matchResult[0].groupRanges).toBeDefined();
      expect(matchResult[0].groupRanges!.length).toBe(1);
      expect(matchResult[0].groupRanges![0]).toEqual([2, 5]);
    });
  });
});
