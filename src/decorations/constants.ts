import { window } from 'vscode';

const DECORATION_COLORS = {
  match: 'rgba(255,165,0,0.5)',
  delimiter: 'rgba(189,147,249)',
  groups: [
    'rgba(7,146,92,0.6)',
    'rgba(49,100,202,0.8)',
    'rgba(110,37,183,0.7)',
    'rgba(211,57,223,0.6)',
    'rgba(0,107,107,0.8)',
    'rgba(184,47,47,0.6)',
  ],
};

export const MATCH_DECORATION = window.createTextEditorDecorationType({
  backgroundColor: DECORATION_COLORS.match,
});

export const DELIMITER_DECORATION = window.createTextEditorDecorationType({
  color: DECORATION_COLORS.delimiter,
  fontWeight: 'bold',
});

export function getCapturingGroupDecoration(index: number) {
  return window.createTextEditorDecorationType({ backgroundColor: DECORATION_COLORS.groups[index] });
}

export const FIRST_GROUP_DECORATION = window.createTextEditorDecorationType({
  backgroundColor: DECORATION_COLORS.groups[0],
});

export const GROUP_DECORATIONS = DECORATION_COLORS.groups.map((_, index) => getCapturingGroupDecoration(index));
