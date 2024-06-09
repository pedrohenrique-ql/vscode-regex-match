import ErrorBase from './ErrorBase';

export const DEFAULT_REGEX_MATCH_FORMAT_ERROR_MESSAGE = `Parsing error: The format of the regex test is incorrect. Please ensure your test follows the required pattern.\n\nExpected format:\n\n/regex/[flags]\n---\ntest string\n---`;

class RegexMatchFormatError extends ErrorBase<'REGEX_MATCH_FORMAT'> {
  line: number;

  constructor(line: number, message = DEFAULT_REGEX_MATCH_FORMAT_ERROR_MESSAGE) {
    super({ message, name: 'REGEX_MATCH_FORMAT', line });
    this.line = line;
  }
}

export default RegexMatchFormatError;
