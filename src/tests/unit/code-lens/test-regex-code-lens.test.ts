import { describe, expect, it, vi } from 'vitest';
import { CodeLens, Position, TextDocument, Uri } from 'vscode';
import TestRegexCodeLensProvider from '@/providers/code-lenses/TestRegexCodeLensProvider';
vi.mock('vscode', () => vi.importActual('@/tests/mocks/vscode'));

describe('Test Regex CodeLens Provider', () => {
  it.each([
    ['raw', 're.compile(r"\\d+")', '/\\d+/'],
    ['regular', 're.compile("\\\\d+")', '/\\d+/'],
    ['slash-containing', 're.compile(r"a/b")', '/a\\/b/'],
  ])('passes the %s Python pattern as a regex literal', (_kind, code, expected) => {
    const document = {
      languageId: 'python', getText: () => code,
      positionAt: (index: number) => new Position(0, index), uri: Uri.file('/example.py'),
    } as unknown as TextDocument;
    const lenses = new TestRegexCodeLensProvider().provideCodeLenses(document) as CodeLens[];
    expect(lenses).toHaveLength(1);
    expect(lenses[0].command?.arguments?.[0]).toMatchObject({ pattern: expected, languageId: 'python' });
  });
});
