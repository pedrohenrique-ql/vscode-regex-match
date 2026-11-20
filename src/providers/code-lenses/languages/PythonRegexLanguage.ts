import { DetectedRegex, RegexLanguage } from './RegexLanguage';

const FUNCTIONS = new Set(['compile', 'match', 'search', 'fullmatch', 'findall', 'finditer', 'sub', 'subn', 'split']);
const ESCAPES: Record<string, string> = {
  '\\': '\\', "'": "'", '"': '"', a: '\\x07', b: '\\x08', f: '\\f',
  n: '\\n', r: '\\r', t: '\\t', v: '\\v',
};

class PythonRegexLanguage implements RegexLanguage {
  detect(source: string): DetectedRegex[] {
    const matches: DetectedRegex[] = [];
    let index = 0;
    while (index < source.length) {
      const char = source[index];
      if (char === '#') {
        const newline = source.indexOf('\n', index);
        index = newline === -1 ? source.length : newline + 1;
        continue;
      }
      if (char === "'" || char === '"') {
        index = this.skipString(source, index);
        continue;
      }
      if (/[A-Za-z0-9_]/.test(char)) {
        const start = index;
        while (/[A-Za-z0-9_]/.test(source[index] ?? '')) index++;
        if (source.slice(start, index) !== 're' || source[index] !== '.') continue;
        if (start > 0 && /[A-Za-z0-9_]/.test(source[start - 1])) continue;
        index++;
        const functionStart = index;
        while (/[A-Za-z_]/.test(source[index] ?? '')) index++;
        if (!FUNCTIONS.has(source.slice(functionStart, index))) continue;
        while (/\s/.test(source[index] ?? '')) index++;
        if (source[index] !== '(') continue;
        index++;
        while (/\s/.test(source[index] ?? '')) index++;
        let raw = false;
        if (source[index] === 'r' || source[index] === 'R') { raw = true; index++; }
        else if (/[A-Za-z_]/.test(source[index] ?? '')) {
          while (/[A-Za-z_]/.test(source[index] ?? '')) index++;
          continue;
        }
        const quote = source[index];
        if (quote !== "'" && quote !== '"') continue;
        if (source[index + 1] === quote && source[index + 2] === quote) {
          index = this.skipString(source, index);
          continue;
        }
        const contentStart = ++index;
        let escaped = false;
        while (index < source.length) {
          const current = source[index];
          if (escaped) { escaped = false; index++; continue; }
          if (current === '\\') { escaped = true; index++; continue; }
          if (current === quote || current === '\n' || current === '\r') break;
          index++;
        }
        if (source[index] === quote && index > contentStart) {
          const value = source.slice(contentStart, index);
          matches.push({ pattern: raw ? value : this.normalize(value), index: contentStart });
          index++;
        }
        continue;
      }
      index++;
    }
    return matches;
  }

  toPattern(match: DetectedRegex): string {
    return `/${match.pattern.replace(/\//g, '\\/')}/`;
  }

  private skipString(source: string, start: number): number {
    const quote = source[start];
    const triple = source[start + 1] === quote && source[start + 2] === quote;
    const delimiter = triple ? quote.repeat(3) : quote;
    let index = start + delimiter.length;
    while (index < source.length) {
      if (source[index] === '\\') { index += 2; continue; }
      if (source.startsWith(delimiter, index)) return index + delimiter.length;
      if (!triple && (source[index] === '\n' || source[index] === '\r')) return index;
      index++;
    }
    return index;
  }

  private normalize(pattern: string): string {
    return pattern.replace(/\\([\\'"abfnrtv])/g, (_match, escaped: string) => ESCAPES[escaped]);
  }
}
export default PythonRegexLanguage;
