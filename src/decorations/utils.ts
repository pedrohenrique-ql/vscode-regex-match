import { TextEditorDecorationType } from 'vscode';

export type DecorationKey =
  | 'match'
  | 'delimiter'
  | 'firstGroup'
  | 'secondGroup'
  | 'thirdGroup'
  | 'fourthGroup'
  | 'fifthGroup'
  | 'sixthGroup';

export type DecorationMapping = { [type in DecorationKey]: TextEditorDecorationType };

export const DECORATION_KEYS = [
  'match',
  'delimiter',
  'firstGroup',
  'secondGroup',
  'thirdGroup',
  'fourthGroup',
  'fifthGroup',
  'sixthGroup',
] as const;

export const DEFAULT_DECORATION_COLORS: { [Decoration in DecorationKey]: string } = {
  match: '#FFA50080',
  delimiter: '#BD93F9FF',
  firstGroup: '#518241',
  secondGroup: '#3164CACC',
  thirdGroup: '#6E25B7B2',
  fourthGroup: '#D339DF99',
  fifthGroup: '#006B6BCC',
  sixthGroup: '#B82F2F99',
};
