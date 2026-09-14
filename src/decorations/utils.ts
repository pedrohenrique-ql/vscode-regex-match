import { TextEditorDecorationType } from 'vscode';

export interface DecorationMapping {
  match: TextEditorDecorationType;
  groups: TextEditorDecorationType[];
}

export const DEFAULT_DECORATION_COLORS = {
  match: '#FFA50080',
  groups: ['#07925C99', '#3164CACC', '#6E25B7B2', '#D339DF99', '#006B6BCC', '#B82F2F99'],
};
