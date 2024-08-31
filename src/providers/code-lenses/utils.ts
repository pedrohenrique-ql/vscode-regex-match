export const JAVASCRIPT_REGEX_DETECT =
  /(?<!\/)(?<=[({=:>])\s*\/(?!\*)[^/\r\n][^\r\n]*?\/[gimuy]*\s*(?=[}),;\n]|\n|$)(?![^/]*\/\*|\*\/)/g;

export const REGEX_DETECTORS_MAP: { [key in string]: RegExp | undefined } = {
  javascript: JAVASCRIPT_REGEX_DETECT,
  typescript: JAVASCRIPT_REGEX_DETECT,
  javascriptreact: JAVASCRIPT_REGEX_DETECT,
  typescriptreact: JAVASCRIPT_REGEX_DETECT,
};

export function getRegexDetect(languageId: string): RegExp | undefined {
  return REGEX_DETECTORS_MAP[languageId];
}
