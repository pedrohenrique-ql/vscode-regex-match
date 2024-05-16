import { describe, expect, it } from 'vitest';

import FileParser from '../../FileParser';

describe('File Parser', () => {
  it('should parse file content correctly', () => {
    const fileContent = '/[0-9]a/g\n---\nbb9abb\n---';

    const parsedRegexTest = FileParser.parseFileContent(fileContent);

    expect(parsedRegexTest).toBeDefined();
    expect(parsedRegexTest!.matchingRegex).toStrictEqual(/[0-9]a/dg);
    expect(parsedRegexTest!.testLines).toHaveLength(1);
    expect(parsedRegexTest!.testLines[0]).toBe('bb9abb');
    expect(parsedRegexTest!.startTestIndex).toBe(14);
  });

  it('should parse file content correctly, if the regex has multiline flag', () => {
    const fileContent = '/[0-9]a/gm\n---\nbb9abb\n2a\n---';

    const parsedRegexTest = FileParser.parseFileContent(fileContent);

    expect(parsedRegexTest).toBeDefined();
    expect(parsedRegexTest!.matchingRegex).toStrictEqual(/[0-9]a/dgm);
    expect(parsedRegexTest!.testLines).toHaveLength(2);
    expect(parsedRegexTest!.testLines[0]).toBe('bb9abb');
    expect(parsedRegexTest!.testLines[1]).toBe('2a');
    expect(parsedRegexTest!.startTestIndex).toBe(15);
  });

  it('should parse file content correctly, if the regex does not have multiline flag', () => {
    const fileContent = '/[0-9]a/g\n---\nbb9abb\n2a\n---';

    const parsedRegexTest = FileParser.parseFileContent(fileContent);

    expect(parsedRegexTest).toBeDefined();
    expect(parsedRegexTest!.matchingRegex).toStrictEqual(/[0-9]a/dg);
    expect(parsedRegexTest!.testLines).toHaveLength(1);
    expect(parsedRegexTest!.testLines[0]).toBe('bb9abb\n2a');
    expect(parsedRegexTest!.startTestIndex).toBe(14);
  });

  it('should set the default flags in matching regex, if the flags are not provided', () => {
    const fileContent = '/[0-9]a/\n---\nbb9abb\n---';

    const parsedRegexTest = FileParser.parseFileContent(fileContent);

    expect(parsedRegexTest).toBeDefined();
    expect(parsedRegexTest!.matchingRegex).toStrictEqual(/[0-9]a/dgm);
    expect(parsedRegexTest!.testLines).toHaveLength(1);
    expect(parsedRegexTest!.testLines[0]).toBe('bb9abb');
    expect(parsedRegexTest!.startTestIndex).toBe(13);
  });
});
