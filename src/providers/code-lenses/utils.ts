export const JAVASCRIPT_REGEX_DETECT =
  /(?<!\/)(?<=[({=:>[,])\s*\/(?!\*)[^/\r\n][^\r\n]*?(?<!\\|\^)\/[gimuysvd]*\s*(?=[\]}),;\n]|\n|$)(?![^/]*\/\*|\*\/)/g;
