import JavaScriptRegexLanguage from './JavaScriptRegexLanguage';
import PythonRegexLanguage from './PythonRegexLanguage';
import { RegexLanguage } from './RegexLanguage';

const javascript = new JavaScriptRegexLanguage();
const REGEX_LANGUAGES: Record<string, RegexLanguage | undefined> = {
  javascript, typescript: javascript, javascriptreact: javascript, typescriptreact: javascript,
  python: new PythonRegexLanguage(),
};
export function getRegexLanguage(languageId: string): RegexLanguage | undefined {
  return REGEX_LANGUAGES[languageId];
}
