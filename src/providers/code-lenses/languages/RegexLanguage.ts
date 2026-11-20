export interface DetectedRegex { pattern: string; index: number; }
export interface RegexLanguage {
  detect(source: string): DetectedRegex[];
  toPattern(match: DetectedRegex): string;
}
