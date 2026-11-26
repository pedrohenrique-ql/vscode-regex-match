export interface DetectedRegex {
  pattern: string;
  index: number;
  length: number;
  flags?: string;
}

export interface RegexLanguage {
  readonly canApply: boolean;
  detect(source: string): DetectedRegex[];
  toPattern(match: DetectedRegex): string;
}
