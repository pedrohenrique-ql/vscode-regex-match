import { window } from 'vscode';

const DECORATION_COLORS = {
  match: '#FFA50080',
  delimiter: '#BD93F9FF',
  groups: ['#07925C99', '#3164CACC', '#6E25B7B2', '#D339DF99', '#006B6BCC', '#B82F2F99'],
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
