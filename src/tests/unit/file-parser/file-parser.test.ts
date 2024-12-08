import { describe, expect, it } from 'vitest';

import RegexMatchFormatError, { DEFAULT_REGEX_MATCH_FORMAT_ERROR_MESSAGE } from '@/exceptions/RegexMatchFormatError';
import RegexSyntaxError from '@/exceptions/RegexSyntaxError';
import FileParser from '@/services/regex-match/FileParser';

describe('File Parser', () => {
  it('should parse file content correctly', () => {
    const fileContent = '/[0-9]a/g\n---\nbb9abb\n---';

    const regexTests = FileParser.parseFileContent(fileContent, []);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(1);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/[0-9]a/dg);
    expect(regexTests[0].getFormattedTestString()).toHaveLength(1);
    expect(regexTests[0].getFormattedTestString()[0]).toBe('bb9abb');
    expect(regexTests[0].getStartTestIndex()).toBe(14);
  });

  it('should parse file content correctly, if the regex has multiline flag', () => {
    const fileContent = '/[0-9]a/gm\n---\nbb9abb\n2a\n---';

    const regexTests = FileParser.parseFileContent(fileContent, []);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(1);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/[0-9]a/dgm);
    expect(regexTests[0].getFormattedTestString()).toHaveLength(2);
    expect(regexTests[0].getFormattedTestString()[0]).toBe('bb9abb');
    expect(regexTests[0].getFormattedTestString()[1]).toBe('2a');
    expect(regexTests[0].getStartTestIndex()).toBe(15);
  });

  it('should parse file content correctly, if the regex does not have multiline flag', () => {
    const fileContent = '/[0-9]a/g\n---\nbb9abb\n2a\n---';

    const regexTests = FileParser.parseFileContent(fileContent, []);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(1);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/[0-9]a/dg);
    expect(regexTests[0].getFormattedTestString()).toHaveLength(2);
    expect(regexTests[0].getFormattedTestString()[0]).toBe('bb9abb');
    expect(regexTests[0].getFormattedTestString()[1]).toBe('2a');
    expect(regexTests[0].getStartTestIndex()).toBe(14);
  });

  it("should set the required 'd' flag in matching regex", () => {
    const fileContent = '/[0-9]a/gm\n---\nbb9abb\n---';

    const regexTests = FileParser.parseFileContent(fileContent, []);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(1);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/[0-9]a/dgm);
    expect(regexTests[0].getFormattedTestString()).toHaveLength(1);
    expect(regexTests[0].getFormattedTestString()[0]).toBe('bb9abb');
    expect(regexTests[0].getStartTestIndex()).toBe(15);
  });

  it('should parse regex test with an error if the matching regex is invalid', () => {
    const fileContent = '/(?/gm\n---\nbb9abb\n---';

    try {
      FileParser.parseFileContent(fileContent, []);
      expect.unreachable('Expected to throw an error');
    } catch (error) {
      expect(error).toBeInstanceOf(RegexSyntaxError);

      const regexMatchFormatError = error as RegexSyntaxError;
      expect(regexMatchFormatError.message).toContain('Invalid regular expression');
      expect(regexMatchFormatError.line).toBe(0);
    }
  });

  it('should throw error if the file content does not contain the test area delimiter', () => {
    const fileContent = '/[0-9]a/g\nbb9abb\n---';

    try {
      FileParser.parseFileContent(fileContent, []);
      expect.unreachable('Expected to throw an error');
    } catch (error) {
      expect(error).toBeInstanceOf(RegexMatchFormatError);

      const regexMatchFormatError = error as RegexMatchFormatError;
      expect(regexMatchFormatError.message).toBe(DEFAULT_REGEX_MATCH_FORMAT_ERROR_MESSAGE);
      expect(regexMatchFormatError.line).toBe(0);
    }
  });

  it('should throw error if the file content does not contain the matching regex', () => {
    const fileContent = '---\nbb9abb\n---';

    try {
      FileParser.parseFileContent(fileContent, []);
      expect.unreachable('Expected to throw an error');
    } catch (error) {
      expect(error).toBeInstanceOf(RegexMatchFormatError);

      const regexMatchFormatError = error as RegexMatchFormatError;
      expect(regexMatchFormatError.message).toBe(DEFAULT_REGEX_MATCH_FORMAT_ERROR_MESSAGE);
      expect(regexMatchFormatError.line).toBe(0);
    }
  });

  it('should throw error if the file content does not contain the test area', () => {
    const fileContent = '/[0-9]a/g\n---';

    try {
      FileParser.parseFileContent(fileContent, []);
      expect.unreachable('Expected to throw an error');
    } catch (error) {
      expect(error).toBeInstanceOf(RegexMatchFormatError);

      const regexMatchFormatError = error as RegexMatchFormatError;
      expect(regexMatchFormatError.message).toBe(DEFAULT_REGEX_MATCH_FORMAT_ERROR_MESSAGE);
      expect(regexMatchFormatError.line).toBe(0);
    }
  });

  describe('Multiple Regex Tests', () => {
    it('should throw error if the second regex test does not have opening delimiter', () => {
      const fileContent = '/[0-9]/\n---\ntest\ntest\n---\n/[0-9]/';

      try {
        FileParser.parseFileContent(fileContent, []);
        expect.unreachable('Expected to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(RegexMatchFormatError);

        const regexMatchFormatError = error as RegexMatchFormatError;
        expect(regexMatchFormatError.message).toBe(DEFAULT_REGEX_MATCH_FORMAT_ERROR_MESSAGE);
        expect(regexMatchFormatError.line).toBe(0);
      }
    });

    it('should throw error if the second regex test does not have closing delimiter', () => {
      const fileContent = '/[0-9]/\n---\ntest\ntest\n---\n/[0-9]/\n---\ntest\ntest';

      try {
        FileParser.parseFileContent(fileContent, []);
        expect.unreachable('Expected to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(RegexMatchFormatError);

        const regexMatchFormatError = error as RegexMatchFormatError;
        expect(regexMatchFormatError.message).toBe(DEFAULT_REGEX_MATCH_FORMAT_ERROR_MESSAGE);
        expect(regexMatchFormatError.line).toBe(0);
      }
    });

    it('should parse correctly if the second matching regex is invalid', () => {
      const fileContent = '/[0-9]/gm\n---\nbb9abb\n---\n/[0-9](/gm\n---\n9\n---';

      try {
        FileParser.parseFileContent(fileContent, []);
        expect.unreachable('Expected to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(RegexSyntaxError);

        const regexMatchFormatError = error as RegexSyntaxError;
        expect(regexMatchFormatError.message).toContain('Invalid regular expression');
        expect(regexMatchFormatError.line).toBe(4);
      }
    });

    it('should parse multiple regex tests correctly', () => {
      const fileContent = '/[0-9]/gm\n---\ntest1\ntest2\n---\n/[0-9]/gm\n---\ntest3\ntest4\n---';

      const regexTests = FileParser.parseFileContent(fileContent, []);
      expect(regexTests).not.toBeNull();
      expect(regexTests).toHaveLength(2);

      expect(regexTests[0].getMatchingRegex()).toStrictEqual(/[0-9]/dgm);
      expect(regexTests[0].getFormattedTestString()).toHaveLength(2);
      expect(regexTests[0].getFormattedTestString()[0]).toBe('test1');
      expect(regexTests[0].getFormattedTestString()[1]).toBe('test2');
      expect(regexTests[0].getStartTestIndex()).toBe(14);

      expect(regexTests[1].getMatchingRegex()).toStrictEqual(/[0-9]/dgm);
      expect(regexTests[1].getFormattedTestString()).toHaveLength(2);
      expect(regexTests[1].getFormattedTestString()[0]).toBe('test3');
      expect(regexTests[1].getFormattedTestString()[1]).toBe('test4');
      expect(regexTests[1].getStartTestIndex()).toBe(44);
    });

    it('should parse multiple regex tests correctly, if the second regex test does not have multiline flag', () => {
      const fileContent = '/[0-9]/gm\n---\ntest1\ntest2\n---\n/[0-9]/i\n---\ntest3\ntest4\n---';

      const regexTests = FileParser.parseFileContent(fileContent, []);
      expect(regexTests).not.toBeNull();
      expect(regexTests).toHaveLength(2);

      expect(regexTests[0].getMatchingRegex()).toStrictEqual(/[0-9]/dgm);
      expect(regexTests[0].getFormattedTestString()).toHaveLength(2);
      expect(regexTests[0].getFormattedTestString()[0]).toBe('test1');
      expect(regexTests[0].getFormattedTestString()[1]).toBe('test2');
      expect(regexTests[0].getStartTestIndex()).toBe(14);

      expect(regexTests[1].getMatchingRegex()).toStrictEqual(/[0-9]/di);
      expect(regexTests[1].getFormattedTestString()).toHaveLength(2);
      expect(regexTests[1].getFormattedTestString()[0]).toBe('test3');
      expect(regexTests[1].getFormattedTestString()[1]).toBe('test4');
      expect(regexTests[1].getStartTestIndex()).toBe(43);
    });

    it('should parse multiple regex tests correctly, if there is a regex with an error', () => {
      const fileContent = '/[0-9]/gm\n---\ntest1\ntest2\n---\n/[0-9](/gm\n---\n9\n---';

      try {
        FileParser.parseFileContent(fileContent, []);
        expect.unreachable('Expected to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(RegexSyntaxError);

        const regexMatchFormatError = error as RegexSyntaxError;
        expect(regexMatchFormatError.message).toContain('Invalid regular expression');
        expect(regexMatchFormatError.line).toBe(5);
      }
    });

    it('should parse multiple regex tests correctly, if there are empty lines between tests', () => {
      const fileContent = '/[0-9]/gm\n---\ntest1\ntest2\n---\n\n\n/[0-9]/gm\n---\ntest3\ntest4\n---';

      const regexTests = FileParser.parseFileContent(fileContent, []);
      expect(regexTests).not.toBeNull();
      expect(regexTests).toHaveLength(2);

      expect(regexTests[0].getMatchingRegex()).toStrictEqual(/[0-9]/dgm);
      expect(regexTests[0].getFormattedTestString()).toHaveLength(2);
      expect(regexTests[0].getFormattedTestString()[0]).toBe('test1');
      expect(regexTests[0].getFormattedTestString()[1]).toBe('test2');
      expect(regexTests[0].getStartTestIndex()).toBe(14);

      expect(regexTests[1].getMatchingRegex()).toStrictEqual(/[0-9]/dgm);
      expect(regexTests[1].getFormattedTestString()).toHaveLength(2);
      expect(regexTests[1].getFormattedTestString()[0]).toBe('test3');
      expect(regexTests[1].getFormattedTestString()[1]).toBe('test4');
      expect(regexTests[1].getStartTestIndex()).toBe(46);
    });
  });
});
