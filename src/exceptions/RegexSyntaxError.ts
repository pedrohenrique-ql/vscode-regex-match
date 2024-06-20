import ErrorBase from './ErrorBase';

class RegexSyntaxError extends ErrorBase<'REGEX_SYNTAX'> {
  line: number;

  constructor(message: string, line: number) {
    super({ message, name: 'REGEX_SYNTAX', line });
    this.line = line;
  }
}

export default RegexSyntaxError;
