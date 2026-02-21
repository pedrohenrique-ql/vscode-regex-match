import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { TextDocument, Position, CodeLens, workspace } from 'vscode';

import ApplyRegexCodeLensProvider from '@/providers/code-lenses/ApplyRegexCodeLensProvider';
import { createRegexTest } from '@/tests/factories/RegexTestFactory';

vi.mock('vscode', () => vi.importActual('@/tests/mocks/vscode'));

describe('Apply Regex to Code - Code Lens', () => {
  let provider: ApplyRegexCodeLensProvider;
  let mockDocument: TextDocument;
  let mockCodeDocument: TextDocument;
  let mockGetText: Mock;
  let mockCodeGetText: Mock;

  beforeEach(() => {
    provider = new ApplyRegexCodeLensProvider();

    mockGetText = vi.fn().mockReturnValue('');
    const mockPositionAt = vi.fn().mockReturnValue(new Position(0, 0));

    mockDocument = {
      getText: mockGetText,
      positionAt: mockPositionAt,
      uri: { toString: () => 'test://document' },
    } as unknown as TextDocument;

    mockCodeGetText = vi.fn().mockReturnValue('');
    const mockCodePositionAt = vi.fn().mockReturnValue(new Position(0, 0));

    mockCodeDocument = {
      getText: mockCodeGetText,
      positionAt: mockCodePositionAt,
      uri: { toString: () => 'test://code' },
    } as unknown as TextDocument;

    (workspace.textDocuments as TextDocument[]) = [mockCodeDocument];
  });

  function createMockPositionAt(text: string) {
    return (index: number) => {
      const lines = text.slice(0, index).split('\n');
      return new Position(lines.length - 1, lines[lines.length - 1].length);
    };
  }

  function setupDocumentText(text: string, codeText?: string): void {
    mockGetText.mockReturnValue(text);
    mockCodeGetText.mockReturnValue(codeText ?? '/hello/gm');

    (mockDocument.positionAt as Mock).mockImplementation(createMockPositionAt(text));
    (mockCodeDocument.positionAt as Mock).mockImplementation(createMockPositionAt(codeText ?? '/hello/gm'));
  }

  it('should return empty array when there are no regex tests', () => {
    const result = provider.provideCodeLenses(mockDocument);
    expect(result).toEqual([]);
  });

  it('should return empty array when there are no code regex tests', () => {
    const regexTest = createRegexTest({
      isCodeRegex: false,
    });

    provider.setRegexTests([regexTest]);
    const result = provider.provideCodeLenses(mockDocument);

    expect(result).toEqual([]);
  });

  it('should create code lens for single match', () => {
    const documentText = 'test';
    const regexTest = createRegexTest({
      regexPattern: '/test/gm',
      isCodeRegex: true,
      codeRegexPattern: '/hello/gm',
    });

    setupDocumentText(documentText);
    provider.setRegexTests([regexTest]);

    const result = provider.provideCodeLenses(mockDocument) as CodeLens[];

    expect(result).toHaveLength(1);
    expect(result[0].command!.title).toBe('Apply Regex to Code');
    expect(result[0].command!.command).toBe('regex-match.applyRegexToCode');
  });

  it('should handle multiple matches with correct positioning', () => {
    const firstRegexTest = createRegexTest({
      regexPattern: '/test/gm',
      isCodeRegex: false,
    });

    const secondRegexTest = createRegexTest({
      regexPattern: '/test/gm',
      isCodeRegex: true,
      codeRegexPattern: '/hello/gm',
    });

    const documentText = 'const regex1 = /test/gm;\nconst regex2 = /test/gm;';
    setupDocumentText(documentText);
    provider.setRegexTests([firstRegexTest, secondRegexTest]);

    const result = provider.provideCodeLenses(mockDocument) as CodeLens[];

    expect(result).toHaveLength(1);
    expect(result[0].range.start.line).toBe(1);
  });

  it('should not create code lens when regex is not updated', () => {
    const regexTest = createRegexTest({
      regexPattern: '/test/gm',
      isCodeRegex: true,
      codeRegexPattern: '/test/gm',
    });

    const documentText = 'const regex = /test/gm;';
    setupDocumentText(documentText);
    provider.setRegexTests([regexTest]);
    const result = provider.provideCodeLenses(mockDocument) as CodeLens[];

    expect(result).toEqual([]);
  });

  it('should handle documents with no matching patterns', () => {
    const regexTest = createRegexTest({
      regexPattern: '/notfound/gm',
      isCodeRegex: true,
      codeRegexPattern: '/hello/gm',
    });

    const documentText = 'const regex = /different/gm;';
    setupDocumentText(documentText);
    provider.setRegexTests([regexTest]);
    const result = provider.provideCodeLenses(mockDocument) as CodeLens[];

    expect(result).toEqual([]);
  });

  it('should handle multiple code regex tests correctly', () => {
    const firstRegexTest = createRegexTest({
      regexPattern: '/test/gm',
      isCodeRegex: true,
      codeRegexPattern: '/hello/gm',
    });

    const secondRegexTest = createRegexTest({
      regexPattern: '/world/gm',
      isCodeRegex: true,
      codeRegexPattern: '/foo/gm',
    });

    const documentText = 'test\\nworld';
    setupDocumentText(documentText, '/hello/gm /foo/gm');
    provider.setRegexTests([firstRegexTest, secondRegexTest]);
    const result = provider.provideCodeLenses(mockDocument) as CodeLens[];

    expect(result).toHaveLength(2);
    expect(result[0].command!.title).toBe('Apply Regex to Code');
    expect(result[1].command!.title).toBe('Apply Regex to Code');
  });

  it('should use correct match for third regex test when first and third have same pattern', () => {
    const firstRegexTest = createRegexTest({
      regexPattern: '/test/gm',
      isCodeRegex: false,
    });

    const secondRegexTest = createRegexTest({
      regexPattern: '/other/gm',
      isCodeRegex: false,
    });

    const thirdRegexTest = createRegexTest({
      regexPattern: '/test/gm',
      isCodeRegex: true,
      codeRegexPattern: '/updated/gm',
    });

    const documentText = 'test\nother\ntest';
    setupDocumentText(documentText, '/updated/gm');
    provider.setRegexTests([firstRegexTest, secondRegexTest, thirdRegexTest]);

    const result = provider.provideCodeLenses(mockDocument) as CodeLens[];

    expect(result).toHaveLength(1);
    expect(result[0].command!.title).toBe('Apply Regex to Code');
    expect(result[0].range.start.line).toBe(2);
  });

  it('should create code lenses with correct ranges for multiple updated regex tests', () => {
    const firstRegexTest = createRegexTest({
      regexPattern: '/hello/gm',
      isCodeRegex: true,
      codeRegexPattern: '/helloX/gm',
    });

    const secondRegexTest = createRegexTest({
      regexPattern: '/world/gm',
      isCodeRegex: true,
      codeRegexPattern: '/worldY/gm',
    });

    const documentText = 'hello\nworld';
    setupDocumentText(documentText, '/helloX/gm /worldY/gm');
    provider.setRegexTests([firstRegexTest, secondRegexTest]);

    const result = provider.provideCodeLenses(mockDocument) as CodeLens[];
    expect(result).toHaveLength(2);

    expect(result[0].range.start.line).toBe(0);
    expect(result[0].command!.title).toBe('Apply Regex to Code');
    expect(result[0].command!.command).toBe('regex-match.applyRegexToCode');

    expect(result[1].range.start.line).toBe(1);
    expect(result[1].command!.title).toBe('Apply Regex to Code');
    expect(result[1].command!.command).toBe('regex-match.applyRegexToCode');
  });
});
