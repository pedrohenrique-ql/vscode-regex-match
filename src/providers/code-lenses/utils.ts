export const JAVASCRIPT_REGEX_DETECT =
  /(?<!\/)(?<=[({=:>[,])\s*\/(?!\*)[^/\r\n][^\r\n]*?(?<!\\|\^)\/[gimuysvd]*\s*(?=[\]}),;\n]|\n|$)(?![^/]*\/\*|\*\/)/g;

export const PYTHON_REGEX_DETECT =
  /(?<!#.*)(?<=\bre\.(?:compile|match|search|fullmatch|findall|finditer|sub|subn|split)\s*\(\s*[rR]?(?<quote>["']))(?:\\.|(?!\k<quote>)[^\\\r\n])+?(?=\k<quote>)/g;

const PYTHON_STRING_ESCAPES: Record<string, string> = {
  '\\': '\\',
  "'": "'",
  '"': '"',
  a: '\\x07',
  b: '\\x08',
  f: '\\f',
  n: '\\n',
  r: '\\r',
  t: '\\t',
  v: '\\v',
};

export const REGEX_DETECTORS_MAP: { [key in string]: RegExp | undefined } = {
  javascript: JAVASCRIPT_REGEX_DETECT,
  typescript: JAVASCRIPT_REGEX_DETECT,
  javascriptreact: JAVASCRIPT_REGEX_DETECT,
  typescriptreact: JAVASCRIPT_REGEX_DETECT,
  python: PYTHON_REGEX_DETECT,
};

export function getRegexDetect(languageId: string): RegExp | undefined {
  return REGEX_DETECTORS_MAP[languageId];
}

export function normalizePythonRegexPattern(pattern: string, isRawString: boolean): string {
  if (isRawString) {
    return pattern;
  }

  return pattern.replace(/\\([\\'"abfnrtv])/g, (_match, escaped: string) => PYTHON_STRING_ESCAPES[escaped]);
}
