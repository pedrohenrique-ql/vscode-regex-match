export function escapeRegexSource(regexSource: string) {
  return regexSource.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
}

const REGEX_LINE_PATTERN = /^(?<slash>\/?)(?<pattern>.*?)(?:\/(?<flags>[a-zA-Z]*))?$/;

interface RegexLineGroups {
  slash: string;
  pattern: string;
  flags?: string;
}

export interface SplitRegexLine {
  pattern: string;
  patternStart: number;
  flags: string;
  flagsStart: number;
}

export function splitRegexLine(regexLine: string): SplitRegexLine {
  const groups = REGEX_LINE_PATTERN.exec(regexLine)?.groups as RegexLineGroups | undefined;

  const patternStart = (groups?.slash ?? '').length;
  const pattern = groups?.pattern ?? regexLine;

  return {
    pattern,
    patternStart,
    flags: groups?.flags ?? '',
    flagsStart: patternStart + pattern.length + 1,
  };
}
