import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hover, MarkdownString, Position, TextDocument } from 'vscode';

import RegexHoverProvider from '@/providers/RegexHoverProvider';

vi.mock('vscode', () => vi.importActual('@/tests/mocks/vscode'));

const MULTI_REGEX_FILE_CONTENT = '/(a+)/gm\n---\naaa\n12312aaaa\n---\n\n/b+/gm\n---\nbbb\ncccbbbb\n---';

describe('Regex Hover Provider', () => {
  let provider: RegexHoverProvider;

  beforeEach(() => {
    provider = new RegexHoverProvider();
  });

  function createDocument(fileContent: string): TextDocument {
    const lines = fileContent.split('\n');

    return {
      lineAt: (line: number) => ({ text: lines[line] }),
      lineCount: lines.length,
    } as unknown as TextDocument;
  }

  function hover(fileContent: string, line: number, character: number): Hover | undefined {
    return provider.provideHover(createDocument(fileContent), new Position(line, character));
  }

  function hoverText(result: Hover | undefined): string {
    return (result!.contents as unknown as MarkdownString).value;
  }

  it('should provide a hover explaining the token under the cursor on the regex line', () => {
    const result = hover('/a+/g', 0, 1);

    expect(result).toBeDefined();
    expect(hoverText(result)).toContain('`a`');
    expect(hoverText(result)).toContain('matches the character `a` literally');
  });

  it('should include the enclosing quantifier and capturing group in the hover content', () => {
    const result = hover('/(\\d{2,4})\\w+/gi', 0, 2);

    expect(result).toBeDefined();
    expect(hoverText(result)).toContain('matches a digit (equivalent to `[0-9]`)');
    expect(hoverText(result)).toContain('`{2,4}`');
    expect(hoverText(result)).toContain('capturing group 1');
  });

  it('should set the hover range to the hovered token only', () => {
    const result = hover('/(\\d{2,4})\\w+/gi', 0, 2);

    expect(result!.range!.start.line).toBe(0);
    expect(result!.range!.start.character).toBe(2);
    expect(result!.range!.end.line).toBe(0);
    expect(result!.range!.end.character).toBe(4);
  });

  it('should provide a hover for the flags when hovering a flag character', () => {
    const result = hover('/a+/gi', 0, 5);

    expect(result).toBeDefined();
    expect(hoverText(result)).toContain('case-insensitive matching');
    expect(result!.range!.start.character).toBe(5);
    expect(result!.range!.end.character).toBe(6);
  });

  it('should not provide a hover for a line inside the test block', () => {
    expect(hover('/a+/g\n---\n/b+/g\n---', 2, 1)).toBeUndefined();
  });

  it('should not provide a hover for the test area delimiter line', () => {
    expect(hover('/a+/g\n---\naaa\n---', 1, 0)).toBeUndefined();
  });

  it('should not provide a hover for an empty line', () => {
    expect(hover('/a+/g\n---\naaa\n---\n', 4, 0)).toBeUndefined();
  });

  it("should not provide a hover for the second regex line's test content in a multi-regex file", () => {
    expect(hover(MULTI_REGEX_FILE_CONTENT, 8, 0)).toBeUndefined();
  });

  it('should provide a hover for the second regex line in a multi-regex file', () => {
    const result = hover(MULTI_REGEX_FILE_CONTENT, 6, 1);

    expect(result).toBeDefined();
    expect(hoverText(result)).toContain('matches the character `b` literally');
  });

  it('should not provide a hover when the regex is invalid', () => {
    expect(hover('/a(/', 0, 1)).toBeUndefined();
  });
});
