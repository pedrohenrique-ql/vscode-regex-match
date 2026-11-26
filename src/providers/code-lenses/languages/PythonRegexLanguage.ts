import type { DetectedRegex, RegexLanguage } from './RegexLanguage';

const FUNCTIONS = new Set(['compile', 'match', 'search', 'fullmatch', 'findall', 'finditer', 'sub', 'subn', 'split']);
const POSITIONAL_FLAGS_INDEX: Record<string, number> = {
  compile: 1, match: 2, search: 2, fullmatch: 2, findall: 2, finditer: 2, sub: 4, subn: 4, split: 3,
};
const FLAG_MAP: Record<string, string> = {
  I: 'i', IGNORECASE: 'i', M: 'm', MULTILINE: 'm', S: 's', DOTALL: 's',
};
const STRING_ESCAPES: Record<string, string> = {
  '\\': '\\', "'": "'", '"': '"', a: '\\x07', b: '\\x08', f: '\\f',
  n: '\\n', r: '\\r', t: '\\t', v: '\\v',
};

class PythonRegexLanguage implements RegexLanguage {
  readonly canApply = false;

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
      if (!/[A-Za-z0-9_]/.test(char)) {
        index++;
        continue;
      }

      const start = index;
      while (/[A-Za-z0-9_]/.test(source[index] ?? '')) index++;
      if (source.slice(start, index) !== 're' || source[index] !== '.' ||
          (start > 0 && /[A-Za-z0-9_]/.test(source[start - 1]))) continue;

      index++;
      const functionStart = index;
      while (/[A-Za-z_]/.test(source[index] ?? '')) index++;
      const functionName = source.slice(functionStart, index);
      if (!FUNCTIONS.has(functionName)) continue;

      while (/\s/.test(source[index] ?? '')) index++;
      if (source[index] !== '(') continue;
      const call = this.readCall(source, index);
      if (!call) continue;
      index = call.end + 1;

      const firstArgument = call.arguments[0]?.text.trim();
      if (!firstArgument) continue;
      const literal = this.readPatternLiteral(firstArgument);
      if (!literal || !literal.pattern) continue;

      const flags = this.readFlags(functionName, call.arguments);
      if (flags === undefined) continue;

      const translated = this.translatePattern(literal.pattern);
      if (!translated) continue;
      const combinedFlags = new Set([...flags, ...translated.flags]);
      const pattern = translated.pattern;
      const regexFlags = [...combinedFlags].join('');

      try {
        new RegExp(pattern, regexFlags);
      } catch {
        continue;
      }

      matches.push({
        pattern,
        index: call.arguments[0].start + call.arguments[0].text.search(/\S/) + literal.contentStart,
        length: literal.sourceLength,
        flags: regexFlags,
      });
    }

    return matches;
  }

  toPattern(match: DetectedRegex): string {
    const escapedPattern = match.pattern.replace(/\\.|\//g, (part) => part === '/' ? '\\/' : part);
    return `/${escapedPattern}/${match.flags ?? ''}`;
  }

  private readCall(source: string, openIndex: number): { arguments: { text: string; start: number }[]; end: number } | undefined {
    const argumentsList: { text: string; start: number }[] = [];
    let argumentStart = openIndex + 1;
    let index = argumentStart;
    let depth = 0;

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
      if (char === '(' || char === '[' || char === '{') {
        depth++;
      } else if (char === ')' || char === ']' || char === '}') {
        if (char === ')' && depth === 0) {
          argumentsList.push({ text: source.slice(argumentStart, index), start: argumentStart });
          return { arguments: argumentsList, end: index };
        }
        depth--;
      } else if (char === ',' && depth === 0) {
        argumentsList.push({ text: source.slice(argumentStart, index), start: argumentStart });
        argumentStart = index + 1;
      }
      index++;
    }
    return undefined;
  }

  private readPatternLiteral(argument: string): { pattern: string; contentStart: number; sourceLength: number } | undefined {
    const match = /^(r)?(['"])/i.exec(argument);
    if (!match || match[1] && match[1].toLowerCase() !== 'r') return undefined;
    const raw = Boolean(match[1]);
    const quote = match[2];
    if (argument.startsWith(quote.repeat(3), match[0].length - 1)) return undefined;

    const contentStart = match[0].length;
    let index = contentStart;
    let escaped = false;
    while (index < argument.length) {
      const char = argument[index];
      if (escaped) {
        escaped = false;
        index++;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        index++;
        continue;
      }
      if (char === quote) break;
      if (char === '\n' || char === '\r') return undefined;
      index++;
    }
    if (argument[index] !== quote || argument.slice(index + 1).trim()) return undefined;

    const value = argument.slice(contentStart, index);
    return {
      pattern: raw ? value : this.normalizeString(value),
      contentStart,
      sourceLength: index - contentStart,
    };
  }

  private readFlags(functionName: string, argumentsList: { text: string; start: number }[]): string[] | undefined {
    const flagsIndex = POSITIONAL_FLAGS_INDEX[functionName];
    let expression: string | undefined;
    for (const argument of argumentsList.slice(1)) {
      const keyword = /^\s*flags\s*=\s*(.*?)\s*$/.exec(argument.text);
      if (keyword) {
        if (expression !== undefined) return undefined;
        expression = keyword[1];
      }
    }
    if (expression === undefined && flagsIndex < argumentsList.length) {
      const positional = argumentsList[flagsIndex]?.text.trim();
      if (positional && !/^[A-Za-z_]\w*\s*=/.test(positional)) expression = positional;
    }
    if (!expression || expression === '0') return [];
    const tokens = expression.split('|').map((token) => token.trim());
    if (tokens.some((token) => !/^re\.(?:I|IGNORECASE|M|MULTILINE|S|DOTALL)$/.test(token))) return undefined;
    const flags = new Set<string>();
    for (const token of tokens) {
      const name = token.slice(3);
      const flag = FLAG_MAP[name];
      if (!flag) return undefined;
      flags.add(flag);
    }
    return [...flags];
  }

  private translatePattern(source: string): { pattern: string; flags: string[] } | undefined {
    let pattern = source;
    const flags: string[] = [];
    const inline = /^\(\?([ims]+)\)/.exec(pattern);
    if (inline) {
      for (const flag of inline[1]) flags.push(flag);
      pattern = pattern.slice(inline[0].length);
    }
    if (/^\(\?[a-zA-Z-]+:/.test(pattern) || /\(\?[a-zA-Z-]+\)/.test(pattern)) return undefined;

    let output = '';
    for (let index = 0; index < pattern.length; index++) {
      const char = pattern[index];
      if (char === '\\') {
        const next = pattern[index + 1];
        if (!next) return undefined;
        if (next === 'A') {
          output += '(?<![\\s\\S])';
          index++;
          continue;
        }
        if (next === 'Z' || next === 'z') {
          output += '(?![\\s\\S])';
          index++;
          continue;
        }
        if (next === 'a') {
          output += '\\x07';
          index++;
          continue;
        }
        if (next === 'N' || next === 'U' || next === 'g' || next === 'G' || next === 'K' ||
            (/[A-Za-z]/.test(next) && !'bBdDsSwWfnrtvux'.includes(next))) return undefined;
        if (next === 'g' && pattern[index + 2] === '<') return undefined;
        output += char + next;
        index++;
        continue;
      }
      if (pattern.startsWith('(?P<', index)) {
        output += '(?<';
        index += 3;
        continue;
      }
      if (pattern.startsWith('(?P=', index)) {
        const close = pattern.indexOf(')', index + 4);
        if (close === -1) return undefined;
        const name = pattern.slice(index + 4, close);
        if (!/^[A-Za-z_]\w*$/.test(name)) return undefined;
        output += `\\k<${name}>`;
        index = close;
        continue;
      }
      output += char;
    }
    return { pattern: output, flags };
  }

  private skipString(source: string, start: number): number {
    const quote = source[start];
    const triple = source[start + 1] === quote && source[start + 2] === quote;
    const delimiter = triple ? quote.repeat(3) : quote;
    let index = start + delimiter.length;
    while (index < source.length) {
      if (source[index] === '\\') {
        index += 2;
        continue;
      }
      if (source.startsWith(delimiter, index)) return index + delimiter.length;
      if (!triple && (source[index] === '\n' || source[index] === '\r')) return index;
      index++;
    }
    return index;
  }

  private normalizeString(pattern: string): string {
    return pattern.replace(/\\([\\'"abfnrtv])/g, (_match, escaped: string) => STRING_ESCAPES[escaped]);
  }
}

export default PythonRegexLanguage;
