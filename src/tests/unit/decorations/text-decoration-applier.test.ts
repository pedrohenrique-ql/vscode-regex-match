import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Position, Range, TextEditor, TextEditorDecorationType, workspace, WorkspaceConfiguration } from 'vscode';

import TextDecorationApplier from '@/decorations/TextDecorationApplier';
import { DEFAULT_DECORATION_COLORS } from '@/decorations/utils';
import { createRegexTest } from '@/tests/factories/RegexTestFactory';

vi.mock('vscode', () => vi.importActual('@/tests/mocks/vscode'));

interface MockedDecorationType extends TextEditorDecorationType {
  options: { backgroundColor?: string };
  isDisposed: boolean;
}

describe('Text Decoration Applier', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function stubColorSettings(settings: Record<string, unknown>) {
    vi.spyOn(workspace, 'getConfiguration').mockReturnValue({
      get: (key: string, defaultValue: unknown) => (key in settings ? settings[key] : defaultValue),
    } as unknown as WorkspaceConfiguration);
  }

  function createTextEditor(appliedDecorations: { type: TextEditorDecorationType; ranges: Range[] }[] = []) {
    return {
      document: { positionAt: (offset: number) => new Position(0, offset) },
      setDecorations: (type: TextEditorDecorationType, ranges: Range[]) => appliedDecorations.push({ type, ranges }),
    } as unknown as TextEditor;
  }

  function getDecorationTypes(applier: TextDecorationApplier) {
    const appliedDecorations: { type: TextEditorDecorationType; ranges: Range[] }[] = [];
    applier.clearDecorations(createTextEditor(appliedDecorations));

    const [match, ...groups] = appliedDecorations.map(({ type }) => type as MockedDecorationType);
    return { match, groups };
  }

  function getColors(decorationTypes: MockedDecorationType[]) {
    return decorationTypes.map((decorationType) => decorationType.options.backgroundColor);
  }

  it('should use the configured colors for the matches and the capturing groups', () => {
    stubColorSettings({ match: '#111111', groups: ['#222222', '#333333'] });

    const { match, groups } = getDecorationTypes(new TextDecorationApplier());

    expect(getColors([match])).toEqual(['#111111']);
    expect(getColors(groups)).toEqual(['#222222', '#333333']);
  });

  it('should use the default colors when the settings are not defined', () => {
    stubColorSettings({});

    const { match, groups } = getDecorationTypes(new TextDecorationApplier());

    expect(getColors([match])).toEqual([DEFAULT_DECORATION_COLORS.match]);
    expect(getColors(groups)).toEqual(DEFAULT_DECORATION_COLORS.groups);
  });

  it('should fall back to the default group colors when the group color list is empty', () => {
    stubColorSettings({ match: '#111111', groups: [] });

    const { groups } = getDecorationTypes(new TextDecorationApplier());

    expect(getColors(groups)).toEqual(DEFAULT_DECORATION_COLORS.groups);
  });

  it('should cycle the group colors when a match has more groups than colors', () => {
    stubColorSettings({ match: '#111111', groups: ['#222222', '#333333'] });

    const applier = new TextDecorationApplier();
    const appliedDecorations: { type: TextEditorDecorationType; ranges: Range[] }[] = [];
    const regexTest = createRegexTest({ regexPattern: '/(a)(b)(c)/gm', testLines: ['abc'] });

    applier.applyDecorations(createTextEditor(appliedDecorations), [regexTest]);

    const groupDecorations = appliedDecorations.filter(
      ({ type, ranges }) => ranges.length > 0 && (type as MockedDecorationType).options.backgroundColor !== '#111111',
    );

    expect(groupDecorations).toHaveLength(2);
    expect(getColors(groupDecorations.map(({ type }) => type as MockedDecorationType))).toEqual(['#222222', '#333333']);
    expect(groupDecorations.map(({ ranges }) => ranges.length)).toEqual([2, 1]);
  });

  it('should dispose the previous decoration types when the color settings are updated', () => {
    stubColorSettings({ match: '#111111', groups: ['#222222', '#333333'] });

    const applier = new TextDecorationApplier();
    const { match, groups } = getDecorationTypes(applier);

    stubColorSettings({ match: '#444444', groups: ['#555555'] });
    applier.applyDecorations(createTextEditor(), [], { isToUpdateDecorations: true });

    expect([match, ...groups].map((decorationType) => decorationType.isDisposed)).toEqual([true, true, true]);

    const updatedDecorationTypes = getDecorationTypes(applier);
    expect(getColors([updatedDecorationTypes.match, ...updatedDecorationTypes.groups])).toEqual(['#444444', '#555555']);
    expect(updatedDecorationTypes.match.isDisposed).toBe(false);
  });

  it('should dispose the decoration types when the applier is disposed', () => {
    stubColorSettings({ match: '#111111', groups: ['#222222'] });

    const applier = new TextDecorationApplier();
    const { match, groups } = getDecorationTypes(applier);

    applier.dispose();

    expect([match, ...groups].map((decorationType) => decorationType.isDisposed)).toEqual([true, true]);
  });
});
