import { describe, expect, it, vi } from 'vitest';
import { Uri, Range } from 'vscode';

import { CodeRegex } from '@/providers/code-lenses/TestRegexCodeLensProvider';
import FileParser from '@/services/regex-match/FileParser';

vi.mock('vscode', async () => {
  const { Uri, Range } = await import('@/tests/mocks/vscode');
  return { Uri, Range };
});

describe('File Parser - Code Regex', () => {
  it('should insert code regex in the regex test when received', () => {
    const fileContent = '/[0-9]/gm\n---\ntest1\ntest2\n---';

    const codeRegex: CodeRegex = {
      pattern: '/[0-9]/gm',
      documentUri: Uri.file('./file-parser.test.ts'),
      range: new Range(0, 0, 0, 0),
    };

    const regexTests = FileParser.parseFileContent(fileContent, [], codeRegex);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(1);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/[0-9]/dgm);
    expect(regexTests[0].getFormattedTestString()).toHaveLength(2);
    expect(regexTests[0].getFormattedTestString()[0]).toBe('test1');
    expect(regexTests[0].getFormattedTestString()[1]).toBe('test2');
    expect(regexTests[0].getStartTestIndex()).toBe(14);
    expect(regexTests[0].isCodeRegex()).toBe(true);
  });

  it('should maintain the code regex in the regex test when update the file content', () => {
    const fileContent = '/[0-9]/gm\n---\ntest1\ntest2\n---';

    const codeRegex: CodeRegex = {
      pattern: '/[0-9]/gm',
      documentUri: Uri.file('./file-parser.test.ts'),
      range: new Range(0, 0, 0, 0),
    };

    let regexTests = FileParser.parseFileContent(fileContent, [], codeRegex);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(1);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/[0-9]/dgm);
    expect(regexTests[0].isCodeRegex()).toBe(true);

    const oldCodeRegex = regexTests[0].getCodeRegex();
    const updatedFileContent = '/UPDATED-REGEX/g\n---\ntest1\ntest2\n---\n';

    regexTests = FileParser.parseFileContent(updatedFileContent, regexTests);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(1);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/UPDATED-REGEX/dg);
    expect(regexTests[0].isCodeRegex()).toBe(true);
    expect(regexTests[0].getCodeRegex()).toBe(oldCodeRegex);
  });

  it('should maintain the code regex in the regex test when update the regex and the test string', () => {
    const fileContent = '/[0-9]/gm\n---\ntest1\ntest2\n---';

    const codeRegex: CodeRegex = {
      pattern: '/[0-9]/gm',
      documentUri: Uri.file('./file-parser.test.ts'),
      range: new Range(0, 0, 0, 0),
    };

    let regexTests = FileParser.parseFileContent(fileContent, [], codeRegex);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(1);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/[0-9]/dgm);
    expect(regexTests[0].isCodeRegex()).toBe(true);

    const oldCodeRegex = regexTests[0].getCodeRegex();
    const updatedFileContent = '/UPDATED-REGEX/g\n---\ntest3\ntest4\n---\n';

    regexTests = FileParser.parseFileContent(updatedFileContent, regexTests);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(1);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/UPDATED-REGEX/dg);
    expect(regexTests[0].isCodeRegex()).toBe(true);
    expect(regexTests[0].getCodeRegex()).toBe(oldCodeRegex);
  });

  it('should maintain the code regex in the correct regex test when update the file content by adding a regex test below', () => {
    const fileContent = '/[0-9]/gm\n---\ntest1\ntest2\n---';

    const codeRegex: CodeRegex = {
      pattern: '/[0-9]/gm',
      documentUri: Uri.file('./file-parser.test.ts'),
      range: new Range(0, 0, 0, 0),
    };

    let regexTests = FileParser.parseFileContent(fileContent, [], codeRegex);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(1);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/[0-9]/dgm);
    expect(regexTests[0].isCodeRegex()).toBe(true);

    const oldCodeRegex = regexTests[0].getCodeRegex();
    const updatedFileContent = '/[0-9]/gm\n---\ntest1\ntest2\n---\n/ANOTHER-REGEX/gm\n---\ntest3\ntest4\n---';

    regexTests = FileParser.parseFileContent(updatedFileContent, regexTests);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(2);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/[0-9]/dgm);
    expect(regexTests[0].isCodeRegex()).toBe(true);
    expect(regexTests[0].getCodeRegex()).toBe(oldCodeRegex);

    expect(regexTests[1].getMatchingRegex()).toStrictEqual(/ANOTHER-REGEX/dgm);
    expect(regexTests[1].isCodeRegex()).toBe(false);
  });

  it('should maintain the code regex in the correct regex test when update the file content by adding a regex test above', () => {
    const fileContent = '/[0-9]/gm\n---\ntest1\ntest2\n---';

    const codeRegex: CodeRegex = {
      pattern: '/[0-9]/gm',
      documentUri: Uri.file('./file-parser.test.ts'),
      range: new Range(0, 0, 0, 0),
    };

    let regexTests = FileParser.parseFileContent(fileContent, [], codeRegex);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(1);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/[0-9]/dgm);
    expect(regexTests[0].isCodeRegex()).toBe(true);

    const oldCodeRegex = regexTests[0].getCodeRegex();
    const updatedFileContent = '/ANOTHER-REGEX/gm\n---\ntest3\ntest4\n---\n/[0-9]/gm\n---\ntest1\ntest2\n---';

    regexTests = FileParser.parseFileContent(updatedFileContent, regexTests);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(2);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/ANOTHER-REGEX/dgm);
    expect(regexTests[0].isCodeRegex()).toBe(false);

    expect(regexTests[1].getMatchingRegex()).toStrictEqual(/[0-9]/dgm);
    expect(regexTests[1].isCodeRegex()).toBe(true);
    expect(regexTests[1].getCodeRegex()).toBe(oldCodeRegex);
  });

  it('should maintain the code regex in the correct regex test when update matching regex and has multiple regex tests', () => {
    const fileContent = '/[0-9]/gm\n---\ntest1\ntest2\n---';

    const codeRegex: CodeRegex = {
      pattern: '/[0-9]/gm',
      documentUri: Uri.file('./file-parser.test.ts'),
      range: new Range(0, 0, 0, 0),
    };

    let regexTests = FileParser.parseFileContent(fileContent, [], codeRegex);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(1);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/[0-9]/dgm);
    expect(regexTests[0].isCodeRegex()).toBe(true);

    let oldCodeRegex = regexTests[0].getCodeRegex();
    let updatedFileContent = '/UPDATED-REGEX/gm\n---\ntest1\ntest2\n---\n/ANOTHER-REGEX/gm\n---\ntest3\ntest4\n---\n';

    regexTests = FileParser.parseFileContent(updatedFileContent, regexTests);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(2);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/UPDATED-REGEX/dgm);
    expect(regexTests[0].isCodeRegex()).toBe(true);
    expect(regexTests[0].getCodeRegex()).toBe(oldCodeRegex);

    expect(regexTests[1].getMatchingRegex()).toStrictEqual(/ANOTHER-REGEX/dgm);
    expect(regexTests[1].isCodeRegex()).toBe(false);

    oldCodeRegex = regexTests[0].getCodeRegex();
    updatedFileContent = '/UPDATED-REGEX2/gm\n---\ntest1\ntest2\n---\n/ANOTHER-REGEX/gm\n---\ntest3\ntest4\n---';

    regexTests = FileParser.parseFileContent(updatedFileContent, regexTests);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(2);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/UPDATED-REGEX2/dgm);
    expect(regexTests[0].isCodeRegex()).toBe(true);
    expect(regexTests[0].getCodeRegex()).toBe(oldCodeRegex);

    expect(regexTests[1].getMatchingRegex()).toStrictEqual(/ANOTHER-REGEX/dgm);
    expect(regexTests[1].isCodeRegex()).toBe(false);
  });

  it('should maintain the code regex in the correct regex test when remove a regex test', () => {
    const fileContent = '/[0-9]/gm\n---\ntest1\ntest2\n---';

    const codeRegex: CodeRegex = {
      pattern: '/[0-9]/gm',
      documentUri: Uri.file('./file-parser.test.ts'),
      range: new Range(0, 0, 0, 0),
    };

    let regexTests = FileParser.parseFileContent(fileContent, [], codeRegex);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(1);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/[0-9]/dgm);
    expect(regexTests[0].isCodeRegex()).toBe(true);

    let oldCodeRegex = regexTests[0].getCodeRegex();
    let updatedFileContent = '/[0-9]/gm\n---\ntest1\ntest2\n---\n/ANOTHER-REGEX/gm\n---\ntest3\ntest4\n---\n';

    regexTests = FileParser.parseFileContent(updatedFileContent, regexTests);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(2);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/[0-9]/dgm);
    expect(regexTests[0].isCodeRegex()).toBe(true);
    expect(regexTests[0].getCodeRegex()).toBe(oldCodeRegex);

    expect(regexTests[1].getMatchingRegex()).toStrictEqual(/ANOTHER-REGEX/dgm);
    expect(regexTests[1].isCodeRegex()).toBe(false);

    oldCodeRegex = regexTests[0].getCodeRegex();
    updatedFileContent = '/[0-9]/gm\n---\ntest1\ntest2\n---';

    regexTests = FileParser.parseFileContent(updatedFileContent, regexTests);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(1);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/[0-9]/dgm);
    expect(regexTests[0].isCodeRegex()).toBe(true);
    expect(regexTests[0].getCodeRegex()).toBe(oldCodeRegex);
  });

  it('should lost the code regex in the regex test when update matching regex and test string when has multiple regex tests', () => {
    const fileContent = '/[0-9]/gm\n---\ntest1\ntest2\n---';

    const codeRegex: CodeRegex = {
      pattern: '/[0-9]/gm',
      documentUri: Uri.file('./file-parser.test.ts'),
      range: new Range(0, 0, 0, 0),
    };

    let regexTests = FileParser.parseFileContent(fileContent, [], codeRegex);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(1);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/[0-9]/dgm);
    expect(regexTests[0].isCodeRegex()).toBe(true);

    const updatedFileContent = '/UPDATED-REGEX/gm\n---\ntest3\ntest4\n---\n/UPDATED-REGEX/gm\n---\ntest3\ntest4\n---';

    regexTests = FileParser.parseFileContent(updatedFileContent, regexTests);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(2);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/UPDATED-REGEX/dgm);
    expect(regexTests[0].isCodeRegex()).toBe(false);

    expect(regexTests[1].getMatchingRegex()).toStrictEqual(/UPDATED-REGEX/dgm);
    expect(regexTests[1].isCodeRegex()).toBe(false);
  });

  it('should insert another regex test with code regex', () => {
    const fileContent = '/[0-9]/gm\n---\ntest1\ntest2\n---';

    const codeRegex: CodeRegex = {
      pattern: '/[0-9]/gm',
      documentUri: Uri.file('./file-parser.test.ts'),
      range: new Range(0, 0, 0, 0),
    };

    let regexTests = FileParser.parseFileContent(fileContent, [], codeRegex);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(1);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/[0-9]/dgm);
    expect(regexTests[0].isCodeRegex()).toBe(true);
    expect(regexTests[0].getCodeRegExp()).toStrictEqual(/[0-9]/gm);

    const updatedFileContent = '/[0-9]/gm\n---\ntest1\ntest2\n---\n/ANOTHER-REGEX/gm\n---\ntest3\ntest4\n---';

    const newCodeRegex: CodeRegex = {
      pattern: '/ANOTHER-REGEX/gm',
      documentUri: Uri.file('./file-parser.test.ts'),
      range: new Range(0, 0, 0, 0),
    };

    regexTests = FileParser.parseFileContent(updatedFileContent, regexTests, newCodeRegex);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(2);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/[0-9]/dgm);
    expect(regexTests[0].isCodeRegex()).toBe(true);
    expect(regexTests[0].getCodeRegExp()).toStrictEqual(/[0-9]/gm);

    expect(regexTests[1].getMatchingRegex()).toStrictEqual(/ANOTHER-REGEX/dgm);
    expect(regexTests[1].isCodeRegex()).toBe(true);
    expect(regexTests[1].getCodeRegExp()).toStrictEqual(/ANOTHER-REGEX/gm);
  });

  it('should insert another regex test with code regex when already has a test without code regex', () => {
    const fileContent = '/[0-9]/gm\n---\ntest1\ntest2\n---';

    let regexTests = FileParser.parseFileContent(fileContent, []);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(1);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/[0-9]/dgm);
    expect(regexTests[0].isCodeRegex()).toBeFalsy();

    let updatedFileContent = '/[0-9]/gm\n---\ntest1\ntest2\n---\n/ANOTHER-REGEX/gm\n---\ntest3\ntest4\n---';

    let newCodeRegex: CodeRegex = {
      pattern: '/ANOTHER-REGEX/gm',
      documentUri: Uri.file('./file-parser.test.ts'),
      range: new Range(0, 0, 0, 0),
    };

    regexTests = FileParser.parseFileContent(updatedFileContent, regexTests, newCodeRegex);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(2);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/[0-9]/dgm);
    expect(regexTests[0].isCodeRegex()).toBeFalsy();

    expect(regexTests[1].getMatchingRegex()).toStrictEqual(/ANOTHER-REGEX/dgm);
    expect(regexTests[1].isCodeRegex()).toBe(true);
    expect(regexTests[1].getCodeRegExp()).toStrictEqual(/ANOTHER-REGEX/gm);

    updatedFileContent =
      '/[0-9]/gm\n---\ntest1\ntest2\n---\n/ANOTHER-REGEX/gm\n---\ntest3\ntest4\n---\n/ANOTHER-REGEX2/gm\n---\ntest5\ntest6\n---';

    newCodeRegex = {
      pattern: '/ANOTHER-REGEX2/gm',
      documentUri: Uri.file('./file-parser.test.ts'),
      range: new Range(0, 0, 0, 0),
    };

    regexTests = FileParser.parseFileContent(updatedFileContent, regexTests, newCodeRegex);
    expect(regexTests).not.toBeNull();
    expect(regexTests).toHaveLength(3);

    expect(regexTests[0].getMatchingRegex()).toStrictEqual(/[0-9]/dgm);
    expect(regexTests[0].isCodeRegex()).toBeFalsy();

    expect(regexTests[1].getMatchingRegex()).toStrictEqual(/ANOTHER-REGEX/dgm);
    expect(regexTests[1].isCodeRegex()).toBe(true);
    expect(regexTests[1].getCodeRegExp()).toStrictEqual(/ANOTHER-REGEX/gm);

    expect(regexTests[2].getMatchingRegex()).toStrictEqual(/ANOTHER-REGEX2/dgm);
    expect(regexTests[2].isCodeRegex()).toBe(true);
    expect(regexTests[2].getCodeRegExp()).toStrictEqual(/ANOTHER-REGEX2/gm);
  });
});
