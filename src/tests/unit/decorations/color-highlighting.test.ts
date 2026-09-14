import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ConfigurationChangeEvent,
  Position,
  Range,
  TextEditor,
  TextEditorDecorationType,
  Uri,
  window,
  workspace,
  WorkspaceConfiguration,
} from 'vscode';

import RegexTestFile from '@/controllers/regex-test/RegexTestFile';
import TextDecorationApplier from '@/decorations/TextDecorationApplier';
import { DEFAULT_DECORATION_COLORS } from '@/decorations/utils';
import DiagnosticProvider from '@/providers/DiagnosticProvider';
import { createRegexTest } from '@/tests/factories/RegexTestFactory';

vi.mock('vscode', () => vi.importActual('@/tests/mocks/vscode'));

const FILE_PATH = '/regex-match/RegexMatch.rgx';
const FILE_CONTENT = '/(a+)(b+)/gm\n---\naabb\n---';

interface MockedDecorationType extends TextEditorDecorationType {
  options: { backgroundColor?: string };
  isDisposed: boolean;
}

interface AppliedDecoration {
  editorId: string;
  decorationType: MockedDecorationType;
  ranges: Range[];
}

describe('Color Highlighting', () => {
  let appliedDecorations: AppliedDecoration[] = [];

  beforeEach(() => {
    vi.restoreAllMocks();
    appliedDecorations = [];
  });

  function stubColorSettings(settings: Record<string, unknown>) {
    vi.spyOn(workspace, 'getConfiguration').mockReturnValue({
      get: (key: string, defaultValue: unknown) => (key in settings ? settings[key] : defaultValue),
    } as unknown as WorkspaceConfiguration);
  }

  function createTextEditor(editorId = 'editor') {
    return {
      document: {
        uri: Uri.file(FILE_PATH),
        getText: () => FILE_CONTENT,
        positionAt: (offset: number) => new Position(0, offset),
      },
      setDecorations: (decorationType: MockedDecorationType, ranges: Range[]) =>
        appliedDecorations.push({ editorId, decorationType, ranges }),
    } as unknown as TextEditor;
  }

  function getPaintedDecorations(editorId = 'editor') {
    return appliedDecorations.filter((applied) => applied.editorId === editorId && applied.ranges.length > 0);
  }

  function getColors(decorationTypes: MockedDecorationType[]) {
    return decorationTypes.map((decorationType) => decorationType.options.backgroundColor);
  }

  describe('Decoration Colors', () => {
    function getDecorationTypes(applier: TextDecorationApplier) {
      appliedDecorations = [];
      applier.clearDecorations(createTextEditor());

      const [match, ...groups] = appliedDecorations.map(({ decorationType }) => decorationType);
      return { match, groups };
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
      const regexTest = createRegexTest({ regexPattern: '/(a)(b)(c)/gm', testLines: ['abc'] });

      applier.applyDecorations(createTextEditor(), [regexTest]);

      const groupDecorations = getPaintedDecorations().filter(
        ({ decorationType }) => decorationType.options.backgroundColor !== '#111111',
      );

      expect(getColors(groupDecorations.map(({ decorationType }) => decorationType))).toEqual(['#222222', '#333333']);
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

      expect(getColors([updatedDecorationTypes.match, ...updatedDecorationTypes.groups])).toEqual([
        '#444444',
        '#555555',
      ]);
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

  describe('Configuration Change', () => {
    function changeColorHighlightingConfiguration(settings: Record<string, unknown>) {
      let onChangeConfiguration: ((event: ConfigurationChangeEvent) => void) | undefined;

      vi.spyOn(workspace, 'onDidChangeConfiguration').mockImplementation((listener) => {
        onChangeConfiguration = listener;
        return { dispose: () => undefined };
      });

      Object.assign(window, { visibleTextEditors: [createTextEditor('first'), createTextEditor('second')] });

      const diagnosticProvider = { updateDiagnostics: () => undefined } as unknown as DiagnosticProvider;
      new RegexTestFile(Uri.file(FILE_PATH), diagnosticProvider);

      appliedDecorations = [];
      stubColorSettings(settings);

      onChangeConfiguration?.({ affectsConfiguration: () => true });
    }

    beforeEach(() => {
      stubColorSettings({ match: '#111111', groups: ['#222222', '#333333'] });
    });

    it('should update the decorations of every visible editor of the file', () => {
      changeColorHighlightingConfiguration({ match: '#111111', groups: ['#444444', '#555555'] });

      expect(getPaintedDecorations('first')).not.toHaveLength(0);
      expect(getPaintedDecorations('second')).not.toHaveLength(0);
    });

    it('should create the decoration types once when the file is visible in more than one editor', () => {
      changeColorHighlightingConfiguration({ match: '#111111', groups: ['#444444', '#555555'] });

      function getDecorationTypesOf(editorId: string) {
        return getPaintedDecorations(editorId).map(({ decorationType }) => decorationType);
      }

      expect(getDecorationTypesOf('first')).toEqual(getDecorationTypesOf('second'));
    });

    it('should apply the updated colors to every visible editor of the file', () => {
      changeColorHighlightingConfiguration({ match: '#111111', groups: ['#444444', '#555555'] });

      const backgroundColors = getColors(
        [...getPaintedDecorations('first'), ...getPaintedDecorations('second')].map(
          ({ decorationType }) => decorationType,
        ),
      );

      expect(backgroundColors).not.toContain('#222222');
      expect(backgroundColors).toContain('#444444');
      expect(backgroundColors).toContain('#555555');
    });
  });
});
