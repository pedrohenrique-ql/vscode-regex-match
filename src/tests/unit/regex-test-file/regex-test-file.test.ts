import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Position, Range, TextEditor, Uri, window } from 'vscode';

import FileParser from '@/controllers/regex-test/FileParser';
import RegexTestFile, { DOCUMENT_CHANGE_DEBOUNCE_MS } from '@/controllers/regex-test/RegexTestFile';
import { CodeRegex } from '@/providers/code-lenses/TestRegexCodeLensProvider';
import DiagnosticProvider from '@/providers/DiagnosticProvider';

vi.mock('vscode', () => vi.importActual('@/tests/mocks/vscode'));

const FILE_PATH = '/regex-match/RegexMatch.rgx';
const FILE_CONTENT = '/(a+)(b+)/gm\n---\naabb\n---';

describe('Regex Test File', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    Object.assign(window, { visibleTextEditors: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createTextEditor(setDecorations = vi.fn()) {
    return {
      document: {
        uri: Uri.file(FILE_PATH),
        getText: () => FILE_CONTENT,
        positionAt: (offset: number) => new Position(0, offset),
        lineAt: () => ({ text: '' }),
      },
      setDecorations,
    } as unknown as TextEditor;
  }

  function createRegexTestFile() {
    const diagnosticProvider = { updateDiagnostics: () => undefined } as unknown as DiagnosticProvider;
    return new RegexTestFile(Uri.file(FILE_PATH), diagnosticProvider);
  }

  function spyOnParser() {
    return vi.spyOn(FileParser, 'parseFileContent');
  }

  it('should parse the file once when several document changes arrive within the debounce window', () => {
    const regexTestFile = createRegexTestFile();
    const parseSpy = spyOnParser();
    const editor = createTextEditor();

    regexTestFile.handleTextDocumentChange(editor);
    vi.advanceTimersByTime(DOCUMENT_CHANGE_DEBOUNCE_MS - 1);
    regexTestFile.handleTextDocumentChange(editor);
    vi.advanceTimersByTime(DOCUMENT_CHANGE_DEBOUNCE_MS - 1);
    regexTestFile.handleTextDocumentChange(editor);
    vi.advanceTimersByTime(DOCUMENT_CHANGE_DEBOUNCE_MS);

    expect(parseSpy).toHaveBeenCalledTimes(1);
  });

  it('should not parse the file before the debounce delay elapses', () => {
    const regexTestFile = createRegexTestFile();
    const parseSpy = spyOnParser();

    regexTestFile.handleTextDocumentChange(createTextEditor());
    vi.advanceTimersByTime(DOCUMENT_CHANGE_DEBOUNCE_MS - 1);

    expect(parseSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(parseSpy).toHaveBeenCalledTimes(1);
  });

  it('should parse again when a change arrives after the previous run flushed', () => {
    const regexTestFile = createRegexTestFile();
    const parseSpy = spyOnParser();
    const editor = createTextEditor();

    regexTestFile.handleTextDocumentChange(editor);
    vi.advanceTimersByTime(DOCUMENT_CHANGE_DEBOUNCE_MS);
    regexTestFile.handleTextDocumentChange(editor);
    vi.advanceTimersByTime(DOCUMENT_CHANGE_DEBOUNCE_MS);

    expect(parseSpy).toHaveBeenCalledTimes(2);
  });

  it('should decorate the editor of the most recent change when changes are coalesced', () => {
    const regexTestFile = createRegexTestFile();
    const firstSetDecorations = vi.fn();
    const lastSetDecorations = vi.fn();
    const firstEditor = createTextEditor(firstSetDecorations);
    const lastEditor = createTextEditor(lastSetDecorations);

    regexTestFile.handleTextDocumentChange(firstEditor);
    regexTestFile.handleTextDocumentChange(lastEditor);
    vi.advanceTimersByTime(DOCUMENT_CHANGE_DEBOUNCE_MS);

    expect(firstSetDecorations).not.toHaveBeenCalled();
    expect(lastSetDecorations).toHaveBeenCalled();
  });

  it('should keep the code regex of an earlier change when a later change carries none', () => {
    const regexTestFile = createRegexTestFile();
    const parseSpy = spyOnParser();
    const editor = createTextEditor();
    const codeRegex: CodeRegex = { pattern: '/a+/g', range: new Range(0, 0, 0, 5), documentUri: null };

    regexTestFile.handleTextDocumentChange(editor, codeRegex);
    regexTestFile.handleTextDocumentChange(editor);
    vi.advanceTimersByTime(DOCUMENT_CHANGE_DEBOUNCE_MS);

    expect(parseSpy).toHaveBeenCalledTimes(1);
    expect(parseSpy.mock.calls[0][2]).toBe(codeRegex);
  });

  it('should parse immediately when the file editor is already visible on creation', () => {
    const parseSpy = spyOnParser();
    Object.assign(window, { visibleTextEditors: [createTextEditor()] });

    createRegexTestFile();

    expect(parseSpy).toHaveBeenCalledTimes(1);
  });

  it('should not parse after the file is disposed with a change still pending', () => {
    const regexTestFile = createRegexTestFile();
    const parseSpy = spyOnParser();

    regexTestFile.handleTextDocumentChange(createTextEditor());
    regexTestFile.dispose();
    vi.advanceTimersByTime(DOCUMENT_CHANGE_DEBOUNCE_MS);

    expect(parseSpy).not.toHaveBeenCalled();
  });
});
