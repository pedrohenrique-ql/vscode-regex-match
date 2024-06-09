class ErrorBase<ErrorName extends string> extends Error {
  name: ErrorName;
  message: string;
  line?: number;

  constructor(error: { name: ErrorName; message: string; line?: number }) {
    super();
    this.name = error.name;
    this.message = error.message;
    this.line = error.line;
  }
}

export default ErrorBase;
